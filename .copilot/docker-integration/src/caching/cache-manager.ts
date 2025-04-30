import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config-manager';

/**
 * CacheManager class that manages Docker build caching and model caching
 * Follows SRP by focusing only on caching strategies
 */
export class CacheManager {
	private logger: Logger;
	private configManager: ConfigManager;
	private cacheDir: string;
	private modelCacheDir: string;
	private dockerLayerCacheDir: string;
	private initialized: boolean = false;

	constructor(logger: Logger, configManager: ConfigManager) {
		this.logger = logger;
		this.configManager = configManager;

		// Set up cache directories
		this.cacheDir = path.join(os.homedir(), '.transformers-docker', 'cache');
		this.modelCacheDir = path.join(this.cacheDir, 'models');
		this.dockerLayerCacheDir = path.join(this.cacheDir, 'docker-layers');
	}

	/**
	 * Initialize the cache manager
	 */
	public async initialize(): Promise<void> {
		if (this.initialized) {
			return;
		}

		this.logger.info('CacheManager', 'Initializing cache manager');

		// Create cache directories if they don't exist
		this.createDirectoryIfNotExists(this.cacheDir);
		this.createDirectoryIfNotExists(this.modelCacheDir);
		this.createDirectoryIfNotExists(this.dockerLayerCacheDir);

		// Set up cache metadata
		await this.initializeMetadata();

		this.initialized = true;
		this.logger.info('CacheManager', 'Cache manager initialized successfully');
	}

	/**
	 * Set up model caching for transformers.js models
	 */
	public async setupModelCaching(): Promise<void> {
		this.logger.info('CacheManager', 'Setting up model caching');

		// Create cache configuration file
		const cacheConfig = {
			version: '1.0.0',
			modelCacheDir: this.modelCacheDir,
			maxCacheSize: this.configManager.get('cache.maxModelCacheSize', 10 * 1024 * 1024 * 1024), // 10GB default
			cacheStrategy: this.configManager.get('cache.modelCacheStrategy', 'lru'),
			ttl: this.configManager.get('cache.modelCacheTtl', 7 * 24 * 60 * 60), // 7 days default
			compressionEnabled: this.configManager.get('cache.modelCompressionEnabled', true)
		};

		// Write cache configuration
		fs.writeFileSync(
			path.join(this.modelCacheDir, 'cache-config.json'),
			JSON.stringify(cacheConfig, null, 2)
		);

		// Create symlinks for the model cache directory in transformers.js-examples
		await this.createModelCacheSymlinks();

		this.logger.info('CacheManager', 'Model caching set up successfully');
	}

	/**
	 * Set up Docker layer caching for faster builds
	 */
	public async setupDockerLayerCaching(): Promise<void> {
		this.logger.info('CacheManager', 'Setting up Docker layer caching');

		// Create Docker daemon configuration for build cache
		const dockerConfig = {
			"builder": {
				"gc": {
					"enabled": true,
					"defaultKeepStorage": "20GB"
				}
			},
			"features": {
				"buildkit": true
			},
			"registry-mirrors": [
				"http://localhost:5000"
			],
			"log-driver": "json-file",
			"log-opts": {
				"max-size": "10m",
				"max-file": "3"
			}
		};

		// Docker daemon configuration path depends on the platform
		let dockerConfigPath: string;
		if (process.platform === 'win32') {
			dockerConfigPath = path.join(os.homedir(), '.docker', 'daemon.json');
		} else {
			dockerConfigPath = '/etc/docker/daemon.json';
		}

		// Try to update Docker daemon configuration if possible
		try {
			// Make sure the directory exists
			this.createDirectoryIfNotExists(path.dirname(dockerConfigPath));

			// Check if existing config is present
			if (fs.existsSync(dockerConfigPath)) {
				this.logger.debug('CacheManager', 'Existing Docker daemon configuration found, merging with cache settings');

				// Read existing configuration
				const existingConfig = JSON.parse(fs.readFileSync(dockerConfigPath, 'utf8'));

				// Merge with new configuration
				const mergedConfig = {
					...existingConfig,
					builder: {
						...(existingConfig.builder || {}),
						gc: {
							...(existingConfig.builder?.gc || {}),
							enabled: true,
							defaultKeepStorage: "20GB"
						}
					},
					features: {
						...(existingConfig.features || {}),
						buildkit: true
					},
					"registry-mirrors": [
						...(existingConfig["registry-mirrors"] || []),
						"http://localhost:5000"
					]
				};

				// Write merged configuration
				fs.writeFileSync(dockerConfigPath, JSON.stringify(mergedConfig, null, 2));
			} else {
				// Write new configuration
				fs.writeFileSync(dockerConfigPath, JSON.stringify(dockerConfig, null, 2));
			}

			this.logger.info('CacheManager', 'Docker layer caching configuration updated successfully');
		} catch (error) {
			this.logger.warn(
				'CacheManager',
				`Could not update Docker daemon configuration at ${dockerConfigPath}: ${error instanceof Error ? error.message : String(error)}. Please update it manually.`
			);

			// Instead, write the configuration to a file in our cache directory
			fs.writeFileSync(
				path.join(this.cacheDir, 'recommended-docker-daemon.json'),
				JSON.stringify(dockerConfig, null, 2)
			);

			this.logger.info('CacheManager', `Recommended Docker daemon configuration saved to ${path.join(this.cacheDir, 'recommended-docker-daemon.json')}`);
		}
	}

	/**
	 * Create model cache symlinks in the transformers.js-examples project
	 */
	private async createModelCacheSymlinks(): Promise<void> {
		try {
			this.logger.info('CacheManager', 'Creating model cache symlinks');

			// For each project directory, create a symlink to the central cache
			const projectsDir = path.resolve(process.cwd());

			// Check if we are in the transformers.js-examples directory
			if (fs.existsSync(path.join(projectsDir, 'package.json'))) {
				const packageJson = JSON.parse(fs.readFileSync(path.join(projectsDir, 'package.json'), 'utf8'));

				if (packageJson.name === 'transformers.js-examples') {
					// Look for all potential model directories
					const dirs = fs.readdirSync(projectsDir);

					for (const dir of dirs) {
						const dirPath = path.join(projectsDir, dir);

						// Skip if not a directory or a system directory
						if (!fs.statSync(dirPath).isDirectory() || dir.startsWith('.')) {
							continue;
						}

						// Create model cache directory for this project
						const projectModelCacheDir = path.join(this.modelCacheDir, dir);
						this.createDirectoryIfNotExists(projectModelCacheDir);

						// Create symlink in project
						const symlinkTarget = path.join(dirPath, '.model-cache');

						// Remove existing symlink or directory
						if (fs.existsSync(symlinkTarget)) {
							try {
								// Check if it's a symlink
								if (fs.lstatSync(symlinkTarget).isSymbolicLink()) {
									fs.unlinkSync(symlinkTarget);
								} else {
									// It's a regular directory, move its contents to the cache directory
									const files = fs.readdirSync(symlinkTarget);
									for (const file of files) {
										const sourcePath = path.join(symlinkTarget, file);
										const destPath = path.join(projectModelCacheDir, file);
										fs.renameSync(sourcePath, destPath);
									}
									fs.rmdirSync(symlinkTarget);
								}
							} catch (error) {
								this.logger.warn('CacheManager', `Could not process existing model cache directory: ${error instanceof Error ? error.message : String(error)}`);
							}
						}

						// Create symlink
						try {
							if (process.platform === 'win32') {
								// For Windows, use mklink command which requires administrator privileges
								await this.createWindowsSymlink(projectModelCacheDir, symlinkTarget);
							} else {
								fs.symlinkSync(projectModelCacheDir, symlinkTarget, 'dir');
							}

							this.logger.debug('CacheManager', `Created symlink for ${dir} at ${symlinkTarget}`);
						} catch (error) {
							this.logger.warn('CacheManager', `Could not create symlink for ${dir}: ${error instanceof Error ? error.message : String(error)}`);
						}
					}
				}
			}

			this.logger.info('CacheManager', 'Model cache symlinks created successfully');
		} catch (error) {
			this.logger.error('CacheManager', `Error creating model cache symlinks: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Create a symlink on Windows (requires administrator privileges)
	 */
	private async createWindowsSymlink(target: string, linkPath: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const { exec } = require('child_process');

			exec(`mklink /D "${linkPath}" "${target}"`, (error: any) => {
				if (error) {
					this.logger.warn('CacheManager', `Could not create symlink using mklink. Creating a file with the path instead.`);

					// If mklink fails (due to lack of admin rights), create a file with the path
					try {
						fs.writeFileSync(`${linkPath}.cache-path`, target);
						resolve();
					} catch (writeError) {
						reject(writeError);
					}
				} else {
					resolve();
				}
			});
		});
	}

	/**
	 * Initialize cache metadata
	 */
	private async initializeMetadata(): Promise<void> {
		const metadataPath = path.join(this.cacheDir, 'metadata.json');

		let metadata: any = {
			version: '1.0.0',
			created: new Date().toISOString(),
			lastAccessed: new Date().toISOString(),
			models: {},
			dockerLayers: {}
		};

		if (fs.existsSync(metadataPath)) {
			try {
				const existingMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
				metadata = {
					...existingMetadata,
					lastAccessed: new Date().toISOString()
				};
			} catch (error) {
				this.logger.warn('CacheManager', `Could not read cache metadata: ${error instanceof Error ? error.message : String(error)}`);
			}
		}

		fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
	}

	/**
	 * Get cache health status
	 */
	public async getCacheHealth(): Promise<any> {
		try {
			const metadataPath = path.join(this.cacheDir, 'metadata.json');

			if (!fs.existsSync(metadataPath)) {
				return {
					status: 'not-initialized',
					message: 'Cache metadata not found'
				};
			}

			const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

			// Calculate cache size
			const modelCacheSize = await this.calculateDirSize(this.modelCacheDir);
			const dockerLayerCacheSize = await this.calculateDirSize(this.dockerLayerCacheDir);

			return {
				status: 'healthy',
				version: metadata.version,
				created: metadata.created,
				lastAccessed: metadata.lastAccessed,
				modelCount: Object.keys(metadata.models).length,
				dockerLayerCount: Object.keys(metadata.dockerLayers).length,
				modelCacheSize: this.formatSize(modelCacheSize),
				dockerLayerCacheSize: this.formatSize(dockerLayerCacheSize),
				totalCacheSize: this.formatSize(modelCacheSize + dockerLayerCacheSize)
			};
		} catch (error) {
			return {
				status: 'error',
				message: `Error getting cache health: ${error instanceof Error ? error.message : String(error)}`
			};
		}
	}

	/**
	 * Create a directory if it doesn't exist
	 */
	private createDirectoryIfNotExists(dir: string): void {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
	}

	/**
	 * Calculate directory size recursively
	 */
	private async calculateDirSize(dir: string): Promise<number> {
		let size = 0;

		if (!fs.existsSync(dir)) {
			return 0;
		}

		const files = fs.readdirSync(dir);

		for (const file of files) {
			const filePath = path.join(dir, file);
			const stats = fs.statSync(filePath);

			if (stats.isDirectory()) {
				size += await this.calculateDirSize(filePath);
			} else {
				size += stats.size;
			}
		}

		return size;
	}

	/**
	 * Format size in bytes to human-readable format
	 */
	private formatSize(sizeInBytes: number): string {
		const units = ['B', 'KB', 'MB', 'GB', 'TB'];
		let size = sizeInBytes;
		let unitIndex = 0;

		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}

		return `${size.toFixed(2)} ${units[unitIndex]}`;
	}

	/**
	 * Generate cache key for a model
	 */
	public generateModelCacheKey(modelName: string, options: any = {}): string {
		// Combine model name and options into a string
		const dataToHash = `${modelName}:${JSON.stringify(options)}`;

		// Generate MD5 hash for the cache key
		return crypto.createHash('md5').update(dataToHash).digest('hex');
	}
}

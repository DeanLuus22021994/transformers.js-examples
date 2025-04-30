import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';
import { Logger } from './logger';

/**
 * ConfigManager class that manages configuration settings
 * Follows SRP by focusing only on configuration management
 */
export class ConfigManager {
	private config: Record<string, any>;
	private configPath: string;
	private logger: Logger;
	private static instance: ConfigManager;

	private constructor(logger: Logger) {
		this.logger = logger;
		this.config = {};
		this.configPath = path.join(os.homedir(), '.transformers-docker', 'config.json');
		this.loadConfig();
	}

	/**
	 * Get the singleton instance of ConfigManager
	 */
	public static getInstance(logger: Logger): ConfigManager {
		if (!ConfigManager.instance) {
			ConfigManager.instance = new ConfigManager(logger);
		}
		return ConfigManager.instance;
	}

	/**
	 * Load configuration from file and environment variables
	 */
	private loadConfig(): void {
		// Create directory if it doesn't exist
		const configDir = path.dirname(this.configPath);
		if (!fs.existsSync(configDir)) {
			fs.mkdirSync(configDir, { recursive: true });
		}

		// Load from config file if it exists
		if (fs.existsSync(this.configPath)) {
			try {
				this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
				this.logger.info('ConfigManager', 'Loaded configuration from file');
			} catch (error) {
				this.logger.error('ConfigManager', `Error loading config file: ${error instanceof Error ? error.message : String(error)}`);
				// Initialize with default config
				this.initDefaultConfig();
			}
		} else {
			// Initialize with default config
			this.initDefaultConfig();
		}

		// Load environment variables from .env file if it exists
		if (fs.existsSync('.env')) {
			dotenv.config();
			this.logger.info('ConfigManager', 'Loaded environment variables from .env file');
		}

		// Override config with environment variables
		this.loadFromEnvironment();
	}

	/**
	 * Initialize default configuration
	 */
	private initDefaultConfig(): void {
		this.config = {
			version: '1.0.0',
			swarm: {
				name: 'transformers-swarm',
				taskHistoryRetentionLimit: 5,
				autoLockManagers: true
			},
			cache: {
				maxModelCacheSize: 10 * 1024 * 1024 * 1024, // 10GB
				modelCacheStrategy: 'lru',
				modelCacheTtl: 7 * 24 * 60 * 60, // 7 days in seconds
				modelCompressionEnabled: true
			},
			docker: {
				useGpu: true,
				registryPort: 5000,
				visualizerPort: 8080
			},
			logging: {
				level: 'info',
				maxFileSizeMB: 10,
				maxFiles: 5
			}
		};

		// Save default config
		this.saveConfig();
		this.logger.info('ConfigManager', 'Initialized default configuration');
	}

	/**
	 * Load configuration from environment variables
	 */
	private loadFromEnvironment(): void {
		// Override config with environment variables
		// Format: TD_SECTION_KEY=value (TD = Transformers Docker)
		Object.keys(process.env).forEach(key => {
			if (key.startsWith('TD_')) {
				const parts = key.substring(3).split('_');
				if (parts.length >= 2) {
					const section = parts[0].toLowerCase();
					const configKey = parts.slice(1).join('_').toLowerCase();

					// Create section if it doesn't exist
					if (!this.config[section]) {
						this.config[section] = {};
					}

					// Parse value based on type
					const value = process.env[key];
					if (value) {
						if (value === 'true' || value === 'false') {
							this.config[section][configKey] = value === 'true';
						} else if (!isNaN(Number(value))) {
							this.config[section][configKey] = Number(value);
						} else {
							this.config[section][configKey] = value;
						}
					}
				}
			}
		});

		this.logger.debug('ConfigManager', 'Configuration updated from environment variables');
	}

	/**
	 * Save configuration to file
	 */
	public saveConfig(): void {
		try {
			fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
			this.logger.info('ConfigManager', 'Configuration saved to file');
		} catch (error) {
			this.logger.error('ConfigManager', `Error saving config file: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Get a configuration value
	 * Uses dot notation for nested properties, e.g. "swarm.name"
	 */
	public get<T>(key: string, defaultValue: T): T {
		const parts = key.split('.');
		let current: any = this.config;

		for (const part of parts) {
			if (current === undefined || current === null || typeof current !== 'object') {
				return defaultValue;
			}
			current = current[part];
		}

		return current !== undefined ? current as T : defaultValue;
	}

	/**
	 * Set a configuration value
	 * Uses dot notation for nested properties, e.g. "swarm.name"
	 */
	public set(key: string, value: any): void {
		const parts = key.split('.');
		let current: any = this.config;

		// Navigate to the right depth, creating objects as needed
		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			if (!current[part] || typeof current[part] !== 'object') {
				current[part] = {};
			}
			current = current[part];
		}

		// Set the final property
		const finalPart = parts[parts.length - 1];
		current[finalPart] = value;

		// Save the updated config
		this.saveConfig();
	}

	/**
	 * Get the entire configuration
	 */
	public getAll(): Record<string, any> {
		return { ...this.config };
	}

	/**
	 * Reset configuration to defaults
	 */
	public resetToDefaults(): void {
		this.initDefaultConfig();
		this.logger.info('ConfigManager', 'Configuration reset to defaults');
	}
}

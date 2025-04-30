import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';
import { DockerClient } from '../core/docker-client';
import { SwarmConfig } from './swarm-config';
import { CacheManager } from '../caching/cache-manager';

/**
 * Docker Swarm Manager class that manages the Docker Swarm lifecycle
 * Follows Single Responsibility Principle by focusing only on Swarm management
 */
export class SwarmManager {
	private logger: Logger;
	private dockerClient: DockerClient;
	private swarmConfig: SwarmConfig;
	private cacheManager: CacheManager;
	private swarmId: string | null = null;

	constructor(
		logger: Logger,
		dockerClient: DockerClient,
		swarmConfig: SwarmConfig,
		cacheManager: CacheManager
	) {
		this.logger = logger;
		this.dockerClient = dockerClient;
		this.swarmConfig = swarmConfig;
		this.cacheManager = cacheManager;
	}

	/**
	 * Initialize Docker Swarm when terminal starts
	 */
	public async initializeSwarm(): Promise<boolean> {
		try {
			this.logger.info('SwarmManager', 'Checking Docker Swarm status');

			const isSwarmActive = await this.dockerClient.isSwarmActive();

			if (!isSwarmActive) {
				this.logger.info('SwarmManager', 'Initializing new Docker Swarm');

				// Initialize new swarm
				this.swarmId = await this.dockerClient.initializeSwarm(this.swarmConfig);

				if (this.swarmId) {
					this.logger.info('SwarmManager', `Docker Swarm initialized with ID: ${this.swarmId}`);

					// Setup advanced caching
					await this.setupCaching();

					// Setup service discovery
					await this.setupServiceDiscovery();

					return true;
				} else {
					this.logger.error('SwarmManager', 'Failed to initialize Docker Swarm');
					return false;
				}
			} else {
				const swarmInfo = await this.dockerClient.getSwarmInfo();
				this.swarmId = swarmInfo.ID;
				this.logger.info('SwarmManager', `Docker Swarm is already active with ID: ${this.swarmId}`);

				// Check and update swarm configuration if needed
				await this.updateSwarmConfigIfNecessary();

				return true;
			}
		} catch (error) {
			this.logger.error('SwarmManager', `Error initializing Docker Swarm: ${error instanceof Error ? error.message : String(error)}`);
			return false;
		}
	}

	/**
	 * Deploy the core services to Docker Swarm
	 */
	public async deployCoreServices(): Promise<boolean> {
		try {
			if (!this.swarmId) {
				this.logger.error('SwarmManager', 'Cannot deploy services: Swarm not initialized');
				return false;
			}

			this.logger.info('SwarmManager', 'Deploying core services to Docker Swarm');

			// Deploy registry service for local image caching
			await this.deployRegistry();

			// Deploy visualizer for monitoring
			await this.deployVisualizer();

			// Deploy transformers.js specific services
			await this.deployTransformersServices();

			this.logger.info('SwarmManager', 'Core services deployed successfully');
			return true;
		} catch (error) {
			this.logger.error('SwarmManager', `Error deploying core services: ${error instanceof Error ? error.message : String(error)}`);
			return false;
		}
	}

	/**
	 * Deploy local registry for caching Docker images
	 */
	private async deployRegistry(): Promise<void> {
		this.logger.info('SwarmManager', 'Deploying local registry service');

		const registryOptions = {
			name: 'registry',
			Image: 'registry:2',
			Ports: [
				{
					HostPort: '5000',
					ContainerPort: '5000'
				}
			],
			Mounts: [
				{
					Source: path.join(os.homedir(), '.transformers-docker', 'registry'),
					Target: '/var/lib/registry',
					Type: 'bind'
				}
			],
			Labels: {
				'com.transformers.js.type': 'registry',
				'com.transformers.js.managed': 'true'
			},
			RestartPolicy: {
				Name: 'always'
			}
		};

		await this.dockerClient.createService(registryOptions);
		this.logger.info('SwarmManager', 'Registry service deployed successfully');
	}

	/**
	 * Deploy visualizer for Swarm monitoring
	 */
	private async deployVisualizer(): Promise<void> {
		this.logger.info('SwarmManager', 'Deploying visualizer service');

		const visualizerOptions = {
			name: 'visualizer',
			Image: 'dockersamples/visualizer:latest',
			Ports: [
				{
					HostPort: '8080',
					ContainerPort: '8080'
				}
			],
			Mounts: [
				{
					Source: '/var/run/docker.sock',
					Target: '/var/run/docker.sock',
					Type: 'bind'
				}
			],
			Labels: {
				'com.transformers.js.type': 'monitoring',
				'com.transformers.js.managed': 'true'
			},
			Constraints: ['node.role==manager'],
			RestartPolicy: {
				Name: 'always'
			}
		};

		await this.dockerClient.createService(visualizerOptions);
		this.logger.info('SwarmManager', 'Visualizer service deployed successfully');
	}

	/**
	 * Deploy transformers.js specific services
	 */
	private async deployTransformersServices(): Promise<void> {
		this.logger.info('SwarmManager', 'Deploying transformers.js specific services');

		// Check if GPU is available
		const hasGpu = await this.dockerClient.hasGpuSupport();

		// Deploy model cache service
		const modelCacheOptions = {
			name: 'model-cache',
			Image: 'redis:alpine',
			Ports: [
				{
					HostPort: '6379',
					ContainerPort: '6379'
				}
			],
			Mounts: [
				{
					Source: path.join(os.homedir(), '.transformers-docker', 'model-cache'),
					Target: '/data',
					Type: 'bind'
				}
			],
			Labels: {
				'com.transformers.js.type': 'cache',
				'com.transformers.js.managed': 'true'
			},
			Env: [
				'REDIS_APPENDONLY=yes',
				'REDIS_APPENDFSYNC=always'
			],
			RestartPolicy: {
				Name: 'always'
			}
		};

		await this.dockerClient.createService(modelCacheOptions);
		this.logger.info('SwarmManager', 'Model cache service deployed successfully');

		// If GPU is available, deploy GPU-optimized services
		if (hasGpu) {
			this.logger.info('SwarmManager', 'GPU detected - deploying GPU-optimized services');
			await this.deployGpuServices();
		}
	}

	/**
	 * Deploy GPU-optimized services if GPU is available
	 */
	private async deployGpuServices(): Promise<void> {
		const gpuInferenceOptions = {
			name: 'gpu-inference',
			Image: 'nvidia/cuda:11.8.0-devel-ubuntu22.04',
			Command: ['nvidia-smi', '-l', '30'],
			Labels: {
				'com.transformers.js.type': 'gpu',
				'com.transformers.js.managed': 'true'
			},
			ResourceRequirements: {
				Limits: {
					'nvidia.com/gpu': '1'
				},
				Reservations: {
					'nvidia.com/gpu': '1'
				}
			},
			RestartPolicy: {
				Name: 'always'
			}
		};

		try {
			await this.dockerClient.createService(gpuInferenceOptions);
			this.logger.info('SwarmManager', 'GPU inference service deployed successfully');
		} catch (error) {
			this.logger.error('SwarmManager', `Failed to deploy GPU service: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Setup advanced caching for Docker layers and model files
	 */
	private async setupCaching(): Promise<void> {
		this.logger.info('SwarmManager', 'Setting up advanced caching mechanisms');

		// Initialize the cache manager
		await this.cacheManager.initialize();

		// Set up model caching
		await this.cacheManager.setupModelCaching();

		// Set up Docker layer caching
		await this.cacheManager.setupDockerLayerCaching();

		this.logger.info('SwarmManager', 'Advanced caching mechanisms set up successfully');
	}

	/**
	 * Setup service discovery for Swarm services
	 */
	private async setupServiceDiscovery(): Promise<void> {
		this.logger.info('SwarmManager', 'Setting up service discovery');

		const overlayNetwork = {
			Name: 'transformers-net',
			Driver: 'overlay',
			Attachable: true,
			Labels: {
				'com.transformers.js.managed': 'true'
			}
		};

		await this.dockerClient.createNetwork(overlayNetwork);

		this.logger.info('SwarmManager', 'Service discovery network set up successfully');
	}

	/**
	 * Update Swarm configuration if necessary
	 */
	private async updateSwarmConfigIfNecessary(): Promise<void> {
		try {
			// Get current swarm configuration
			const currentConfig = await this.dockerClient.getSwarmConfig();

			// Check if update is needed
			const needsUpdate = this.swarmConfig.needsUpdate(currentConfig);

			if (needsUpdate) {
				this.logger.info('SwarmManager', 'Updating Swarm configuration');
				await this.dockerClient.updateSwarmConfig(this.swarmConfig);
				this.logger.info('SwarmManager', 'Swarm configuration updated successfully');
			} else {
				this.logger.info('SwarmManager', 'Swarm configuration is up to date');
			}
		} catch (error) {
			this.logger.error('SwarmManager', `Error updating Swarm configuration: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Tear down the Swarm when shutting down
	 */
	public async tearDownSwarm(): Promise<boolean> {
		try {
			if (!this.swarmId) {
				this.logger.warn('SwarmManager', 'No active Swarm to tear down');
				return false;
			}

			this.logger.info('SwarmManager', `Tearing down Docker Swarm with ID: ${this.swarmId}`);

			// Remove all services
			await this.dockerClient.removeAllServices();

			// Leave swarm
			await this.dockerClient.leaveSwarm();

			this.swarmId = null;

			this.logger.info('SwarmManager', 'Docker Swarm torn down successfully');
			return true;
		} catch (error) {
			this.logger.error('SwarmManager', `Error tearing down Docker Swarm: ${error instanceof Error ? error.message : String(error)}`);
			return false;
		}
	}
}

import * as Dockerode from 'dockerode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../utils/logger';
import { SwarmConfig } from '../swarm/swarm-config';

const execAsync = promisify(exec);

/**
 * Docker Client class that handles all interactions with Docker Engine
 * Follows SRP by focusing only on Docker API interactions
 */
export class DockerClient {
	private docker: Dockerode;
	private logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;

		// Create Docker client with default socket
		this.docker = new Dockerode({
			socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock'
		});
	}

	/**
	 * Check if Docker is running and accessible
	 */
	public async checkDockerConnection(): Promise<boolean> {
		try {
			this.logger.info('DockerClient', 'Checking Docker connection');
			const info = await this.docker.info();
			this.logger.info('DockerClient', `Connected to Docker Engine version ${info.ServerVersion}`);
			return true;
		} catch (error) {
			this.logger.error('DockerClient', `Failed to connect to Docker: ${error instanceof Error ? error.message : String(error)}`);
			return false;
		}
	}

	/**
	 * Check if Docker is running in Swarm mode
	 */
	public async isSwarmActive(): Promise<boolean> {
		try {
			const info = await this.docker.info();
			return info.Swarm?.LocalNodeState === 'active';
		} catch (error) {
			this.logger.error('DockerClient', `Error checking Swarm status: ${error instanceof Error ? error.message : String(error)}`);
			return false;
		}
	}

	/**
	 * Get information about the current Swarm
	 */
	public async getSwarmInfo(): Promise<any> {
		try {
			const info = await this.docker.info();
			return info.Swarm;
		} catch (error) {
			this.logger.error('DockerClient', `Error getting Swarm info: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		}
	}

	/**
	 * Initialize a new Docker Swarm
	 */
	public async initializeSwarm(config: SwarmConfig): Promise<string | null> {
		try {
			this.logger.info('DockerClient', 'Initializing Docker Swarm');

			// Get host IP for advertising
			const hostIp = await this.getHostIp();

			const swarmInitOptions = {
				ListenAddr: '0.0.0.0:2377',
				AdvertiseAddr: hostIp,
				ForceNewCluster: false,
				Spec: {
					Name: config.name,
					TaskHistoryRetentionLimit: config.taskHistoryRetentionLimit,
					EncryptionConfig: {
						AutoLockManagers: config.autoLockManagers
					}
				}
			};

			const result = await this.docker.swarmInit(swarmInitOptions);
			return result;
		} catch (error) {
			this.logger.error('DockerClient', `Error initializing Swarm: ${error instanceof Error ? error.message : String(error)}`);
			return null;
		}
	}

	/**
	 * Get the current Swarm configuration
	 */
	public async getSwarmConfig(): Promise<any> {
		try {
			const swarm = await this.docker.swarmInspect();
			return swarm;
		} catch (error) {
			this.logger.error('DockerClient', `Error getting Swarm config: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		}
	}

	/**
	 * Update the Swarm configuration
	 */
	public async updateSwarmConfig(config: SwarmConfig): Promise<boolean> {
		try {
			const currentConfig = await this.getSwarmConfig();

			const updateOptions = {
				version: currentConfig.Version.Index,
				rotateWorkerToken: false,
				rotateManagerToken: false,
				TaskHistoryRetentionLimit: config.taskHistoryRetentionLimit,
				Name: config.name
			};

			await this.docker.swarmUpdate(updateOptions);
			return true;
		} catch (error) {
			this.logger.error('DockerClient', `Error updating Swarm config: ${error instanceof Error ? error.message : String(error)}`);
			return false;
		}
	}

	/**
	 * Create a new service in the Swarm
	 */
	public async createService(options: any): Promise<any> {
		try {
			this.logger.info('DockerClient', `Creating service: ${options.name}`);
			return await this.docker.createService(options);
		} catch (error) {
			this.logger.error('DockerClient', `Error creating service: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		}
	}

	/**
	 * Remove a service from the Swarm
	 */
	public async removeService(serviceId: string): Promise<void> {
		try {
			this.logger.info('DockerClient', `Removing service: ${serviceId}`);
			const service = this.docker.getService(serviceId);
			await service.remove();
		} catch (error) {
			this.logger.error('DockerClient', `Error removing service: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		}
	}

	/**
	 * List all services in the Swarm
	 */
	public async listServices(): Promise<any[]> {
		try {
			return await this.docker.listServices();
		} catch (error) {
			this.logger.error('DockerClient', `Error listing services: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		}
	}

	/**
	 * Remove all services from the Swarm
	 */
	public async removeAllServices(): Promise<void> {
		try {
			this.logger.info('DockerClient', 'Removing all services');

			const services = await this.listServices();

			for (const service of services) {
				if (service.Spec?.Labels?.['com.transformers.js.managed'] === 'true') {
					await this.removeService(service.ID);
				}
			}

			this.logger.info('DockerClient', 'All services removed successfully');
		} catch (error) {
			this.logger.error('DockerClient', `Error removing all services: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		}
	}

	/**
	 * Leave the Swarm
	 */
	public async leaveSwarm(): Promise<void> {
		try {
			this.logger.info('DockerClient', 'Leaving Docker Swarm');
			await this.docker.swarmLeave({ force: true });
			this.logger.info('DockerClient', 'Left Docker Swarm successfully');
		} catch (error) {
			this.logger.error('DockerClient', `Error leaving Swarm: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		}
	}

	/**
	 * Create a new network
	 */
	public async createNetwork(options: any): Promise<any> {
		try {
			this.logger.info('DockerClient', `Creating network: ${options.Name}`);
			return await this.docker.createNetwork(options);
		} catch (error) {
			this.logger.error('DockerClient', `Error creating network: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		}
	}

	/**
	 * Check if GPU is available for Docker
	 */
	public async hasGpuSupport(): Promise<boolean> {
		try {
			this.logger.info('DockerClient', 'Checking GPU support');

			// Try running nvidia-smi to check for NVIDIA GPUs
			try {
				await execAsync('nvidia-smi');

				// Check if Docker supports NVIDIA runtime
				const info = await this.docker.info();
				const runtimes = info.Runtimes || {};

				if (runtimes.nvidia) {
					this.logger.info('DockerClient', 'NVIDIA GPU support confirmed');
					return true;
				}
			} catch (nvidiaError) {
				// No NVIDIA GPU available
			}

			this.logger.info('DockerClient', 'No GPU support detected');
			return false;
		} catch (error) {
			this.logger.error('DockerClient', `Error checking GPU support: ${error instanceof Error ? error.message : String(error)}`);
			return false;
		}
	}

	/**
	 * Get optimal Docker build args based on system capabilities
	 */
	public async getOptimalBuildArgs(): Promise<Record<string, string>> {
		const buildArgs: Record<string, string> = {};

		// Check for GPU support
		if (await this.hasGpuSupport()) {
			buildArgs.USE_GPU = 'true';
			buildArgs.CUDA_VERSION = '11.8.0';
		} else {
			buildArgs.USE_GPU = 'false';
		}

		// Set optimal Node.js settings
		buildArgs.NODE_ENV = 'production';
		buildArgs.NODE_OPTIONS = '--max-old-space-size=4096';

		return buildArgs;
	}

	/**
	 * Get the host IP address for Swarm advertising
	 */
	private async getHostIp(): Promise<string> {
		try {
			// Use different approaches based on platform
			if (process.platform === 'win32') {
				const { stdout } = await execAsync('ipconfig');

				// Extract IPv4 address
				const ipMatch = /IPv4 Address[^\n]+:\s*([^\s]+)/i.exec(stdout);

				if (ipMatch && ipMatch[1]) {
					return ipMatch[1];
				}
			} else {
				// For Linux/Mac
				const { stdout } = await execAsync("ip route get 1 | awk '{print $(NF-2);exit}'");
				return stdout.trim();
			}

			// Fallback to localhost
			return '127.0.0.1';
		} catch (error) {
			this.logger.error('DockerClient', `Error getting host IP: ${error instanceof Error ? error.message : String(error)}`);
			return '127.0.0.1';
		}
	}
}

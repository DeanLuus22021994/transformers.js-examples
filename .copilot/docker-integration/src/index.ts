import { DockerIntegrationManager } from './core/docker-integration-manager';
import { Logger } from './utils/logger';
import { ConfigManager } from './utils/config-manager';
import { DockerClient } from './core/docker-client';
import { SwarmManager } from './swarm/swarm-manager';
import { SwarmConfig } from './swarm/swarm-config';
import { CacheManager } from './caching/cache-manager';
import { TerminalHookManager } from './hooks/terminal-hook-manager';

// Export all modules
export {
	DockerIntegrationManager,
	Logger,
	ConfigManager,
	DockerClient,
	SwarmManager,
	SwarmConfig,
	CacheManager,
	TerminalHookManager
};

// Singleton instance of the Docker Integration Manager
let instance: DockerIntegrationManager | null = null;

/**
 * Initialize the Docker Integration system
 */
export async function initialize(): Promise<boolean> {
	const manager = DockerIntegrationManager.getInstance();
	return await manager.initialize();
}

/**
 * Shutdown the Docker Integration system
 */
export async function shutdown(): Promise<boolean> {
	const manager = DockerIntegrationManager.getInstance();
	return await manager.shutdown();
}

/**
 * Get the status of the Docker Integration system
 */
export async function getStatus(): Promise<any> {
	const manager = DockerIntegrationManager.getInstance();
	return await manager.getStatus();
}

/**
 * Check if the Docker Integration system is initialized
 */
export function isInitialized(): boolean {
	return DockerIntegrationManager.isInitialized();
}

/**
 * Reinitialize the Docker Integration system if needed
 */
export async function reinitializeIfNeeded(): Promise<boolean> {
	const manager = DockerIntegrationManager.getInstance();
	return await manager.reinitializeIfNeeded();
}

// Default export with simplified API
export default {
	initialize,
	shutdown,
	getStatus,
	isInitialized,
	reinitializeIfNeeded
};

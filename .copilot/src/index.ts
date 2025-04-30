import { setupBrowserEnvironment } from './browser-utils';
import { setupNodeEnvironment } from './node-utils';
import { TransformersConfig } from './types';

/**
 * Initialize the Transformers.js environment based on the current runtime
 * @param config Configuration options for Transformers.js
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeEnvironment(config?: TransformersConfig): Promise<void> {
	if (typeof window !== 'undefined') {
		return setupBrowserEnvironment(config);
	} else {
		return setupNodeEnvironment(config);
	}
}

/**
 * Export all utilities and helpers
 */
export * from './browser-utils';
export * from './node-utils';
export * from './types';
export * from './model-utils';
export * from './pipeline-utils';
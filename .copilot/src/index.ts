import { setupBrowserEnvironment } from './browser-utils';
import { setupNodeEnvironment } from './node-utils';
import { TransformersConfig } from './types';
import { ShellIntegration } from './shell-integration';
import { TracerFactory } from './tracer/tracer-factory';
import path from 'path';

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

// Base directory for all tracing
const baseDir = path.resolve(__dirname, '..');

// Initialize tracer factory and shell integration
const tracerFactory = TracerFactory.getInstance(path.join(baseDir, 'trace'));
const shellIntegration = new ShellIntegration(baseDir);

// Export the main functionality
export {
  shellIntegration,
  tracerFactory,
};

// Simple programmatic interface
export default {
  executeCommand: (command: string, directory?: string) => shellIntegration.executeCommand(command, directory),
  archiveSession: () => shellIntegration.archiveSession(),
  getArchiveSummary: () => shellIntegration.getArchiveSummary()
};

// If this is the main module being run
if (require.main === module) {
  // Initialize shell hooks
  shellIntegration.initShellHooks();

  console.log('Terminal tracing system initialized.');
  console.log('Type commands to execute with tracing or use the API programmatically.');
}

/**
 * Export all utilities and helpers
 */
export * from './browser-utils';
export * from './node-utils';
export * from './types';
export * from './model-utils';
export * from './pipeline-utils';
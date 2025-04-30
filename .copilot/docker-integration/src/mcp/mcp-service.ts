/**
 * MCP Service - Starts and manages the MCP server
 * This service implements the Model Context Protocol for GitHub Copilot integration
 */

import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { MCPServer } from './mcp-server';

// Initialize logger
const logger = new Logger('mcp-service');

// Parse environment variables
const PORT = process.env.MCP_SERVER_PORT ? parseInt(process.env.MCP_SERVER_PORT, 10) : 8083;
const HEALTH_FILE_DIR = process.env.HEALTH_FILE_DIR || '/tmp';

// Create health status file directory if it doesn't exist
if (!fs.existsSync(HEALTH_FILE_DIR)) {
	fs.mkdirSync(HEALTH_FILE_DIR, { recursive: true });
}

/**
 * Update health file
 */
function updateHealthFile(status: 'healthy' | 'unhealthy', message?: string): void {
	try {
		const healthData = {
			status,
			timestamp: new Date().toISOString(),
			message: message || ''
		};

		fs.writeFileSync(
			path.join(HEALTH_FILE_DIR, 'mcp-health.json'),
			JSON.stringify(healthData, null, 2)
		);
	} catch (error) {
		logger.error(`Failed to write health file: ${(error as Error).message}`);
	}
}

/**
 * Main function
 */
async function main(): Promise<void> {
	logger.info('Starting MCP service');

	try {
		// Create MCP server instance
		const mcpServer = new MCPServer(PORT);

		// Update health status to initializing
		updateHealthFile('healthy', 'MCP server initializing');

		// Start the server
		await mcpServer.start();

		// Update health status to healthy
		updateHealthFile('healthy', 'MCP server started successfully');

		// Handle process termination
		process.on('SIGTERM', async () => {
			logger.info('Received SIGTERM, shutting down MCP server');

			try {
				// Stop the server
				await mcpServer.stop();

				// Update health status
				updateHealthFile('unhealthy', 'MCP server stopped');

				// Exit process
				process.exit(0);
			} catch (error) {
				logger.error(`Error stopping MCP server: ${(error as Error).message}`);
				process.exit(1);
			}
		});
	} catch (error) {
		logger.error(`Failed to start MCP service: ${(error as Error).message}`);
		updateHealthFile('unhealthy', `Failed to start: ${(error as Error).message}`);
		process.exit(1);
	}
}

// Start the service
main().catch((error) => {
	logger.error(`Unhandled error: ${error.message}`);
	updateHealthFile('unhealthy', `Unhandled error: ${error.message}`);
	process.exit(1);
});

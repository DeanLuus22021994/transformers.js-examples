/**
 * CLI module for MCP server management
 */
import { Logger } from '../utils/logger';

/**
 * Start the MCP server
 */
export async function startMCPServer(port?: number): Promise<boolean> {
	const logger = Logger.getInstance();
	try {
		logger.info('mcp-cli', `Starting MCP server${port ? ` on port ${port}` : ''}`);

		// Dynamically import to avoid circular dependencies
		const { MCPServer } = await import('../mcp/mcp-server');

		const server = new MCPServer(port);
		await server.start();

		logger.info('mcp-cli', 'MCP server started successfully');
		return true;
	} catch (error) {
		logger.error('mcp-cli', `Failed to start MCP server: ${(error as Error).message}`);
		return false;
	}
}

/**
 * Stop the MCP server
 */
export async function stopMCPServer(): Promise<boolean> {
	const logger = Logger.getInstance();
	try {
		logger.info('mcp-cli', 'Stopping MCP server');

		// In a real implementation, we would need a way to access the running server instance
		// This is a placeholder for the actual implementation
		logger.info('mcp-cli', 'MCP server stopped');
		return true;
	} catch (error) {
		logger.error('mcp-cli', `Failed to stop MCP server: ${(error as Error).message}`);
		return false;
	}
}

/**
 * Check MCP server status
 */
export async function checkMCPServerStatus(serverHost: string = 'localhost', serverPort: number = 8083): Promise<{
	running: boolean;
	port?: number;
	uptime?: number;
	models?: number;
}> {
	const logger = Logger.getInstance();
	try {
		// Send a request to the health endpoint to check if server is running
		const http = await import('http');

		return new Promise((resolve) => {
			const req = http.request({
				hostname: serverHost,
				port: serverPort,
				path: '/health',
				method: 'GET',
				timeout: 5000
			}, (res) => {
				let data = '';

				res.on('data', (chunk) => {
					data += chunk;
				});

				res.on('end', () => {
					if (res.statusCode === 200) {
						try {
							const response = JSON.parse(data);
							logger.info('mcp-cli', `MCP server is running on port ${serverPort}`);

							// Get the number of models
							getModelCount(serverHost, serverPort).then(modelCount => {
								resolve({
									running: true,
									port: serverPort,
									uptime: Date.now() - new Date(response.timestamp).getTime(),
									models: modelCount
								});
							}).catch(() => {
								resolve({
									running: true,
									port: serverPort,
									uptime: Date.now() - new Date(response.timestamp).getTime()
								});
							});
						} catch (error) {
							logger.error('mcp-cli', `Error parsing response: ${(error as Error).message}`);
							resolve({
								running: true,
								port: serverPort
							});
						}
					} else {
						logger.error('mcp-cli', `MCP server returned status code ${res.statusCode}`);
						resolve({ running: false });
					}
				});
			});

			req.on('error', () => {
				logger.error('mcp-cli', 'MCP server is not running or not reachable');
				resolve({ running: false });
			});

			req.on('timeout', () => {
				req.destroy();
				logger.error('mcp-cli', 'Request to MCP server timed out');
				resolve({ running: false });
			});

			req.end();
		});
	} catch (error) {
		logger.error('mcp-cli', `Failed to check MCP server status: ${(error as Error).message}`);
		return { running: false };
	}
}

/**
 * Helper function to get model count
 */
async function getModelCount(serverHost: string, serverPort: number): Promise<number> {
	const http = await import('http');

	return new Promise((resolve, reject) => {
		const req = http.request({
			hostname: serverHost,
			port: serverPort,
			path: '/v1/models',
			method: 'GET',
			timeout: 5000
		}, (res) => {
			let data = '';

			res.on('data', (chunk) => {
				data += chunk;
			});

			res.on('end', () => {
				if (res.statusCode === 200) {
					try {
						const response = JSON.parse(data);
						resolve(response.data ? response.data.length : 0);
					} catch (error) {
						reject(error);
					}
				} else {
					reject(new Error(`Failed to get models: ${res.statusCode}`));
				}
			});
		});

		req.on('error', (error) => {
			reject(error);
		});

		req.on('timeout', () => {
			req.destroy();
			reject(new Error('Request timed out'));
		});

		req.end();
	});
}

/**
 * List available models
 */
export async function listModels(): Promise<string[]> {
	const logger = Logger.getInstance();
	try {
		// This is a placeholder for actual model listing
		// In a real implementation, we would connect to the server and get the list of models
		return [
			'transformers.js/gemma-2-2b',
			'transformers.js/phi-3.5',
			'transformers.js/llama-3.2-8b'
		];
	} catch (error) {
		logger.error('mcp-cli', `Failed to list models: ${(error as Error).message}`);
		return [];
	}
}

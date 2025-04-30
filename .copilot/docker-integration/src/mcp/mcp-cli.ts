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
export async function stopMCPServer(serverHost: string = 'localhost', serverPort: number = 8083): Promise<boolean> {
	const logger = Logger.getInstance();
	try {
		logger.info('mcp-cli', 'Stopping MCP server');

		// Check if the server is running
		const status = await checkMCPServerStatus(serverHost, serverPort);
		if (!status.running) {
			logger.info('mcp-cli', 'MCP server is not running');
			return true;
		}

		// For Docker Swarm deployments, we can stop the service
		try {
			const { DockerClient } = await import('../core/docker-client');
			const dockerClient = new DockerClient(logger);

			// Find the MCP service
			const services = await dockerClient.listServices();
			const mcpService = services.find(service =>
				service.name === 'transformers-mcp-server' ||
				service.name.includes('mcp-server')
			);

			if (mcpService) {
				logger.info('mcp-cli', `Stopping MCP service: ${mcpService.name}`);
				await dockerClient.removeService(mcpService.name);
				logger.info('mcp-cli', 'MCP service stopped via Docker Swarm');
				return true;
			}
		} catch (dockerError) {
			logger.warn('mcp-cli', `Could not stop via Docker: ${(dockerError as Error).message}`);
			// Continue with HTTP shutdown if Docker approach fails
		}

		// Attempt to send a graceful shutdown signal via HTTP
		const http = await import('http');

		return new Promise((resolve) => {
			const req = http.request({
				hostname: serverHost,
				port: serverPort,
				path: '/shutdown',
				method: 'POST',
				timeout: 5000
			}, (res) => {
				if (res.statusCode === 200) {
					logger.info('mcp-cli', 'MCP server shutdown initiated');
					resolve(true);
				} else {
					logger.warn('mcp-cli', `MCP server returned status code ${res.statusCode} for shutdown`);
					resolve(false);
				}
			});

			req.on('error', () => {
				logger.error('mcp-cli', 'Could not send shutdown signal to MCP server');
				resolve(false);
			});

			req.on('timeout', () => {
				req.destroy();
				logger.error('mcp-cli', 'Shutdown request timed out');
				resolve(false);
			});

			req.end();
		});
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
export async function listModels(serverHost: string = 'localhost', serverPort: number = 8083): Promise<string[]> {
	const logger = Logger.getInstance();
	try {
		// Send a request to the models endpoint
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
							if (response.data && Array.isArray(response.data)) {
								const modelIds = response.data.map((model: any) => model.id);
								logger.info('mcp-cli', `Found ${modelIds.length} models`);
								resolve(modelIds);
							} else {
								logger.warn('mcp-cli', 'No models found');
								resolve([]);
							}
						} catch (error) {
							logger.error('mcp-cli', `Error parsing model list: ${(error as Error).message}`);
							resolve([]);
						}
					} else {
						logger.error('mcp-cli', `Failed to list models: status code ${res.statusCode}`);
						resolve([]);
					}
				});
			});

			req.on('error', (error) => {
				logger.error('mcp-cli', `Error listing models: ${error.message}`);
				resolve([]);
			});

			req.on('timeout', () => {
				req.destroy();
				logger.error('mcp-cli', 'Request to list models timed out');
				resolve([]);
			});

			req.end();
		});
	} catch (error) {
		logger.error('mcp-cli', `Failed to list models: ${(error as Error).message}`);
		return [];
	}
}

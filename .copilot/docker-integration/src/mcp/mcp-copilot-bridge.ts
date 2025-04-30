/**
 * MCP-Copilot Bridge - Connects the MCP server with Copilot integration
 */
import * as http from 'http';
import { Logger } from '../utils/logger';

// Initialize logger
const logger = new Logger('mcp-copilot-bridge');

/**
 * MCPCopilotBridge class for connecting MCP with Copilot
 */
export class MCPCopilotBridge {
	private mcpServerHost: string;
	private mcpServerPort: number;
	private copilotServicePort: number;

	constructor(mcpServerHost: string = 'localhost', mcpServerPort: number = 8083, copilotServicePort: number = 8082) {
		this.mcpServerHost = mcpServerHost;
		this.mcpServerPort = mcpServerPort;
		this.copilotServicePort = copilotServicePort;
	}

	/**
	 * Initialize the bridge
	 */
	public async initialize(): Promise<boolean> {
		try {
			logger.info('Initializing MCP-Copilot bridge');

			// Verify MCP server is running
			const mcpStatus = await this.checkMCPServerStatus();
			if (!mcpStatus) {
				logger.error('MCP server is not running');
				return false;
			}

			// Verify Copilot service is running
			const copilotStatus = await this.checkCopilotServiceStatus();
			if (!copilotStatus) {
				logger.error('Copilot service is not running');
				return false;
			}

			// Register MCP commands with Copilot service
			const registered = await this.registerCommands();
			if (!registered) {
				logger.error('Failed to register MCP commands with Copilot service');
				return false;
			}

			logger.info('MCP-Copilot bridge initialized successfully');
			return true;
		} catch (error) {
			logger.error(`Failed to initialize MCP-Copilot bridge: ${(error as Error).message}`);
			return false;
		}
	}

	/**
	 * Check if MCP server is running
	 */
	private async checkMCPServerStatus(): Promise<boolean> {
		return new Promise((resolve) => {
			const req = http.request({
				hostname: this.mcpServerHost,
				port: this.mcpServerPort,
				path: '/health',
				method: 'GET',
				timeout: 5000
			}, (res) => {
				if (res.statusCode === 200) {
					resolve(true);
				} else {
					resolve(false);
				}
			});

			req.on('error', () => {
				resolve(false);
			});

			req.on('timeout', () => {
				req.destroy();
				resolve(false);
			});

			req.end();
		});
	}

	/**
	 * Check if Copilot service is running
	 */
	private async checkCopilotServiceStatus(): Promise<boolean> {
		return new Promise((resolve) => {
			const req = http.request({
				hostname: 'localhost',
				port: this.copilotServicePort,
				path: '/health',
				method: 'GET',
				timeout: 5000
			}, (res) => {
				if (res.statusCode === 200) {
					resolve(true);
				} else {
					resolve(false);
				}
			});

			req.on('error', () => {
				resolve(false);
			});

			req.on('timeout', () => {
				req.destroy();
				resolve(false);
			});

			req.end();
		});
	}

	/**
	 * Register MCP commands with Copilot service
	 */
	private async registerCommands(): Promise<boolean> {
		return new Promise((resolve) => {
			// Define MCP commands to register
			const commands = [
				{
					name: 'mcp:list-models',
					description: 'List available models in MCP server',
					handler: 'mcpListModels'
				},
				{
					name: 'mcp:get-status',
					description: 'Get MCP server status',
					handler: 'mcpGetStatus'
				},
				{
					name: 'mcp:start-inference',
					description: 'Start inference with a specific model',
					handler: 'mcpStartInference',
					params: ['modelId']
				}
			];

			// Convert to JSON
			const data = JSON.stringify({
				commands
			});

			// Send request to register commands
			const req = http.request({
				hostname: 'localhost',
				port: this.copilotServicePort,
				path: '/api/register-commands',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': data.length
				},
				timeout: 5000
			}, (res) => {
				let responseData = '';

				res.on('data', (chunk) => {
					responseData += chunk;
				});

				res.on('end', () => {
					if (res.statusCode === 200) {
						try {
							const parsedResponse = JSON.parse(responseData);
							if (parsedResponse.success) {
								logger.info('MCP commands registered successfully with Copilot service');
								resolve(true);
							} else {
								logger.error(`Failed to register commands: ${parsedResponse.error}`);
								resolve(false);
							}
						} catch (error) {
							logger.error(`Failed to parse response: ${(error as Error).message}`);
							resolve(false);
						}
					} else {
						logger.error(`Failed to register commands: ${res.statusCode}`);
						resolve(false);
					}
				});
			});

			req.on('error', (error) => {
				logger.error(`Error sending command registration: ${error.message}`);
				resolve(false);
			});

			req.on('timeout', () => {
				logger.error('Command registration request timed out');
				req.destroy();
				resolve(false);
			});

			req.write(data);
			req.end();
		});
	}

	/**
	 * Start inference with a model
	 */
	public async startInference(modelId: string, prompt: string): Promise<string> {
		return new Promise((resolve, reject) => {
			// Create request data
			const data = JSON.stringify({
				model: modelId,
				prompt: prompt,
				max_tokens: 100,
				temperature: 0.7
			});

			// Send request to MCP server
			const req = http.request({
				hostname: this.mcpServerHost,
				port: this.mcpServerPort,
				path: '/v1/completions',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': data.length
				},
				timeout: 30000
			}, (res) => {
				let responseData = '';

				res.on('data', (chunk) => {
					responseData += chunk;
				});

				res.on('end', () => {
					if (res.statusCode === 200) {
						try {
							const parsedResponse = JSON.parse(responseData);
							if (parsedResponse.choices && parsedResponse.choices.length > 0) {
								resolve(parsedResponse.choices[0].text);
							} else {
								reject(new Error('No completion generated'));
							}
						} catch (error) {
							reject(new Error(`Failed to parse response: ${(error as Error).message}`));
						}
					} else {
						reject(new Error(`Failed to get completion: ${res.statusCode}`));
					}
				});
			});

			req.on('error', (error) => {
				reject(new Error(`Error during inference: ${error.message}`));
			});

			req.on('timeout', () => {
				req.destroy();
				reject(new Error('Inference request timed out'));
			});

			req.write(data);
			req.end();
		});
	}

	/**
	 * List available models
	 */
	public async listModels(): Promise<string[]> {
		return new Promise((resolve, reject) => {
			// Send request to MCP server
			const req = http.request({
				hostname: this.mcpServerHost,
				port: this.mcpServerPort,
				path: '/v1/models',
				method: 'GET',
				timeout: 5000
			}, (res) => {
				let responseData = '';

				res.on('data', (chunk) => {
					responseData += chunk;
				});

				res.on('end', () => {
					if (res.statusCode === 200) {
						try {
							const parsedResponse = JSON.parse(responseData);
							if (parsedResponse.data) {
								const modelIds = parsedResponse.data.map((model: any) => model.id);
								resolve(modelIds);
							} else {
								resolve([]);
							}
						} catch (error) {
							reject(new Error(`Failed to parse response: ${(error as Error).message}`));
						}
					} else {
						reject(new Error(`Failed to list models: ${res.statusCode}`));
					}
				});
			});

			req.on('error', (error) => {
				reject(new Error(`Error listing models: ${error.message}`));
			});

			req.on('timeout', () => {
				req.destroy();
				reject(new Error('List models request timed out'));
			});

			req.end();
		});
	}
}

// Export bridge for external use
export default MCPCopilotBridge;

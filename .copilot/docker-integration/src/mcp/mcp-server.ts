/**
 * MCP Server Integration for transformers.js Docker Swarm
 * Implements the Model Context Protocol to enable seamless integration with GitHub Copilot
 */

import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import { Logger } from '../utils/logger';
import { DockerClient } from '../core/docker-client';
import { SwarmManager } from '../swarm/swarm-manager';
import { SwarmConfig } from '../swarm/swarm-config';
import { CacheManager } from '../caching/cache-manager';
import { ConfigManager } from '../utils/config-manager';

// Constants
const DEFAULT_PORT = process.env.MCP_SERVER_PORT ? parseInt(process.env.MCP_SERVER_PORT, 10) : 8083;
const HOST = process.env.MCP_SERVER_HOST || '0.0.0.0';

/**
 * MCP Server class for GitHub Copilot integration
 */
export class MCPServer {
	private server: http.Server;
	private port: number;
	private logger: Logger;
	private dockerClient: DockerClient;
	private swarmManager: SwarmManager;
	private configManager: ConfigManager;
	private cacheManager: CacheManager;
	private models: Map<string, any>;

	constructor(port: number = DEFAULT_PORT) {
		this.port = port;
		this.models = new Map();

		// Initialize dependencies
		this.logger = Logger.getInstance();
		this.configManager = ConfigManager.getInstance(this.logger);
		this.dockerClient = new DockerClient(this.logger);
		this.cacheManager = new CacheManager(this.logger, this.configManager);

		const swarmConfig = new SwarmConfig(
			'transformers-swarm',
			5,
			true
		);

		this.swarmManager = new SwarmManager(
			this.logger,
			this.dockerClient,
			swarmConfig,
			this.cacheManager
		);

		this.server = http.createServer(this.handleRequest.bind(this));
	}

	/**
	 * Start the MCP server
	 */
	public async start(): Promise<void> {
		try {
			// Initialize Docker Swarm if not already initialized
			const swarmActive = await this.swarmManager.initializeSwarm();
			if (!swarmActive) {
				this.logger.info('mcp-server', 'Initializing Docker Swarm for MCP server');
				await this.swarmManager.initializeSwarm();
			}

			// Register available models
			await this.registerModels();

			// Start the server
			return new Promise<void>((resolve) => {
				this.server.listen(this.port, HOST, () => {
					this.logger.info('mcp-server', `MCP server listening on port ${this.port}`);
					resolve();
				});
			});
		} catch (error) {
			this.logger.error('mcp-server', `Failed to start MCP server: ${(error as Error).message}`);
			throw error;
		}
	}

	/**
	 * Stop the MCP server
	 */
	public async stop(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.server.close((err) => {
				if (err) {
					this.logger.error('mcp-server', `Error stopping MCP server: ${err.message}`);
					reject(err);
				} else {
					this.logger.info('mcp-server', 'MCP server stopped');
					resolve();
				}
			});
		});
	}

	/**
	 * Handle incoming requests
	 */
	private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
		const url = req.url || '/';
		const method = req.method || 'GET';

		// Set CORS headers
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

		// Handle preflight requests
		if (method === 'OPTIONS') {
			res.writeHead(204);
			res.end();
			return;
		}

		// Health check endpoint
		if (url === '/health' && method === 'GET') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({
				status: 'healthy',
				timestamp: new Date().toISOString()
			}));
			return;
		}

		// MCP protocol endpoints
		if (url === '/v1/models' && method === 'GET') {
			await this.handleListModels(req, res);
			return;
		}

		if (url.startsWith('/v1/completions') && method === 'POST') {
			await this.handleCompletions(req, res);
			return;
		}

		if (url.startsWith('/v1/chat/completions') && method === 'POST') {
			await this.handleChatCompletions(req, res);
			return;
		}

		// Swarm management endpoints
		if (url === '/v1/swarm/status' && method === 'GET') {
			await this.handleSwarmStatus(req, res);
			return;
		}

		if (url === '/v1/swarm/init' && method === 'POST') {
			await this.handleSwarmInit(req, res);
			return;
		}

		// Service management endpoints
		if (url === '/v1/services' && method === 'GET') {
			await this.handleListServices(req, res);
			return;
		}
		if (url === '/v1/services' && method === 'POST') {
			await this.handleCreateService(req, res);
			return;
		}

		// Shutdown endpoint
		if (url === '/shutdown' && method === 'POST') {
			await this.handleShutdown(req, res);
			return;
		}

		// Default 404 response
		res.writeHead(404, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ error: 'Not found' }));
	}

	/**
	 * Register available models from transformers.js
	 */
	private async registerModels(): Promise<void> {
		try {
			this.logger.info('mcp-server', 'Registering models for MCP server');

			// Define supported models
			this.models.set('transformers.js/gemma-2-2b', {
				id: 'transformers.js/gemma-2-2b',
				object: 'model',
				created: Date.now(),
				owned_by: 'transformers.js',
				permission: [{
					id: 'modelperm-1',
					object: 'model_permission',
					created: Date.now(),
					allow_create_engine: false,
					allow_sampling: true,
					allow_logprobs: true,
					allow_search_indices: false,
					allow_view: true,
					allow_fine_tuning: false,
					organization: '*',
					group: null,
					is_blocking: false
				}],
				root: 'transformers.js/gemma-2-2b',
				parent: null
			});

			this.models.set('transformers.js/phi-3.5', {
				id: 'transformers.js/phi-3.5',
				object: 'model',
				created: Date.now(),
				owned_by: 'transformers.js',
				permission: [{
					id: 'modelperm-2',
					object: 'model_permission',
					created: Date.now(),
					allow_create_engine: false,
					allow_sampling: true,
					allow_logprobs: true,
					allow_search_indices: false,
					allow_view: true,
					allow_fine_tuning: false,
					organization: '*',
					group: null,
					is_blocking: false
				}],
				root: 'transformers.js/phi-3.5',
				parent: null
			});

			this.models.set('transformers.js/llama-3.2-8b', {
				id: 'transformers.js/llama-3.2-8b',
				object: 'model',
				created: Date.now(),
				owned_by: 'transformers.js',
				permission: [{
					id: 'modelperm-3',
					object: 'model_permission',
					created: Date.now(),
					allow_create_engine: false,
					allow_sampling: true,
					allow_logprobs: true,
					allow_search_indices: false,
					allow_view: true,
					allow_fine_tuning: false,
					organization: '*',
					group: null,
					is_blocking: false
				}],
				root: 'transformers.js/llama-3.2-8b',
				parent: null
			});

			this.logger.info('mcp-server', `Registered ${this.models.size} models`);
		} catch (error) {
			this.logger.error('mcp-server', `Failed to register models: ${(error as Error).message}`);
			throw error;
		}
	}

	/**
	 * Handle list models endpoint
	 */
	private async handleListModels(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
		try {
			const modelArray = Array.from(this.models.values());

			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({
				object: 'list',
				data: modelArray
			}));
		} catch (error) {
			this.logger.error('mcp-server', `Error listing models: ${(error as Error).message}`);
			res.writeHead(500, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Internal Server Error' }));
		}
	}

	/**
	 * Handle text completions
	 */
	private async handleCompletions(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
		try {
			let body = '';
			req.on('data', chunk => {
				body += chunk.toString();
			});

			req.on('end', async () => {
				try {
					const requestData = JSON.parse(body);
					const modelId = requestData.model;

					if (!this.models.has(modelId)) {
						res.writeHead(404, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify({ error: `Model ${modelId} not found` }));
						return;
					}

					// Forward to the appropriate container
					const result = await this.forwardToModelContainer(modelId, 'completions', requestData);

					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify(result));
				} catch (parseError) {
					this.logger.error('mcp-server', `Error parsing completion request: ${(parseError as Error).message}`);
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ error: 'Invalid request body' }));
				}
			});
		} catch (error) {
			this.logger.error('mcp-server', `Error handling completion: ${(error as Error).message}`);
			res.writeHead(500, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Internal Server Error' }));
		}
	}

	/**
	 * Handle chat completions
	 */
	private async handleChatCompletions(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
		try {
			let body = '';
			req.on('data', chunk => {
				body += chunk.toString();
			});

			req.on('end', async () => {
				try {
					const requestData = JSON.parse(body);
					const modelId = requestData.model;

					if (!this.models.has(modelId)) {
						res.writeHead(404, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify({ error: `Model ${modelId} not found` }));
						return;
					}

					// Forward to the appropriate container
					const result = await this.forwardToModelContainer(modelId, 'chat/completions', requestData);

					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify(result));
				} catch (parseError) {
					this.logger.error('mcp-server', `Error parsing chat completion request: ${(parseError as Error).message}`);
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ error: 'Invalid request body' }));
				}
			});
		} catch (error) {
			this.logger.error('mcp-server', `Error handling chat completion: ${(error as Error).message}`);
			res.writeHead(500, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Internal Server Error' }));
		}
	}

	/**
	 * Forward request to the appropriate model container
	 */
	private async forwardToModelContainer(modelId: string, endpoint: string, requestData: any): Promise<any> {
		try {
			// Check if the model service is running in the swarm
			const serviceName = this.getServiceNameFromModelId(modelId);
			const services = await this.dockerClient.listServices();

			const modelService = services.find(service => service.name === serviceName);

			// If service doesn't exist, create it
			if (!modelService) {
				await this.createModelService(modelId);
				// Wait for service to be ready
				await new Promise(resolve => setTimeout(resolve, 5000));
			}

			// Mock response - in a real implementation, this would forward to the container
			// and return the actual result
			return {
				id: `cmpl-${Math.random().toString(36).substring(2, 10)}`,
				object: endpoint === 'completions' ? 'text_completion' : 'chat.completion',
				created: Math.floor(Date.now() / 1000),
				model: modelId,
				choices: [
					{
						text: endpoint === 'completions' ? 'This is a sample completion.' : undefined,
						message: endpoint !== 'completions' ? {
							role: 'assistant',
							content: 'This is a sample chat completion.'
						} : undefined,
						index: 0,
						finish_reason: 'stop'
					}
				],
				usage: {
					prompt_tokens: 10,
					completion_tokens: 20,
					total_tokens: 30
				}
			};
		} catch (error) {
			this.logger.error('mcp-server', `Error forwarding to model container: ${(error as Error).message}`);
			throw error;
		}
	}

	/**
	 * Convert model ID to Docker service name
	 */
	private getServiceNameFromModelId(modelId: string): string {
		return modelId.replace(/\//g, '-').replace(/\./g, '-');
	}

	/**
	 * Create a new model service in the swarm
	 */
	private async createModelService(modelId: string): Promise<void> {
		try {
			const serviceName = this.getServiceNameFromModelId(modelId);

			this.logger.info('mcp-server', `Creating service for model ${modelId}`);

			// Check which example directory matches this model
			const modelImageMapping: { [key: string]: string } = {
				'transformers.js/gemma-2-2b': 'gemma-2-2b-jpn-webgpu',
				'transformers.js/phi-3.5': 'phi-3.5-webgpu',
				'transformers.js/llama-3.2-8b': 'llama-3.2-webgpu'
			};

			const exampleDir = modelImageMapping[modelId];
			if (!exampleDir) {
				throw new Error(`No example directory mapping found for model ${modelId}`);
			}

			// Create the service in the swarm
			await this.dockerClient.createService({
				name: serviceName,
				image: `transformersjs/${exampleDir}:latest`,
				replicas: 1,
				networks: ['transformers-net'],
				env: [
					'NODE_ENV=production',
					'HF_CACHE_DIR=/cache',
					'HF_USE_CACHE=true'
				],
				mounts: [
					{
						source: 'transformers-cache',
						target: '/cache',
						type: 'volume'
					}
				]
			});

			this.logger.info('mcp-server', `Service ${serviceName} created successfully`);
		} catch (error) {
			this.logger.error('mcp-server', `Error creating model service: ${(error as Error).message}`);
			throw error;
		}
	}

	/**
	 * Handle swarm status endpoint
	 */
	private async handleSwarmStatus(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
		try {
			// Get swarm status by initializing (which returns whether it's active)
			const status = await this.swarmManager.initializeSwarm();

			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ active: status }));
		} catch (error) {
			this.logger.error('mcp-server', `Error getting swarm status: ${(error as Error).message}`);
			res.writeHead(500, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Internal Server Error' }));
		}
	}

	/**
	 * Handle swarm initialization endpoint
	 */
	private async handleSwarmInit(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
		try {
			const result = await this.swarmManager.initializeSwarm();

			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ success: result }));
		} catch (error) {
			this.logger.error('mcp-server', `Error initializing swarm: ${(error as Error).message}`);
			res.writeHead(500, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Internal Server Error' }));
		}
	}

	/**
	 * Handle list services endpoint
	 */
	private async handleListServices(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
		try {
			const services = await this.dockerClient.listServices();

			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({
				object: 'list',
				data: services
			}));
		} catch (error) {
			this.logger.error('mcp-server', `Error listing services: ${(error as Error).message}`);
			res.writeHead(500, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Internal Server Error' }));
		}
	}
	/**
	 * Handle create service endpoint
	 */
	private async handleCreateService(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
		try {
			let body = '';
			req.on('data', chunk => {
				body += chunk.toString();
			});

			req.on('end', async () => {
				try {
					const serviceConfig = JSON.parse(body);

					const result = await this.dockerClient.createService(serviceConfig);

					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify(result));
				} catch (parseError) {
					this.logger.error('mcp-server', `Error parsing service create request: ${(parseError as Error).message}`);
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ error: 'Invalid request body' }));
				}
			});
		} catch (error) {
			this.logger.error('mcp-server', `Error creating service: ${(error as Error).message}`);
			res.writeHead(500, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Internal Server Error' }));
		}
	}

	/**
	 * Handle shutdown endpoint
	 */
	private async handleShutdown(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
		try {
			this.logger.info('mcp-server', 'Received shutdown request');

			// Send successful response before shutting down
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({
				success: true,
				message: 'Shutdown initiated',
				timestamp: new Date().toISOString()
			}));

			// Stop the server after a short delay to allow response to be sent
			setTimeout(async () => {
				try {
					this.logger.info('mcp-server', 'Shutting down server');
					await this.stop();
					this.logger.info('mcp-server', 'Server shutdown complete');

					// Exit process if running as standalone
					if (process.env.MCP_STANDALONE === 'true') {
						process.exit(0);
					}
				} catch (stopError) {
					this.logger.error('mcp-server', `Error during shutdown: ${(stopError as Error).message}`);
					// Force exit if stop failed
					if (process.env.MCP_STANDALONE === 'true') {
						process.exit(1);
					}
				}
			}, 100);
		} catch (error) {
			this.logger.error('mcp-server', `Error handling shutdown: ${(error as Error).message}`);
			res.writeHead(500, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Internal Server Error' }));
		}
	}
}

// Export the server for external use
export default MCPServer;

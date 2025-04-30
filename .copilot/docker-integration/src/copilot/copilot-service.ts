/**
 * Copilot Integration Service - Provides seamless integration with GitHub Copilot
 */
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';

// Initialize logger
const logger = new Logger('copilot-service');

// Configuration
const PORT = parseInt(process.env.COPILOT_HEALTH_PORT || '8082', 10);
const HEALTH_FILE_DIR = process.env.HEALTH_FILE_DIR || '/tmp';

// Ensure health file directory exists
if (!fs.existsSync(HEALTH_FILE_DIR)) {
  fs.mkdirSync(HEALTH_FILE_DIR, { recursive: true });
}

// Copilot integration handlers
class CopilotIntegration {
  private dockerCommands: Record<string, Function> = {};

  constructor() {
    this.registerDockerCommands();
  }

  /**
   * Register Docker-related commands that can be triggered by Copilot
   */
  private registerDockerCommands() {
    this.dockerCommands = {
      // Command to build and start a specific example
      startExample: async (exampleName: string) => {
        try {
          logger.info(`Starting example: ${exampleName}`);

          // Dynamically import the Docker client to avoid circular dependencies
          const { DockerClient } = await import('../core/docker-client');
          const dockerClient = new DockerClient();

          return await dockerClient.composeUp(exampleName);
        } catch (error) {
          logger.error(`Failed to start example ${exampleName}: ${(error as Error).message}`);
          throw error;
        }
      },

      // Command to stop a running example
      stopExample: async (exampleName: string) => {
        try {
          logger.info(`Stopping example: ${exampleName}`);

          const { DockerClient } = await import('../core/docker-client');
          const dockerClient = new DockerClient();

          return await dockerClient.composeDown(exampleName);
        } catch (error) {
          logger.error(`Failed to stop example ${exampleName}: ${(error as Error).message}`);
          throw error;
        }
      },

      // Command to get status of all examples
      getExamplesStatus: async () => {
        try {
          logger.info('Getting status of all examples');

          const { DockerClient } = await import('../core/docker-client');
          const dockerClient = new DockerClient();

          return await dockerClient.getComposeStatus();
        } catch (error) {
          logger.error(`Failed to get examples status: ${(error as Error).message}`);
          throw error;
        }
      },

      // Command to optimize Docker settings for the current host
      optimizeDockerSettings: async () => {
        try {
          logger.info('Optimizing Docker settings');

          const { DockerIntegrationManager } = await import('../core/docker-integration-manager');
          const integrationManager = new DockerIntegrationManager();

          return await integrationManager.optimizeDockerSettings();
        } catch (error) {
          logger.error(`Failed to optimize Docker settings: ${(error as Error).message}`);
          throw error;
        }
      }
    };
  }

  /**
   * Handles a Copilot command request
   */
  async handleCommand(command: string, params: any): Promise<any> {
    if (this.dockerCommands[command]) {
      try {
        return await this.dockerCommands[command](params);
      } catch (error) {
        throw new Error(`Command execution failed: ${(error as Error).message}`);
      }
    } else {
      throw new Error(`Unknown command: ${command}`);
    }
  }

  /**
   * Gets the list of available commands
   */
  getAvailableCommands(): string[] {
    return Object.keys(this.dockerCommands);
  }
}

// Create Copilot integration instance
const copilotIntegration = new CopilotIntegration();

// Update health status file
function updateHealthFile(status: 'healthy' | 'unhealthy', message?: string) {
  try {
    const healthData = {
      status,
      timestamp: new Date().toISOString(),
      message: message || '',
      availableCommands: copilotIntegration.getAvailableCommands()
    };

    fs.writeFileSync(
      path.join(HEALTH_FILE_DIR, 'copilot-health.json'),
      JSON.stringify(healthData, null, 2)
    );
  } catch (error) {
    logger.error(`Failed to write health file: ${(error as Error).message}`);
  }
}

// Start HTTP server for health checks and command API
const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/health') {
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      availableCommands: copilotIntegration.getAvailableCommands()
    }));
    return;
  }

  if (req.url === '/api/commands' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({
      commands: copilotIntegration.getAvailableCommands()
    }));
    return;
  }

  if (req.url === '/api/execute' && req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { command, params } = JSON.parse(body);

        if (!command) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Command is required' }));
          return;
        }

        try {
          const result = await copilotIntegration.handleCommand(command, params);
          res.statusCode = 200;
          res.end(JSON.stringify({ result }));
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: (error as Error).message }));
        }
      } catch (parseError) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });

    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start the server
server.listen(PORT, () => {
  logger.info(`Copilot integration service running on port ${PORT}`);
  updateHealthFile('healthy', 'Copilot integration service started successfully');
});

// Handle process termination
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...');
  server.close(() => {
    logger.info('Server closed');
    updateHealthFile('unhealthy', 'Service is shutting down');
    process.exit(0);
  });
});

// Export copilot integration for external use
export { copilotIntegration };

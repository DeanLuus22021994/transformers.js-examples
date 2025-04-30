import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config-manager';
import { DockerClient } from './docker-client';
import { SwarmManager } from '../swarm/swarm-manager';
import { SwarmConfig } from '../swarm/swarm-config';
import { CacheManager } from '../caching/cache-manager';
import { TerminalHookManager } from '../hooks/terminal-hook-manager';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

/**
 * DockerIntegrationManager is the main class that orchestrates all Docker integration
 * Follows SRP by delegating specific responsibilities to specialized classes
 */
export class DockerIntegrationManager {
  private logger: Logger;
  private configManager: ConfigManager;
  private dockerClient: DockerClient;
  private swarmManager: SwarmManager;
  private cacheManager: CacheManager;
  private terminalHookManager: TerminalHookManager;
  private sessionId: string;
  private static instance: DockerIntegrationManager;

  private constructor() {
    // Initialize logger
    this.logger = Logger.getInstance();
    this.logger.info('DockerIntegrationManager', 'Initializing Docker Integration Manager');

    // Initialize session ID
    this.sessionId = uuidv4();

    // Initialize config manager
    this.configManager = ConfigManager.getInstance(this.logger);

    // Initialize Docker client
    this.dockerClient = new DockerClient(this.logger);

    // Initialize cache manager
    this.cacheManager = new CacheManager(this.logger, this.configManager);

    // Initialize Swarm manager
    const swarmConfig = SwarmConfig.fromJson(this.configManager.get('swarm', {}));
    this.swarmManager = new SwarmManager(
      this.logger,
      this.dockerClient,
      swarmConfig,
      this.cacheManager
    );

    // Initialize terminal hook manager
    this.terminalHookManager = new TerminalHookManager(this.logger, this.configManager);
  }

  /**
   * Get the singleton instance of DockerIntegrationManager
   */
  public static getInstance(): DockerIntegrationManager {
    if (!DockerIntegrationManager.instance) {
      DockerIntegrationManager.instance = new DockerIntegrationManager();
    }
    return DockerIntegrationManager.instance;
  }

  /**
   * Initialize the Docker integration system
   */
  public async initialize(): Promise<boolean> {
    try {
      this.logger.info('DockerIntegrationManager', 'Initializing Docker integration system');

      // Check Docker connection
      const dockerConnected = await this.dockerClient.checkDockerConnection();
      if (!dockerConnected) {
        this.logger.error('DockerIntegrationManager', 'Docker is not running or not accessible');
        return false;
      }

      // Initialize cache manager
      await this.cacheManager.initialize();

      // Initialize Swarm
      const swarmInitialized = await this.swarmManager.initializeSwarm();
      if (!swarmInitialized) {
        this.logger.error('DockerIntegrationManager', 'Failed to initialize Docker Swarm');
        return false;
      }

      // Deploy core services
      await this.swarmManager.deployCoreServices();

      // Register terminal hooks
      await this.terminalHookManager.registerHooks();

      this.logger.info('DockerIntegrationManager', 'Docker integration system initialized successfully');

      // Create initialization marker
      this.createInitializationMarker();

      return true;
    } catch (error) {
      this.logger.error('DockerIntegrationManager', `Error initializing Docker integration system: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Shut down the Docker integration system
   */
  public async shutdown(): Promise<boolean> {
    try {
      this.logger.info('DockerIntegrationManager', 'Shutting down Docker integration system');

      // Unregister terminal hooks
      await this.terminalHookManager.unregisterHooks();

      // If configured to leave Swarm on shutdown, tear it down
      if (this.configManager.get('swarm.leaveOnShutdown', false)) {
        await this.swarmManager.tearDownSwarm();
      }

      this.logger.info('DockerIntegrationManager', 'Docker integration system shut down successfully');
      return true;
    } catch (error) {
      this.logger.error('DockerIntegrationManager', `Error shutting down Docker integration system: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Get system status
   */
  public async getStatus(): Promise<any> {
    try {
      this.logger.info('DockerIntegrationManager', 'Getting system status');

      // Check Docker connection
      const dockerConnected = await this.dockerClient.checkDockerConnection();

      // Check if Swarm is active
      const isSwarmActive = await this.dockerClient.isSwarmActive();

      // Get Swarm info if active
      let swarmInfo = null;
      if (isSwarmActive) {
        swarmInfo = await this.dockerClient.getSwarmInfo();
      }

      // Get cache health
      const cacheHealth = await this.cacheManager.getCacheHealth();

      return {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        dockerConnected,
        isSwarmActive,
        swarmInfo,
        cacheHealth,
        hooks: this.terminalHookManager.getHookStatus(),
        config: this.configManager.getAll()
      };
    } catch (error) {
      this.logger.error('DockerIntegrationManager', `Error getting system status: ${error instanceof Error ? error.message : String(error)}`);

      return {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        dockerConnected: false,
        isSwarmActive: false
      };
    }
  }

  /**
   * Create initialization marker file
   */
  private createInitializationMarker(): void {
    try {
      const markerDir = path.join(os.homedir(), '.transformers-docker');

      // Create directory if it doesn't exist
      if (!fs.existsSync(markerDir)) {
        fs.mkdirSync(markerDir, { recursive: true });
      }

      // Write marker file
      const markerPath = path.join(markerDir, 'initialized.json');

      fs.writeFileSync(markerPath, JSON.stringify({
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        hostname: os.hostname(),
        platform: os.platform(),
        version: this.configManager.get('version', '1.0.0')
      }, null, 2));

      this.logger.debug('DockerIntegrationManager', `Created initialization marker at ${markerPath}`);
    } catch (error) {
      this.logger.error('DockerIntegrationManager', `Error creating initialization marker: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if the system was previously initialized
   */
  public static isInitialized(): boolean {
    const markerPath = path.join(os.homedir(), '.transformers-docker', 'initialized.json');
    return fs.existsSync(markerPath);
  }

  /**
   * Reinitialize the system if needed
   */
  public async reinitializeIfNeeded(): Promise<boolean> {
    // Check if Docker is running
    const dockerConnected = await this.dockerClient.checkDockerConnection();
    if (!dockerConnected) {
      this.logger.warn('DockerIntegrationManager', 'Docker is not running, skipping reinitialization');
      return false;
    }

    // Check if Swarm is active
    const isSwarmActive = await this.dockerClient.isSwarmActive();

    if (!isSwarmActive) {
      this.logger.info('DockerIntegrationManager', 'Swarm is not active, reinitializing');
      return await this.initialize();
    }

    this.logger.info('DockerIntegrationManager', 'Swarm is already active, no reinitialization needed');
    return true;
  }
}

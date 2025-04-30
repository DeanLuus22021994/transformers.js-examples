const path = require('path');
const fs = require('fs');
const os = require('os');

// Import modular Azure services
const {
    BlobStorageClient,
    LogAnalyticsClient,
    SecretManager,
    AzureEnvironment,
    AzureInitializationError
} = require('./azure');

/**
 * Azure Solution Insight Service
 * Provides traceability and oversight analytics using Azure services
 */
class AzureSolutionInsightService {
    /**
     * Create a new Azure Solution Insight Service
     * @param {object} configManager Configuration manager
     * @param {object} logger Logger instance
     */
    constructor(configManager, logger) {
        this.configManager = configManager;
        this.logger = logger;

        // Service clients
        this.blobStorageClient = null;
        this.logAnalyticsClient = null;
        this.secretManager = null;

        // State
        this.workspaceId = null;
        this.isInitialized = false;
    }

    /**
     * Initialize Azure services with best practices
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            // Check if Azure Monitor integration is enabled
            if (!this.configManager.getValue('solutionOversight', 'azureMonitorIntegration', 'enabled', false)) {
                this.logger.info('Azure Monitor integration is not enabled');
                return false;
            }

            // Initialize services in parallel for better performance
            const initPromises = [];

            // Initialize Blob Storage
            initPromises.push(this.initializeBlobStorage());

            // Initialize Log Analytics
            initPromises.push(this.initializeLogAnalytics());

            // Initialize Key Vault (if needed)
            initPromises.push(this.initializeKeyVault());

            // Wait for all initializations to complete
            await Promise.all(initPromises);

            this.isInitialized = true;
            this.logger.info('Azure Solution Insight Service initialized successfully');
            return true;
        } catch (error) {
            this.logger.error('AZURE_INIT_ERROR', `Failed to initialize Azure Solution Insight: ${error.message}`);
            return false;
        }
    }

    /**
     * Initialize Blob Storage client
     * @returns {Promise<void>}
     */
    async initializeBlobStorage() {
        try {
            // Get storage account from config or environment
            const storageAccount = this.configManager.getValue(
                'solutionOversight',
                'azureMonitorIntegration',
                'storageAccount',
                null
            );

            // Create and initialize the client
            this.blobStorageClient = new BlobStorageClient(this.logger);
            await this.blobStorageClient.initialize(storageAccount);

            return true;
        } catch (error) {
            this.logger.warning(`Blob Storage initialization failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Initialize Log Analytics client
     * @returns {Promise<void>}
     */
    async initializeLogAnalytics() {
        try {
            const logAnalyticsEnabled = this.configManager.getValue(
                'solutionOversight',
                'azureMonitorIntegration',
                'logAnalytics',
                'enabled',
                true
            );

            if (!logAnalyticsEnabled) {
                return false;
            }

            // Get workspace ID from config
            this.workspaceId = this.configManager.getValue(
                'solutionOversight',
                'azureMonitorIntegration',
                'logAnalytics',
                'workspaceId',
                process.env.AZURE_LOG_WORKSPACE_ID
            );

            if (!this.workspaceId) {
                this.logger.warning('Log Analytics workspace ID not configured');
                return false;
            }

            // Get shared key
            const sharedKey = await this.getLogAnalyticsSharedKey();
            if (!sharedKey) {
                this.logger.warning('Log Analytics shared key not available');
                return false;
            }

            // Create the client
            this.logAnalyticsClient = new LogAnalyticsClient(this.workspaceId, sharedKey, this.logger);

            return true;
        } catch (error) {
            this.logger.warning(`Log Analytics initialization failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Initialize Key Vault client
     * @returns {Promise<void>}
     */
    async initializeKeyVault() {
        try {
            // Get Key Vault name from config
            const keyVaultName = this.configManager.getValue(
                'solutionOversight',
                'azureMonitorIntegration',
                'keyVaultReference',
                process.env.AZURE_KEYVAULT_NAME
            );

            if (!keyVaultName) {
                this.logger.info('No Key Vault configured, skipping initialization');
                return false;
            }

            // Create and initialize the client
            this.secretManager = new SecretManager(keyVaultName, this.logger);
            await this.secretManager.initialize();

            return true;
        } catch (error) {
            this.logger.warning(`Key Vault initialization failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Log solution analysis event to Azure Log Analytics
     * @param {string} eventType Event type
     * @param {object} eventData Event data
     * @returns {Promise<boolean>} Success status
     */
    async logSolutionEvent(eventType, eventData) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.isInitialized) {
            this.logger.warning('Azure Solution Insight not initialized for event logging');
            return false;
        }

        try {
            // Best practice: Use a structured log format with consistent fields
            const logEntry = {
                Timestamp: new Date().toISOString(),
                EventType: eventType,
                ProjectId: this.configManager.getValue('meta', 'project', 'transformers.js-examples'),
                Environment: this.configManager.config?.config?.currentEnvironment || 'development',
                CorrelationId: eventData.correlationId || this.generateCorrelationId(),
                Source: 'DevDebtProcessor',
                // Flatten event data
                ...this.flattenObject(eventData)
            };

            // Determine where to store the log
            if (this.logAnalyticsClient && this.workspaceId) {
                // Use the Log Analytics Data Collector API
                const logType = 'DevDebtTracking_CL'; // Custom log type name, must end with _CL
                try {
                    const result = await this.logAnalyticsClient.sendData(logType, logEntry);

                    if (result) {
                        this.logger.info(`[Azure Log Analytics] Event logged to ${logType}: ${eventType}`);
                        return true;
                    }
                } catch (logError) {
                    this.logger.warning(`Log Analytics logging failed, falling back: ${logError.message}`);
                    // Fall through to next options
                }
            }

            if (this.blobStorageClient) {
                // If Log Analytics is not available or failed, store in Blob Storage
                const containerName = 'dev-debt-logs';
                const blobName = `${eventType}/${new Date().toISOString().replace(/:/g, '-')}-${this.generateShortId()}.json`;

                await this.blobStorageClient.storeData(containerName, blobName, logEntry);
                this.logger.info(`[Azure Blob Storage] Event logged: ${eventType}`);
                return true;
            }

            // Last resort: local file system
            const logDir = path.join(os.tmpdir(), 'azure-insight-logs');

            // Ensure directory exists
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            const logFile = path.join(
                logDir,
                `azure-insight-${new Date().toISOString().slice(0, 10)}.jsonl`
            );

            fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
            this.logger.info(`[Local File] Event logged: ${eventType} to ${logFile}`);
            return true;

        } catch (error) {
            this.logger.error('AZURE_LOG_EVENT_ERROR', `Failed to log solution event: ${error.message}`);
            return false;
        }
    }

    /**
     * Get the Log Analytics shared key
     * @returns {Promise<string|null>} The shared key or null if not available
     */
    async getLogAnalyticsSharedKey() {
        try {
            // First check if key is available directly in environment variables
            if (process.env.AZURE_LOG_KEY) {
                return process.env.AZURE_LOG_KEY;
            }

            // Check if there's a Key Vault reference and if Key Vault is initialized
            const keyVaultReference = this.configManager.getValue(
                'solutionOversight',
                'azureMonitorIntegration',
                'logAnalytics',
                'keyVaultReference',
                null
            );

            if (keyVaultReference && this.secretManager) {
                // Best practice: Use Key Vault for secret management
                try {
                    return await this.secretManager.getSecret(keyVaultReference);
                } catch (keyVaultError) {
                    this.logger.warning(`Failed to get key from Key Vault: ${keyVaultError.message}`);
                }
            }

            // If no key available, log warning
            this.logger.warning('No Log Analytics shared key available');
            return null;
        } catch (error) {
            this.logger.error('AZURE_KEY_ERROR', `Failed to get Log Analytics key: ${error.message}`);
            return null;
        }
    }

    /**
     * Flatten an object for Log Analytics
     * @param {object} obj The object to flatten
     * @param {string} prefix Current prefix for property names
     * @returns {object} Flattened object
     */
    flattenObject(obj, prefix = '') {
        const result = {};

        for (const key in obj) {
            const value = obj[key];
            const newKey = prefix ? `${prefix}_${key}` : key;

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.assign(result, this.flattenObject(value, newKey));
            } else if (Array.isArray(value)) {
                result[newKey] = JSON.stringify(value);
            } else {
                result[newKey] = value;
            }
        }

        return result;
    }

    /**
     * Generate a correlation ID for tracing
     * @returns {string} Correlation ID
     */
    generateCorrelationId() {
        return 'corr-' + Math.random().toString(36).substring(2, 15) +
               '-' + Math.random().toString(36).substring(2, 15);
    }

    /**
     * Generate a short ID for use in file names
     * @returns {string} Short ID
     */
    generateShortId() {
        return Math.random().toString(36).substring(2, 10);
    }

    /**
     * Query solution insights from Log Analytics
     * @param {string} query The KQL query
     * @param {object} options Query options
     * @returns {Promise<object>} Query results
     */
    async querySolutionInsights(query, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.isInitialized) {
            throw new AzureInitializationError('Azure Solution Insight not initialized for querying');
        }

        // This is a placeholder - to implement actual querying, you'd need to add the LogsQueryClient
        // from @azure/monitor-query package and implement the actual query logic

        this.logger.warning('Azure Log Analytics querying not implemented yet');
        return null;
    }
}

module.exports = AzureSolutionInsightService;
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const { BlobServiceClient } = require('@azure/storage-blob');
const vscode = require('vscode');

/**
 * Azure integration service for Dev Debt processor
 */
class AzureIntegrationService {
    constructor(configManager, logger) {
        this.configManager = configManager;
        this.logger = logger;
        this.credential = null;
        this.isInitialized = false;
    }

    /**
     * Initialize Azure services
     */
    async initialize() {
        try {
            // Check if Azure integration is enabled
            const isEnabled = this.configManager.getValue('integrations', 'azure', 'enabled', false);
            if (!isEnabled) {
                this.logger.info('Azure integration is not enabled');
                return false;
            }

            // Initialize Azure credential
            this.credential = new DefaultAzureCredential();

            // Test the credential by making a simple call
            await this.credential.getToken("https://management.azure.com/.default");

            this.isInitialized = true;
            this.logger.info('Azure integration initialized successfully');
            return true;
        } catch (error) {
            this.logger.error('AZURE_INIT_FAILED', `Failed to initialize Azure integration: ${error.message}`);
            return false;
        }
    }

    /**
     * Store dev debt data in Azure Blob Storage
     * @param {string} projectPath Project path
     * @param {object} devDebtData Dev debt data
     */
    async storeDevDebtData(projectPath, devDebtData) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.isInitialized) {
            this.logger.error('AZURE_NOT_INITIALIZED', 'Azure integration is not initialized');
            return false;
        }

        try {
            // Get storage account name from config
            const storageAccount = this.configManager.getValue('integrations', 'azure', 'storageAccount', null);
            if (!storageAccount) {
                this.logger.error('AZURE_CONFIG_ERROR', 'Azure storage account not configured');
                return false;
            }

            // Create blob service client
            const blobServiceClient = new BlobServiceClient(
                `https://${storageAccount}.blob.core.windows.net`,
                this.credential
            );

            // Create container client (use project name as container)
            const containerName = `devdebt-${projectPath.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
            const containerClient = blobServiceClient.getContainerClient(containerName);

            // Create container if it doesn't exist
            await containerClient.createIfNotExists({
                access: 'blob' // Public read access for blobs
            });

            // Create blob client
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const blobName = `devdebt-${timestamp}.json`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            // Upload dev debt data
            await blockBlobClient.upload(
                JSON.stringify(devDebtData, null, 2),
                JSON.stringify(devDebtData, null, 2).length,
                {
                    blobHTTPHeaders: {
                        blobContentType: 'application/json'
                    },
                    metadata: {
                        project: projectPath,
                        timestamp: timestamp,
                        type: 'dev-debt'
                    }
                }
            );

            this.logger.info(`Dev debt data stored in Azure Blob Storage: ${containerName}/${blobName}`);
            return true;
        } catch (error) {
            this.logger.error('AZURE_STORAGE_ERROR', `Failed to store dev debt data: ${error.message}`);
            return false;
        }
    }

    /**
     * Retrieve secrets from Azure Key Vault
     * @param {string} secretName Secret name
     * @returns {Promise<string>} Secret value
     */
    async getSecret(secretName) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.isInitialized) {
            this.logger.error('AZURE_NOT_INITIALIZED', 'Azure integration is not initialized');
            return null;
        }

        try {
            // Get key vault name from config
            const keyVaultName = this.configManager.getValue('integrations', 'azure', 'keyVaultName', null);
            if (!keyVaultName) {
                this.logger.error('AZURE_CONFIG_ERROR', 'Azure Key Vault not configured');
                return null;
            }

            // Create secret client
            const secretClient = new SecretClient(
                `https://${keyVaultName}.vault.azure.net`,
                this.credential
            );

            // Get secret
            const secret = await secretClient.getSecret(secretName);
            return secret.value;
        } catch (error) {
            this.logger.error('AZURE_KEYVAULT_ERROR', `Failed to get secret ${secretName}: ${error.message}`);
            return null;
        }
    }
}

module.exports = AzureIntegrationService;
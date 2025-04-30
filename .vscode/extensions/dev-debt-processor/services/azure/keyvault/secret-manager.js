const { SecretClient } = require('@azure/keyvault-secrets');
const AzureCredentialProvider = require('../common/azure-credential');
const { KeyVaultError } = require('../common/error-types');

/**
 * Client for managing secrets in Azure Key Vault
 */
class SecretManager {
    /**
     * Create a new Secret Manager
     * @param {string} vaultUrl Key Vault URL or name
     * @param {object} logger Logger instance
     */
    constructor(vaultUrl, logger) {
        this.logger = logger;
        this.vaultUrl = this.normalizeVaultUrl(vaultUrl);
        this.secretClient = null;
        this.isInitialized = false;
    }

    /**
     * Normalize the vault URL
     * @param {string} vaultUrl Vault URL or name
     * @returns {string} Normalized vault URL
     */
    normalizeVaultUrl(vaultUrl) {
        if (!vaultUrl) return null;

        // If it's already a URL, return it
        if (vaultUrl.startsWith('https://')) {
            return vaultUrl;
        }

        // Otherwise, assume it's a vault name and build the URL
        return `https://${vaultUrl}.vault.azure.net`;
    }

    /**
     * Initialize the Secret Manager
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            if (this.isInitialized) {
                return true;
            }

            if (!this.vaultUrl) {
                throw new KeyVaultError('Key Vault URL not provided');
            }

            // Get a credential
            const credential = AzureCredentialProvider.getCredential();

            // Create a client
            this.secretClient = new SecretClient(this.vaultUrl, credential);

            this.isInitialized = true;
            this.logger.info(`Initialized Secret Manager for vault ${this.vaultUrl}`);
            return true;
        } catch (error) {
            this.logger.error('AZURE_KEYVAULT_INIT_ERROR', `Failed to initialize Key Vault: ${error.message}`);
            throw new KeyVaultError(`Failed to initialize Key Vault: ${error.message}`);
        }
    }

    /**
     * Get a secret from the key vault
     * @param {string} secretName Secret name
     * @returns {Promise<string>} Secret value
     */
    async getSecret(secretName) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const secret = await this.secretClient.getSecret(secretName);
            return secret.value;
        } catch (error) {
            this.logger.error('AZURE_KEYVAULT_GET_ERROR', `Failed to get secret ${secretName}: ${error.message}`);
            throw new KeyVaultError(`Failed to get secret ${secretName}: ${error.message}`);
        }
    }

    /**
     * Set a secret in the key vault
     * @param {string} secretName Secret name
     * @param {string} secretValue Secret value
     * @returns {Promise<object>} Created or updated secret
     */
    async setSecret(secretName, secretValue) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const result = await this.secretClient.setSecret(secretName, secretValue);
            return result;
        } catch (error) {
            this.logger.error('AZURE_KEYVAULT_SET_ERROR', `Failed to set secret ${secretName}: ${error.message}`);
            throw new KeyVaultError(`Failed to set secret ${secretName}: ${error.message}`);
        }
    }
}

module.exports = SecretManager;
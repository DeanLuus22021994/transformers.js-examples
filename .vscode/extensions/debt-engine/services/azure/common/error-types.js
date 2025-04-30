/**
 * Custom error types for Azure service integration
 */

/**
 * Base error class for all Azure integration errors
 */
class AzureIntegrationError extends Error {
    constructor(message, code = 'AZURE_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error thrown when Azure initialization fails
 */
class AzureInitializationError extends AzureIntegrationError {
    constructor(message) {
        super(message, 'AZURE_INIT_ERROR');
    }
}

/**
 * Error thrown when Azure configuration is invalid
 */
class AzureConfigurationError extends AzureIntegrationError {
    constructor(message) {
        super(message, 'AZURE_CONFIG_ERROR');
    }
}

/**
 * Error thrown when a Log Analytics operation fails
 */
class LogAnalyticsError extends AzureIntegrationError {
    constructor(message) {
        super(message, 'AZURE_LOG_ANALYTICS_ERROR');
    }
}

/**
 * Error thrown when a Blob Storage operation fails
 */
class BlobStorageError extends AzureIntegrationError {
    constructor(message) {
        super(message, 'AZURE_BLOB_ERROR');
    }
}

/**
 * Error thrown when a Key Vault operation fails
 */
class KeyVaultError extends AzureIntegrationError {
    constructor(message) {
        super(message, 'AZURE_KEYVAULT_ERROR');
    }
}

module.exports = {
    AzureIntegrationError,
    AzureInitializationError,
    AzureConfigurationError,
    LogAnalyticsError,
    BlobStorageError,
    KeyVaultError
};
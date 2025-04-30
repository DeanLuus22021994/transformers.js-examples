const { DefaultAzureCredential } = require('@azure/identity');

/**
 * Provides a centralized method for obtaining Azure credentials
 * following Azure best practices for authentication.
 */
class AzureCredentialProvider {
    /**
     * Get an Azure credential instance suitable for the current environment
     * @param {object} options Credential options
     * @returns {DefaultAzureCredential} An Azure credential instance
     */
    static getCredential(options = {}) {
        // Set default options
        const defaultOptions = {
            managedIdentityClientId: process.env.AZURE_CLIENT_ID || undefined,
            loggingOptions: {
                logLevel: "warning"
            }
        };

        // Merge with user-provided options
        const mergedOptions = { ...defaultOptions, ...options };

        // Best practice: Use DefaultAzureCredential which tries multiple authentication methods
        // in a pre-defined order appropriate for the environment
        return new DefaultAzureCredential(mergedOptions);
    }
}

module.exports = AzureCredentialProvider;
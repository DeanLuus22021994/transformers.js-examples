/**
 * Helper for determining and managing environment-specific settings
 */
class AzureEnvironment {
    /**
     * Check if the current environment is a local development environment
     * @returns {boolean} True if local development, false otherwise
     */
    static isLocalDevelopment() {
        return process.env.NODE_ENV === 'development' ||
               process.env.NODE_ENV === 'local' ||
               !process.env.NODE_ENV;
    }

    /**
     * Check if Azurite emulator should be used
     * @returns {boolean} True if Azurite should be used
     */
    static useAzuriteEmulator() {
        return this.isLocalDevelopment() &&
               (process.env.USE_AZURITE === 'true' ||
               process.env.AZURE_STORAGE_CONNECTION_STRING?.includes('azurite') ||
               process.env.AZURE_STORAGE_CONNECTION_STRING?.includes('devstoreaccount1'));
    }

    /**
     * Get the appropriate connection string for the current environment
     * @returns {string|null} Connection string or null if not available
     */
    static getStorageConnectionString() {
        return process.env.AZURE_STORAGE_CONNECTION_STRING || null;
    }

    /**
     * Get the appropriate PostgreSQL connection string for the current environment
     * @returns {string|null} PostgreSQL connection string or null if not available
     */
    static getPostgresConnectionString() {
        if (this.isLocalDevelopment() && process.env.POSTGRES_CONNECTION_STRING_LOCAL) {
            return process.env.POSTGRES_CONNECTION_STRING_LOCAL;
        }

        return process.env.POSTGRES_CONNECTION_STRING || null;
    }
}

module.exports = AzureEnvironment;
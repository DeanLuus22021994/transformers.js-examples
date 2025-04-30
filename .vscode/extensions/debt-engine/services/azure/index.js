const AzureCredentialProvider = require('./common/azure-credential');
const AzureEnvironment = require('./common/environment');
const BlobStorageClient = require('./storage/blob-storage-client');
const LogAnalyticsClient = require('./analytics/log-analytics-client');
const SecretManager = require('./keyvault/secret-manager');
const PostgresClient = require('./database/postgres-client');
const DevDebtRepository = require('./dev-debt/dev-debt-repository');
const ErrorTypes = require('./common/error-types');

/**
 * Main export point for Azure services
 */
module.exports = {
    // Clients
    BlobStorageClient,
    LogAnalyticsClient,
    SecretManager,
    PostgresClient,
    DevDebtRepository,

    // Utilities
    AzureCredentialProvider,
    AzureEnvironment,

    // Error types
    ...ErrorTypes
};
const { BlobServiceClient } = require('@azure/storage-blob');
const AzureCredentialProvider = require('../common/azure-credential');
const AzureEnvironment = require('../common/environment');
const { BlobStorageError } = require('../common/error-types');

/**
 * Client for interacting with Azure Blob Storage
 */
class BlobStorageClient {
    /**
     * Create a new Blob Storage client
     * @param {object} logger Logger instance
     * @param {string} connectionString Optional connection string override
     */
    constructor(logger, connectionString) {
        this.logger = logger;
        this.connectionString = connectionString || AzureEnvironment.getStorageConnectionString();
        this.blobServiceClient = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the blob storage client
     * @param {string} storageAccount Optional storage account name for credential flow
     * @returns {Promise<boolean>} Success status
     */
    async initialize(storageAccount) {
        try {
            if (this.isInitialized) {
                return true;
            }

            if (this.connectionString) {
                // Best practice: Use connection string for local development and emulator support
                this.blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
                this.logger.info('Initialized Blob Storage client using connection string');
            } else if (storageAccount) {
                // Use managed identity or other credential types for production
                const credential = AzureCredentialProvider.getCredential();
                this.blobServiceClient = new BlobServiceClient(
                    `https://${storageAccount}.blob.core.windows.net`,
                    credential
                );
                this.logger.info(`Initialized Blob Storage client for account ${storageAccount} using Azure credentials`);
            } else {
                throw new BlobStorageError('No storage connection string or account name provided');
            }

            this.isInitialized = true;
            return true;
        } catch (error) {
            this.logger.error('AZURE_BLOB_INIT_ERROR', `Failed to initialize Blob Storage: ${error.message}`);
            throw new BlobStorageError(`Failed to initialize Blob Storage: ${error.message}`);
        }
    }

    /**
     * Store data in a blob
     * @param {string} containerName Container name
     * @param {string} blobName Blob name
     * @param {object|string} data Data to store
     * @param {object} options Additional options
     * @returns {Promise<string>} URL of the stored blob
     */
    async storeData(containerName, blobName, data, options = {}) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            // Get container client and create container if it doesn't exist
            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            await containerClient.createIfNotExists({
                access: options.publicAccess ? 'blob' : undefined
            });

            // Get blob client
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            // Convert data to appropriate format
            let content;
            let contentType;

            if (typeof data === 'string') {
                content = data;
                contentType = 'text/plain';
            } else {
                content = JSON.stringify(data, null, 2);
                contentType = 'application/json';
            }

            // Upload the content
            const uploadOptions = {
                blobHTTPHeaders: {
                    blobContentType: options.contentType || contentType
                },
                metadata: options.metadata || {
                    timestamp: new Date().toISOString()
                }
            };

            await blockBlobClient.upload(content, content.length, uploadOptions);

            this.logger.info(`Successfully uploaded blob to ${containerName}/${blobName}`);
            return blockBlobClient.url;
        } catch (error) {
            this.logger.error('AZURE_BLOB_STORE_ERROR', `Failed to store data in blob: ${error.message}`);
            throw new BlobStorageError(`Failed to store data in blob: ${error.message}`);
        }
    }

    /**
     * List blobs in a container
     * @param {string} containerName Container name
     * @param {object} options List options
     * @returns {Promise<Array>} Array of blob items
     */
    async listBlobs(containerName, options = {}) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            const blobs = [];

            // List blobs
            for await (const blob of containerClient.listBlobsFlat(options)) {
                blobs.push(blob);
            }

            return blobs;
        } catch (error) {
            this.logger.error('AZURE_BLOB_LIST_ERROR', `Failed to list blobs: ${error.message}`);
            throw new BlobStorageError(`Failed to list blobs: ${error.message}`);
        }
    }

    /**
     * Download blob data
     * @param {string} containerName Container name
     * @param {string} blobName Blob name
     * @returns {Promise<string|object>} Blob content
     */
    async downloadData(containerName, blobName) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            // Download blob content
            const downloadResponse = await blockBlobClient.download(0);
            const content = await this.streamToString(downloadResponse.readableStreamBody);

            // Try to parse as JSON if it looks like JSON
            if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
                try {
                    return JSON.parse(content);
                } catch {
                    // If parsing fails, return as string
                    return content;
                }
            }

            return content;
        } catch (error) {
            this.logger.error('AZURE_BLOB_DOWNLOAD_ERROR', `Failed to download blob: ${error.message}`);
            throw new BlobStorageError(`Failed to download blob: ${error.message}`);
        }
    }

    /**
     * Convert a readable stream to a string
     * @param {ReadableStream} readableStream The stream to convert
     * @returns {Promise<string>} The stream content as a string
     */
    async streamToString(readableStream) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            readableStream.on('data', (data) => {
                chunks.push(data.toString());
            });
            readableStream.on('end', () => {
                resolve(chunks.join(''));
            });
            readableStream.on('error', reject);
        });
    }
}

module.exports = BlobStorageClient;
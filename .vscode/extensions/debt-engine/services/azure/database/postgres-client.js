const { Pool } = require('pg');
const AzureEnvironment = require('../common/environment');

/**
 * Client for interacting with PostgreSQL databases
 */
class PostgresClient {
    /**
     * Create a new PostgreSQL client
     * @param {object} logger Logger instance
     * @param {string} connectionString Optional connection string override
     */
    constructor(logger, connectionString) {
        this.logger = logger;
        this.connectionString = connectionString || AzureEnvironment.getPostgresConnectionString();
        this.pool = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the PostgreSQL client
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            if (this.isInitialized) {
                return true;
            }

            if (!this.connectionString) {
                throw new Error('PostgreSQL connection string not provided');
            }

            // Create connection pool
            this.pool = new Pool({
                connectionString: this.connectionString,
                // Best practices for connection pooling
                max: 20, // Maximum number of clients
                idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
                connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
                ssl: !AzureEnvironment.isLocalDevelopment() ? { rejectUnauthorized: false } : false
            });

            // Test the connection
            const client = await this.pool.connect();
            client.release();

            this.isInitialized = true;
            this.logger.info('PostgreSQL client initialized successfully');
            return true;
        } catch (error) {
            this.logger.error('POSTGRES_INIT_ERROR', `Failed to initialize PostgreSQL client: ${error.message}`);
            throw error;
        }
    }

    /**
     * Execute a query
     * @param {string} text Query text
     * @param {Array} params Query parameters
     * @returns {Promise<object>} Query results
     */
    async query(text, params = []) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const start = Date.now();
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;

            this.logger.info(`Executed query in ${duration}ms: ${text.substring(0, 50)}...`);
            return result;
        } catch (error) {
            this.logger.error('POSTGRES_QUERY_ERROR', `Query error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Execute a query with a dedicated client (for transactions)
     * @param {function} callback Function that receives a client and performs operations
     * @returns {Promise<any>} Result of the callback
     */
    async withClient(callback) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const client = await this.pool.connect();
        try {
            return await callback(client);
        } finally {
            client.release();
        }
    }

    /**
     * Execute a transaction
     * @param {function} callback Function that receives a client and performs operations
     * @returns {Promise<any>} Result of the callback
     */
    async transaction(callback) {
        return this.withClient(async (client) => {
            try {
                await client.query('BEGIN');
                const result = await callback(client);
                await client.query('COMMIT');
                return result;
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
        });
    }

    /**
     * Close all connections
     * @returns {Promise<void>}
     */
    async end() {
        if (this.pool) {
            await this.pool.end();
            this.isInitialized = false;
        }
    }
}

module.exports = PostgresClient;
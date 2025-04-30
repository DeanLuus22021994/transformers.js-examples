const { PostgresClient } = require('../index');

/**
 * Repository for storing and retrieving development debt information
 */
class DevDebtRepository {
    /**
     * Create a new Dev Debt Repository
     * @param {object} logger Logger instance
     */
    constructor(logger) {
        this.logger = logger;
        this.postgresClient = new PostgresClient(logger);
        this.isInitialized = false;
    }

    /**
     * Initialize the repository
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            if (this.isInitialized) {
                return true;
            }

            await this.postgresClient.initialize();

            // Ensure tables exist
            await this.ensureTablesExist();

            this.isInitialized = true;
            return true;
        } catch (error) {
            this.logger.error('DEV_DEBT_REPO_INIT_ERROR', `Failed to initialize Dev Debt Repository: ${error.message}`);
            return false;
        }
    }

    /**
     * Ensure necessary database tables exist
     */
    async ensureTablesExist() {
        await this.postgresClient.transaction(async (client) => {
            // Create dev debt table if it doesn't exist
            await client.query(`
                CREATE TABLE IF NOT EXISTS dev_debt (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT,
                    priority TEXT,
                    estimated_effort TEXT,
                    assigned_to TEXT,
                    status TEXT DEFAULT 'Open',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create table for action items
            await client.query(`
                CREATE TABLE IF NOT EXISTS dev_debt_actions (
                    id SERIAL PRIMARY KEY,
                    dev_debt_id INTEGER REFERENCES dev_debt(id) ON DELETE CASCADE,
                    description TEXT NOT NULL,
                    is_completed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create table for related files
            await client.query(`
                CREATE TABLE IF NOT EXISTS dev_debt_files (
                    id SERIAL PRIMARY KEY,
                    dev_debt_id INTEGER REFERENCES dev_debt(id) ON DELETE CASCADE,
                    file_path TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            this.logger.info('Dev Debt database tables created or verified');
        });
    }

    /**
     * Store a dev debt entry
     * @param {object} devDebt Dev debt information
     * @returns {Promise<object>} Created dev debt entry
     */
    async storeDevDebt(devDebt) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return this.postgresClient.transaction(async (client) => {
            // Insert main dev debt record
            const devDebtResult = await client.query(
                `INSERT INTO dev_debt
                (title, description, priority, estimated_effort, assigned_to)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *`,
                [
                    devDebt.title || 'Untitled Dev Debt',
                    devDebt.description || '',
                    devDebt.priority || 'Medium',
                    devDebt.estimatedEffort || '',
                    devDebt.assignedTo || ''
                ]
            );

            const devDebtId = devDebtResult.rows[0].id;

            // Insert action items if provided
            if (Array.isArray(devDebt.actionItems) && devDebt.actionItems.length > 0) {
                for (const item of devDebt.actionItems) {
                    await client.query(
                        `INSERT INTO dev_debt_actions
                        (dev_debt_id, description, is_completed)
                        VALUES ($1, $2, $3)`,
                        [devDebtId, item.description, item.isCompleted || false]
                    );
                }
            }

            // Insert related files if provided
            if (Array.isArray(devDebt.relatedFiles) && devDebt.relatedFiles.length > 0) {
                for (const filePath of devDebt.relatedFiles) {
                    await client.query(
                        `INSERT INTO dev_debt_files
                        (dev_debt_id, file_path)
                        VALUES ($1, $2)`,
                        [devDebtId, filePath]
                    );
                }
            }

            this.logger.info(`Stored dev debt entry with ID ${devDebtId}`);

            // Return the complete dev debt object with ID
            return {
                id: devDebtId,
                ...devDebt
            };
        });
    }

    /**
     * Get all dev debt entries
     * @param {object} filters Optional filters
     * @returns {Promise<Array>} Array of dev debt entries
     */
    async getAllDevDebt(filters = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        let query = `
            SELECT
                d.id, d.title, d.description, d.priority,
                d.estimated_effort, d.assigned_to, d.status,
                d.created_at, d.updated_at
            FROM dev_debt d
        `;

        const whereConditions = [];
        const queryParams = [];
        let paramCount = 1;

        // Apply filters
        if (filters.status) {
            whereConditions.push(`d.status = $${paramCount++}`);
            queryParams.push(filters.status);
        }

        if (filters.priority) {
            whereConditions.push(`d.priority = $${paramCount++}`);
            queryParams.push(filters.priority);
        }

        if (filters.assignedTo) {
            whereConditions.push(`d.assigned_to = $${paramCount++}`);
            queryParams.push(filters.assignedTo);
        }

        // Add where clause if filters were applied
        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }

        // Add order by
        query += ' ORDER BY d.created_at DESC';

        const result = await this.postgresClient.query(query, queryParams);

        // Fetch action items and related files for each dev debt
        const devDebtItems = await Promise.all(result.rows.map(async (row) => {
            const actionItems = await this.getActionItems(row.id);
            const relatedFiles = await this.getRelatedFiles(row.id);

            return {
                ...row,
                actionItems,
                relatedFiles
            };
        }));

        return devDebtItems;
    }

    /**
     * Get action items for a dev debt entry
     * @param {number} devDebtId Dev debt ID
     * @returns {Promise<Array>} Array of action items
     */
    async getActionItems(devDebtId) {
        const result = await this.postgresClient.query(
            `SELECT id, description, is_completed
             FROM dev_debt_actions
             WHERE dev_debt_id = $1
             ORDER BY id ASC`,
            [devDebtId]
        );

        return result.rows;
    }

    /**
     * Get related files for a dev debt entry
     * @param {number} devDebtId Dev debt ID
     * @returns {Promise<Array>} Array of file paths
     */
    async getRelatedFiles(devDebtId) {
        const result = await this.postgresClient.query(
            `SELECT file_path
             FROM dev_debt_files
             WHERE dev_debt_id = $1
             ORDER BY id ASC`,
            [devDebtId]
        );

        return result.rows.map(row => row.file_path);
    }

    /**
     * Get a specific dev debt entry by ID
     * @param {number} id Dev debt ID
     * @returns {Promise<object|null>} Dev debt entry or null if not found
     */
    async getDevDebtById(id) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const result = await this.postgresClient.query(
            `SELECT
                d.id, d.title, d.description, d.priority,
                d.estimated_effort, d.assigned_to, d.status,
                d.created_at, d.updated_at
             FROM dev_debt d
             WHERE d.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const devDebt = result.rows[0];

        // Get action items and related files
        const actionItems = await this.getActionItems(id);
        const relatedFiles = await this.getRelatedFiles(id);

        return {
            ...devDebt,
            actionItems,
            relatedFiles
        };
    }

    /**
     * Update a dev debt entry
     * @param {number} id Dev debt ID
     * @param {object} updates Updates to apply
     * @returns {Promise<object|null>} Updated dev debt entry or null if not found
     */
    async updateDevDebt(id, updates) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return this.postgresClient.transaction(async (client) => {
            // Check if dev debt exists
            const checkResult = await client.query(
                'SELECT id FROM dev_debt WHERE id = $1',
                [id]
            );

            if (checkResult.rows.length === 0) {
                return null;
            }

            // Update main dev debt record
            const updateFields = [];
            const queryParams = [id];
            let paramCount = 2;

            if (updates.title !== undefined) {
                updateFields.push(`title = $${paramCount++}`);
                queryParams.push(updates.title);
            }

            if (updates.description !== undefined) {
                updateFields.push(`description = $${paramCount++}`);
                queryParams.push(updates.description);
            }

            if (updates.priority !== undefined) {
                updateFields.push(`priority = $${paramCount++}`);
                queryParams.push(updates.priority);
            }

            if (updates.estimatedEffort !== undefined) {
                updateFields.push(`estimated_effort = $${paramCount++}`);
                queryParams.push(updates.estimatedEffort);
            }

            if (updates.assignedTo !== undefined) {
                updateFields.push(`assigned_to = $${paramCount++}`);
                queryParams.push(updates.assignedTo);
            }

            if (updates.status !== undefined) {
                updateFields.push(`status = $${paramCount++}`);
                queryParams.push(updates.status);
            }

            // Always update the updated_at timestamp
            updateFields.push('updated_at = CURRENT_TIMESTAMP');

            if (updateFields.length > 0) {
                await client.query(
                    `UPDATE dev_debt
                     SET ${updateFields.join(', ')}
                     WHERE id = $1`,
                    queryParams
                );
            }

            // Update action items if provided
            if (Array.isArray(updates.actionItems)) {
                // Delete existing action items
                await client.query(
                    'DELETE FROM dev_debt_actions WHERE dev_debt_id = $1',
                    [id]
                );

                // Insert new action items
                for (const item of updates.actionItems) {
                    await client.query(
                        `INSERT INTO dev_debt_actions
                        (dev_debt_id, description, is_completed)
                        VALUES ($1, $2, $3)`,
                        [id, item.description, item.isCompleted || false]
                    );
                }
            }

            // Update related files if provided
            if (Array.isArray(updates.relatedFiles)) {
                // Delete existing related files
                await client.query(
                    'DELETE FROM dev_debt_files WHERE dev_debt_id = $1',
                    [id]
                );

                // Insert new related files
                for (const filePath of updates.relatedFiles) {
                    await client.query(
                        `INSERT INTO dev_debt_files
                        (dev_debt_id, file_path)
                        VALUES ($1, $2)`,
                        [id, filePath]
                    );
                }
            }

            this.logger.info(`Updated dev debt entry with ID ${id}`);

            // Return the updated dev debt entry
            return this.getDevDebtById(id);
        });
    }
}

module.exports = DevDebtRepository;
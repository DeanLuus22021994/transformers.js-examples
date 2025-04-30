const path = require('path');
const fs = require('fs');
const xml2js = require('xml2js');
const vscode = require('vscode');
const EnhancedConfigManager = require('./enhanced-config-manager');

/**
 * Configuration manager specifically for solution-wide operations
 */
class SolutionConfigManager {
    constructor(baseConfigManager) {
        this.configManager = baseConfigManager || new EnhancedConfigManager();
        this.workspacePath = vscode.workspace.rootPath || process.cwd();
        this.directoryOverrides = new Map();
        this.currentActivity = null;
        this.iterationState = null;
    }

    /**
     * Initialize the solution config manager
     */
    async initialize() {
        await this.configManager.initialize();
        await this.loadDirectoryConfigurations();
        await this.initializeIterationState();
        return true;
    }

    /**
     * Load directory-specific configurations
     */
    async loadDirectoryConfigurations() {
        try {
            const indexConfigPath = path.join(this.workspacePath, '.config', 'index.config.xml');

            if (!fs.existsSync(indexConfigPath)) {
                console.warn('Index config file not found');
                return false;
            }

            const indexConfigData = fs.readFileSync(indexConfigPath, 'utf8');
            const parser = new xml2js.Parser({ explicitArray: false });
            const indexConfig = await parser.parseStringPromise(indexConfigData);

            if (!indexConfig.config ||
                !indexConfig.config.directoryConfiguration ||
                !indexConfig.config.directoryConfiguration.rootDirectories ||
                !indexConfig.config.directoryConfiguration.rootDirectories.directory) {
                return false;
            }

            // Extract directory configurations
            const directories = Array.isArray(indexConfig.config.directoryConfiguration.rootDirectories.directory)
                ? indexConfig.config.directoryConfiguration.rootDirectories.directory
                : [indexConfig.config.directoryConfiguration.rootDirectories.directory];

            // Store them in the map
            directories.forEach(dirConfig => {
                if (dirConfig.$ && dirConfig.$.path) {
                    this.directoryOverrides.set(dirConfig.$.path, {
                        path: dirConfig.$.path,
                        applyConfig: dirConfig.$.applyConfig === 'true',
                        description: dirConfig.description || '',
                        environment: dirConfig.environment || 'development',
                        features: dirConfig.features || {}
                    });
                }
            });

            return true;
        } catch (error) {
            console.error('Failed to load directory configurations:', error);
            return false;
        }
    }

    /**
     * Initialize iteration state for traceability
     */
    async initializeIterationState() {
        try {
            const traceabilityEnabled = this.configManager.getValue('solutionOversight', 'traceability', 'analysisEnabled', true);

            if (!traceabilityEnabled) {
                return false;
            }

            // Get or create iteration state file
            const stateDir = path.join(this.workspacePath, '.config', 'state');
            const stateFile = path.join(stateDir, 'iteration-state.json');

            if (!fs.existsSync(stateDir)) {
                fs.mkdirSync(stateDir, { recursive: true });
            }

            if (fs.existsSync(stateFile)) {
                const stateData = fs.readFileSync(stateFile, 'utf8');
                this.iterationState = JSON.parse(stateData);
            } else {
                // Create new iteration state
                this.iterationState = {
                    currentIteration: 1,
                    startDate: new Date().toISOString(),
                    endDate: this.calculateIterationEndDate(),
                    metrics: {
                        devDebtResolved: 0,
                        devDebtCreated: 0,
                        testsCovered: 0,
                        codeQualityScore: 100
                    },
                    history: []
                };

                this.saveIterationState();
            }

            return true;
        } catch (error) {
            console.error('Failed to initialize iteration state:', error);
            return false;
        }
    }

    /**
     * Calculate the end date for the current iteration
     * @returns {string} ISO date string for iteration end
     */
    calculateIterationEndDate() {
        const iterationLength = this.configManager.getValue('solutionOversight', 'iterationControl', 'iterationLength', 7);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + iterationLength);
        return endDate.toISOString();
    }

    /**
     * Save the current iteration state
     */
    saveIterationState() {
        try {
            const stateFile = path.join(this.workspacePath, '.config', 'state', 'iteration-state.json');
            fs.writeFileSync(stateFile, JSON.stringify(this.iterationState, null, 2));
            return true;
        } catch (error) {
            console.error('Failed to save iteration state:', error);
            return false;
        }
    }

    /**
     * Check if a feature is enabled for a specific directory
     * @param {string} feature The feature to check
     * @param {string} directoryPath The directory path relative to workspace root
     * @returns {boolean} Whether the feature is enabled
     */
    isFeatureEnabledForDirectory(feature, directoryPath) {
        // First, find the closest parent directory that has configuration
        const configuredDir = this.findConfiguredParentDirectory(directoryPath);

        if (configuredDir) {
            const dirConfig = this.directoryOverrides.get(configuredDir);

            if (dirConfig && dirConfig.applyConfig && dirConfig.features) {
                // If the feature is explicitly defined in this directory's config, use that
                if (dirConfig.features[feature] !== undefined) {
                    return dirConfig.features[feature] === true;
                }
            }
        }

        // Fall back to global setting
        return this.configManager.isEnabled(feature);
    }

    /**
     * Find the closest parent directory that has configuration
     * @param {string} directoryPath The directory path to check
     * @returns {string|null} The configured parent directory or null
     */
    findConfiguredParentDirectory(directoryPath) {
        // Normalize the path
        const normalizedPath = directoryPath.replace(/\\/g, '/');

        // Check if this exact directory has configuration
        if (this.directoryOverrides.has(normalizedPath)) {
            return normalizedPath;
        }

        // Check for parent directories
        const dirs = Array.from(this.directoryOverrides.keys());

        // Sort by path length descending to find the closest parent first
        dirs.sort((a, b) => b.length - a.length);

        for (const dir of dirs) {
            if (normalizedPath.startsWith(dir + '/')) {
                return dir;
            }
        }

        return null;
    }

    /**
     * Get the environment for a specific directory
     * @param {string} directoryPath The directory path relative to workspace root
     * @returns {string} The environment name
     */
    getDirectoryEnvironment(directoryPath) {
        const configuredDir = this.findConfiguredParentDirectory(directoryPath);

        if (configuredDir) {
            const dirConfig = this.directoryOverrides.get(configuredDir);
            if (dirConfig && dirConfig.environment) {
                return dirConfig.environment;
            }
        }

        // Fall back to global environment
        return this.configManager.config.config.currentEnvironment || 'development';
    }

    /**
     * Set the current activity for traceability
     * @param {string} activity The activity name
     * @param {string} context Additional context
     */
    setCurrentActivity(activity, context = null) {
        this.currentActivity = {
            name: activity,
            startTime: new Date().toISOString(),
            context: context,
            correlationId: this.generateCorrelationId()
        };

        // Log the activity start if traceability is enabled
        const traceabilityEnabled = this.configManager.getValue('solutionOversight', 'traceability', 'analysisEnabled', true);

        if (traceabilityEnabled) {
            this.logTraceabilityEvent('activity_started', {
                activity: this.currentActivity.name,
                correlationId: this.currentActivity.correlationId,
                context: this.currentActivity.context
            });
        }
    }

    /**
     * End the current activity
     * @param {object} result Result data
     */
    endCurrentActivity(result = null) {
        if (!this.currentActivity) {
            return;
        }

        this.currentActivity.endTime = new Date().toISOString();
        this.currentActivity.result = result;

        // Log the activity end if traceability is enabled
        const traceabilityEnabled = this.configManager.getValue('solutionOversight', 'traceability', 'analysisEnabled', true);

        if (traceabilityEnabled) {
            this.logTraceabilityEvent('activity_completed', {
                activity: this.currentActivity.name,
                correlationId: this.currentActivity.correlationId,
                duration: this.calculateActivityDuration(
                    this.currentActivity.startTime,
                    this.currentActivity.endTime
                ),
                result: result
            });
        }

        this.currentActivity = null;
    }

    /**
     * Log a traceability event
     * @param {string} eventType The type of event
     * @param {object} eventData Event data
     */
    logTraceabilityEvent(eventType, eventData) {
        try {
            const traceabilityEnabled = this.configManager.getValue('solutionOversight', 'traceability', 'analysisEnabled', true);

            if (!traceabilityEnabled) {
                return;
            }

            // Get log path from config
            const reportPath = this.configManager.getValue(
                'traceabilityAnalysis',
                'iterationControl',
                'reportPath',
                './reports/traceability'
            );

            const logDir = path.resolve(path.join(this.workspacePath, reportPath));

            // Ensure directory exists
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            const now = new Date();
            const logFile = path.join(
                logDir,
                `traceability-${now.toISOString().slice(0, 10)}.jsonl`
            );

            // Create the log entry
            const entry = {
                timestamp: now.toISOString(),
                eventType,
                iterationId: this.iterationState?.currentIteration,
                ...eventData
            };

            // Append to log file
            fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');

            // Check if we need to update iteration metrics
            this.updateIterationMetricsIfNeeded(eventType, eventData);

            return true;
        } catch (error) {
            console.error('Failed to log traceability event:', error);
            return false;
        }
    }

    /**
     * Update iteration metrics based on events
     * @param {string} eventType The type of event
     * @param {object} eventData Event data
     */
    updateIterationMetricsIfNeeded(eventType, eventData) {
        if (!this.iterationState) {
            return;
        }

        switch (eventType) {
            case 'dev_debt_created':
                this.iterationState.metrics.devDebtCreated++;
                break;

            case 'dev_debt_resolved':
                this.iterationState.metrics.devDebtResolved++;
                break;

            case 'test_added':
                this.iterationState.metrics.testsCovered++;
                break;

            case 'code_quality_changed':
                if (eventData.score !== undefined) {
                    this.iterationState.metrics.codeQualityScore = eventData.score;
                }
                break;
        }

        // Save the updated state
        this.saveIterationState();
    }

    /**
     * End current iteration and start a new one
     */
    async startNewIteration() {
        if (!this.iterationState) {
            await this.initializeIterationState();
            return;
        }

        // Save the current iteration to history
        this.iterationState.history.push({
            iteration: this.iterationState.currentIteration,
            startDate: this.iterationState.startDate,
            endDate: this.iterationState.endDate,
            metrics: { ...this.iterationState.metrics }
        });

        // Start a new iteration
        this.iterationState.currentIteration++;
        this.iterationState.startDate = new Date().toISOString();
        this.iterationState.endDate = this.calculateIterationEndDate();

        // Reset metrics
        this.iterationState.metrics = {
            devDebtResolved: 0,
            devDebtCreated: 0,
            testsCovered: 0,
            codeQualityScore: 100
        };

        // Save the new state
        this.saveIterationState();

        // Log the iteration change
        this.logTraceabilityEvent('iteration_started', {
            iteration: this.iterationState.currentIteration,
            startDate: this.iterationState.startDate,
            endDate: this.iterationState.endDate
        });
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
     * Calculate duration between two ISO timestamps in milliseconds
     * @param {string} startTime ISO timestamp for start time
     * @param {string} endTime ISO timestamp for end time
     * @returns {number} Duration in milliseconds
     */
    calculateActivityDuration(startTime, endTime) {
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();
        return end - start;
    }

    /**
     * Get configuration for integrating with Copilot
     * @param {string} directoryPath Optional directory path for context
     * @returns {object} Configuration for Copilot
     */
    getCopilotContextConfiguration(directoryPath = null) {
        const copilotEnabled = this.configManager.getValue('copilotIntegration', 'enabled', true);

        if (!copilotEnabled) {
            return null;
        }

        // Get directory-specific environment if applicable
        const environment = directoryPath
            ? this.getDirectoryEnvironment(directoryPath)
            : this.configManager.config.config.currentEnvironment || 'development';

        // Get primary template path
        const templatePath = this.configManager.getValue(
            'copilotIntegration',
            'templateManagement',
            'primaryTemplatePath',
            '.github/instructions/format_dev_debt_docs.instructions.md'
        );

        // Build context configuration
        return {
            enabled: true,
            environment,
            templates: {
                devDebt: templatePath,
                testing: this.configManager.getValue('copilotIntegration', 'featureSpecificPrompts', 'testing', 'promptPath', null),
                maintenance: this.configManager.getValue('copilotIntegration', 'featureSpecificPrompts', 'maintenance', 'promptPath', null)
            },
            contextAttributes: {
                includeConfig: this.configManager.getValue('copilotIntegration', 'contextAlignment', 'includeConfigInContext', true),
                adaptToDirectory: this.configManager.getValue('copilotIntegration', 'contextAlignment', 'adaptToDirectory', true),
                contextDepth: this.configManager.getValue('copilotIntegration', 'contextAlignment', 'contextDepth', 'comprehensive')
            },
            currentIteration: this.iterationState?.currentIteration || 1
        };
    }
}

module.exports = SolutionConfigManager;
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

/**
 * Configuration manager that integrates with the .copilot directory
 */
class CopilotConfigManager {
    constructor() {
        this.workspacePath = vscode.workspace.rootPath || process.cwd();
        this.configPath = path.join(this.workspacePath, '.copilot', 'config.json');
        this.config = null;
    }

    /**
     * Initialize configuration manager
     */
    async initialize() {
        try {
            await this.loadConfig();
            await this.ensureDevDebtSection();
            return true;
        } catch (error) {
            console.error('Error initializing config manager:', error);
            return false;
        }
    }

    /**
     * Load configuration from .copilot/config.json
     */
    async loadConfig() {
        try {
            if (!fs.existsSync(this.configPath)) {
                throw new Error(`Configuration file not found: ${this.configPath}`);
            }

            const data = fs.readFileSync(this.configPath, 'utf8');
            this.config = JSON.parse(data);
            return this.config;
        } catch (error) {
            throw new Error(`Failed to load configuration: ${error.message}`);
        }
    }

    /**
     * Ensure the config has required Dev Debt sections
     */
    async ensureDevDebtSection() {
        if (!this.config) {
            throw new Error('Configuration not loaded');
        }

        let modified = false;

        // Add devDebt section if missing
        if (!this.config.devDebt) {
            this.config.devDebt = {
                enabled: true,
                autoProcess: true,
                delaySeconds: 30,
                strictValidation: true,
                templatePath: "templates/dev-debt/template.md",
                outputPath: "../.dev-debt-logs"
            };
            modified = true;
        }

        // Add maintenance section if missing
        if (!this.config.maintenance) {
            this.config.maintenance = {
                enabled: true,
                autoCleanNodeModules: false,
                pruneUnusedDependencies: false
            };
            modified = true;
        }

        // Add testing section if missing
        if (!this.config.testing) {
            this.config.testing = {
                enabled: true,
                autoRunTests: false,
                gpuTestsEnabled: true
            };
            modified = true;
        }

        // Add retrospective section if missing
        if (!this.config.retrospective) {
            this.config.retrospective = {
                enabled: false,
                autoGenerate: false,
                includeMetrics: true,
                outputPath: "../reports/retrospectives"
            };
            modified = true;
        }

        // Save if modified
        if (modified) {
            await this.saveConfig();
        }
    }

    /**
     * Save configuration to file
     */
    async saveConfig() {
        try {
            if (!this.config) {
                throw new Error('Configuration not loaded');
            }

            const data = JSON.stringify(this.config, null, '\t');
            fs.writeFileSync(this.configPath, data);
        } catch (error) {
            throw new Error(`Failed to save configuration: ${error.message}`);
        }
    }

    /**
     * Get value from configuration
     * @param {string} section Section name
     * @param {string} key Setting key
     * @param {any} defaultValue Default value if not found
     * @returns {any} Configuration value
     */
    getValue(section, key, defaultValue = null) {
        try {
            if (!this.config || !this.config[section]) {
                return defaultValue;
            }

            return this.config[section][key] !== undefined
                ? this.config[section][key]
                : defaultValue;
        } catch (error) {
            console.error(`Error getting ${section}.${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Set value in configuration
     * @param {string} section Section name
     * @param {string} key Setting key
     * @param {any} value Value to set
     */
    async setValue(section, key, value) {
        try {
            if (!this.config) {
                await this.initialize();
            }

            if (!this.config[section]) {
                this.config[section] = {};
            }

            this.config[section][key] = value;
            await this.saveConfig();
            return true;
        } catch (error) {
            console.error(`Error setting ${section}.${key}:`, error);
            return false;
        }
    }

    /**
     * Check if feature is enabled
     * @param {string} feature Feature name
     * @returns {boolean} Whether the feature is enabled
     */
    isEnabled(feature) {
        return this.getValue(feature, 'enabled', false);
    }

    /**
     * Toggle feature on or off
     * @param {string} feature Feature name
     * @param {boolean} enabled Enabled state
     */
    async toggleFeature(feature, enabled) {
        return this.setValue(feature, 'enabled', enabled);
    }

    /**
     * Get template path
     * @returns {string} Full path to template file
     */
    getTemplatePath() {
        const relativePath = this.getValue('devDebt', 'templatePath', 'templates/dev-debt/template.md');
        return path.join(this.workspacePath, '.copilot', relativePath);
    }

    /**
     * Get output path for logs
     * @returns {string} Full path to output directory
     */
    getOutputPath() {
        const relativePath = this.getValue('devDebt', 'outputPath', '../.dev-debt-logs');
        return path.resolve(path.join(this.workspacePath, '.copilot', relativePath));
    }
}

module.exports = CopilotConfigManager;
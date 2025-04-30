const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const vscode = require('vscode');

class ConfigManager {
    constructor() {
        this.configDir = path.join(vscode.workspace.rootPath || process.cwd(), '.config');
        this.configPath = path.join(this.configDir, 'dev-tools.config.xml');
        this.config = null;
        this.parser = new xml2js.Parser({ explicitArray: false });
        this.builder = new xml2js.Builder({ headless: true });

        // Ensure config directory exists
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
    }

    /**
     * Initialize the configuration, creating default if needed
     */
    async initialize() {
        try {
            if (!fs.existsSync(this.configPath)) {
                await this.createDefaultConfig();
            }
            await this.loadConfig();
            return true;
        } catch (error) {
            console.error('Failed to initialize config:', error);
            return false;
        }
    }

    /**
     * Create a default configuration file
     */
    async createDefaultConfig() {
        const defaultConfig = {
            config: {
                devDebt: {
                    enabled: true,
                    autoProcess: true,
                    generateTemplates: true,
                    delaySeconds: 30,
                    strictValidation: true
                },
                maintenance: {
                    enabled: true,
                    autoCleanNodeModules: false,
                    pruneUnusedDependencies: false,
                    runLinters: true
                },
                testing: {
                    enabled: true,
                    autoRunTests: false,
                    gpuTestsEnabled: true,
                    generateTestsForNewCode: true
                },
                retrospective: {
                    enabled: false,
                    autoGenerate: false,
                    includeMetrics: true,
                    storageLocation: './reports/retrospectives'
                }
            }
        };

        const xml = this.builder.buildObject(defaultConfig);
        fs.writeFileSync(this.configPath, xml);
    }

    /**
     * Load configuration from XML file
     */
    async loadConfig() {
        return new Promise((resolve, reject) => {
            fs.readFile(this.configPath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                this.parser.parseString(data, (err, result) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    this.config = result;
                    resolve(result);
                });
            });
        });
    }

    /**
     * Save current configuration to XML file
     */
    async saveConfig() {
        if (!this.config) {
            throw new Error('Config not loaded');
        }

        const xml = this.builder.buildObject(this.config);
        fs.writeFileSync(this.configPath, xml);
    }

    /**
     * Get value from config
     * @param {string} section Section name (devDebt, maintenance, testing, retrospective)
     * @param {string} key Setting key
     * @param {any} defaultValue Default value if not found
     * @returns {any} Config value
     */
    getValue(section, key, defaultValue = null) {
        try {
            if (!this.config || !this.config.config || !this.config.config[section]) {
                return defaultValue;
            }

            const value = this.config.config[section][key];

            // Handle boolean strings
            if (value === 'true') return true;
            if (value === 'false') return false;

            // Handle numeric strings
            if (!isNaN(value) && value !== '') {
                return Number(value);
            }

            return value !== undefined ? value : defaultValue;
        } catch (error) {
            console.error(`Error getting ${section}.${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Set value in config
     * @param {string} section Section name
     * @param {string} key Setting key
     * @param {any} value Value to set
     */
    async setValue(section, key, value) {
        try {
            if (!this.config || !this.config.config) {
                await this.initialize();
            }

            if (!this.config.config[section]) {
                this.config.config[section] = {};
            }

            this.config.config[section][key] = value;
            await this.saveConfig();
            return true;
        } catch (error) {
            console.error(`Error setting ${section}.${key}:`, error);
            return false;
        }
    }

    /**
     * Check if a feature is enabled
     * @param {string} feature Feature name (devDebt, maintenance, testing, retrospective)
     * @returns {boolean} True if enabled
     */
    isEnabled(feature) {
        return this.getValue(feature, 'enabled', false);
    }

    /**
     * Toggle a feature on/off
     * @param {string} feature Feature name
     * @param {boolean} enabled Enabled state
     */
    async toggleFeature(feature, enabled) {
        return this.setValue(feature, 'enabled', enabled);
    }

    /**
     * Sync configuration with Copilot config
     */
    async syncWithCopilotConfig() {
        try {
            const CopilotConfigManager = require('./copilot-config-manager');
            const copilotConfig = new CopilotConfigManager();
            await copilotConfig.initialize();

            // Sync enabled states
            const features = ['devDebt', 'maintenance', 'testing', 'retrospective'];
            for (const feature of features) {
                const enabled = this.isEnabled(feature);
                await copilotConfig.toggleFeature(feature, enabled);
            }

            return true;
        } catch (error) {
            console.error('Failed to sync configurations:', error);
            return false;
        }
    }
}

module.exports = ConfigManager;
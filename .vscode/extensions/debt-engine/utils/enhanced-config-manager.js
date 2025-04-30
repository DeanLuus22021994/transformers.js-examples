const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const vscode = require('vscode');

/**
 * Enhanced configuration manager supporting modular configuration files
 */
class EnhancedConfigManager {
    constructor() {
        this.workspacePath = vscode.workspace.rootPath || process.cwd();
        this.configPath = path.join(this.workspacePath, '.config');
        this.mainConfigPath = path.join(this.configPath, 'index.config.xml');
        this.modulesPath = path.join(this.configPath, 'modules');

        this.parser = new xml2js.Parser({ explicitArray: false });
        this.builder = new xml2js.Builder({ headless: true, renderOpts: { pretty: true } });

        this.config = null;
        this.modules = {};
        this.currentEnvironment = 'development';
        this.projectOverrides = {};
    }

    /**
     * Initialize the configuration system
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            await this.loadMainConfig();
            await this.loadModules();
            await this.applyEnvironmentOverrides();
            await this.applyProjectOverrides();
            return true;
        } catch (error) {
            console.error('Failed to initialize config system:', error);
            return false;
        }
    }

    /**
     * Load the main configuration file
     * @returns {Promise<void>}
     */
    async loadMainConfig() {
        try {
            if (!fs.existsSync(this.mainConfigPath)) {
                throw new Error(`Main config file not found: ${this.mainConfigPath}`);
            }

            const data = fs.readFileSync(this.mainConfigPath, 'utf8');
            this.config = await this.parser.parseStringPromise(data);

            // Extract current environment
            if (this.config.config && this.config.config.currentEnvironment) {
                this.currentEnvironment = this.config.config.currentEnvironment;
            }
        } catch (error) {
            throw new Error(`Failed to load main config: ${error.message}`);
        }
    }

    /**
     * Load all module configuration files
     * @returns {Promise<void>}
     */
    async loadModules() {
        try {
            if (!this.config || !this.config.config || !this.config.config.importModules) {
                return;
            }

            const imports = Array.isArray(this.config.config.importModules.module)
                ? this.config.config.importModules.module
                : [this.config.config.importModules.module];

            for (const importModule of imports) {
                const modulePath = importModule.path || importModule;
                const fullPath = path.resolve(path.join(this.configPath, modulePath));

                if (!fs.existsSync(fullPath)) {
                    console.warn(`Module not found: ${fullPath}`);
                    continue;
                }

                const data = fs.readFileSync(fullPath, 'utf8');
                const moduleData = await this.parser.parseStringPromise(data);

                // Store module by its root element name
                const moduleName = Object.keys(moduleData)[0].replace('Config', '');
                this.modules[moduleName] = moduleData;
            }
        } catch (error) {
            throw new Error(`Failed to load modules: ${error.message}`);
        }
    }

    /**
     * Apply environment-specific overrides
     * @returns {Promise<void>}
     */
    async applyEnvironmentOverrides() {
        try {
            if (!this.modules.environment ||
                !this.modules.environment.environmentConfig ||
                !this.modules.environment.environmentConfig.environments ||
                !this.modules.environment.environmentConfig.environments.environment) {
                return;
            }

            const environments = Array.isArray(this.modules.environment.environmentConfig.environments.environment)
                ? this.modules.environment.environmentConfig.environments.environment
                : [this.modules.environment.environmentConfig.environments.environment];

            const currentEnv = environments.find(env => env.$.name === this.currentEnvironment);

            if (!currentEnv) {
                return;
            }

            // Apply environment-specific overrides to each module
            Object.keys(currentEnv).forEach(section => {
                if (section === '$') return; // Skip attributes

                if (this.modules[section]) {
                    this.applyOverrides(this.modules[section], currentEnv[section]);
                }
            });
        } catch (error) {
            throw new Error(`Failed to apply environment overrides: ${error.message}`);
        }
    }

    /**
     * Apply project-specific overrides
     * @returns {Promise<void>}
     */
    async applyProjectOverrides() {
        try {
            // Load project overrides
            const projectOverridesPath = path.join(this.configPath, 'projects', 'project-overrides.config.xml');

            if (!fs.existsSync(projectOverridesPath)) {
                return;
            }

            const data = fs.readFileSync(projectOverridesPath, 'utf8');
            const overridesData = await this.parser.parseStringPromise(data);

            if (!overridesData.projectOverridesConfig ||
                !overridesData.projectOverridesConfig.projects ||
                !overridesData.projectOverridesConfig.projects.project) {
                return;
            }

            const projects = Array.isArray(overridesData.projectOverridesConfig.projects.project)
                ? overridesData.projectOverridesConfig.projects.project
                : [overridesData.projectOverridesConfig.projects.project];

            // Store project overrides
            this.projectOverrides = {};

            for (const project of projects) {
                if (project.$ && project.$.path) {
                    this.projectOverrides[project.$.path] = project;
                }
            }
        } catch (error) {
            throw new Error(`Failed to apply project overrides: ${error.message}`);
        }
    }

    /**
     * Get the effective configuration for a specific project
     * @param {string} projectPath Relative path to the project
     * @returns {object} Effective configuration
     */
    getProjectConfig(projectPath) {
        try {
            // Start with base configuration
            const effectiveConfig = JSON.parse(JSON.stringify(this.modules));

            // Apply project overrides if they exist
            if (this.projectOverrides[projectPath] && this.projectOverrides[projectPath].overrides) {
                const overrides = this.projectOverrides[projectPath].overrides;

                Object.keys(overrides).forEach(section => {
                    if (effectiveConfig[section]) {
                        this.applyOverrides(effectiveConfig[section], overrides[section]);
                    }
                });
            }

            return effectiveConfig;
        } catch (error) {
            console.error(`Failed to get project config: ${error.message}`);
            return this.modules;
        }
    }

    /**
     * Recursively apply overrides to a configuration object
     * @param {object} target Target object to receive overrides
     * @param {object} source Source of override values
     */
    applyOverrides(target, source) {
        if (!source || typeof source !== 'object') return;

        Object.keys(source).forEach(key => {
            if (source[key] !== null && typeof source[key] === 'object') {
                if (!target[key]) target[key] = {};
                this.applyOverrides(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        });
    }

    /**
     * Get a configuration value
     * @param {string} module Module name
     * @param {string} section Section within module
     * @param {string} key Setting key
     * @param {any} defaultValue Default value if not found
     * @param {string} projectPath Optional project path for project-specific values
     * @returns {any} Configuration value
     */
    getValue(module, section, key, defaultValue = null, projectPath = null) {
        try {
            // Get the effective configuration
            const effectiveConfig = projectPath
                ? this.getProjectConfig(projectPath)
                : this.modules;

            if (!effectiveConfig[module]) {
                return defaultValue;
            }

            // Get the module config root name (e.g., devDebtConfig)
            const configRootName = Object.keys(effectiveConfig[module])[0];
            const moduleConfig = effectiveConfig[module][configRootName];

            if (!moduleConfig || !moduleConfig[section]) {
                return defaultValue;
            }

            return moduleConfig[section][key] !== undefined
                ? this.parseValue(moduleConfig[section][key])
                : defaultValue;
        } catch (error) {
            console.error(`Error getting ${module}.${section}.${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Parse a configuration value into the appropriate type
     * @param {any} value The configuration value
     * @returns {any} Parsed value
     */
    parseValue(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (!isNaN(value) && value !== '') return Number(value);
        return value;
    }

    /**
     * Check if a feature is enabled
     * @param {string} feature Feature name
     * @param {string} projectPath Optional project path
     * @returns {boolean} Whether the feature is enabled
     */
    isEnabled(feature, projectPath = null) {
        return this.getValue(feature, 'core', 'enabled', false, projectPath);
    }

    /**
     * Toggle a feature on or off
     * @param {string} feature Feature name
     * @param {boolean} enabled Whether to enable the feature
     * @returns {Promise<boolean>} Success status
     */
    async toggleFeature(feature, enabled) {
        try {
            if (!this.modules[feature]) {
                throw new Error(`Feature module not found: ${feature}`);
            }

            // Get the module config root name (e.g., devDebtConfig)
            const configRootName = Object.keys(this.modules[feature])[0];

            // Ensure core section exists
            if (!this.modules[feature][configRootName].core) {
                this.modules[feature][configRootName].core = {};
            }

            // Set enabled state
            this.modules[feature][configRootName].core.enabled = enabled.toString();

            // Save the module
            const modulePath = path.join(this.modulesPath, `${feature}.config.xml`);
            const xml = this.builder.buildObject(this.modules[feature]);
            fs.writeFileSync(modulePath, xml);

            // Log the change in the audit trail
            await this.logAuditEvent('feature_toggle', {
                feature,
                enabled,
                user: process.env.USERNAME || 'unknown',
                timestamp: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error(`Failed to toggle feature ${feature}:`, error);
            return false;
        }
    }

    /**
     * Log an event to the audit trail
     * @param {string} eventType Type of event
     * @param {object} eventData Event data
     * @returns {Promise<boolean>} Success status
     */
    async logAuditEvent(eventType, eventData) {
        try {
            if (!this.modules.audit ||
                !this.modules.audit.auditConfig ||
                !this.modules.audit.auditConfig.core ||
                this.modules.audit.auditConfig.core.enabled !== 'true') {
                return false;
            }

            const storagePath = this.modules.audit.auditConfig.storage.path || './logs/config-audit';
            const format = this.modules.audit.auditConfig.storage.format || 'json';

            // Ensure log directory exists
            const fullPath = path.resolve(path.join(this.workspacePath, storagePath));
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }

            // Create log entry
            const entry = {
                eventType,
                timestamp: new Date().toISOString(),
                ...eventData
            };

            // Write to log file
            const logFile = path.join(fullPath, `audit-${new Date().toISOString().slice(0, 7)}.${format}`);

            if (format === 'json') {
                let entries = [];

                // Read existing file if it exists
                if (fs.existsSync(logFile)) {
                    const data = fs.readFileSync(logFile, 'utf8');
                    try {
                        entries = JSON.parse(data);
                    } catch (e) {
                        entries = [];
                    }
                }

                // Add new entry
                entries.push(entry);

                // Write updated file
                fs.writeFileSync(logFile, JSON.stringify(entries, null, 2));
            } else if (format === 'csv') {
                // Check if file exists
                const fileExists = fs.existsSync(logFile);

                // Create CSV line
                const headers = Object.keys(entry).join(',');
                const values = Object.values(entry).map(v => `"${v}"`).join(',');
                const line = fileExists ? values : `${headers}\n${values}`;

                // Append to file
                fs.appendFileSync(logFile, line + '\n');
            }

            return true;
        } catch (error) {
            console.error(`Failed to log audit event:`, error);
            return false;
        }
    }
}

module.exports = EnhancedConfigManager;
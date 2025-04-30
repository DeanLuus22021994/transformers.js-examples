/**
 * Technical Debt Configuration Service
 * This service handles loading and managing debt scanner configuration
 */

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

/**
 * Technical Debt Configuration Service
 */
class DebtConfigService {
  /**
   * Constructor
   * @param {Object} logger Logger instance
   */
  constructor(logger) {
    this.logger = logger;
    this.config = null;
    this.configLoaded = false;
  }

  /**
   * Load configuration from file
   * @param {string} workspacePath Path to the workspace
   * @returns {Promise<Object>} Loaded configuration
   */
  async loadConfig(workspacePath) {
    const configPaths = [
      path.join(workspacePath, '.github', 'debt-management', 'config', 'debt-config.yml'),
      path.join(workspacePath, '.github', 'debt-config.yml'),
      path.join(workspacePath, 'debt-config.yml')
    ];

    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const configContent = fs.readFileSync(configPath, 'utf8');
          this.config = yaml.parse(configContent);
          this.configLoaded = true;
          this.logger.info(`Loaded debt configuration from ${configPath}`);
          return this.config;
        } catch (error) {
          this.logger.error(`Error loading config from ${configPath}: ${error.message}`);
        }
      }
    }

    // If no config found, create a default config
    this.logger.info('No debt configuration found, using defaults');
    this.config = this._createDefaultConfig();
    this.configLoaded = true;
    return this.config;
  }

  /**
   * Get debt markers from config
   * @returns {Array<string>} List of debt markers
   */
  getMarkers() {
    if (!this.configLoaded) {
      throw new Error('Configuration not loaded');
    }

    if (this.config.markers && Array.isArray(this.config.markers)) {
      return this.config.markers.map(item => item.marker);
    }

    return ['#debt:', '#improve:', '#refactor:', '#fixme:', '#todo:'];
  }

  /**
   * Get include patterns from config
   * @returns {Array<string>} List of include patterns
   */
  getIncludePatterns() {
    if (!this.configLoaded) {
      throw new Error('Configuration not loaded');
    }

    if (this.config.include_patterns && Array.isArray(this.config.include_patterns)) {
      return this.config.include_patterns;
    }

    return ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx', '**/*.css', '**/*.scss', '**/*.html'];
  }

  /**
   * Get exclude patterns from config
   * @returns {Array<string>} List of exclude patterns
   */
  getExcludePatterns() {
    if (!this.configLoaded) {
      throw new Error('Configuration not loaded');
    }

    if (this.config.exclude_patterns && Array.isArray(this.config.exclude_patterns)) {
      return this.config.exclude_patterns;
    }

    return ['node_modules/**', 'dist/**', 'build/**', '.git/**'];
  }

  /**
   * Create default configuration
   * @private
   * @returns {Object} Default configuration
   */
  _createDefaultConfig() {
    return {
      version: '1.0',
      markers: [
        {
          marker: '#debt:',
          priority: 'high',
          color: 'FF0000',
          label: 'debt:high'
        },
        {
          marker: '#improve:',
          priority: 'medium',
          color: 'FFFF00',
          label: 'debt:improve'
        },
        {
          marker: '#refactor:',
          priority: 'medium',
          color: 'FFAA00',
          label: 'debt:refactor'
        },
        {
          marker: '#todo:',
          priority: 'low',
          color: '00FF00',
          label: 'todo'
        },
        {
          marker: '#fixme:',
          priority: 'high',
          color: 'FF00FF',
          label: 'fixme'
        }
      ],
      include_patterns: [
        '**/*.js',
        '**/*.ts',
        '**/*.jsx',
        '**/*.tsx',
        '**/*.css',
        '**/*.scss',
        '**/*.html'
      ],
      exclude_patterns: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.git/**'
      ]
    };
  }
}

module.exports = DebtConfigService;

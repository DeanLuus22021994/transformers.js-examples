/**
 * Interface definitions for debt scanner components
 */

/**
 * @typedef {Object} ScanResult
 * @property {string} filePath - Absolute path to the file
 * @property {number} lineNum - Line number where the marker was found
 * @property {string} description - Description of the debt item
 * @property {string} relPath - Relative path to the file from the workspace
 * @property {string} marker - The marker that was found
 */

/**
 * @typedef {Object} ScanOptions
 * @property {Array<string>} [markers] - Debt markers to scan for
 * @property {Array<string>} [includePatterns] - File patterns to include
 * @property {Array<string>} [excludePatterns] - File patterns to exclude
 */

/**
 * @typedef {Object} ScanReport
 * @property {string} reportPath - Path to the generated report
 * @property {number} totalCount - Total number of debt items found
 */

/**
 * @typedef {Object} Logger
 * @property {function} info - Log info message
 * @property {function} warn - Log warning message
 * @property {function} error - Log error message
 * @property {function} debug - Log debug message
 */

/**
 * @typedef {Object} ConfigManager
 * @property {function} initialize - Initialize configuration
 * @property {function} isEnabled - Check if a feature is enabled
 * @property {function} getValue - Get a configuration value
 * @property {function} setValue - Set a configuration value
 */

module.exports = {};

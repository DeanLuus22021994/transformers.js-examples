/**
 * @fileoverview Core scanner module for technical debt detection
 * This module is framework-agnostic and can be used in any Node.js environment
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const glob = require('glob');

// Promisify the glob function
const globPromise = promisify(glob);

/**
 * Core Technical Debt Scanner Module
 */
class DebtScannerCore {
  /**
   * Create a new DebtScannerCore instance
   * @param {Object} options - Scanner options
   * @param {Array<string>} [options.markers] - Debt markers to scan for
   * @param {Array<string>} [options.includePatterns] - File patterns to include
   * @param {Array<string>} [options.excludePatterns] - File patterns to exclude
   * @param {Object} [logger] - Optional logger object
   */
  constructor(options = {}, logger = console) {
    this.markers = options.markers || [
      '#debt:',
      '#improve:',
      '#refactor:',
      '#fixme:',
      '#todo:',
      'DIR.TAG:'
    ];
    this.includePatterns = options.includePatterns || ['**/*.{js,ts,jsx,tsx,css,scss,html,md}'];
    this.excludePatterns = options.excludePatterns || ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**', '**/debt-reports/**'];
    this.logger = logger;
  }

  /**
   * Scan a workspace for debt markers
   * @param {string} workspacePath - The root path to scan
   * @returns {Promise<Array<Object>>} - Found debt items
   */
  async scanWorkspace(workspacePath) {
    this.logger.info(`Starting debt scan in ${workspacePath}`);
    const results = [];

    try {
      // Find all files matching include patterns and not matching exclude patterns
      for (const includePattern of this.includePatterns) {
        const files = await globPromise(includePattern, {
          cwd: workspacePath,
          ignore: this.excludePatterns,
          absolute: true
        });

        // Process each file
        for (const filePath of files) {
          try {
            const fileResults = await this.scanFile(filePath, workspacePath);
            results.push(...fileResults);
          } catch (error) {
            this.logger.error(`Error scanning file ${filePath}: ${error.message}`);
          }
        }
      }

      this.logger.info(`Debt scan complete, found ${results.length} items`);
      return results;
    } catch (error) {
      this.logger.error(`Error during debt scan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scan a single file for debt markers
   * @param {string} filePath - Path to the file
   * @param {string} workspacePath - The root workspace path
   * @returns {Promise<Array<Object>>} - Found debt items
   */
  async scanFile(filePath, workspacePath) {
    const results = [];

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const marker of this.markers) {
          if (line.includes(marker)) {
            const markerIndex = line.indexOf(marker);
            const description = line.substring(markerIndex + marker.length).trim();
            const lineNum = index + 1;
            const relPath = path.relative(workspacePath, filePath);

            // Parse DIR.TAG format specially
            let dirPath = null;
            let tags = [];

            if (marker === 'DIR.TAG:') {
              const parts = description.split('#').map(p => p.trim());
              dirPath = parts[0];

              // Extract tags
              for (let i = 1; i < parts.length; i++) {
                if (parts[i]) {
                  tags.push('#' + parts[i]);
                }
              }
            }

            results.push({
              filePath,
              lineNum,
              description,
              relPath,
              marker,
              dirPath,
              tags
            });
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error reading file ${filePath}: ${error.message}`);
    }

    return results;
  }
}

module.exports = DebtScannerCore;

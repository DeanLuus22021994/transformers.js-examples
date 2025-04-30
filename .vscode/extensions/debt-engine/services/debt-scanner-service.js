/**
 * Technical Debt Scanner Service
 * This service handles scanning code for debt tags
 */

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const glob = require('glob');
const readline = require('readline');

// Promisify the glob function
const globPromise = promisify(glob);

/**
 * Default debt markers to scan for if not otherwise configured
 */
const DEFAULT_MARKERS = ['#debt:', '#improve:', '#refactor:', '#fixme:', '#todo:'];

/**
 * Default file patterns to include in scanning
 */
const DEFAULT_INCLUDE_PATTERNS = ['**/*.{js,ts,jsx,tsx,css,scss,html}'];

/**
 * Default directories to exclude from scanning
 */
const DEFAULT_EXCLUDE_DIRS = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'];

/**
 * Technical Debt Scanner Service
 */
class DebtScannerService {
  /**
   * Constructor
   * @param {Object} options Configuration options
   * @param {Array<string>} [options.markers] Debt markers to scan for
   * @param {Array<string>} [options.includePatterns] File patterns to include
   * @param {Array<string>} [options.excludePatterns] File patterns to exclude
   * @param {Object} logger Logger instance
   */
  constructor(options = {}, logger) {
    this.markers = options.markers || DEFAULT_MARKERS;
    this.includePatterns = options.includePatterns || DEFAULT_INCLUDE_PATTERNS;
    this.excludePatterns = options.excludePatterns || DEFAULT_EXCLUDE_DIRS;
    this.logger = logger;
  }

  /**
   * Scan a workspace for debt tags
   * @param {string} workspacePath Path to the workspace to scan
   * @returns {Promise<{reportPath: string, totalCount: number}>} Results of the scan
   */
  async scanWorkspace(workspacePath) {
    this.logger.info(`Starting debt tag scan in ${workspacePath}`);

    // Create output directory if it doesn't exist
    const outputDir = path.join(workspacePath, 'debt-reports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const reportFileName = `debt-report-${new Date().toISOString().replace(/:/g, '-')}.md`;
    const reportPath = path.join(outputDir, reportFileName);

    // Write report header
    let report = '# Technical Debt Report\n\n';
    report += `Generated on ${new Date().toISOString()}\n\n`;
    report += '## Debt Markers Found\n\n';

    let totalCount = 0;
    const results = await this._scanAllFiles(workspacePath);

    // Process results by marker type
    for (const marker of this.markers) {
      report += `### ${marker} Items\n\n`;

      const markerResults = results.filter(result =>
        result.marker === marker
      );

      if (markerResults.length === 0) {
        report += 'No items found.\n\n';
        continue;
      }

      // Add table header
      report += '| File | Line | Description |\n';
      report += '|------|------|-------------|\n';

      // Add each result to the report
      for (const result of markerResults) {
        report += `| ${result.relPath} | ${result.lineNum} | ${result.description} |\n`;
        totalCount++;
      }

      report += '\n';
    }

    // Add summary
    report += '## Summary\n\n';
    report += `Total debt items found: ${totalCount}\n\n`;

    // Add recommendations
    if (totalCount > 0) {
      report += '## Recommendations\n\n';

      if (totalCount > 50) {
        report += '- **High Priority:** Schedule a dedicated debt reduction sprint\n';
      } else if (totalCount > 20) {
        report += '- **Medium Priority:** Allocate 20% of sprint capacity to debt reduction\n';
      } else {
        report += '- **Low Priority:** Continue addressing debt items as part of regular development\n';
      }
    }

    // Write report to file
    fs.writeFileSync(reportPath, report);

    this.logger.info(`Debt scan complete, report saved to ${reportPath}`);

    return { reportPath, totalCount };
  }

  /**
   * Scan all matching files in the workspace for debt markers
   * @private
   * @param {string} workspacePath Path to the workspace
   * @returns {Promise<Array<Object>>} Results of the scan
   */
  async _scanAllFiles(workspacePath) {
    const results = [];

    // Get all files matching the include patterns and not matching exclude patterns
    for (const includePattern of this.includePatterns) {
      const files = await globPromise(includePattern, {
        cwd: workspacePath,
        ignore: this.excludePatterns,
        absolute: true
      });

      // Process each file
      for (const filePath of files) {
        const fileResults = await this._scanFile(filePath, workspacePath);
        results.push(...fileResults);
      }
    }

    return results;
  }

  /**
   * Scan an individual file for debt markers
   * @private
   * @param {string} filePath Path to the file
   * @param {string} workspacePath Base workspace path for relative paths
   * @returns {Promise<Array<Object>>} Results of the scan
   */
  async _scanFile(filePath, workspacePath) {
    const results = [];

    try {
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let lineNum = 0;

      // Process each line in the file
      for await (const line of rl) {
        lineNum++;

        // Check each marker in this line
        for (const marker of this.markers) {
          if (line.includes(marker)) {
            const markerIndex = line.indexOf(marker);
            const description = line.substring(markerIndex + marker.length).trim();
            const relPath = path.relative(workspacePath, filePath);

            results.push({
              filePath,
              lineNum,
              description,
              relPath,
              marker
            });
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error scanning file ${filePath}: ${error.message}`);
    }

    return results;
  }
}

module.exports = DebtScannerService;

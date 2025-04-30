/**
 * Technical Debt Reporter Service
 * This service handles formatting and presenting debt reports
 */

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * Technical Debt Reporter Service
 */
class DebtReporterService {
  /**
   * Constructor
   * @param {Object} logger Logger instance
   */
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Open a report in VS Code
   * @param {string} reportPath Path to the report file
   * @returns {Promise<void>} Promise that resolves when the report is opened
   */
  async openReport(reportPath) {
    if (!fs.existsSync(reportPath)) {
      this.logger.error(`Report file not found at ${reportPath}`);
      throw new Error(`Report file not found at ${reportPath}`);
    }

    try {
      const reportUri = vscode.Uri.file(reportPath);
      await vscode.commands.executeCommand('markdown.showPreview', reportUri);
      this.logger.info(`Opened report at ${reportPath}`);
    } catch (error) {
      this.logger.error(`Error opening report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a weekly trend report based on previous reports
   * @param {string} workspacePath Path to the workspace
   * @returns {Promise<string>} Path to the generated report
   */
  async generateTrendReport(workspacePath) {
    const outputDir = path.join(workspacePath, 'debt-reports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const reportFiles = fs.readdirSync(outputDir)
      .filter(file => file.startsWith('debt-report-') && file.endsWith('.md'))
      .sort()
      .reverse()
      .slice(0, 5); // Get up to 5 most recent reports

    if (reportFiles.length === 0) {
      this.logger.info('No previous reports found to generate trend');
      throw new Error('No previous reports found to generate trend');
    }

    const trendReportPath = path.join(outputDir, `debt-trend-${new Date().toISOString().replace(/:/g, '-')}.md`);
    const reports = [];

    // Extract data from each report
    for (const file of reportFiles) {
      const filePath = path.join(outputDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const dateMatch = content.match(/Generated on (.*)/);
      const countMatch = content.match(/Total debt items found: (\d+)/);

      if (dateMatch && countMatch) {
        const date = dateMatch[1];
        const count = parseInt(countMatch[1], 10);
        reports.push({ date, count, file });
      }
    }

    // Sort reports by date
    reports.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Generate the trend report
    let trendReport = '# Technical Debt Trend Report\n\n';
    trendReport += `Generated on ${new Date().toISOString()}\n\n`;
    trendReport += '## Trend Over Time\n\n';
    trendReport += '| Date | Count | Change |\n';
    trendReport += '|------|-------|--------|\n';

    let previousCount = null;
    for (const report of reports) {
      const change = previousCount !== null ? report.count - previousCount : '';
      const changeStr = change !== '' ? (change > 0 ? `+${change}` : change.toString()) : '';
      trendReport += `| ${report.date} | ${report.count} | ${changeStr} |\n`;
      previousCount = report.count;
    }

    // Add recommendations
    trendReport += '\n## Trend Analysis\n\n';

    const latestCount = reports[reports.length - 1].count;
    const firstCount = reports[0].count;
    const trendDelta = latestCount - firstCount;

    if (trendDelta > 0) {
      trendReport += `⚠️ **Warning:** Technical debt has increased by ${trendDelta} items over this period.\n\n`;
      trendReport += '### Recommendations\n\n';
      trendReport += '- Consider scheduling a dedicated debt-reduction sprint\n';
      trendReport += '- Review debt items and prioritize high-impact items\n';
      trendReport += '- Establish a "fix as you go" policy for affected areas\n';
    } else if (trendDelta < 0) {
      trendReport += `✅ **Good Progress:** Technical debt has decreased by ${Math.abs(trendDelta)} items over this period.\n\n`;
      trendReport += '### Recommendations\n\n';
      trendReport += '- Continue current debt reduction efforts\n';
      trendReport += '- Consider documenting successful strategies for future reference\n';
    } else {
      trendReport += '⚠️ **Static:** Technical debt level has remained the same over this period.\n\n';
      trendReport += '### Recommendations\n\n';
      trendReport += '- Review current debt management approach\n';
      trendReport += '- Focus on addressing at least one debt item per sprint\n';
    }

    // Write the report to file
    fs.writeFileSync(trendReportPath, trendReport);
    this.logger.info(`Generated trend report at ${trendReportPath}`);

    return trendReportPath;
  }
}

module.exports = DebtReporterService;

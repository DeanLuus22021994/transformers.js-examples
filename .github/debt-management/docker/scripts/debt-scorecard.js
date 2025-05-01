// JS_ID::DEBT_SCORECARD
// filepath: c:\Projects\transformers.js-examples\.github\debt-management\docker\scripts\debt-scorecard.js
// JS_META::DESCRIPTION
// Technical debt scorecard generator and tracker
// JS_META::VERSION
// Version: 1.0.0
// JS_META::AUTHOR
// Author: Transformers.js Team

// JS_IMPORT::DEPENDENCIES
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { program } = require('commander');
const { promisify } = require('util');
const { logTrace } = require('./smollm2-helper');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);

// JS_CONFIG::CONSTANTS
// Constants for configuration
const REPORTS_DIR = process.env.REPORTS_DIR || '/app/debt-reports';
const SCORECARD_FILE = path.join(REPORTS_DIR, 'latest-scorecard.json');
const SCORECARD_HISTORY_DIR = path.join(REPORTS_DIR, 'history');
const THRESHOLD_CONFIG = {
  good: {
    totalIssues: 10,
    highPriorityRatio: 0.1,
    improvementRate: 0.1
  },
  warning: {
    totalIssues: 30,
    highPriorityRatio: 0.3,
    improvementRate: 0
  },
  critical: {
    totalIssues: 50,
    highPriorityRatio: 0.5,
    improvementRate: -0.1
  }
};

// JS_CLASS::DEBT_SCORECARD
// Main scorecard class for tracking debt over time
class DebtScorecard {
  // JS_METHOD::CONSTRUCTOR
  constructor() {
    this.currentScorecard = null;
    this.historicalData = [];
    this.metrics = {
      totalIssues: 0,
      byPriority: {},
      byCategory: {},
      trendingCategories: [],
      topFiles: [],
      healthScore: 100,
      improvementRate: 0
    };

    // JS_ID::TRACEABILITY_ID
    this.traceId = `scorecard-${Date.now()}`;
  }

  // JS_METHOD::INIT
  // Initialize the scorecard
  async init() {
    try {
      console.log(chalk.cyan('Initializing Technical Debt Scorecard...'));
      logTrace('SCORECARD_INIT', 'Initializing technical debt scorecard');

      // Create history directory if it doesn't exist
      if (!fs.existsSync(SCORECARD_HISTORY_DIR)) {
        await promisify(fs.mkdir)(SCORECARD_HISTORY_DIR, { recursive: true });
        logTrace('DIR_CREATED', `Created scorecard history directory: ${SCORECARD_HISTORY_DIR}`);
      }

      // Load current scorecard if it exists
      await this.loadCurrentScorecard();

      // Load historical data
      await this.loadHistoricalData();

      // Calculate metrics
      this.calculateMetrics();

      console.log(chalk.green('Technical Debt Scorecard initialized successfully!'));
      logTrace('SCORECARD_READY', 'Scorecard initialization completed');

      return true;
    } catch (error) {
      console.error(chalk.red('Failed to initialize Technical Debt Scorecard:'), error.message);
      logTrace('SCORECARD_INIT_ERROR', `Initialization failed: ${error.message}`, 'error');
      return false;
    }
  }

  // JS_METHOD::LOAD_CURRENT_SCORECARD
  // Load the current scorecard
  async loadCurrentScorecard() {
    try {
      if (fs.existsSync(SCORECARD_FILE)) {
        const scorecardData = await readFile(SCORECARD_FILE, 'utf8');
        this.currentScorecard = JSON.parse(scorecardData);
        console.log(chalk.green('Loaded current scorecard.'));
        logTrace('SCORECARD_LOADED', 'Current scorecard loaded');
        return true;
      } else {
        console.log(chalk.yellow('No current scorecard found.'));
        logTrace('SCORECARD_MISSING', 'No current scorecard file found', 'warning');
        return false;
      }
    } catch (error) {
      console.error(chalk.red('Failed to load current scorecard:'), error.message);
      logTrace('SCORECARD_LOAD_ERROR', `Failed to load scorecard: ${error.message}`, 'error');
      return false;
    }
  }

  // JS_METHOD::LOAD_HISTORICAL_DATA
  // Load historical scorecard data
  async loadHistoricalData() {
    try {
      if (!fs.existsSync(SCORECARD_HISTORY_DIR)) {
        console.log(chalk.yellow('No historical data directory found.'));
        logTrace('HISTORY_DIR_MISSING', 'History directory not found', 'warning');
        return false;
      }

      const files = await readdir(SCORECARD_HISTORY_DIR);
      const scorecardFiles = files.filter(file => file.startsWith('scorecard-') && file.endsWith('.json'));

      if (scorecardFiles.length === 0) {
        console.log(chalk.yellow('No historical scorecard data found.'));
        logTrace('HISTORY_EMPTY', 'No historical scorecard files found', 'warning');
        return false;
      }

      // Sort files by date (most recent first)
      scorecardFiles.sort().reverse();

      // Load the most recent 10 scorecards
      const recentFiles = scorecardFiles.slice(0, 10);

      for (const file of recentFiles) {
        try {
          const filePath = path.join(SCORECARD_HISTORY_DIR, file);
          const scorecardData = await readFile(filePath, 'utf8');
          const scorecard = JSON.parse(scorecardData);

          // Extract date from filename: scorecard-YYYY-MM-DD.json
          const dateMatch = file.match(/scorecard-(\d{4}-\d{2}-\d{2})/);
          const date = dateMatch ? dateMatch[1] : 'unknown';

          this.historicalData.push({
            date,
            data: scorecard
          });
        } catch (err) {
          console.warn(chalk.yellow(`Failed to load historical scorecard ${file}:`, err.message));
          logTrace('HISTORY_LOAD_ERROR', `Failed to load ${file}: ${err.message}`, 'warning');
        }
      }

      console.log(chalk.green(`Loaded ${this.historicalData.length} historical scorecards.`));
      logTrace('HISTORY_LOADED', `Loaded ${this.historicalData.length} historical scorecards`);

      return true;
    } catch (error) {
      console.error(chalk.red('Failed to load historical data:'), error.message);
      logTrace('HISTORY_LOAD_ERROR', `Failed to load historical data: ${error.message}`, 'error');
      return false;
    }
  }

  // JS_METHOD::CALCULATE_METRICS
  // Calculate scorecard metrics
  calculateMetrics() {
    if (!this.currentScorecard) {
      console.warn(chalk.yellow('Cannot calculate metrics: No current scorecard available.'));
      logTrace('METRICS_ERROR', 'No current scorecard available for metrics calculation', 'warning');
      return false;
    }

    // Extract current data
    const { totalIssues, byCategory, byPriority, byFile } = this.currentScorecard;

    // Basic metrics
    this.metrics.totalIssues = totalIssues;
    this.metrics.byPriority = byPriority;
    this.metrics.byCategory = byCategory;

    // Calculate high priority ratio
    const highPriorityCount = byPriority.high || 0;
    this.metrics.highPriorityRatio = totalIssues > 0 ? highPriorityCount / totalIssues : 0;

    // Calculate top files
    this.metrics.topFiles = Object.entries(byFile || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([file, count]) => ({ file, count }));

    // Calculate trending categories
    if (this.historicalData.length > 0) {
      const previousScorecard = this.historicalData[0].data;
      const trendingCategories = [];

      for (const [category, count] of Object.entries(byCategory)) {
        const previousCount = previousScorecard.byCategory[category] || 0;
        const change = count - previousCount;
        const percentChange = previousCount > 0 ? (change / previousCount) * 100 : 0;

        trendingCategories.push({
          category,
          count,
          change,
          percentChange
        });
      }

      // Sort by absolute percent change (highest first)
      this.metrics.trendingCategories = trendingCategories
        .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
        .slice(0, 5);

      // Calculate improvement rate
      if (previousScorecard.totalIssues > 0) {
        const issueChange = totalIssues - previousScorecard.totalIssues;
        this.metrics.improvementRate = -issueChange / previousScorecard.totalIssues; // Negative means issues decreased
      }
    }

    // Calculate health score (100 is best, 0 is worst)
    this.calculateHealthScore();

    logTrace('METRICS_CALCULATED', `Calculated scorecard metrics with health score: ${this.metrics.healthScore}`);
    return true;
  }

  // JS_METHOD::CALCULATE_HEALTH_SCORE
  // Calculate the overall health score
  calculateHealthScore() {
    // Start with a perfect score
    let score = 100;

    // Factor 1: Total issues (max penalty: 40 points)
    if (this.metrics.totalIssues >= THRESHOLD_CONFIG.critical.totalIssues) {
      score -= 40;
    } else if (this.metrics.totalIssues >= THRESHOLD_CONFIG.warning.totalIssues) {
      score -= 20;
    } else if (this.metrics.totalIssues >= THRESHOLD_CONFIG.good.totalIssues) {
      score -= 10;
    }

    // Factor 2: High priority ratio (max penalty: 30 points)
    if (this.metrics.highPriorityRatio >= THRESHOLD_CONFIG.critical.highPriorityRatio) {
      score -= 30;
    } else if (this.metrics.highPriorityRatio >= THRESHOLD_CONFIG.warning.highPriorityRatio) {
      score -= 15;
    } else if (this.metrics.highPriorityRatio >= THRESHOLD_CONFIG.good.highPriorityRatio) {
      score -= 5;
    }

    // Factor 3: Improvement rate (max penalty/bonus: 30 points)
    if (this.metrics.improvementRate <= THRESHOLD_CONFIG.critical.improvementRate) {
      score -= 30; // Issues are increasing rapidly
    } else if (this.metrics.improvementRate <= THRESHOLD_CONFIG.warning.improvementRate) {
      score -= 15; // Issues are increasing or stable
    } else if (this.metrics.improvementRate >= THRESHOLD_CONFIG.good.improvementRate) {
      score += 15; // Issues are decreasing
    }

    // Ensure score stays within 0-100 range
    this.metrics.healthScore = Math.max(0, Math.min(100, score));

    // Determine health status based on score
    if (this.metrics.healthScore >= 80) {
      this.metrics.healthStatus = 'good';
    } else if (this.metrics.healthScore >= 50) {
      this.metrics.healthStatus = 'warning';
    } else {
      this.metrics.healthStatus = 'critical';
    }
  }

  // JS_METHOD::ARCHIVE_CURRENT_SCORECARD
  // Archive the current scorecard to history
  async archiveCurrentScorecard() {
    if (!this.currentScorecard) {
      console.warn(chalk.yellow('Cannot archive: No current scorecard available.'));
      logTrace('ARCHIVE_ERROR', 'No current scorecard available to archive', 'warning');
      return false;
    }

    try {
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const archiveFile = path.join(SCORECARD_HISTORY_DIR, `scorecard-${timestamp}.json`);

      await writeFile(archiveFile, JSON.stringify(this.currentScorecard, null, 2));
      console.log(chalk.green(`Archived current scorecard to ${archiveFile}`));
      logTrace('SCORECARD_ARCHIVED', `Archived scorecard to ${archiveFile}`, 'success');

      return true;
    } catch (error) {
      console.error(chalk.red('Failed to archive scorecard:'), error.message);
      logTrace('ARCHIVE_ERROR', `Failed to archive scorecard: ${error.message}`, 'error');
      return false;
    }
  }

  // JS_METHOD::GENERATE_REPORT
  // Generate a scorecard report
  async generateReport(format = 'markdown') {
    try {
      console.log(chalk.cyan('Generating Technical Debt Scorecard Report...'));
      logTrace('REPORT_GEN', `Generating scorecard report in ${format} format`);

      if (!this.currentScorecard) {
        throw new Error('No current scorecard available.');
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let reportContent;
      let reportFile;

      if (format === 'json') {
        reportContent = JSON.stringify(this.metrics, null, 2);
        reportFile = path.join(REPORTS_DIR, `scorecard-metrics-${timestamp}.json`);
      } else if (format === 'markdown') {
        reportContent = this.generateMarkdownReport();
        reportFile = path.join(REPORTS_DIR, `scorecard-report-${timestamp}.md`);
      } else if (format === 'html') {
        reportContent = this.generateHtmlReport();
        reportFile = path.join(REPORTS_DIR, `scorecard-report-${timestamp}.html`);
      } else {
        throw new Error(`Unsupported report format: ${format}`);
      }

      await writeFile(reportFile, reportContent);
      console.log(chalk.green(`Scorecard report generated and saved to ${reportFile}`));
      logTrace('REPORT_SAVED', `Scorecard report saved to ${reportFile}`, 'success');

      return reportFile;
    } catch (error) {
      console.error(chalk.red('Failed to generate scorecard report:'), error.message);
      logTrace('REPORT_ERROR', `Failed to generate report: ${error.message}`, 'error');
      return null;
    }
  }

  // JS_METHOD::GENERATE_MARKDOWN_REPORT
  // Generate a markdown scorecard report
  generateMarkdownReport() {
    const { totalIssues, byCategory, byPriority, topFiles,
            trendingCategories, healthScore, healthStatus, improvementRate } = this.metrics;

    // Helper for creating a health indicator
    const getHealthIndicator = () => {
      if (healthStatus === 'good') return '🟢 Good';
      if (healthStatus === 'warning') return '🟡 Warning';
      return '🔴 Critical';
    };

    // Generate markdown report
    let markdown = `# Technical Debt Scorecard\n\n`;
    markdown += `Generated on: ${new Date().toISOString()}\n\n`;

    // Health score section
    markdown += `## Health Score: ${healthScore}/100 ${getHealthIndicator()}\n\n`;

    // Create a simple progress bar
    const progressBarWidth = 30;
    const filledWidth = Math.round((healthScore / 100) * progressBarWidth);
    const emptyWidth = progressBarWidth - filledWidth;

    markdown += `[${'#'.repeat(filledWidth)}${'-'.repeat(emptyWidth)}] ${healthScore}%\n\n`;

    // Add improvement rate
    if (improvementRate !== 0) {
      const direction = improvementRate > 0 ? 'decreased' : 'increased';
      const rate = Math.abs(improvementRate * 100).toFixed(1);
      markdown += `Technical debt has ${direction} by ${rate}% since last report.\n\n`;
    } else {
      markdown += `Technical debt is unchanged since last report.\n\n`;
    }

    // Summary
    markdown += `## Summary\n\n`;
    markdown += `Total technical debt issues: **${totalIssues}**\n\n`;

    // By priority
    markdown += `## Issues by Priority\n\n`;
    markdown += `| Priority | Count | Percentage |\n`;
    markdown += `|----------|-------|------------|\n`;

    for (const [priority, count] of Object.entries(byPriority)) {
      const percentage = ((count / totalIssues) * 100).toFixed(1);
      markdown += `| ${priority} | ${count} | ${percentage}% |\n`;
    }

    markdown += `\n`;

    // By category
    markdown += `## Issues by Category\n\n`;
    markdown += `| Category | Count | Percentage |\n`;
    markdown += `|----------|-------|------------|\n`;

    for (const [category, count] of Object.entries(byCategory)) {
      const percentage = ((count / totalIssues) * 100).toFixed(1);
      markdown += `| ${category} | ${count} | ${percentage}% |\n`;
    }

    markdown += `\n`;

    // Trending categories
    if (trendingCategories.length > 0) {
      markdown += `## Trending Categories\n\n`;
      markdown += `| Category | Current | Change | % Change |\n`;
      markdown += `|----------|---------|--------|----------|\n`;

      for (const { category, count, change, percentChange } of trendingCategories) {
        const changeIndicator = change > 0 ? '🔺' : change < 0 ? '🔽' : '▪️';
        markdown += `| ${category} | ${count} | ${changeIndicator} ${change} | ${percentChange.toFixed(1)}% |\n`;
      }

      markdown += `\n`;
    }

    // Top files with issues
    markdown += `## Top Files with Issues\n\n`;
    markdown += `| File | Issues |\n`;
    markdown += `|------|--------|\n`;

    for (const { file, count } of topFiles) {
      markdown += `| ${file} | ${count} |\n`;
    }

    markdown += `\n`;

    // Recommendations
    markdown += `## Recommendations\n\n`;

    // Generate recommendations based on metrics
    const recommendations = this.generateRecommendations();
    recommendations.forEach((recommendation, index) => {
      markdown += `${index + 1}. ${recommendation}\n`;
    });

    return markdown;
  }

  // JS_METHOD::GENERATE_HTML_REPORT
  // Generate an HTML scorecard report
  generateHtmlReport() {
    const { totalIssues, byCategory, byPriority, topFiles,
            trendingCategories, healthScore, healthStatus, improvementRate } = this.metrics;

    // Helper for creating health indicator class
    const getHealthClass = () => {
      if (healthStatus === 'good') return 'success';
      if (healthStatus === 'warning') return 'warning';
      return 'danger';
    };

    // Helper for creating tables
    const createTable = (title, data, isPercentage = true) => {
      let tableHtml = `<h2>${title}</h2>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>${title.includes('Priority') ? 'Priority' : 'Category'}</th>
            <th>Count</th>
            ${isPercentage ? '<th>Percentage</th>' : ''}
          </tr>
        </thead>
        <tbody>`;

      for (const [key, count] of Object.entries(data)) {
        tableHtml += `
          <tr>
            <td>${key}</td>
            <td>${count}</td>`;

        if (isPercentage) {
          const percentage = ((count / totalIssues) * 100).toFixed(1);
          tableHtml += `<td>${percentage}%</td>`;
        }

        tableHtml += `</tr>`;
      }

      tableHtml += `
        </tbody>
      </table>`;

      return tableHtml;
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations();
    let recommendationsHtml = '';
    recommendations.forEach(recommendation => {
      recommendationsHtml += `<li class="list-group-item">${recommendation}</li>`;
    });

    // Generate HTML content
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Technical Debt Scorecard</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body { padding: 20px; }
    .scorecard-container { max-width: 1200px; margin: 0 auto; }
    .health-box {
      background-color: #f8f9fa;
      border-radius: 5px;
      padding: 20px;
      margin-bottom: 20px;
      text-align: center;
    }
    .health-score {
      font-size: 48px;
      font-weight: bold;
    }
    .success { color: #198754; }
    .warning { color: #ffc107; }
    .danger { color: #dc3545; }
    .trend-up { color: #dc3545; }
    .trend-down { color: #198754; }
    .progress-container { margin: 20px 0; }
  </style>
</head>
<body>
  <div class="scorecard-container">
    <h1 class="mb-4">Technical Debt Scorecard</h1>
    <p>Generated on: ${new Date().toISOString()}</p>

    <div class="health-box">
      <h2>Health Score</h2>
      <div class="health-score ${getHealthClass()}">${healthScore}/100</div>
      <div class="mt-2">
        <span class="badge bg-${getHealthClass()}">${healthStatus.toUpperCase()}</span>
      </div>

      <div class="progress-container">
        <div class="progress" style="height: 25px;">
          <div class="progress-bar bg-${getHealthClass()}" role="progressbar" style="width: ${healthScore}%"
               aria-valuenow="${healthScore}" aria-valuemin="0" aria-valuemax="100">${healthScore}%</div>
        </div>
      </div>

      <p class="mt-3">
        ${improvementRate !== 0 ?
          `Technical debt has ${improvementRate > 0 ? 'decreased' : 'increased'} by
           ${Math.abs(improvementRate * 100).toFixed(1)}% since last report.` :
          'Technical debt is unchanged since last report.'}
      </p>
    </div>

    <div class="summary-box mb-4">
      <h2>Summary</h2>
      <p>Total technical debt issues: <strong>${totalIssues}</strong></p>
    </div>

    <div class="row">
      <div class="col-md-6">
        ${createTable('Issues by Priority', byPriority)}
      </div>
      <div class="col-md-6">
        ${createTable('Issues by Category', byCategory)}
      </div>
    </div>`;

    // Add trending categories if available
    if (trendingCategories.length > 0) {
      html += `
    <h2>Trending Categories</h2>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Category</th>
          <th>Current</th>
          <th>Change</th>
          <th>% Change</th>
        </tr>
      </thead>
      <tbody>`;

      for (const { category, count, change, percentChange } of trendingCategories) {
        const trendClass = change > 0 ? 'trend-up' : change < 0 ? 'trend-down' : '';
        const changeSign = change > 0 ? '+' : '';

        html += `
        <tr>
          <td>${category}</td>
          <td>${count}</td>
          <td class="${trendClass}">${changeSign}${change}</td>
          <td class="${trendClass}">${changeSign}${percentChange.toFixed(1)}%</td>
        </tr>`;
      }

      html += `
      </tbody>
    </table>`;
    }

    // Add top files section
    html += `
    <h2>Top Files with Issues</h2>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>File</th>
          <th>Issues</th>
        </tr>
      </thead>
      <tbody>`;

    for (const { file, count } of topFiles) {
      html += `
        <tr>
          <td>${file}</td>
          <td>${count}</td>
        </tr>`;
    }

    html += `
      </tbody>
    </table>

    <h2>Recommendations</h2>
    <ul class="list-group">
      ${recommendationsHtml}
    </ul>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;

    return html;
  }

  // JS_METHOD::GENERATE_RECOMMENDATIONS
  // Generate recommendations based on metrics
  generateRecommendations() {
    const recommendations = [];
    const { totalIssues, highPriorityRatio, topFiles, trendingCategories, healthStatus } = this.metrics;

    // Add general recommendation based on health status
    if (healthStatus === 'critical') {
      recommendations.push('⚠️ Urgent attention required: Your technical debt has reached a critical level that may significantly impact development velocity and system stability.');
    } else if (healthStatus === 'warning') {
      recommendations.push('⚠️ Technical debt requires attention: Schedule dedicated time to address the most critical issues.');
    } else {
      recommendations.push('✅ Technical debt is at a manageable level: Continue regular maintenance to prevent accumulation.');
    }

    // Add recommendation based on high priority ratio
    if (highPriorityRatio >= THRESHOLD_CONFIG.warning.highPriorityRatio) {
      recommendations.push(`Focus on reducing high-priority issues first, which currently make up ${(highPriorityRatio * 100).toFixed(1)}% of all issues.`);
    }

    // Add recommendation based on top files
    if (topFiles.length > 0) {
      const worstFile = topFiles[0];
      recommendations.push(`Prioritize refactoring ${path.basename(worstFile.file)} which contains ${worstFile.count} issues.`);
    }

    // Add recommendation based on trending categories
    if (trendingCategories.length > 0) {
      const worstTrend = trendingCategories.find(t => t.change > 0);
      if (worstTrend) {
        recommendations.push(`Address the increasing trend in "${worstTrend.category}" issues, which have grown by ${worstTrend.percentChange.toFixed(1)}%.`);
      }

      // Look for positive trends to reinforce
      const bestTrend = trendingCategories.find(t => t.change < 0);
      if (bestTrend) {
        recommendations.push(`Continue the good work in reducing "${bestTrend.category}" issues, which have decreased by ${Math.abs(bestTrend.percentChange).toFixed(1)}%.`);
      }
    }

    // Add general recommendations
    recommendations.push('Consider implementing automated code quality checks in CI/CD pipelines to prevent new technical debt.');
    recommendations.push('Establish a regular "debt reduction day" where the team focuses solely on addressing technical debt issues.');

    return recommendations;
  }
}

// JS_FUNCTION::MAIN
// Main entry point
async function main() {
  program
    .name('debt-scorecard')
    .description('Technical debt scorecard generator')
    .version('1.0.0');

  program
    .command('generate')
    .description('Generate a technical debt scorecard report')
    .option('-f, --format <format>', 'Report format (json, markdown, html)', 'markdown')
    .option('-a, --archive', 'Archive the current scorecard to history', false)
    .action(async (options) => {
      const scorecard = new DebtScorecard();
      await scorecard.init();

      if (options.archive) {
        await scorecard.archiveCurrentScorecard();
      }

      await scorecard.generateReport(options.format);
    });

  await program.parseAsync(process.argv);
}

// JS_ACTION::RUN_MAIN
// Run the main function if this is the main module
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  });
}

// JS_EXPORT::MODULE
// Export the DebtScorecard class
module.exports = { DebtScorecard };

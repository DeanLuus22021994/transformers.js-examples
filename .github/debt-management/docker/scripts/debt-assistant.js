// JS_ID::DEBT_ASSISTANT
// filepath: c:\Projects\transformers.js-examples\.github\debt-management\docker\scripts\debt-assistant.js
// JS_META::DESCRIPTION
// AI-powered technical debt assistant using the HuggingFace SmolLM2-1.7B model
// JS_META::VERSION
// Version: 1.1.0
// JS_META::AUTHOR
// Author: Transformers.js Team

// JS_IMPORT::DEPENDENCIES
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { program } = require('commander');
const chalk = require('chalk');
const { spawn } = require('child_process');
const { promisify } = require('util');
const { SmolLM2Helper, logTrace } = require('./smollm2-helper');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// JS_CONFIG::CONSTANTS
// Constants for paths and configuration
const CONFIG_DIR = process.env.CONFIG_DIR || '/app/config';
const REPORTS_DIR = process.env.REPORTS_DIR || '/app/debt-reports';
const MODEL_CACHE_DIR = process.env.MODEL_CACHE_DIR || '/app/model-cache';
const CONFIG_FILE = path.join(CONFIG_DIR, 'debt-config.yml');
const DEFAULT_CONFIG = {
  markers: ['#debt:', '#improve:', '#refactor:', '#fixme:', '#todo:'],
  include_patterns: ['**/*.js', '**/*.ts', '**/*.py', '**/*.cs', '**/*.java'],
  exclude_patterns: ['**/node_modules/**', '**/.git/**'],
  reporting: {
    summary: true,
    create_issues: true,
    weekly_digest: true,
    notify_authors: false
  }
};

// JS_CLASS::DEBT_ASSISTANT
// Main class for debt management assistant
class DebtAssistant {
  // JS_METHOD::CONSTRUCTOR
  constructor() {
    this.config = null;
    this.aiHelper = null;
    this.scorecard = {
      totalIssues: 0,
      byCategory: {},
      byPriority: {},
      byFile: {},
      suggestions: []
    };

    // JS_ID::TRACEABILITY_IDS
    // Unique ids for tracking system actions and errors
    this.traceIds = {
      modelInit: `model-init-${Date.now()}`,
      configLoad: `config-${Date.now()}`,
      analysisRun: `analysis-${Date.now()}`
    };
  }

  // JS_METHOD::INIT
  // Initialize the assistant
  async init() {
    try {
      console.log(chalk.cyan('Initializing Debt Management Assistant...'));
      logTrace('ASSISTANT_INIT', 'Starting initialization process');

      // JS_ACTION::LOAD_CONFIG
      // Load configuration
      await this.loadConfig();

      // JS_ACTION::SETUP_DIRECTORIES
      // Setup report directories
      await this.setupDirectories();

      // JS_ACTION::INIT_MODEL
      // Initialize the AI model
      await this.initializeModel();

      console.log(chalk.green('Debt Management Assistant initialized successfully!'));
      logTrace('ASSISTANT_READY', 'Assistant initialization completed');

      return true;
    } catch (error) {
      console.error(chalk.red('Failed to initialize Debt Management Assistant:'), error.message);
      logTrace('ASSISTANT_INIT_ERROR', `Initialization failed: ${error.message}`, 'error');

      // JS_ACTION::SELF_HEAL
      // Attempt recovery
      return this.recoverFromError(error, 'init');
    }
  }

  // JS_METHOD::LOAD_CONFIG
  // Load configuration from file or use defaults
  async loadConfig() {
    try {
      console.log(chalk.cyan('Loading configuration...'));
      logTrace('CONFIG_LOAD', `Loading configuration from ${CONFIG_FILE}`);

      if (fs.existsSync(CONFIG_FILE)) {
        const configYaml = await readFile(CONFIG_FILE, 'utf8');
        this.config = yaml.load(configYaml);
        console.log(chalk.green('Configuration loaded successfully!'));
        logTrace('CONFIG_LOADED', 'Configuration loaded from file');
      } else {
        console.log(chalk.yellow('Configuration file not found, using defaults...'));
        this.config = DEFAULT_CONFIG;

        // JS_ACTION::CREATE_DEFAULT_CONFIG
        // Create default configuration file
        try {
          await mkdir(CONFIG_DIR, { recursive: true });
          await writeFile(CONFIG_FILE, yaml.dump(DEFAULT_CONFIG));
          console.log(chalk.green('Default configuration file created!'));
          logTrace('CONFIG_CREATED', 'Created default configuration file');
        } catch (writeError) {
          console.warn(chalk.yellow('Could not write default configuration file:'), writeError.message);
          logTrace('CONFIG_WRITE_ERROR', `Failed to write config: ${writeError.message}`, 'warning');
        }
      }

      return true;
    } catch (error) {
      console.error(chalk.red('Failed to load configuration:'), error.message);
      logTrace('CONFIG_LOAD_ERROR', `Failed to load config: ${error.message}`, 'error');
      this.config = DEFAULT_CONFIG; // Fallback to defaults
      return false;
    }
  }

  // JS_METHOD::SETUP_DIRECTORIES
  // Setup necessary directories
  async setupDirectories() {
    try {
      // Create reports directory if it doesn't exist
      if (!fs.existsSync(REPORTS_DIR)) {
        await mkdir(REPORTS_DIR, { recursive: true });
        console.log(chalk.green(`Created reports directory: ${REPORTS_DIR}`));
        logTrace('DIR_CREATED', `Created reports directory: ${REPORTS_DIR}`);
      }

      // Create model cache directory if it doesn't exist
      if (!fs.existsSync(MODEL_CACHE_DIR)) {
        await mkdir(MODEL_CACHE_DIR, { recursive: true });
        console.log(chalk.green(`Created model cache directory: ${MODEL_CACHE_DIR}`));
        logTrace('DIR_CREATED', `Created model cache directory: ${MODEL_CACHE_DIR}`);
      }

      return true;
    } catch (error) {
      console.error(chalk.red('Failed to setup directories:'), error.message);
      logTrace('DIR_SETUP_ERROR', `Failed to setup directories: ${error.message}`, 'error');
      return false;
    }
  }

  // JS_METHOD::INITIALIZE_MODEL
  // Initialize the AI model
  async initializeModel() {
    try {
      console.log(chalk.cyan('Initializing AI model...'));
      logTrace('MODEL_INIT', 'Initializing SmolLM2 model');

      // Create SmolLM2Helper instance
      this.aiHelper = new SmolLM2Helper({
        useGpu: true,          // Try to use GPU acceleration
        quantize: true,        // Use quantization for reduced memory
        modelId: 'HuggingFaceTB/SmolLM2-1.7B-intermediate-checkpoints',
        revision: 'step-125000',
        cacheDir: MODEL_CACHE_DIR
      });

      // Check environment compatibility first
      const envCheck = await this.aiHelper.checkEnvironment();
      if (!envCheck.compatible) {
        console.warn(chalk.yellow('Environment not fully compatible with model requirements:'), envCheck.error);
        logTrace('MODEL_ENV_WARNING', `Environment check: ${envCheck.error}`, 'warning');
      }

      // Initialize the model
      const result = await this.aiHelper.initializeModel();

      if (result.success) {
        console.log(chalk.green(`AI model initialized successfully on ${result.device}!`));
        if (result.device === 'cuda') {
          console.log(chalk.green('🚀 Using RTX GPU acceleration!'));
        }
        logTrace('MODEL_READY', `Model initialized on ${result.device} in ${result.initTime.toFixed(2)}s`, 'success');
        return true;
      } else {
        console.warn(chalk.yellow('AI model initialization failed:'), result.error);
        console.log(chalk.yellow('Continuing with reduced functionality...'));
        logTrace('MODEL_INIT_FAILED', `Model initialization failed: ${result.error}`, 'warning');
        return false;
      }
    } catch (error) {
      console.error(chalk.red('Failed to initialize AI model:'), error.message);
      logTrace('MODEL_INIT_ERROR', `Model initialization error: ${error.message}`, 'error');
      return false;
    }
  }

  // JS_METHOD::ANALYZE_DEBT
  // Analyze technical debt in files
  async analyzeDebt(files) {
    console.log(chalk.cyan(`Analyzing ${files.length} files for technical debt...`));
    logTrace('ANALYSIS_START', `Starting analysis of ${files.length} files`);

    // Setup analysis result structure
    const analysisResults = {
      totalIssues: 0,
      byCategory: {},
      byPriority: {},
      byFile: {},
      suggestions: []
    };

    // Check if AI helper is available
    const useAI = this.aiHelper && this.aiHelper.getModelStatus().ready;

    if (!useAI) {
      console.log(chalk.yellow('AI model not available, using pattern-based analysis only'));
      logTrace('ANALYSIS_FALLBACK', 'Using pattern-based analysis due to unavailable AI model', 'warning');
    }

    // Process each file
    for (const file of files) {
      try {
        console.log(chalk.cyan(`Analyzing file: ${file}`));
        logTrace('FILE_ANALYSIS', `Analyzing ${file}`);

        const fileContent = await readFile(file, 'utf8');
        const fileExtension = path.extname(file).substring(1);
        const language = this.getLanguageFromExtension(fileExtension);

        // Combine pattern-based analysis with AI analysis
        const patternResults = this.analyzeWithPatterns(file, fileContent);

        let aiResults = { issues: [], suggestions: [] };
        if (useAI) {
          try {
            const result = await this.aiHelper.analyzeCode(fileContent, language);
            if (result.success) {
              aiResults = result.analysis;
              logTrace('AI_ANALYSIS_SUCCESS', `AI analysis completed in ${result.latency.toFixed(2)}s`);
            } else {
              logTrace('AI_ANALYSIS_ERROR', `AI analysis failed: ${result.error}`, 'warning');
            }
          } catch (aiError) {
            console.warn(chalk.yellow('AI analysis failed:'), aiError.message);
            logTrace('AI_ANALYSIS_ERROR', `Error in AI analysis: ${aiError.message}`, 'error');
          }
        }

        // Merge pattern and AI results
        const mergedIssues = [...patternResults.issues, ...aiResults.issues];
        const mergedSuggestions = [...patternResults.suggestions, ...aiResults.suggestions];

        // Add file-specific results
        analysisResults.byFile[file] = mergedIssues.length;

        // Add to total issues count
        analysisResults.totalIssues += mergedIssues.length;

        // Categorize issues
        for (const issue of mergedIssues) {
          // By category
          const category = issue.category || 'other';
          analysisResults.byCategory[category] = (analysisResults.byCategory[category] || 0) + 1;

          // By priority
          const priority = issue.severity || 'medium';
          analysisResults.byPriority[priority] = (analysisResults.byPriority[priority] || 0) + 1;
        }

        // Add unique suggestions
        for (const suggestion of mergedSuggestions) {
          if (!analysisResults.suggestions.includes(suggestion)) {
            analysisResults.suggestions.push(suggestion);
          }
        }

        logTrace('FILE_ANALYSIS_COMPLETE', `Completed analysis for ${file} with ${mergedIssues.length} issues`);
      } catch (error) {
        console.error(chalk.red(`Error analyzing file ${file}:`), error.message);
        logTrace('FILE_ANALYSIS_ERROR', `Error analyzing ${file}: ${error.message}`, 'error');
      }
    }

    // Update scorecard with new results
    this.updateScorecard(analysisResults);

    // Log analysis completion
    console.log(chalk.green(`Analysis complete! Found ${analysisResults.totalIssues} issues across ${files.length} files.`));
    logTrace('ANALYSIS_COMPLETE', `Analysis completed with ${analysisResults.totalIssues} total issues`, 'success');

    return analysisResults;
  }

  // JS_METHOD::ANALYZE_WITH_PATTERNS
  // Analyze file using pattern matching
  analyzeWithPatterns(file, content) {
    const result = {
      issues: [],
      suggestions: []
    };

    // Get markers from config
    const markers = Array.isArray(this.config.markers) ?
      this.config.markers.map(m => typeof m === 'object' ? m.tag : m) :
      DEFAULT_CONFIG.markers;

    // Split content into lines
    const lines = content.split('\n');

    // Examine each line for markers
    lines.forEach((line, lineNumber) => {
      markers.forEach(marker => {
        if (line.toLowerCase().includes(marker.toLowerCase())) {
          // Extract the comment content
          const markerIndex = line.toLowerCase().indexOf(marker.toLowerCase());
          const comment = line.substring(markerIndex + marker.length).trim();

          // Determine priority/severity based on marker or default to medium
          let priority = 'medium';
          let category = 'maintenance';

          // Try to find the marker configuration
          const markerConfig = Array.isArray(this.config.markers) ?
            this.config.markers.find(m => typeof m === 'object' && m.tag === marker) :
            null;

          if (markerConfig) {
            priority = markerConfig.priority || priority;
            category = markerConfig.category || category;
          }

          // Add to issues
          result.issues.push({
            line: lineNumber + 1,
            category,
            description: `${marker} ${comment}`,
            severity: priority
          });

          // Generate a suggestion
          result.suggestions.push(
            `Consider addressing the ${priority} priority issue in ${path.basename(file)} at line ${lineNumber + 1}: ${comment}`
          );
        }
      });
    });

    return result;
  }

  // JS_METHOD::GET_LANGUAGE_FROM_EXTENSION
  // Determine language from file extension
  getLanguageFromExtension(extension) {
    const languageMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cs': 'csharp',
      'go': 'golang',
      'rb': 'ruby',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'rs': 'rust',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sh': 'shell',
      'bash': 'shell'
    };

    return languageMap[extension.toLowerCase()] || 'unknown';
  }

  // JS_METHOD::UPDATE_SCORECARD
  // Update the technical debt scorecard
  updateScorecard(analysisResults) {
    // Update total issues
    this.scorecard.totalIssues += analysisResults.totalIssues;

    // Update by category
    for (const [category, count] of Object.entries(analysisResults.byCategory)) {
      this.scorecard.byCategory[category] = (this.scorecard.byCategory[category] || 0) + count;
    }

    // Update by priority
    for (const [priority, count] of Object.entries(analysisResults.byPriority)) {
      this.scorecard.byPriority[priority] = (this.scorecard.byPriority[priority] || 0) + count;
    }

    // Update by file (keep only files with issues)
    for (const [file, count] of Object.entries(analysisResults.byFile)) {
      if (count > 0) {
        this.scorecard.byFile[file] = (this.scorecard.byFile[file] || 0) + count;
      }
    }

    // Add unique suggestions (limit to top 20)
    const uniqueSuggestions = new Set([...this.scorecard.suggestions, ...analysisResults.suggestions]);
    this.scorecard.suggestions = [...uniqueSuggestions].slice(0, 20);

    // Save the updated scorecard
    this.saveScorecard();
  }

  // JS_METHOD::SAVE_SCORECARD
  // Save the scorecard to a file
  async saveScorecard() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const scorecardFile = path.join(REPORTS_DIR, `scorecard-${timestamp}.json`);

      await writeFile(scorecardFile, JSON.stringify(this.scorecard, null, 2));
      console.log(chalk.green(`Scorecard saved to ${scorecardFile}`));
      logTrace('SCORECARD_SAVED', `Scorecard saved to ${scorecardFile}`);

      // Also save as latest
      await writeFile(path.join(REPORTS_DIR, 'latest-scorecard.json'), JSON.stringify(this.scorecard, null, 2));

      return true;
    } catch (error) {
      console.error(chalk.red('Failed to save scorecard:'), error.message);
      logTrace('SCORECARD_SAVE_ERROR', `Failed to save scorecard: ${error.message}`, 'error');
      return false;
    }
  }

  // JS_METHOD::GENERATE_REPORT
  // Generate a formatted debt report
  async generateReport(format = 'json') {
    try {
      console.log(chalk.cyan('Generating technical debt report...'));
      logTrace('REPORT_GEN', `Generating report in ${format} format`);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let reportContent;
      let reportFile;

      if (format === 'json') {
        reportContent = JSON.stringify(this.scorecard, null, 2);
        reportFile = path.join(REPORTS_DIR, `debt-report-${timestamp}.json`);
      } else if (format === 'markdown') {
        reportContent = this.generateMarkdownReport();
        reportFile = path.join(REPORTS_DIR, `debt-report-${timestamp}.md`);
      } else if (format === 'html') {
        reportContent = this.generateHtmlReport();
        reportFile = path.join(REPORTS_DIR, `debt-report-${timestamp}.html`);
      } else {
        throw new Error(`Unsupported report format: ${format}`);
      }

      await writeFile(reportFile, reportContent);
      console.log(chalk.green(`Report generated and saved to ${reportFile}`));
      logTrace('REPORT_SAVED', `Report saved to ${reportFile}`, 'success');

      return reportFile;
    } catch (error) {
      console.error(chalk.red('Failed to generate report:'), error.message);
      logTrace('REPORT_ERROR', `Failed to generate report: ${error.message}`, 'error');
      return null;
    }
  }

  // JS_METHOD::GENERATE_MARKDOWN_REPORT
  // Generate a markdown report
  generateMarkdownReport() {
    const { totalIssues, byCategory, byPriority, byFile, suggestions } = this.scorecard;

    // Generate markdown report
    let markdown = `# Technical Debt Report\n\n`;
    markdown += `Generated on: ${new Date().toISOString()}\n\n`;

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

    // Top files with issues
    markdown += `## Top Files with Issues\n\n`;
    markdown += `| File | Issues |\n`;
    markdown += `|------|--------|\n`;

    const sortedFiles = Object.entries(byFile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    for (const [file, count] of sortedFiles) {
      markdown += `| ${file} | ${count} |\n`;
    }

    markdown += `\n`;

    // Suggestions
    markdown += `## Top Suggestions\n\n`;

    suggestions.forEach((suggestion, index) => {
      markdown += `${index + 1}. ${suggestion}\n`;
    });

    return markdown;
  }

  // JS_METHOD::GENERATE_HTML_REPORT
  // Generate an HTML report
  generateHtmlReport() {
    const { totalIssues, byCategory, byPriority, byFile, suggestions } = this.scorecard;

    // Helper for creating category/priority tables
    const createTable = (title, data) => {
      let tableHtml = `<h2>${title}</h2>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>${title.includes('Priority') ? 'Priority' : 'Category'}</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>`;

      for (const [key, count] of Object.entries(data)) {
        const percentage = ((count / totalIssues) * 100).toFixed(1);
        tableHtml += `
          <tr>
            <td>${key}</td>
            <td>${count}</td>
            <td>${percentage}%</td>
          </tr>`;
      }

      tableHtml += `
        </tbody>
      </table>`;

      return tableHtml;
    };

    // Generate HTML content
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Technical Debt Report</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body { padding: 20px; }
    .report-container { max-width: 1200px; margin: 0 auto; }
    .summary-box {
      background-color: #f8f9fa;
      border-radius: 5px;
      padding: 20px;
      margin-bottom: 20px;
      text-align: center;
    }
    .summary-count {
      font-size: 48px;
      font-weight: bold;
      color: #dc3545;
    }
    .progress-container { margin: 20px 0; }
  </style>
</head>
<body>
  <div class="report-container">
    <h1 class="mb-4">Technical Debt Report</h1>
    <p>Generated on: ${new Date().toISOString()}</p>

    <div class="summary-box">
      <h2>Total Technical Debt Issues</h2>
      <div class="summary-count">${totalIssues}</div>
    </div>

    <div class="row">
      <div class="col-md-6">
        ${createTable('Issues by Priority', byPriority)}
      </div>
      <div class="col-md-6">
        ${createTable('Issues by Category', byCategory)}
      </div>
    </div>

    <h2>Top Files with Issues</h2>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>File</th>
          <th>Issues</th>
        </tr>
      </thead>
      <tbody>`;

    const sortedFiles = Object.entries(byFile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    for (const [file, count] of sortedFiles) {
      html += `
        <tr>
          <td>${file}</td>
          <td>${count}</td>
        </tr>`;
    }

    html += `
      </tbody>
    </table>

    <h2>Top Suggestions</h2>
    <ul class="list-group">`;

    suggestions.forEach(suggestion => {
      html += `<li class="list-group-item">${suggestion}</li>`;
    });

    html += `
    </ul>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;

    return html;
  }

  // JS_METHOD::RECOVER_FROM_ERROR
  // Attempt to recover from errors using self-healing mechanisms
  async recoverFromError(error, context) {
    console.log(chalk.yellow('Attempting to recover from error...'));
    logTrace('RECOVERY_ATTEMPT', `Attempting recovery in context: ${context}`, 'warning');

    // Different recovery strategies based on context
    switch (context) {
      case 'init':
        // Try to continue with reduced functionality
        console.log(chalk.yellow('Continuing with reduced functionality...'));
        logTrace('RECOVERY_STRATEGY', 'Continuing with reduced functionality');
        return true;

      case 'model':
        // Try to reinitialize the model
        console.log(chalk.yellow('Attempting to reinitialize the AI model...'));
        logTrace('RECOVERY_STRATEGY', 'Reinitializing AI model');

        try {
          // Create new SmolLM2Helper with CPU fallback
          this.aiHelper = new SmolLM2Helper({
            useGpu: false,  // Fall back to CPU
            quantize: false,
            modelId: 'HuggingFaceTB/SmolLM2-1.7B-intermediate-checkpoints',
            revision: 'step-125000',
            cacheDir: MODEL_CACHE_DIR
          });

          const result = await this.aiHelper.initializeModel();
          if (result.success) {
            console.log(chalk.green('AI model reinitialized successfully in recovery mode!'));
            logTrace('RECOVERY_SUCCESS', 'Model reinitialized in recovery mode', 'success');
            return true;
          }
        } catch (recoveryError) {
          console.error(chalk.red('Recovery failed:'), recoveryError.message);
          logTrace('RECOVERY_FAILED', `Recovery failed: ${recoveryError.message}`, 'error');
        }

        // If AI model couldn't be initialized, continue without it
        console.log(chalk.yellow('Continuing without AI model...'));
        logTrace('RECOVERY_FALLBACK', 'Continuing without AI model');
        return true;

      case 'analysis':
        // Try to continue with pattern-based analysis only
        console.log(chalk.yellow('Falling back to pattern-based analysis only...'));
        logTrace('RECOVERY_STRATEGY', 'Using pattern-based analysis only');
        return true;

      default:
        // Generic recovery strategy
        console.log(chalk.yellow('Unknown error context, attempting generic recovery...'));
        logTrace('RECOVERY_STRATEGY', 'Generic recovery attempt');
        return false;
    }
  }
}

// JS_FUNCTION::MAIN
// Main entry point
async function main() {
  program
    .name('debt-assistant')
    .description('AI-powered technical debt management assistant')
    .version('1.1.0');

  program
    .command('analyze')
    .description('Analyze files for technical debt')
    .argument('<files...>', 'Files to analyze')
    .option('-f, --format <format>', 'Report format (json, markdown, html)', 'json')
    .action(async (files, options) => {
      const assistant = new DebtAssistant();
      await assistant.init();
      await assistant.analyzeDebt(files);
      await assistant.generateReport(options.format);
    });

  program
    .command('report')
    .description('Generate a technical debt report')
    .option('-f, --format <format>', 'Report format (json, markdown, html)', 'json')
    .action(async (options) => {
      const assistant = new DebtAssistant();
      await assistant.init();

      // Check if scorecard exists
      const latestScorecard = path.join(REPORTS_DIR, 'latest-scorecard.json');
      if (fs.existsSync(latestScorecard)) {
        try {
          const scorecardData = await readFile(latestScorecard, 'utf8');
          assistant.scorecard = JSON.parse(scorecardData);
          console.log(chalk.green('Loaded existing scorecard data.'));
          await assistant.generateReport(options.format);
        } catch (error) {
          console.error(chalk.red('Failed to load scorecard:'), error.message);
        }
      } else {
        console.error(chalk.red('No scorecard data found. Run analyze command first.'));
      }
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
// Export the DebtAssistant class
module.exports = { DebtAssistant };

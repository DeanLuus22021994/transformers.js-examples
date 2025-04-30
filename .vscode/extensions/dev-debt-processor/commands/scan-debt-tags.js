const vscode = require('vscode');

// Import services
const DebtConfigService = require('../services/debt-config-service');
const DebtScannerService = require('../services/debt-scanner-service');
const DebtReporterService = require('../services/debt-reporter-service');

/**
 * Scan codebase for debt tags
 * @param {import('../utils/logger')} logger The logger instance
 */
async function scanDebtTags(logger) {
    if (!vscode.workspace.workspaceFolders) {
        logger.error('No workspace folder open');
        return vscode.window.showErrorMessage('No workspace folder open');
    }

    try {
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        logger.info(`Starting debt tag scan in ${workspaceRoot}`);
        
        // Initialize services
        const configService = new DebtConfigService(logger);
        const scannerService = new DebtScannerService({}, logger);
        const reporterService = new DebtReporterService(logger);        // Load debt configuration
        await configService.loadConfig(workspaceRoot);
        
        // Configure scanner with loaded config
        scannerService.markers = configService.getMarkers();
        scannerService.includePatterns = configService.getIncludePatterns();
        scannerService.excludePatterns = configService.getExcludePatterns();
        
        // Run the scan
        const { reportPath, totalCount } = await scannerService.scanWorkspace(workspaceRoot);
        
        // Show progress notification
        vscode.window.setStatusBarMessage(`Found ${totalCount} technical debt items`, 5000);
        
        // Open the report in VS Code
        await reporterService.openReport(reportPath);
        
        // Ask if user wants to see trend report
        const showTrend = await vscode.window.showInformationMessage(
            `Technical debt scan complete. Found ${totalCount} items.`,
            'Show Report',
            'Show Trend',
            'Close'
        );
        
        if (showTrend === 'Show Trend') {
            try {
                const trendReportPath = await reporterService.generateTrendReport(workspaceRoot);
                await reporterService.openReport(trendReportPath);
            } catch (error) {
                logger.error(`Error generating trend report: ${error.message}`);
                vscode.window.showWarningMessage(`Could not generate trend report: ${error.message}`);
            }
        } else if (showTrend === 'Show Report') {
            await reporterService.openReport(reportPath);
        }

        return reportPath;
    } catch (error) {
        logger.error(`Error scanning for debt tags: ${error.message}`);
        return vscode.window.showErrorMessage(`Error scanning for debt tags: ${error.message}`);
    }
}

module.exports = scanDebtTags;

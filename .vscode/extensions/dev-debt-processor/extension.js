const vscode = require('vscode');

// Import constants and utilities
const ERROR_CODES = require('./constants/error-codes');
const DevDebtLogger = require('./utils/logger');
const ConfigManager = require('./utils/config-manager');
const CopilotConfigManager = require('./utils/copilot-config-manager');

// Import command handlers
const findAndProcessDevDebtFiles = require('./commands/process-dev-debt');
const viewLogs = require('./commands/view-logs');
const createTemplate = require('./commands/create-template');
const toggleFeature = require('./commands/toggle-feature');
const scanDebtTags = require('./commands/scan-debt-tags');
const StatusIndicator = require('./utils/status-indicator');

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
    // Initialize logger
    const logger = new DevDebtLogger(context);
    logger.info('Dev Debt Processor has been activated');

    // Initialize config managers
    const configManager = new ConfigManager();
    const copilotConfigManager = new CopilotConfigManager();

    // Initialize both config systems
    const configInitialized = await configManager.initialize();
    const copilotInitialized = await copilotConfigManager.initialize();

    // Create status indicator
    const statusIndicator = new StatusIndicator(copilotInitialized ? copilotConfigManager : configManager);

    // Wait for VS Code to fully load
    setTimeout(async () => {
        // Check XML config first, then .copilot config, then VSCode settings
        const xmlEnabled = configManager.isEnabled('devDebt');
        const copilotEnabled = copilotInitialized && copilotConfigManager.isEnabled('devDebt');
        const vsCodeEnabled = vscode.workspace.getConfiguration('devDebtProcessor').get('enabled', true);

        if ((xmlEnabled || copilotEnabled) && vsCodeEnabled) {
            logger.info('Dev Debt processing is enabled');

            // Determine which config to use for auto-processing
            const useXmlConfig = xmlEnabled;
            const useCopilotConfig = !xmlEnabled && copilotEnabled;

            const autoProcess = useXmlConfig
                ? configManager.getValue('devDebt', 'autoProcess', true)
                : useCopilotConfig
                    ? copilotConfigManager.getValue('devDebt', 'autoProcess', true)
                    : true;

            if (autoProcess) {
                // Use copilot config if available, otherwise use XML config
                const effectiveConfig = copilotInitialized ? copilotConfigManager : configManager;
                findAndProcessDevDebtFiles(logger, effectiveConfig);
            } else {
                logger.info('Auto-processing is disabled in configuration');
            }
        } else {
            logger.info(`Dev Debt processing is disabled (XML: ${xmlEnabled}, Copilot: ${copilotEnabled}, VSCode: ${vsCodeEnabled})`);
        }
    }, 2000);

    // Register commands
    let processCommand = vscode.commands.registerCommand(
        'dev-debt-processor.processDevDebt',
        () => findAndProcessDevDebtFiles(logger, copilotInitialized ? copilotConfigManager : configManager)
    );

    let viewLogsCommand = vscode.commands.registerCommand(
        'dev-debt-processor.viewLogs',
        () => viewLogs(logger)
    );

    let createTemplateCommand = vscode.commands.registerCommand(
        'dev-debt-processor.createTemplate',
        (folderUri) => createTemplate(folderUri, logger, copilotInitialized ? copilotConfigManager : configManager)
    );    let toggleFeatureCommand = vscode.commands.registerCommand(
        'dev-debt-processor.toggleFeature',
        async () => {
            // Toggle in both config systems if both are available
            if (copilotInitialized) {
                await toggleFeature(copilotConfigManager, logger);
            } else {
                await toggleFeature(configManager, logger);
            }
            statusIndicator.update();
        }
    );

    let scanDebtTagsCommand = vscode.commands.registerCommand(
        'dev-debt-processor.scanDebtTags',
        () => scanDebtTags(logger)
    );

    // Archive logs when extension is deactivated
    context.subscriptions.push({
        dispose: () => {
            logger.info('Dev Debt Processor is being deactivated');
            logger.archiveLogs();
        }
    });

    // Register all commands in subscriptions
    context.subscriptions.push(
        processCommand,
        viewLogsCommand,
        createTemplateCommand,
        toggleFeatureCommand,
        statusIndicator
    );
}

// This method is called when your extension is deactivated
function deactivate() {
    // Logging is handled in the dispose method registered in activate()
}

module.exports = {
    activate,
    deactivate
};
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const ERROR_CODES = require('../constants/error-codes');
const { validateDevDebtFiles } = require('../services/validation-service');

/**
 * Find and process Dev_Debt.md files
 * @param {import('../utils/logger')} logger The logger instance
 * @param {import('../utils/config-manager')} configManager The config manager
 */
async function findAndProcessDevDebtFiles(logger, configManager) {
    if (!vscode.workspace.workspaceFolders) {
        logger.error(ERROR_CODES.NO_WORKSPACE, 'No workspace folder open');
        return vscode.window.showErrorMessage('No workspace folder open');
    }

    // Check if the feature is enabled in XML config
    if (!configManager.isEnabled('devDebt')) {
        logger.info('Dev Debt processing is disabled in XML config');
        return vscode.window.showInformationMessage('Dev Debt processing is disabled in configuration');
    }

    try {
        // Find all Dev_Debt.md files in the workspace
        const files = await vscode.workspace.findFiles('**/*Dev_Debt.md', '**/node_modules/**');

        if (files.length === 0) {
            logger.info('No Dev_Debt.md files found');
            return;
        }

        logger.info(`Found ${files.length} Dev_Debt.md file(s)`);

        // Use strict validation based on XML config
        const strictValidation = configManager.getValue('devDebt', 'strictValidation', true);

        // Validate each file before processing if strict validation is enabled
        let validFiles = files;

        if (strictValidation) {
            const validationResults = await validateDevDebtFiles(files, logger);

            // Filter out valid files
            validFiles = files.filter((_, index) => validationResults[index].isValid);
            const invalidFiles = files.filter((_, index) => !validationResults[index].isValid);

            if (invalidFiles.length > 0) {
                invalidFiles.forEach((file, index) => {
                    const invalidIndex = files.indexOf(file);
                    if (invalidIndex !== -1) {
                        logger.error(
                            validationResults[invalidIndex].errorCode || ERROR_CODES.INVALID_REFERENCES,
                            `Invalid Dev_Debt file: ${file.fsPath} - ${validationResults[invalidIndex].message}`
                        );
                    }
                });

                if (validFiles.length === 0) {
                    vscode.window.showErrorMessage('All Dev_Debt.md files failed validation. See output for details.');
                    return;
                }
            }
        }

        // Show notification with timer for valid files
        const devDebtCount = validFiles.length;
        const delaySeconds = configManager.getValue('devDebt', 'delaySeconds', 30);
        const message = `Found ${devDebtCount} valid Dev_Debt.md file(s). Processing will begin in ${delaySeconds} seconds...`;

        const cancelOption = 'Cancel Processing';
        const processNowOption = 'Process Now';

        // Show notification with timer countdown
        let secondsLeft = delaySeconds;
        let countdown = setInterval(() => {
            secondsLeft--;
            if (secondsLeft <= 0) {
                clearInterval(countdown);
                // Time's up - process the files
                processDevDebtFiles(validFiles, logger, configManager);
            }
        }, 1000);

        // Show the notification with options
        vscode.window.showInformationMessage(
            message,
            { modal: false },
            processNowOption,
            cancelOption
        ).then(selection => {
            clearInterval(countdown); // Clear the countdown timer

            if (selection === processNowOption) {
                processDevDebtFiles(validFiles, logger, configManager);
            } else if (selection === cancelOption) {
                logger.info('Dev Debt processing cancelled by user');
                vscode.window.showInformationMessage('Dev Debt processing cancelled');
            }
        });

    } catch (error) {
        logger.error(ERROR_CODES.PROCESSING_ERROR, `Error finding Dev_Debt files: ${error.message}`);
        vscode.window.showErrorMessage(`Error finding Dev_Debt files: ${error.message}`);
    }
}

/**
 * Process each valid Dev_Debt.md file with GitHub Copilot
 * @param {vscode.Uri[]} files The valid Dev_Debt.md files to process
 * @param {import('../utils/logger')} logger The logger instance
 * @param {import('../utils/config-manager')} configManager The config manager
 */
async function processDevDebtFiles(files, logger, configManager) {
    for (const file of files) {
        try {
            logger.info(`Processing ${file.fsPath}`);

            // Open the file
            const document = await vscode.workspace.openTextDocument(file);
            const editor = await vscode.window.showTextDocument(document);

            // Get the file content
            const content = document.getText();

            // Get directory for context
            const devDebtDir = path.dirname(file.fsPath);
            const dirName = path.basename(devDebtDir);

            // List files in the directory for context
            const dirFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(devDebtDir, '**/*'),
                '**/node_modules/**'
            );

            const fileList = dirFiles.map(f => path.relative(devDebtDir, f.fsPath)).join('\n- ');

            // Use the GitHub Copilot chat API to process the content with directory context
            await vscode.commands.executeCommand('github.copilot.generate', {
                prompt: `Process this Dev_Debt.md file for the "${dirName}" directory and suggest solutions.
                Consider these directory-specific files:
                - ${fileList}

                Dev Debt Content:
                ${content}`,
                relativeFilePath: document.fileName,
                selection: new vscode.Range(0, 0, document.lineCount, 0)
            });

            logger.info(`Successfully processed: ${file.fsPath}`);

        } catch (error) {
            logger.error(
                ERROR_CODES.PROCESSING_ERROR,
                `Error processing ${file.fsPath}: ${error.message}`
            );
            vscode.window.showErrorMessage(`Error processing ${file.fsPath}: ${error.message}`);
        }
    }
}

module.exports = findAndProcessDevDebtFiles;
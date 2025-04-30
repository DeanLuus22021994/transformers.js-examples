const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const ERROR_CODES = require('../constants/error-codes');
const templateService = require('../services/template-service');

/**
 * Create a Dev Debt template file
 * @param {vscode.Uri} folderUri The URI of the folder where to create the template
 * @param {import('../utils/logger')} logger The logger instance
 */
async function createTemplate(folderUri, logger) {
    try {
        // If no folder is provided, ask the user to select one
        if (!folderUri) {
            folderUri = await selectFolder(logger);
            if (!folderUri) return; // User cancelled or no folders available
        }

        // Get template content based on project configuration
        const folderName = path.basename(folderUri.fsPath);
        const templateContent = await templateService.getTemplateContent(
            vscode.workspace.rootPath,
            folderName,
            logger
        );

        // Create the template file path
        const fileName = 'Dev_Debt.md';
        const fileUri = vscode.Uri.file(path.join(folderUri.fsPath, fileName));

        // Check if the file already exists
        if (fs.existsSync(fileUri.fsPath)) {
            const overwrite = await vscode.window.showWarningMessage(
                `${fileName} already exists in this folder. Overwrite?`,
                'Overwrite',
                'Cancel'
            );

            if (overwrite !== 'Overwrite') {
                return;
            }
        }

        // Write the template
        fs.writeFileSync(fileUri.fsPath, templateContent, 'utf8');

        // Open the file
        const doc = await vscode.workspace.openTextDocument(fileUri);
        await vscode.window.showTextDocument(doc);

        logger.info(`Created Dev_Debt template at ${fileUri.fsPath}`);
        vscode.window.showInformationMessage(`Dev_Debt template created at ${fileUri.fsPath}`);
    } catch (error) {
        logger.error(ERROR_CODES.TEMPLATE_ERROR, `Error creating template: ${error.message}`);
        vscode.window.showErrorMessage(`Error creating template: ${error.message}`);
    }
}

/**
 * Helper to select a folder
 * @param {import('../utils/logger')} logger The logger instance
 * @returns {Promise<vscode.Uri>} The selected folder URI or undefined if canceled
 */
async function selectFolder(logger) {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) {
        logger.error(ERROR_CODES.NO_WORKSPACE, 'No workspace folder open');
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    // If there's only one folder, use that
    if (folders.length === 1) {
        return folders[0].uri;
    }

    // Let the user pick a folder
    const selectedFolder = await vscode.window.showQuickPick(
        folders.map(folder => ({
            label: folder.name,
            uri: folder.uri
        })),
        { placeHolder: 'Select a folder for the Dev Debt template' }
    );

    return selectedFolder?.uri;
}

module.exports = createTemplate;
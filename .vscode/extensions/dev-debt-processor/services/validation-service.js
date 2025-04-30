const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const ERROR_CODES = require('../constants/error-codes');

/**
 * Validate Dev_Debt.md file references
 * @param {vscode.Uri[]} files The Dev_Debt.md files to validate
 * @param {import('../utils/logger')} logger The logger instance
 * @returns {Promise<Array<{isValid: boolean, message: string, errorCode?: string}>>}
 */
async function validateDevDebtFiles(files, logger) {
    const validationResults = [];

    for (const file of files) {
        try {
            logger.info(`Validating ${file.fsPath}`);

            // Read the file content
            const document = await vscode.workspace.openTextDocument(file);
            const content = document.getText();

            // Get the directory of the Dev_Debt.md file
            const devDebtDir = path.dirname(file.fsPath);

            // Extract file paths from the content
            const relatedFilesHeader = content.match(/## Related Files\s*([\s\S]*?)(?=\s*##|$)/);

            if (!relatedFilesHeader) {
                logger.warning(`No "## Related Files" section found in ${file.fsPath}`);
                validationResults.push({
                    isValid: true,
                    message: "No related files section found, but this is not a validation error"
                });
                continue;
            }

            const relatedFilesText = relatedFilesHeader[1].trim();
            const relatedFilePaths = relatedFilesText
                .split("\n")
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.trim().replace(/^- /, '').trim())
                .filter(line => line !== '' && !line.includes('[') && !line.includes(']'));

            // Check if all referenced files are in the same directory or subdirectories
            let allFilesValid = true;
            const invalidFiles = [];

            for (const relatedFilePath of relatedFilePaths) {
                if (isTemplatePlaceholder(relatedFilePath)) {
                    // Template placeholders, skip them
                    continue;
                }

                const absoluteFilePath = path.isAbsolute(relatedFilePath)
                    ? relatedFilePath
                    : path.resolve(devDebtDir, relatedFilePath);

                // Check if the file exists
                const fileExists = fs.existsSync(absoluteFilePath);
                if (!fileExists) {
                    invalidFiles.push(`File not found: ${relatedFilePath}`);
                    allFilesValid = false;
                    continue;
                }

                // Check if the file is in the same directory or subdirectory
                const isInSameDirectory = absoluteFilePath.startsWith(devDebtDir);
                if (!isInSameDirectory) {
                    invalidFiles.push(`File outside directory scope: ${relatedFilePath}`);
                    allFilesValid = false;
                }
            }

            if (allFilesValid) {
                logger.info(`Validation successful for ${file.fsPath}`);
                validationResults.push({ isValid: true, message: "All files are valid" });
            } else {
                logger.error(
                    ERROR_CODES.UNRELATED_FILES,
                    `Validation failed for ${file.fsPath}: ${invalidFiles.join(', ')}`
                );
                validationResults.push({
                    isValid: false,
                    message: `Referenced files not valid: ${invalidFiles.join(', ')}`,
                    errorCode: ERROR_CODES.UNRELATED_FILES
                });
            }
        } catch (error) {
            logger.error(
                ERROR_CODES.PARSE_ERROR,
                `Error validating ${file.fsPath}: ${error.message}`
            );
            validationResults.push({
                isValid: false,
                message: `Parsing error: ${error.message}`,
                errorCode: ERROR_CODES.PARSE_ERROR
            });
        }
    }

    return validationResults;
}

/**
 * Check if a file path is a template placeholder
 * @param {string} path The file path to check
 * @returns {boolean} True if it's a placeholder
 */
function isTemplatePlaceholder(path) {
    const placeholders = [
        '[file path 1]',
        '[file path 2]',
        '[file path relative to this directory]',
        '[another file path relative to this directory]'
    ];

    return placeholders.includes(path);
}

module.exports = {
    validateDevDebtFiles
};
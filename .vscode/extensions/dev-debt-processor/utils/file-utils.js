const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

/**
 * Read template file and process its content
 * @param {string} templatePath Path to the template file
 * @returns {Promise<string>} The processed template content
 */
async function readTemplate(templatePath) {
    try {
        if (fs.existsSync(templatePath)) {
            let content = fs.readFileSync(templatePath, 'utf8');

            // Remove frontmatter and comments
            content = content.replace(/---\s*applyTo:.*?---\s*/s, '');
            content = content.replace(/\/\/[^\n]*/g, '');

            return content;
        }
    } catch (error) {
        throw new Error(`Failed to read template: ${error.message}`);
    }

    return null;
}

/**
 * Get all files in a directory
 * @param {string} dirPath Directory path
 * @param {string} pattern File pattern to match
 * @param {string} exclude Pattern to exclude
 * @returns {Promise<Array<string>>} List of file paths
 */
async function getDirectoryFiles(dirPath, pattern = '**/*', exclude = '**/node_modules/**') {
    try {
        const files = await vscode.workspace.findFiles(
            new vscode.RelativePattern(dirPath, pattern),
            exclude
        );

        return files.map(f => path.relative(dirPath, f.fsPath));
    } catch (error) {
        throw new Error(`Failed to get directory files: ${error.message}`);
    }
}

module.exports = {
    readTemplate,
    getDirectoryFiles
};
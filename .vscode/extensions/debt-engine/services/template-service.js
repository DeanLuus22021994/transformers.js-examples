const path = require('path');
const fs = require('fs');
const vscode = require('vscode');
const fileUtils = require('../utils/file-utils');
const ERROR_CODES = require('../constants/error-codes');

/**
 * Gets the appropriate template content based on project configuration
 * @param {string} projectRoot The project root path
 * @param {string} folderName The name of the folder for placeholder substitution
 * @param {import('../utils/logger')} logger The logger instance
 * @returns {Promise<string>} The template content
 */
async function getTemplateContent(projectRoot, folderName, logger) {
    // Get the prompt template content
    const templatePath = path.join(projectRoot, '.github', 'instructions', 'format_dev_debt_docs.instructions.md');

    try {
        // Try to read the project's template
        const content = await fileUtils.readTemplate(templatePath);
        if (content) {
            return content;
        }
    } catch (error) {
        logger.warning(`Could not load template from ${templatePath}: ${error.message}`);
    }

    // Fall back to default template
    return getDefaultTemplate(folderName);
}

/**
 * Get the default template content
 * @param {string} folderName The folder name for the template
 * @returns {string} The default template content
 */
function getDefaultTemplate(folderName) {
    return `# Development Debt Document for ${folderName}

## Overview
[Brief description of the technical debt this document addresses within this directory]

## Action Items
- [ ] Task 1: [Clear, specific description]
- [ ] Task 2: [Clear, specific description]
- [ ] Task 3: [Clear, specific description]

## Priority
[High/Medium/Low]

## Estimated Effort
[Hours or story points]

## Implementation Notes
[Any specific implementation details or considerations]

## Acceptance Criteria
- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

## Related Files
- [file path relative to this directory]
- [another file path relative to this directory]

## Dependencies
[Any dependencies that need to be resolved first]

## Assigned To
[Developer name or team]
`;
}

module.exports = {
    getTemplateContent,
    getDefaultTemplate
};
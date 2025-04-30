const vscode = require('vscode');

/**
 * Toggle a feature on or off
 * @param {import('../utils/config-manager')} configManager The config manager
 * @param {import('../utils/logger')} logger The logger instance
 */
async function toggleFeature(configManager, logger) {
    try {
        // Get all feature sections
        const features = [
            { label: 'Dev Debt Management', value: 'devDebt' },
            { label: 'Code Maintenance', value: 'maintenance' },
            { label: 'Testing', value: 'testing' },
            { label: 'Retrospectives', value: 'retrospective' }
        ];

        // Ask user to select a feature
        const selectedFeature = await vscode.window.showQuickPick(
            features.map(f => ({
                label: f.label,
                description: configManager.isEnabled(f.value) ? 'Enabled' : 'Disabled',
                value: f.value
            })),
            { placeHolder: 'Select feature to toggle' }
        );

        if (!selectedFeature) {
            return; // User cancelled
        }

        // Get current state
        const featureCode = selectedFeature.value;
        const currentState = configManager.isEnabled(featureCode);

        // Ask for new state
        const newState = await vscode.window.showQuickPick(
            [
                { label: 'Enable', value: true },
                { label: 'Disable', value: false }
            ],
            { placeHolder: `${currentState ? 'Disable' : 'Enable'} ${selectedFeature.label}?` }
        );

        if (!newState) {
            return; // User cancelled
        }

        // Toggle the feature
        await configManager.toggleFeature(featureCode, newState.value);

        // Show confirmation
        logger.info(`${selectedFeature.label} ${newState.value ? 'enabled' : 'disabled'}`);
        vscode.window.showInformationMessage(
            `${selectedFeature.label} has been ${newState.value ? 'enabled' : 'disabled'}`
        );

        // If toggling dev debt, also update vscode setting
        if (featureCode === 'devDebt') {
            await vscode.workspace.getConfiguration('devDebtProcessor').update(
                'enabled',
                newState.value,
                vscode.ConfigurationTarget.Workspace
            );
        }
    } catch (error) {
        logger.error('CONFIG_ERROR', `Error toggling feature: ${error.message}`);
        vscode.window.showErrorMessage(`Error toggling feature: ${error.message}`);
    }
}

module.exports = toggleFeature;
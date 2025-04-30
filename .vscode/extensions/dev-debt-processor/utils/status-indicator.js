const vscode = require('vscode');

class StatusIndicator {
    constructor(configManager) {
        this.configManager = configManager;
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'dev-debt-processor.toggleFeature';
        this.update();
        this.statusBarItem.show();
    }

    update() {
        const devDebtEnabled = this.configManager.isEnabled('devDebt');
        const maintenanceEnabled = this.configManager.isEnabled('maintenance');
        const testingEnabled = this.configManager.isEnabled('testing');
        const retroEnabled = this.configManager.isEnabled('retrospective');

        // Count enabled features
        const enabledCount = [
            devDebtEnabled,
            maintenanceEnabled,
            testingEnabled,
            retroEnabled
        ].filter(Boolean).length;

        // Update status bar
        this.statusBarItem.text = `$(tools) Dev Tools [${enabledCount}/4]`;
        this.statusBarItem.tooltip =
            `Dev Debt: ${devDebtEnabled ? '✅' : '❌'}\n` +
            `Maintenance: ${maintenanceEnabled ? '✅' : '❌'}\n` +
            `Testing: ${testingEnabled ? '✅' : '❌'}\n` +
            `Retrospective: ${retroEnabled ? '✅' : '❌'}\n` +
            `\nClick to toggle features`;
    }

    dispose() {
        this.statusBarItem.dispose();
    }
}

module.exports = StatusIndicator;
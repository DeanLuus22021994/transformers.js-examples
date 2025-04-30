const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const ERROR_CODES = require('../constants/error-codes');

/**
 * Logger to track Dev Debt operations with error codes
 */
class DevDebtLogger {
    constructor(context) {
        this.outputChannel = vscode.window.createOutputChannel("Dev Debt Processor");
        this.logDir = path.join(context.extensionPath, '..', '..', '.dev-debt-logs');
        this.currentSessionLog = path.join(this.logDir, `session_${new Date().toISOString().replace(/[:\.]/g, '-')}.log`);

        // Ensure log directory exists
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }

        // Archive directory for old logs
        this.archiveDir = path.join(this.logDir, 'archive');
        if (!fs.existsSync(this.archiveDir)) {
            fs.mkdirSync(this.archiveDir, { recursive: true });
        }

        this.info('Dev Debt Processor initialized');
    }

    info(message) {
        const logEntry = `[INFO] ${new Date().toISOString()} - ${message}`;
        this.log(logEntry);
    }

    warning(message) {
        const logEntry = `[WARNING] ${new Date().toISOString()} - ${message}`;
        this.log(logEntry);
    }

    error(code, message) {
        const logEntry = `[ERROR ${code}] ${new Date().toISOString()} - ${message}`;
        this.log(logEntry);
        this.outputChannel.appendLine(logEntry);
        this.outputChannel.show(true);
    }

    log(entry) {
        fs.appendFileSync(this.currentSessionLog, entry + '\n');
    }

    archiveLogs() {
        const archiveFolder = path.join(this.archiveDir, new Date().toISOString().split('T')[0]);
        if (!fs.existsSync(archiveFolder)) {
            fs.mkdirSync(archiveFolder, { recursive: true });
        }

        // Move current session log to archive
        const archiveFile = path.join(archiveFolder, path.basename(this.currentSessionLog));
        fs.copyFileSync(this.currentSessionLog, archiveFile);
        this.info(`Session log archived to ${archiveFile}`);
    }
}

module.exports = DevDebtLogger;
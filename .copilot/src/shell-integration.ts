import { TerminalSessionManager } from './tracer/terminal-session-manager';
import { ArchiveUtility } from './tracer/archive-utility';
import path from 'path';

/**
 * Class that integrates terminal tracing with the shell
 */
export class ShellIntegration {
  private sessionManager: TerminalSessionManager;
  private archiveUtility: ArchiveUtility;
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    this.sessionManager = new TerminalSessionManager(baseDir);
    this.archiveUtility = new ArchiveUtility(path.join(baseDir, 'trace'));

    // Periodically compress old logs
    setInterval(() => {
      this.archiveUtility.compressOldLogs(7);
    }, 24 * 60 * 60 * 1000); // Once a day

    // Periodically purge very old archives
    setInterval(() => {
      this.archiveUtility.purgeOldArchives(90);
    }, 7 * 24 * 60 * 60 * 1000); // Once a week
  }

  /**
   * Initialize shell hooks for automatic command tracing
   */
  public initShellHooks(): void {
    // Here you would typically hook into the shell
    // This is pseudocode as actual implementation depends on the shell

    // For PowerShell, you could use PSReadLine module to intercept commands
    this.sessionManager.executeCommand(`
      if (Get-Module -ListAvailable -Name PSReadLine) {
        $null = Register-ObjectEvent -InputObject (Get-PSReadLineOption).HistoryNoDuplicates -EventName PropertyChanged -Action {
          $command = Get-History -Count 1 | Select-Object -ExpandProperty CommandLine
          # Write this to a file that your TS process can read and process
        }
      }
    `);
  }

  /**
   * Execute a terminal command with tracing
   */
  public executeCommand(command: string, directory?: string): { output: string; exitCode: number } {
    return this.sessionManager.executeCommand(command, directory);
  }

  /**
   * Archive the current terminal session
   */
  public archiveSession(): string {
    return this.sessionManager.archiveSession();
  }

  /**
   * Get a summary of available archives
   */
  public getArchiveSummary(): { count: number; latest: any; totalSize: number } {
    const archives = this.archiveUtility.listArchives();
    const totalSize = archives.reduce((sum, archive) => sum + archive.size, 0);

    return {
      count: archives.length,
      latest: archives.length > 0 ? archives[0] : null,
      totalSize
    };
  }
}
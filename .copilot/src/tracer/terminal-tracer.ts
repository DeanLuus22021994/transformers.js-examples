import { CoreTracer } from './core-tracer';
import { TraceLevel, ITerminalTracer } from './types';

/**
 * Terminal tracer specialized for tracing terminal operations
 * Following SRP by handling only terminal-specific tracing concerns
 */
export class TerminalTracer extends CoreTracer implements ITerminalTracer {
  private currentCommand: string | null = null;
  private currentDirectory: string | null = null;

  constructor(baseDir: string) {
    super(baseDir);
  }

  /**
   * Trace a terminal command execution
   */
  public traceCommand(command: string, directory: string): void {
    this.currentCommand = command;
    this.currentDirectory = directory;

    this.trace(
      TraceLevel.INFO,
      'Terminal',
      `Executing command: ${command}`,
      {
        command,
        directory,
        timestamp: new Date().toISOString()
      }
    );
  }

  /**
   * Trace terminal command output
   */
  public traceOutput(output: string, exitCode: number): void {
    if (!this.currentCommand) {
      this.trace(
        TraceLevel.WARN,
        'Terminal',
        'Output received but no command was logged',
        { output: output.substring(0, 100) + (output.length > 100 ? '...' : '') }
      );
      return;
    }

    this.trace(
      exitCode === 0 ? TraceLevel.INFO : TraceLevel.ERROR,
      'Terminal',
      `Command completed with exit code: ${exitCode}`,
      {
        command: this.currentCommand,
        directory: this.currentDirectory,
        output: output,
        exitCode,
        timestamp: new Date().toISOString()
      }
    );

    // Reset current command tracking
    this.currentCommand = null;
    this.currentDirectory = null;
  }
}
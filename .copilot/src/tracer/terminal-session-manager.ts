import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { TracerFactory } from './tracer-factory';
import { TraceLevel } from './types';

/**
 * Terminal Session Manager that handles terminal execution with tracing
 * Following SRP by focusing on terminal session management
 */
export class TerminalSessionManager {
  private tracer: ReturnType<typeof TracerFactory.prototype.createTerminalTracer>;
  private tracerFactory: TracerFactory;
  private sessionDir: string;

  constructor(baseDir: string, sessionName: string = 'terminal') {
    this.sessionDir = path.join(baseDir, 'trace');
    this.tracerFactory = TracerFactory.getInstance(this.sessionDir);
    this.tracer = this.tracerFactory.createTerminalTracer(sessionName);

    // Create session directory
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }

    // Log terminal session start
    this.tracer.trace(
      TraceLevel.INFO,
      'TerminalSession',
      `Terminal session ${sessionName} started`,
      { timestamp: new Date().toISOString() }
    );
  }

  /**
   * Execute a command in the terminal with tracing
   */
  public executeCommand(command: string, directory: string = process.cwd()): { output: string; exitCode: number } {
    this.tracer.traceCommand(command, directory);

    try {
      const output = execSync(command, {
        cwd: directory,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large outputs
      });

      this.tracer.traceOutput(output, 0);
      return { output, exitCode: 0 };
    } catch (error: any) {
      const output = error.stdout || '';
      const exitCode = error.status || 1;

      this.tracer.traceOutput(output, exitCode);
      return { output, exitCode };
    }
  }

  /**
   * Archive the current session
   */
  public archiveSession(): string {
    return this.tracer.archive();
  }

  /**
   * Get information about the current terminal session
   */
  public getSessionInfo(): Record<string, any> {
    return {
      sessionDir: this.sessionDir,
      timestamp: new Date().toISOString(),
      path: process.env.PATH,
      platform: process.platform,
      cwd: process.cwd()
    };
  }
}
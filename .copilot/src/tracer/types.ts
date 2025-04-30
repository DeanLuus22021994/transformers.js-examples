/**
 * Enum representing different trace levels
 */
export enum TraceLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

/**
 * Interface for a trace record
 */
export interface TraceRecord {
  timestamp: Date;
  level: TraceLevel;
  source: string;
  message: string;
  metadata: Record<string, any>;
  sessionId: string;
}

/**
 * Interface for tracing functionality
 * Following Interface Segregation Principle
 */
export interface ITracer {
  trace(level: TraceLevel, source: string, message: string, metadata?: Record<string, any>): void;
  flush(): void;
  archive(): string;
}

/**
 * Interface for terminal trace records
 */
export interface TerminalTraceRecord extends TraceRecord {
  command?: string;
  output?: string;
  exitCode?: number;
  directory?: string;
}

/**
 * Interface for terminal tracers
 */
export interface ITerminalTracer extends ITracer {
  traceCommand(command: string, directory: string): void;
  traceOutput(output: string, exitCode: number): void;
}
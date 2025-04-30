import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ITracer, TraceLevel, TraceRecord } from './types';

/**
 * Core tracer implementation that handles basic tracing functionality
 * Following SRP by focusing solely on tracing concerns
 */
export class CoreTracer implements ITracer {
  private baseDir: string;
  private sessionId: string;
  private currentLog: TraceRecord[] = [];
  private startTime: number;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    this.sessionId = uuidv4();
    this.startTime = Date.now();
    this.initialize();
  }

  private initialize(): void {
    const logDir = path.join(this.baseDir, 'logs');
    const archiveDir = path.join(this.baseDir, 'archives');

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    this.trace(TraceLevel.INFO, 'Tracer', `Session started with ID: ${this.sessionId}`);
  }

  public trace(level: TraceLevel, source: string, message: string, metadata?: Record<string, any>): void {
    const timestamp = new Date();
    const record: TraceRecord = {
      timestamp,
      level,
      source,
      message,
      metadata: metadata || {},
      sessionId: this.sessionId,
    };

    this.currentLog.push(record);
    this.writeToCurrentLog(record);
  }

  private writeToCurrentLog(record: TraceRecord): void {
    const logFile = path.join(this.baseDir, 'logs', `current-${this.sessionId}.log`);
    const formattedRecord = `[${record.timestamp.toISOString()}] [${record.level}] [${record.source}] ${record.message}\n`;

    fs.appendFileSync(logFile, formattedRecord);
  }

  public flush(): void {
    // Intentionally empty - used by derived classes
  }

  public archive(): string {
    const archiveFile = path.join(this.baseDir, 'archives', `session-${this.sessionId}-${new Date().toISOString().replace(/:/g, '-')}.json`);
    const archiveData = {
      sessionId: this.sessionId,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      records: this.currentLog,
    };

    fs.writeFileSync(archiveFile, JSON.stringify(archiveData, null, 2));
    this.trace(TraceLevel.INFO, 'Tracer', `Session archived to ${archiveFile}`);
    return archiveFile;
  }
}
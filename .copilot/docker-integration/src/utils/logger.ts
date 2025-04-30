/**
 * Logger utility for the Docker Integration system
 */
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Log levels for different types of messages
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

/**
 * Logger class that handles all logging operations
 * Follows SRP by focusing only on logging functionality
 */
export class Logger {
  private logger: winston.Logger;
  private static instance: Logger;
  private logDir: string;

  /**
   * Private constructor to enforce singleton pattern
   */
  constructor() {
    this.logDir = path.join(os.homedir(), '.transformers-docker', 'logs');

    // Create log directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Create Winston logger with console and file transports
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'docker-integration' },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf((info: any) => {
              const { timestamp, level, message, module, ...rest } = info;
              return `${timestamp} [${level}] [${module || 'System'}]: ${message} ${
                Object.keys(rest).length > 0 ? JSON.stringify(rest) : ''
              }`;
            })
          )
        }),
        // File transport for all logs
        new winston.transports.File({
          filename: path.join(this.logDir, 'docker-integration.log'),
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
          tailable: true
        }),
        // File transport for errors only
        new winston.transports.File({
          filename: path.join(this.logDir, 'docker-integration-errors.log'),
          level: 'error',
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5
        })
      ]
    });
  }

  /**
   * Get the singleton instance of Logger
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log an info message
   */
  public info(module: string, message: string, meta: Record<string, any> = {}): void {
    this.logger.info(message, { module, ...meta });
  }

  /**
   * Log an error message
   */
  public error(module: string, message: string, meta: Record<string, any> = {}): void {
    this.logger.error(message, { module, ...meta });
  }

  /**
   * Log a warning message
   */
  public warn(module: string, message: string, meta: Record<string, any> = {}): void {
    this.logger.warn(message, { module, ...meta });
  }

  /**
   * Log a debug message
   */
  public debug(module: string, message: string, meta: Record<string, any> = {}): void {
    this.logger.debug(message, { module, ...meta });
  }

  /**
   * Log a message with a specific log level
   */
  public log(level: LogLevel, module: string, message: string, meta: Record<string, any> = {}): void {
    this.logger.log(level, message, { module, ...meta });
  }

  /**
   * Get the log directory path
   */
  public getLogDir(): string {
    return this.logDir;
  }
}

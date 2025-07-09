/**
 * Logging utilities for serverless functions
 * Used by both Supabase Edge Functions and Cloudflare Pages Functions
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  context?: Record<string, unknown>;
  tags?: string[];
}

/**
 * Logger class for consistent logging across serverless functions
 */
export class Logger {
  private context: Record<string, unknown>;
  private minLevel: LogLevel;
  
  constructor(context: Record<string, unknown> = {}, minLevel: LogLevel = 'info') {
    this.context = context;
    this.minLevel = minLevel;
  }
  
  /**
   * Log a debug message
   */
  debug(message: string, options: LogOptions = {}): void {
    this.log('debug', message, options);
  }
  
  /**
   * Log an info message
   */
  info(message: string, options: LogOptions = {}): void {
    this.log('info', message, options);
  }
  
  /**
   * Log a warning message
   */
  warn(message: string, options: LogOptions = {}): void {
    this.log('warn', message, options);
  }
  
  /**
   * Log an error message
   */
  error(message: string | Error, options: LogOptions = {}): void {
    const errorMessage = message instanceof Error ? message.message : message;
    const errorStack = message instanceof Error ? message.stack : undefined;
    
    this.log('error', errorMessage, {
      ...options,
      context: {
        ...options.context,
        stack: errorStack
      }
    });
  }
  
  /**
   * Create a child logger with additional context
   */
  child(additionalContext: Record<string, unknown>): Logger {
    return new Logger({
      ...this.context,
      ...additionalContext
    }, this.minLevel);
  }
  
  /**
   * Set the minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
  
  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, options: LogOptions = {}): void {
    // Skip if below minimum level
    if (!this.shouldLog(level)) {
      return;
    }
    
    const { context, ...restOptions } = options;
    
    const timestamp = new Date().toISOString();
    const logData = {
      level,
      message,
      timestamp,
      ...this.context,
      ...context,
      tags: restOptions.tags
    };
    
    // Log to console
    console[level === 'debug' ? 'log' : level](
      `[${timestamp}] [${level.toUpperCase()}] ${message}`,
      context ? context : ''
    );
    
    // In a production environment, you might want to send logs to a service
    this.sendToLogService(logData);
  }
  
  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    return levels[level] >= levels[this.minLevel];
  }
  
  /**
   * Send logs to an external service
   * This is a placeholder for actual implementation
   */
  private sendToLogService(logData: Record<string, unknown>): void {
    // In a real implementation, you would send logs to a service
    // For example, using fetch to send to a logging endpoint
    if (logData) {
      // Placeholder for future implementation
    }
  }
}

/**
 * Create a logger instance
 */
export function createLogger(context: Record<string, unknown> = {}): Logger {
  return new Logger(context);
}

/**
 * Default logger instance
 */
export const logger = createLogger();
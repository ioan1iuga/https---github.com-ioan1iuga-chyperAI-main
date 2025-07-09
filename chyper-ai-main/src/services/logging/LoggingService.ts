interface LogOptions {
  level: 'debug' | 'info' | 'warn' | 'error';
  module?: string;
  context?: Record<string, any>;
  tags?: string[];
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  module?: string;
  context?: Record<string, any>;
  tags?: string[];
}

interface LogFilter {
  level?: 'debug' | 'info' | 'warn' | 'error';
  module?: string;
  searchText?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
}

/**
 * Service for centralized application logging
 */
class LoggingService {
  private logs: LogEntry[] = [];
  private defaultContext: Record<string, any> = {};
  private persistLogs: boolean = import.meta.env.VITE_PERSIST_LOGS !== 'false';
  private maxLogSize: number = parseInt(import.meta.env.VITE_MAX_LOG_SIZE || '1000');
  private consoleLoggingEnabled: boolean = import.meta.env.VITE_CONSOLE_LOGGING !== 'false';
  private backendLoggingEnabled: boolean = import.meta.env.VITE_BACKEND_LOGGING === 'true';
  private loggingLevel: 'debug' | 'info' | 'warn' | 'error' = 
    (import.meta.env.VITE_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'debug';

  /**
   * Set default context to be included with all logs
   */
  setDefaultContext(context: Record<string, any>): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  /**
   * Configure logging behavior
   */
  configure(options: {
    persistLogs?: boolean;
    maxLogSize?: number;
    consoleLoggingEnabled?: boolean;
    backendLoggingEnabled?: boolean;
    loggingLevel?: 'debug' | 'info' | 'warn' | 'error';
  }): void {
    if (options.persistLogs !== undefined) this.persistLogs = options.persistLogs;
    if (options.maxLogSize !== undefined) this.maxLogSize = options.maxLogSize;
    if (options.consoleLoggingEnabled !== undefined) this.consoleLoggingEnabled = options.consoleLoggingEnabled;
    if (options.backendLoggingEnabled !== undefined) this.backendLoggingEnabled = options.backendLoggingEnabled;
    if (options.loggingLevel !== undefined) this.loggingLevel = options.loggingLevel;
  }

  /**
   * Log a debug message
   */
  debug(message: string, options: Omit<LogOptions, 'level'> = {}): void {
    this.log(message, { ...options, level: 'debug' });
  }

  /**
   * Log an info message
   */
  info(message: string, options: Omit<LogOptions, 'level'> = {}): void {
    this.log(message, { ...options, level: 'info' });
  }

  /**
   * Log a warning message
   */
  warn(message: string, options: Omit<LogOptions, 'level'> = {}): void {
    this.log(message, { ...options, level: 'warn' });
  }

  /**
   * Log an error message
   */
  error(message: string | Error, options: Omit<LogOptions, 'level'> = {}): void {
    let errorMessage = '';
    let errorContext = {};
    
    if (message instanceof Error) {
      errorMessage = message.message;
      errorContext = {
        name: message.name,
        stack: message.stack,
        ...options.context
      };
    } else {
      errorMessage = message;
    }
    
    this.log(errorMessage, { 
      ...options, 
      level: 'error',
      context: { ...options.context, ...errorContext }
    });
  }

  /**
   * Generic log method with level specification
   */
  log(message: string, options: LogOptions): void {
    // Check if we should log based on logging level
    const levelPriority = {
      'debug': 0,
      'info': 1,
      'warn': 2,
      'error': 3
    };
    
    if (levelPriority[options.level] < levelPriority[this.loggingLevel]) {
      return;
    }
    
    const timestamp = new Date();
    const id = this.generateLogId();
    const context = { ...this.defaultContext, ...options.context };
    
    // Create log entry
    const logEntry: LogEntry = {
      id,
      timestamp,
      level: options.level,
      message,
      module: options.module,
      context,
      tags: options.tags
    };
    
    // Save to in-memory store if persistence is enabled
    if (this.persistLogs) {
      this.logs.push(logEntry);
      
      // Trim logs if needed
      if (this.logs.length > this.maxLogSize) {
        this.logs = this.logs.slice(-this.maxLogSize);
      }
    }
    
    // Log to console if enabled
    if (this.consoleLoggingEnabled) {
      this.logToConsole(logEntry);
    }
    
    // Send to backend if enabled
    if (this.backendLoggingEnabled) {
      this.sendToBackend(logEntry);
    }
  }

  /**
   * Get all logs with optional filtering
   */
  getLogs(filter?: LogFilter): LogEntry[] {
    if (!filter) {
      return [...this.logs];
    }
    
    return this.logs.filter(log => {
      // Filter by level
      if (filter.level && log.level !== filter.level) {
        return false;
      }
      
      // Filter by module
      if (filter.module && log.module !== filter.module) {
        return false;
      }
      
      // Filter by text
      if (filter.searchText && !log.message.toLowerCase().includes(filter.searchText.toLowerCase())) {
        return false;
      }
      
      // Filter by date range
      if (filter.startDate && log.timestamp < filter.startDate) {
        return false;
      }
      
      if (filter.endDate && log.timestamp > filter.endDate) {
        return false;
      }
      
      // Filter by tags
      if (filter.tags && filter.tags.length > 0) {
        if (!log.tags || !log.tags.some(tag => filter.tags!.includes(tag))) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Clear all logs from memory
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs to JSON
   */
  exportLogs(filter?: LogFilter): string {
    const logs = this.getLogs(filter);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Create a logger instance for a specific module
   */
  createLogger(module: string) {
    return {
      debug: (message: string, options: Omit<LogOptions, 'level' | 'module'> = {}) => 
        this.debug(message, { ...options, module }),
      
      info: (message: string, options: Omit<LogOptions, 'level' | 'module'> = {}) => 
        this.info(message, { ...options, module }),
      
      warn: (message: string, options: Omit<LogOptions, 'level' | 'module'> = {}) => 
        this.warn(message, { ...options, module }),
      
      error: (message: string | Error, options: Omit<LogOptions, 'level' | 'module'> = {}) => 
        this.error(message, { ...options, module }),
      
      log: (message: string, options: Omit<LogOptions, 'module'>) => 
        this.log(message, { ...options, module })
    };
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Log entry to console
   */
  private logToConsole(logEntry: LogEntry): void {
    const timestamp = logEntry.timestamp.toISOString();
    const module = logEntry.module ? `[${logEntry.module}]` : '';
    const tags = logEntry.tags && logEntry.tags.length > 0 ? `[${logEntry.tags.join(',')}]` : '';
    const prefix = `${timestamp} ${module} ${tags}`;
    
    switch (logEntry.level) {
      case 'debug':
        console.debug(prefix, logEntry.message, logEntry.context);
        break;
      case 'info':
        console.info(prefix, logEntry.message, logEntry.context);
        break;
      case 'warn':
        console.warn(prefix, logEntry.message, logEntry.context);
        break;
      case 'error':
        console.error(prefix, logEntry.message, logEntry.context);
        break;
    }
  }

  /**
   * Send log to backend
   */
  private async sendToBackend(logEntry: LogEntry): Promise<void> {
    try {
      // In a real implementation, this would send the log to a backend service
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      // We don't want logging errors to cause issues, so just log to console
      console.error('Failed to send log to backend:', error);
    }
  }
}

export default new LoggingService();
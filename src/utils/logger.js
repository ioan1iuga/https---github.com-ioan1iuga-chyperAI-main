/**
 * Production-ready logging utility
 * Provides structured logging with configurable levels and formats
 */

// Log levels in order of increasing severity
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Default minimum log level
const DEFAULT_MIN_LEVEL = 'info';

class Logger {
  constructor() {
    // Set minimum log level from environment or default
    this.minLevel = LOG_LEVELS[process.env.LOG_LEVEL] !== undefined 
      ? LOG_LEVELS[process.env.LOG_LEVEL] 
      : LOG_LEVELS[DEFAULT_MIN_LEVEL];
      
    // Enable development mode for more verbose logging
    this.isDev = process.env.NODE_ENV !== 'production';
    
    // Configure additional logging options
    this.options = {
      includeTimestamp: true,
      colorize: this.isDev,
      jsonFormat: !this.isDev
    };
  }

  /**
   * Log a debug message
   */
  debug(message, metadata = {}) {
    this._log('debug', message, metadata);
  }

  /**
   * Log an info message
   */
  info(message, metadata = {}) {
    this._log('info', message, metadata);
  }

  /**
   * Log a warning message
   */
  warn(message, metadata = {}) {
    this._log('warn', message, metadata);
  }

  /**
   * Log an error message
   */
  error(message, metadata = {}) {
    this._log('error', message, metadata);
  }

  /**
   * Internal logging method
   */
  _log(level, message, metadata) {
    // Skip if below minimum level
    if (LOG_LEVELS[level] < this.minLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    
    // Build log data
    const logData = {
      level,
      message,
      ...metadata,
      timestamp
    };

    // Format differently for production vs development
    if (this.options.jsonFormat) {
      // Production: JSON format for structured logging
      console[level](JSON.stringify(logData));
    } else {
      // Development: Colorized, human-readable format
      const colors = {
        debug: '\x1b[34m', // Blue
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
        reset: '\x1b[0m'   // Reset
      };
      
      const color = this.options.colorize ? colors[level] : '';
      const reset = this.options.colorize ? colors.reset : '';
      
      const prefix = this.options.includeTimestamp 
        ? `[${timestamp}] ${color}${level.toUpperCase()}${reset}:`
        : `${color}${level.toUpperCase()}${reset}:`;
      
      console[level](`${prefix} ${message}`, Object.keys(metadata).length ? metadata : '');
    }
  }

  /**
   * Create a child logger with predefined metadata
   */
  child(defaultMetadata = {}) {
    const childLogger = Object.create(this);
    
    // Override log methods to include default metadata
    ['debug', 'info', 'warn', 'error'].forEach(level => {
      childLogger[level] = (message, metadata = {}) => {
        this[level](message, { ...defaultMetadata, ...metadata });
      };
    });
    
    return childLogger;
  }

  /**
   * Set the minimum log level
   */
  setLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
      this.minLevel = LOG_LEVELS[level];
    }
  }
}

// Export a singleton instance
export const logger = new Logger();

// Export the class for custom instances
export default Logger;
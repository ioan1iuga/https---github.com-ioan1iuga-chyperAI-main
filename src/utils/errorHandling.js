/**
 * Error handling and logging utility for ChyperAI
 * Provides consistent error logging, tracking, and user-friendly error messages
 */

// Log levels
const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
};

// Configuration for logger
const config = {
  enableConsoleLogging: true,
  enableRemoteLogging: false,
  logLevel: process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG,
  remoteLogEndpoint: '/api/logs'
};

/**
 * Main logger class
 */
class Logger {
  constructor() {
    this.config = config;
  }

  /**
   * Log a debug message
   * @param {string} message - The message to log
   * @param {object} [data] - Optional data to include with the log
   */
  debug(message, data) {
    this._log(LOG_LEVELS.DEBUG, message, data);
  }

  /**
   * Log an info message
   * @param {string} message - The message to log
   * @param {object} [data] - Optional data to include with the log
   */
  info(message, data) {
    this._log(LOG_LEVELS.INFO, message, data);
  }

  /**
   * Log a warning message
   * @param {string} message - The message to log
   * @param {object} [data] - Optional data to include with the log
   */
  warn(message, data) {
    this._log(LOG_LEVELS.WARN, message, data);
  }

  /**
   * Log an error message
   * @param {string} message - The message to log
   * @param {Error|object} [error] - Optional error object or data to include
   */
  error(message, error) {
    const errorData = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause
        }
      : error;

    this._log(LOG_LEVELS.ERROR, message, errorData);
  }

  /**
   * Log a fatal error message
   * @param {string} message - The message to log
   * @param {Error|object} [error] - Optional error object or data to include
   */
  fatal(message, error) {
    const errorData = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause
        }
      : error;

    this._log(LOG_LEVELS.FATAL, message, errorData);
  }

  /**
   * Internal logging method
   * @private
   */
  _log(level, message, data) {
    // Skip logging if level is below configured level
    if (!this._shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    // Console logging
    if (this.config.enableConsoleLogging) {
      this._logToConsole(level, message, data, timestamp);
    }

    // Remote logging
    if (this.config.enableRemoteLogging) {
      this._logToRemote(logEntry);
    }
  }

  /**
   * Check if the given log level should be logged
   * @private
   */
  _shouldLog(level) {
    const levels = Object.values(LOG_LEVELS);
    const configLevelIndex = levels.indexOf(this.config.logLevel);
    const logLevelIndex = levels.indexOf(level);
    
    return logLevelIndex >= configLevelIndex;
  }

  /**
   * Log to the console
   * @private
   */
  _logToConsole(level, message, data, timestamp) {
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case LOG_LEVELS.DEBUG:
        console.debug(prefix, message, data || '');
        break;
      case LOG_LEVELS.INFO:
        console.info(prefix, message, data || '');
        break;
      case LOG_LEVELS.WARN:
        console.warn(prefix, message, data || '');
        break;
      case LOG_LEVELS.ERROR:
      case LOG_LEVELS.FATAL:
        console.error(prefix, message, data || '');
        break;
      default:
        console.log(prefix, message, data || '');
    }
  }

  /**
   * Log to remote endpoint
   * @private
   */
  _logToRemote(logEntry) {
    // In a real implementation, this would send the log to a server
    // For now, we'll just queue it for later sending
    try {
      const queue = JSON.parse(localStorage.getItem('log-queue') || '[]');
      queue.push(logEntry);
      
      // Keep queue size reasonable
      if (queue.length > 100) {
        queue.shift();
      }
      
      localStorage.setItem('log-queue', JSON.stringify(queue));
    } catch (e) {
      // If we can't log to localStorage, log to console as fallback
      console.error('Failed to queue log for remote sending', e);
    }
  }

  /**
   * Configure the logger
   * @param {object} newConfig - New configuration options
   */
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create and export singleton logger instance
export const logger = new Logger();

/**
 * Error handler for async functions
 * @param {Function} fn - The async function to wrap
 * @returns {Function} Wrapped function that catches and logs errors
 */
export const asyncErrorHandler = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error(`Error in async function: ${fn.name || 'anonymous'}`, error);
      throw error; // Re-throw to allow caller to handle
    }
  };
};

/**
 * Format a user-friendly error message
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export const formatErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  
  if (error.code === 'NETWORK_ERROR') {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  if (error.code === 'AUTH_ERROR') {
    return 'Authentication error. Please sign in again.';
  }
  
  return error.message || 'An unexpected error occurred';
};

/**
 * Toast manager for displaying notifications
 */
export const toastManager = {
  success: (message) => {
    // In a real implementation, this would show a toast notification
    console.log(`%c✓ ${message}`, 'color: green; font-weight: bold;');
  },
  
  error: (message) => {
    // In a real implementation, this would show a toast notification
    console.error(`%c✗ ${message}`, 'color: red; font-weight: bold;');
  },
  
  warning: (message) => {
    // In a real implementation, this would show a toast notification
    console.warn(`%c⚠ ${message}`, 'color: orange; font-weight: bold;');
  },
  
  info: (message) => {
    // In a real implementation, this would show a toast notification
    console.info(`%cℹ ${message}`, 'color: blue; font-weight: bold;');
  }
};

export default {
  logger,
  asyncErrorHandler,
  formatErrorMessage,
  toastManager
};
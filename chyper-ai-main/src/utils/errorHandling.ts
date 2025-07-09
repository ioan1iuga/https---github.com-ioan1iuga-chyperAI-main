/**
 * Utility functions for error handling
 */

/**
 * Extract a readable error message from various error types
 */
export function getErrorMessage(error: any): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  // If the error is a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If the error has a message property, return it
  if (error.message) {
    return error.message;
  }

  // If the error has a response with data.error or data.message
  if (error.response?.data) {
    return error.response.data.error || error.response.data.message || JSON.stringify(error.response.data);
  }

  // Last resort: stringify the error
  try {
    return JSON.stringify(error);
  } catch (e) {
    return 'An unknown error occurred';
  }
}

/**
 * Format API errors for consistent display
 */
export function formatApiError(error: any): { message: string; code?: string; details?: any } {
  if (!error) {
    return { message: 'An unknown error occurred' };
  }

  // Handle network errors
  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return { 
      message: 'Network error - Please check your internet connection', 
      code: 'NETWORK_ERROR' 
    };
  }

  // Handle timeout errors
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return { 
      message: 'Request timed out - Server is taking too long to respond', 
      code: 'TIMEOUT_ERROR'
    };
  }

  // Handle authentication errors
  if (error.status === 401 || error.message?.includes('unauthorized')) {
    return { 
      message: 'Authentication error - Please sign in again', 
      code: 'AUTH_ERROR' 
    };
  }

  // Handle permission errors
  if (error.status === 403 || error.message?.includes('forbidden')) {
    return { 
      message: 'Permission denied - You do not have access to this resource', 
      code: 'PERMISSION_ERROR' 
    };
  }

  // Handle not found errors
  if (error.status === 404 || error.message?.includes('not found')) {
    return { 
      message: 'Resource not found', 
      code: 'NOT_FOUND_ERROR' 
    };
  }

  // Handle validation errors
  if (error.status === 422 || error.message?.includes('validation')) {
    return { 
      message: 'Validation error - Please check your input', 
      code: 'VALIDATION_ERROR',
      details: error.details || error.data?.details
    };
  }

  // Handle server errors
  if (error.status >= 500) {
    return { 
      message: 'Server error - Please try again later', 
      code: 'SERVER_ERROR' 
    };
  }

  // Default error message
  return { 
    message: error.message || 'An unexpected error occurred', 
    code: error.code || 'UNKNOWN_ERROR',
    details: error.details
  };
}

/**
 * Create a logger function that can be used throughout the application
 */
export const logger = {
  error: (message: string, error?: any) => {
    console.error(`ERROR: ${message}`, error);
    // In production, you might want to send this to a logging service
  },
  warn: (message: string, data?: any) => {
    console.warn(`WARNING: ${message}`, data);
  },
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production' || import.meta.env.VITE_CONSOLE_LOGGING === 'true') {
      console.info(`INFO: ${message}`, data);
    }
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development' || import.meta.env.VITE_DEBUG === 'true') {
      console.debug(`DEBUG: ${message}`, data);
    }
  }
};

/**
 * Higher-order function to wrap async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T, 
  errorHandler?: (error: any) => void,
  options: { rethrow?: boolean; silent?: boolean } = { rethrow: true, silent: false }
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error);
      } else {
        if (!options.silent) {
          logger.error('An error occurred:', error);
        }
      }
      if (options.rethrow) {
        throw error;
      }
      // Return a default value or error object if not rethrowing
      return Promise.resolve({
        error: getErrorMessage(error),
        success: false
      }) as unknown as ReturnType<T>;
    }
  };
}
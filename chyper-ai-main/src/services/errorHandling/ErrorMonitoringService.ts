/**
 * Error Monitoring Service
 * 
 * This service handles error logging, monitoring, and provides utilities for
 * implementing proper error handling throughout the application.
 */

interface ErrorMetadata {
  userId?: string;
  projectId?: string;
  sessionId?: string;
  url?: string;
  component?: string;
  params?: Record<string, any>;
  [key: string]: any;
}

interface LoggedError {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  type: string;
  metadata: ErrorMetadata;
  count: number;
  lastOccurrence: Date;
}

type ErrorLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
type ErrorCallback = (error: LoggedError) => void;

class ErrorMonitoringService {
  private errors: LoggedError[] = [];
  private subscribers: Set<ErrorCallback> = new Set();
  private defaultMetadata: Partial<ErrorMetadata> = {};
  
  // Error handling patterns
  private errorHandlingPatterns: Record<string, string> = {
    javascript: `try {
  // Code that might throw
} catch (error) {
  // Handle error
  console.error('An error occurred:', error);
  errorMonitoringService.captureException(error);
}`,
    typescript: `try {
  // Code that might throw
} catch (error) {
  // Handle error
  console.error('An error occurred:', error);
  errorMonitoringService.captureException(error);
}`,
    python: `try:
    # Code that might raise an exception
except Exception as e:
    # Handle exception
    print(f"An error occurred: {e}")
    error_monitoring_service.capture_exception(e)`,
    java: `try {
    // Code that might throw
} catch (Exception e) {
    // Handle exception
    System.out.println("An error occurred: " + e.getMessage());
    errorMonitoringService.captureException(e);
}`,
    csharp: `try
{
    // Code that might throw
}
catch (Exception ex)
{
    // Handle exception
    Console.WriteLine($"An error occurred: {ex.Message}");
    errorMonitoringService.CaptureException(ex);
}`
  };

  constructor() {
    // Initialize
    this.setupGlobalErrorHandlers();
  }

  /**
   * Set default metadata to be included with all captured errors
   */
  setDefaultMetadata(metadata: Partial<ErrorMetadata>): void {
    this.defaultMetadata = { ...this.defaultMetadata, ...metadata };
  }

  /**
   * Capture an exception with additional metadata
   */
  captureException(error: Error, metadata: ErrorMetadata = {}, level: ErrorLevel = 'error'): string {
    const errorId = this.generateErrorId();
    const timestamp = new Date();
    const combinedMetadata = { ...this.defaultMetadata, ...metadata };
    
    // Check if it's a duplicate error
    const existingError = this.errors.find(e => 
      e.message === error.message && 
      e.type === error.name && 
      JSON.stringify(e.metadata) === JSON.stringify(combinedMetadata)
    );
    
    if (existingError) {
      // Update existing error
      existingError.count += 1;
      existingError.lastOccurrence = timestamp;
      
      // Notify subscribers
      this.notifySubscribers(existingError);
      
      return existingError.id;
    }
    
    // Create new error record
    const loggedError: LoggedError = {
      id: errorId,
      timestamp,
      message: error.message,
      stack: error.stack,
      type: error.name,
      metadata: combinedMetadata,
      count: 1,
      lastOccurrence: timestamp
    };
    
    // Store the error
    this.errors.push(loggedError);
    
    // Log to console
    this.logToConsole(loggedError, level);
    
    // In a real implementation, we'd also send to a backend service
    this.sendToBackend(loggedError, level);
    
    // Notify subscribers
    this.notifySubscribers(loggedError);
    
    return errorId;
  }

  /**
   * Capture a message as an error
   */
  captureMessage(message: string, metadata: ErrorMetadata = {}, level: ErrorLevel = 'info'): string {
    const error = new Error(message);
    return this.captureException(error, metadata, level);
  }

  /**
   * Subscribe to error notifications
   */
  subscribe(callback: ErrorCallback): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get all captured errors
   */
  getErrors(): LoggedError[] {
    return [...this.errors];
  }

  /**
   * Clear all captured errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get error handling pattern for a specific language
   */
  getErrorHandlingPattern(language: string): string {
    return this.errorHandlingPatterns[language] || this.errorHandlingPatterns.javascript;
  }

  /**
   * Add error handling to a code snippet using AI
   */
  async addErrorHandlingToCode(code: string, language: string): Promise<string> {
    try {
      // Build the prompt
      const prompt = `
        Add proper error handling to the following ${language} code:
        
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Ensure all potential errors are caught and handled appropriately.
        Include logging and error reporting.
        Return only the modified code without explanation.
      `;
      
      // In a real implementation, this would call an AI service
      // For now, we'll mock a response by adding simple error handling
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Very simple mock - in reality, would use AI to add proper error handling
      if (language === 'javascript' || language === 'typescript') {
        // Check if there are any async functions or promises
        if (code.includes('async') || code.includes('await') || code.includes('Promise')) {
          return code.replace(
            /async\s+function\s+(\w+)\s*\([^)]*\)\s*{/g, 
            'async function $1() {\n  try {'
          ).replace(
            /}\s*$/,
            '  } catch (error) {\n    console.error("Error in $1:", error);\n    throw error;\n  }\n}'
          );
        } else {
          // Add basic try-catch to the whole code
          return `try {\n${code}\n} catch (error) {\n  console.error("Unexpected error:", error);\n}`;
        }
      } else if (language === 'python') {
        // Add basic try-except to the whole code
        return `try:\n${code.split('\n').map(line => '    ' + line).join('\n')}\nexcept Exception as e:\n    print(f"Unexpected error: {str(e)}")`;
      }
      
      // If we don't know how to add error handling for this language, return the original code
      return code;
    } catch (error) {
      console.error('Error adding error handling to code:', error);
      throw new Error(`Failed to add error handling to code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Generate a detailed error report for a specific error
   */
  generateErrorReport(errorId: string): string {
    const error = this.errors.find(e => e.id === errorId);
    if (!error) {
      throw new Error(`Error with ID ${errorId} not found`);
    }
    
    const lines = [
      `# Error Report: ${error.id}`,
      '',
      `**Type:** ${error.type}`,
      `**Message:** ${error.message}`,
      `**First Occurrence:** ${error.timestamp.toISOString()}`,
      `**Last Occurrence:** ${error.lastOccurrence.toISOString()}`,
      `**Occurrences:** ${error.count}`,
      '',
      '## Metadata',
      '```json',
      JSON.stringify(error.metadata, null, 2),
      '```',
      '',
      '## Stack Trace',
      '```',
      error.stack || 'No stack trace available',
      '```'
    ];
    
    return lines.join('\n');
  }

  /**
   * Create decorators for adding error handling to functions
   */
  createErrorHandler<T extends (...args: any[]) => any>(
    fn: T,
    options: {
      metadata?: ErrorMetadata;
      rethrow?: boolean;
      fallbackValue?: any;
      level?: ErrorLevel;
    } = {}
  ): (...args: Parameters<T>) => ReturnType<T> {
    return (...args: Parameters<T>): ReturnType<T> => {
      try {
        const result = fn(...args);
        
        // Handle promise returns
        if (result instanceof Promise) {
          return result.catch(error => {
            const errorId = this.captureException(error, options.metadata, options.level);
            
            if (options.rethrow !== false) {
              throw error;
            }
            
            return options.fallbackValue as ReturnType<T>;
          }) as ReturnType<T>;
        }
        
        return result;
      } catch (error) {
        // Capture synchronous errors
        const errorId = this.captureException(error instanceof Error ? error : new Error(String(error)), options.metadata, options.level);
        
        if (options.rethrow !== false) {
          throw error;
        }
        
        return options.fallbackValue as ReturnType<T>;
      }
    };
  }

  // Private methods

  private setupGlobalErrorHandlers(): void {
    // Browser-specific error handlers
    if (typeof window !== 'undefined') {
      // Disable global error handlers in development to avoid confusion
      if (process.env.NODE_ENV === 'development' && !import.meta.env.VITE_ENABLE_ERROR_TRACKING) {
        console.log('Global error handlers disabled in development. Enable with VITE_ENABLE_ERROR_TRACKING=true');
        return;
      }
      
      // Unhandled promise rejections
      window.addEventListener('unhandledrejection', event => {
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
        this.captureException(error, { 
          type: 'unhandledrejection',
          url: window.location.href
        }, 'error');
      });
      
      // Global errors
      window.addEventListener('error', event => {
        const error = event.error || new Error(`${event.message} at ${event.filename}:${event.lineno}:${event.colno}`);
        this.captureException(error, {
          type: 'global',
          url: window.location.href
        }, 'error');
      });
    }
  }

  private generateErrorId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  private logToConsole(error: LoggedError, level: ErrorLevel): void {
    const prefix = `[${level.toUpperCase()}] [${error.id}]`;
    
    // Only log in development or if explicitly enabled
    if (process.env.NODE_ENV === 'development' || import.meta.env.VITE_CONSOLE_LOGGING === 'true') {
      switch (level) {
        case 'debug':
          console.debug(prefix, error.message, error);
          break;
        case 'info':
          console.info(prefix, error.message, error);
          break;
        case 'warn':
          console.warn(prefix, error.message, error);
          break;
        case 'error':
        case 'critical':
          console.error(prefix, error.message, error);
          break;
      }
    }
  }

  private async sendToBackend(error: LoggedError, level: ErrorLevel): Promise<void> {
    // In a real implementation, this would send the error to a backend service
    // For now, we'll just simulate it
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private notifySubscribers(error: LoggedError): void {
    this.subscribers.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in error subscriber:', err);
      }
    });
  }
}

export default new ErrorMonitoringService();
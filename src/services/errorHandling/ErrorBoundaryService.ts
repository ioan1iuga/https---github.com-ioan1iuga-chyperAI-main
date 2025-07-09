import { logger } from '../../utils/errorHandling';

/**
 * Service for handling errors captured by ErrorBoundary
 * and reporting them to a centralized logging service
 */
export class ErrorBoundaryService {
  /**
   * Log an error captured by the ErrorBoundary
   */
  static logError(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('React ErrorBoundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    // In production, you'd send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTrackingService(error, errorInfo);
    }
  }
  
  /**
   * Send error to a tracking service like Sentry
   * This is a placeholder - in production, implement this
   * with your actual error tracking service
   */
  private static sendToErrorTrackingService(error: Error, errorInfo: React.ErrorInfo): void {
    // This is where you'd integrate with services like Sentry, LogRocket, etc.
    console.log('Would send to error tracking service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }
  
  /**
   * Handle unhandled promise rejections globally
   */
  static setupGlobalErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        logger.error('Unhandled Promise Rejection:', {
          reason: event.reason,
          stack: event.reason?.stack
        });
      });
      
      // Handle global errors
      window.addEventListener('error', (event) => {
        logger.error('Global Error:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        });
        
        // Don't prevent the browser's default error handling
        return false;
      });
      
      logger.info('Global error handlers installed');
    }
  }
}

// Set up global error handlers when imported
ErrorBoundaryService.setupGlobalErrorHandlers();

export default ErrorBoundaryService;
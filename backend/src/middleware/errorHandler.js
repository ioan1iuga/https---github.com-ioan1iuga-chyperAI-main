/**
 * Global error handling middleware
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);
  
  // Default error response
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    code: err.code || 'SERVER_ERROR'
  };
  
  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }
  
  res.status(statusCode).json(response);
};

export default errorHandler;
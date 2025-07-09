// Request Validation Middleware
import { validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Sanitize input data
export const sanitizeInput = (req, res, next) => {
  // Basic sanitization for common XSS patterns
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (Array.isArray(obj[key])) {
          obj[key] = obj[key].map(item => 
            typeof item === 'object' ? sanitizeObject(item) : sanitizeValue(item)
          );
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        } else {
          obj[key] = sanitizeValue(obj[key]);
        }
      }
    }
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Rate limiting helper
export const createRateLimit = (windowMs, maxRequests, message) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [requestKey, timestamp] of requests.entries()) {
      if (timestamp < windowStart) {
        requests.delete(requestKey);
      }
    }
    
    // Count requests from this IP in the current window
    const requestsFromIP = Array.from(requests.entries())
      .filter(([k]) => k.startsWith(key))
      .length;
    
    if (requestsFromIP >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: message || 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add this request
    requests.set(`${key}-${now}`, now);
    
    next();
  };
};

// Validate file uploads
export const validateFileUpload = (options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['.js', '.ts', '.tsx', '.jsx', '.css', '.html', '.md', '.json'],
    required = false
  } = options;

  return (req, res, next) => {
    if (!req.files && required) {
      return res.status(400).json({
        success: false,
        error: 'File upload is required'
      });
    }

    if (req.files) {
      for (const file of Object.values(req.files)) {
        // Check file size
        if (file.size > maxSize) {
          return res.status(400).json({
            success: false,
            error: `File ${file.name} exceeds maximum size of ${maxSize / 1024 / 1024}MB`
          });
        }

        // Check file type
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(ext)) {
          return res.status(400).json({
            success: false,
            error: `File type ${ext} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
          });
        }
      }
    }

    next();
  };
};

// CORS validation
export const validateOrigin = (allowedOrigins) => {
  return (req, res, next) => {
    const origin = req.headers.origin;
    
    if (!origin) {
      return next(); // Allow requests without origin (e.g., mobile apps)
    }
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      error: 'Origin not allowed'
    });
  };
};
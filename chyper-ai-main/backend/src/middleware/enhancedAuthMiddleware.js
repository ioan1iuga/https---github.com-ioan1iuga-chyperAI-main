// Enhanced JWT Authentication Middleware with Session Management
import enhancedAuthService from '../services/security/EnhancedAuthService';
import { logger } from '../utils/logger';

/**
 * Enhanced authentication middleware for Express
 * Verifies JWT tokens and validates sessions
 */
export const enhancedAuthMiddleware = async function(req, res, next) {
  // Check for authorization header
  const authHeader = req.headers.authorization;
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (!authHeader) {
    if (isDevelopment && process.env.ALLOW_MOCK_USER === 'true') {
      // DEVELOPMENT ONLY: Set a mock user for easier testing
      logger.warn('⚠️ Using mock user authentication - DO NOT USE IN PRODUCTION');
      req.user = {
        id: process.env.MOCK_USER_ID || 'mock-user-id',
        email: process.env.MOCK_USER_EMAIL || 'dev@example.com',
        role: process.env.MOCK_USER_ROLE || 'user',
        subscription_tier: process.env.MOCK_USER_TIER || 'free'
      };
      return next();
    }
    
    // No authorization header provided
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please provide valid authentication credentials'
    });
  }

  try {
    // Extract token from "Bearer <token>" format
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization header format',
        message: 'Authentication failed'
      });
    }

    // Validate session and token
    const userData = await enhancedAuthService.validateSession(token);
    
    if (!userData) {
      // Log failed authentication attempt
      const ipAddress = req.headers['x-forwarded-for'] || 
                        req.headers['x-real-ip'] || 
                        req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';
      
      try {
        // Try to decode the token to get the user ID for logging
        const decoded = enhancedAuthService.verifyToken(token);
        if (decoded && decoded.id) {
          await enhancedAuthService.logSecurityEvent(
            decoded.id,
            'session_invalidate',
            ipAddress,
            userAgent,
            { reason: 'Invalid or expired session' }
          );
        }
      } catch (error) {
        // Token couldn't be decoded, just log the attempt without user ID
        logger.warn('Failed authentication attempt with invalid token', {
          ipAddress,
          userAgent: userAgent.substring(0, 100) // Truncate long user agents
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session',
        message: 'Please log in again',
        code: 'SESSION_EXPIRED'
      });
    }
    
    // Set the user data from the validated session
    req.user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'user',
      sessionId: userData.sessionId
    };
    
    // Add session info to request for potential use in route handlers
    req.session = {
      id: userData.sessionId
    };
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
  }
};

/**
 * Middleware to require authentication
 * Use this for protected routes
 */
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Valid authentication credentials must be provided'
    });
  }
  next();
};

/**
 * Middleware to check if user has specific role
 * @param {string} role - Required role
 * @returns {Function} Middleware function
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    if (req.user.role !== role) {
      logger.warn(`Access denied: User ${req.user.id} with role ${req.user.role} attempted to access resource requiring ${role} role`);
      
      // Log security event
      const ipAddress = req.headers['x-forwarded-for'] || 
                        req.headers['x-real-ip'] || 
                        req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';
      
      enhancedAuthService.logSecurityEvent(
        req.user.id,
        'suspicious_activity',
        ipAddress,
        userAgent,
        { 
          type: 'unauthorized_access_attempt',
          requiredRole: role,
          userRole: req.user.role,
          path: req.originalUrl
        }
      ).catch(err => {
        logger.error('Failed to log security event:', err);
      });
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `This operation requires ${role} role permissions`
      });
    }
    
    next();
  };
};

/**
 * CSRF protection middleware
 * Requires CSRF token in headers for non-GET requests
 */
export const csrfProtection = (req, res, next) => {
  // Skip CSRF check for GET, HEAD, OPTIONS requests (they should be idempotent)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const csrfToken = req.headers['x-csrf-token'];
  
  if (!csrfToken) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token missing',
      message: 'CSRF token is required for this operation'
    });
  }
  
  // In a real implementation, validate the CSRF token against the user's session
  // For now, we'll just check that it exists
  
  next();
};

/**
 * Rate limiting middleware
 * Limits requests based on IP address
 */
export const rateLimit = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.socket.remoteAddress;
               
    const now = Date.now();
    
    // Initialize or clean up IP data
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const ipRequests = requests.get(ip);
    
    // Remove requests outside the current window
    const windowStart = now - windowMs;
    const recentRequests = ipRequests.filter(timestamp => timestamp > windowStart);
    
    // Update the requests array with current requests
    requests.set(ip, [...recentRequests, now]);
    
    // Check if rate limit is exceeded
    if (recentRequests.length >= maxRequests) {
      // Log rate limit exceeded
      logger.warn(`Rate limit exceeded for IP: ${ip}`);
      
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
      });
    }
    
    next();
  };
};

export default enhancedAuthMiddleware;
// JWT Authentication Middleware for Node.js Express
import jwt from 'jsonwebtoken';

/**
 * Basic authentication middleware for Express
 * Verifies JWT tokens and adds user object to request
 */
export const authMiddleware = function(req, res, next) {
  // Check for authorization header
  const authHeader = req.headers.authorization;
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (!authHeader) {
    if (isDevelopment && process.env.ALLOW_MOCK_USER === 'true') {
      // DEVELOPMENT ONLY: Set a mock user for easier testing
      console.warn('⚠️ Using mock user authentication - DO NOT USE IN PRODUCTION');
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

    // Verify JWT token
    try {
      const secret = process.env.JWT_SECRET || 'your-jwt-secret-key';
      const decoded = jwt.verify(token, secret);
      
      // Set the user data from the token
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'user',
        subscription_tier: decoded.subscription_tier || 'free'
      };
      
      // Log authentication
      console.log(`User authenticated via JWT: ${req.user.id}`);
    } catch (jwtError) {
      // JWT verification failed, but in development we'll still allow a mock user
      if (isDevelopment) {
        const mockUser = {
          id: token.slice(0, 8), // First 8 chars of token as mock ID
          email: 'user@example.com',
          role: 'user', 
          subscription_tier: 'free'
        };
        
        // Add the mock user to the request
        req.user = mockUser;
        console.log(`Mock user authenticated in dev mode: ${req.user.id}`);
      } else {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: jwtError.message
        });
      }
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
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
      console.warn(`Access denied: User ${req.user.id} with role ${req.user.role} attempted to access resource requiring ${role} role`);
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `This operation requires ${role} role permissions`
      });
    }
    
    next();
  };
};

export default authMiddleware;
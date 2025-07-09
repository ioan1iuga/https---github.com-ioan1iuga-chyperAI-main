// Enhanced Authentication Service with Session Management
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { logger } from '../../utils/logger';

export class EnhancedAuthService {
  constructor() {
    // Initialize JWT secret
    this.jwtSecret = process.env.JWT_SECRET;
    if (!this.jwtSecret) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('JWT_SECRET is not set. Using a random temporary secret for development only.');
        // Generate a random secret instead of using a hardcoded one
        this.jwtSecret = crypto.randomBytes(32).toString('hex');
      } else {
        this.jwtSecret = '';
        logger.error('JWT_SECRET environment variable is required in production');
      }
    }
    
    if (this.jwtSecret) {
      logger.info(`JWT secret configured (${this.jwtSecret.length} characters)`);
    } else {
      logger.error('No JWT secret available - authentication will not work');
    }
    
    // Token expiry settings
    this.tokenExpiry = '1h';  // Align with Supabase config
    this.refreshTokenExpiry = '7d';
    
    // Initialize Supabase client
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        logger.error('Supabase URL or service key not configured');
        this.supabase = null;
      } else {
        this.supabase = createClient(supabaseUrl, supabaseServiceKey);
        logger.info('Supabase client initialized for auth service');
      }
    } catch (error) {
      logger.error('Failed to initialize Supabase client:', error);
      this.supabase = null;
    }
  }

  /**
   * Generate JWT token
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role || 'user',
      sessionId: user.sessionId
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.tokenExpiry });
  }

  /**
   * Generate refresh token
   * @param {Object} user - User object
   * @returns {string} Refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      id: user.id,
      type: 'refresh',
      sessionId: user.sessionId
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.refreshTokenExpiry });
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      logger.error('Token verification failed:', error.message);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Extract token from authorization header
   * @param {string} authHeader - Authorization header
   * @returns {string} Token
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authorization header');
    }
    return authHeader.substring(7);
  }

  /**
   * Generate a unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return crypto.randomUUID();
  }

  /**
   * Create a new session
   * @param {Object} user - User object
   * @param {Object} req - Express request object
   * @returns {Promise<Object>} Session object
   */
  async createSession(user, req) {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      const sessionId = this.generateSessionId();
      const token = this.generateToken({ ...user, sessionId });
      const refreshToken = this.generateRefreshToken({ ...user, sessionId });
      
      // Calculate expiry dates
      const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
      const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 days
      
      // Extract client info
      const userAgent = req.headers['user-agent'] || '';
      const ipAddress = req.headers['x-forwarded-for'] || 
                        req.headers['x-real-ip'] || 
                        req.socket.remoteAddress;
      
      // Store session in database
      const { data, error } = await this.supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          session_token: token,
          refresh_token: refreshToken,
          user_agent: userAgent,
          ip_address: ipAddress,
          expires_at: expiresAt.toISOString(),
          device_info: this.parseUserAgent(userAgent),
          metadata: {
            lastLogin: new Date().toISOString(),
            refreshExpiresAt: refreshExpiresAt.toISOString()
          }
        });
        
      if (error) {
        logger.error('Error creating session:', error);
        throw new Error('Failed to create session');
      }
      
      // Log security event
      await this.logSecurityEvent(
        user.id,
        'session_create',
        ipAddress,
        userAgent,
        { sessionId }
      );
      
      return {
        sessionId,
        token,
        refreshToken,
        expiresAt,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role || 'user'
        }
      };
    } catch (error) {
      logger.error('Session creation error:', error);
      throw error;
    }
  }

  /**
   * Validate session
   * @param {string} token - JWT token
   * @returns {Promise<Object|null>} User data or null if invalid
   */
  async validateSession(token) {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      // Verify the token
      const decoded = this.verifyToken(token);
      
      // Check if session exists and is valid
      const { data, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', token)
        .eq('is_valid', true)
        .single();
        
      if (error || !data) {
        logger.warn('Session validation failed:', error?.message || 'Session not found');
        return null;
      }
      
      // Check if session is expired
      if (new Date(data.expires_at) < new Date()) {
        logger.warn('Session expired:', data.id);
        return null;
      }
      
      // Update last_active
      await this.supabase
        .from('user_sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('session_token', token);
        
      return decoded;
    } catch (error) {
      logger.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Refresh session
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New token and expiry
   */
  async refreshSession(refreshToken) {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      // Verify the refresh token
      const decoded = this.verifyToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      // Check if session exists and is valid
      const { data, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('refresh_token', refreshToken)
        .eq('is_valid', true)
        .single();
        
      if (error || !data) {
        logger.warn('Refresh token validation failed:', error?.message || 'Session not found');
        throw new Error('Invalid refresh token');
      }
      
      // Get user data
      const { data: userData, error: userError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', decoded.id)
        .single();
        
      if (userError || !userData) {
        logger.error('User not found during token refresh:', decoded.id);
        throw new Error('User not found');
      }
      
      // Generate new tokens
      const newToken = this.generateToken({ 
        ...userData, 
        sessionId: decoded.sessionId 
      });
      
      // Update session
      const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
      
      await this.supabase
        .from('user_sessions')
        .update({ 
          session_token: newToken,
          expires_at: expiresAt.toISOString(),
          last_active: new Date().toISOString()
        })
        .eq('refresh_token', refreshToken);
        
      // Log security event
      await this.logSecurityEvent(
        userData.id,
        'session_refresh',
        data.ip_address,
        data.user_agent,
        { sessionId: decoded.sessionId }
      );
        
      return {
        token: newToken,
        expiresAt
      };
    } catch (error) {
      logger.error('Session refresh error:', error);
      throw new Error('Failed to refresh session: ' + error.message);
    }
  }

  /**
   * Invalidate session
   * @param {string} token - JWT token
   * @returns {Promise<boolean>} Success status
   */
  async invalidateSession(token) {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      // Get session info for logging
      const { data: sessionData } = await this.supabase
        .from('user_sessions')
        .select('user_id, ip_address, user_agent')
        .eq('session_token', token)
        .single();
      
      // Update session
      const { error } = await this.supabase
        .from('user_sessions')
        .update({ is_valid: false })
        .eq('session_token', token);
        
      if (error) {
        logger.error('Failed to invalidate session:', error);
        throw new Error('Failed to invalidate session');
      }
      
      // Log security event if we have session data
      if (sessionData) {
        await this.logSecurityEvent(
          sessionData.user_id,
          'session_invalidate',
          sessionData.ip_address,
          sessionData.user_agent,
          {}
        );
      }
      
      return true;
    } catch (error) {
      logger.error('Error invalidating session:', error);
      return false;
    }
  }

  /**
   * Invalidate all sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async invalidateAllSessions(userId) {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      const { error } = await this.supabase
        .from('user_sessions')
        .update({ is_valid: false })
        .eq('user_id', userId);
        
      if (error) {
        logger.error('Failed to invalidate all sessions:', error);
        throw new Error('Failed to invalidate sessions');
      }
      
      // Log security event
      await this.logSecurityEvent(
        userId,
        'session_invalidate',
        null,
        null,
        { allSessions: true }
      );
      
      return true;
    } catch (error) {
      logger.error('Error invalidating all sessions:', error);
      return false;
    }
  }

  /**
   * Get all active sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of sessions
   */
  async getUserSessions(userId) {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      const { data, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_valid', true)
        .order('last_active', { ascending: false });
        
      if (error) {
        logger.error('Failed to fetch user sessions:', error);
        throw new Error('Failed to fetch user sessions');
      }
      
      return data || [];
    } catch (error) {
      logger.error('Error fetching user sessions:', error);
      return [];
    }
  }

  /**
   * Log security event
   * @param {string} userId - User ID
   * @param {string} eventType - Event type
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   * @param {Object} details - Event details
   * @returns {Promise<void>}
   */
  async logSecurityEvent(userId, eventType, ipAddress, userAgent, details = {}) {
    if (!this.supabase) {
      logger.warn('Cannot log security event: Supabase client not initialized');
      return;
    }
    
    try {
      const { error } = await this.supabase
        .from('security_audit_logs')
        .insert({
          user_id: userId,
          event_type: eventType,
          ip_address: ipAddress,
          user_agent: userAgent,
          details
        });
        
      if (error) {
        logger.error('Failed to log security event:', error);
      }
    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }

  /**
   * Parse user agent string
   * @param {string} userAgent - User agent string
   * @returns {Object} Parsed user agent info
   */
  parseUserAgent(userAgent) {
    // Simple parsing - in production use a proper UA parser library
    const isMobile = /mobile/i.test(userAgent);
    const browser = /chrome/i.test(userAgent) ? 'Chrome' : 
                   /firefox/i.test(userAgent) ? 'Firefox' : 
                   /safari/i.test(userAgent) ? 'Safari' : 
                   /edge/i.test(userAgent) ? 'Edge' : 
                   'Unknown';
                   
    const os = /windows/i.test(userAgent) ? 'Windows' : 
              /mac/i.test(userAgent) ? 'MacOS' : 
              /linux/i.test(userAgent) ? 'Linux' : 
              /android/i.test(userAgent) ? 'Android' : 
              /ios/i.test(userAgent) ? 'iOS' : 
              'Unknown';
              
    return {
      isMobile,
      browser,
      os,
      raw: userAgent
    };
  }

  /**
   * Secure password hashing
   * @param {string} password - Plain text password
   * @returns {string} Hashed password
   */
  hashPassword(password) {
    // In production, use bcrypt or argon2
    const salt = crypto.randomBytes(16).toString('hex');
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex') + ':' + salt;
  }

  /**
   * Verify password
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password
   * @returns {boolean} Is password valid
   */
  verifyPassword(password, hashedPassword) {
    // In production, use bcrypt.compare or argon2.verify
    const [hash, salt] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  /**
   * Clean up expired sessions
   * @returns {Promise<number>} Number of deleted sessions
   */
  async cleanupExpiredSessions() {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      const { data, error } = await this.supabase.rpc('cleanup_expired_sessions');
      
      if (error) {
        logger.error('Failed to clean up expired sessions:', error);
        throw error;
      }
      
      logger.info(`Cleaned up ${data} expired sessions`);
      return data;
    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }
}

// Export singleton instance
export default new EnhancedAuthService();
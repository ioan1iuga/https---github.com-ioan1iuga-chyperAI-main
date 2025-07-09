// Session Management API Routes
import express from 'express';
import enhancedAuthService from '../services/security/EnhancedAuthService';
import { enhancedAuthMiddleware, requireAuth, csrfProtection } from '../middleware/enhancedAuthMiddleware';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route GET /api/sessions
 * @desc Get all active sessions for the current user
 * @access Private
 */
router.get('/', enhancedAuthMiddleware, requireAuth, async (req, res) => {
  try {
    const sessions = await enhancedAuthService.getUserSessions(req.user.id);
    
    // Don't return sensitive data like tokens
    const sanitizedSessions = sessions.map(session => {
      const { session_token, refresh_token, ...rest } = session;
      
      // Mark current session
      const isCurrent = rest.id === req.session?.id;
      
      return {
        ...rest,
        isCurrent
      };
    });
    
    return res.json({
      success: true,
      data: sanitizedSessions
    });
  } catch (error) {
    logger.error('Failed to fetch sessions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions',
      message: error.message
    });
  }
});

/**
 * @route DELETE /api/sessions/:sessionId
 * @desc Revoke a specific session
 * @access Private
 */
router.delete('/:sessionId', enhancedAuthMiddleware, requireAuth, csrfProtection, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get the session
    const { data: session, error } = await enhancedAuthService.supabase
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
      
    if (error || !session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Ensure user can only revoke their own sessions
    if (session.user_id !== req.user.id) {
      // Log security event - attempted to revoke someone else's session
      const ipAddress = req.headers['x-forwarded-for'] || 
                        req.headers['x-real-ip'] || 
                        req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';
      
      await enhancedAuthService.logSecurityEvent(
        req.user.id,
        'suspicious_activity',
        ipAddress,
        userAgent,
        { 
          type: 'unauthorized_session_revocation',
          targetSessionId: sessionId,
          targetUserId: session.user_id
        }
      );
      
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only revoke your own sessions'
      });
    }
    
    // Invalidate the session
    await enhancedAuthService.supabase
      .from('user_sessions')
      .update({ is_valid: false })
      .eq('id', sessionId);
      
    // Log the event
    const ipAddress = req.headers['x-forwarded-for'] || 
                      req.headers['x-real-ip'] || 
                      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    
    await enhancedAuthService.logSecurityEvent(
      req.user.id,
      'session_invalidate',
      ipAddress,
      userAgent,
      { sessionId }
    );
      
    return res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    logger.error('Failed to revoke session:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to revoke session',
      message: error.message
    });
  }
});

/**
 * @route DELETE /api/sessions
 * @desc Revoke all sessions except current
 * @access Private
 */
router.delete('/', enhancedAuthMiddleware, requireAuth, csrfProtection, async (req, res) => {
  try {
    // Get current session token
    const currentToken = req.headers.authorization.split(' ')[1];
    
    // Invalidate all other sessions
    const { error } = await enhancedAuthService.supabase
      .from('user_sessions')
      .update({ is_valid: false })
      .eq('user_id', req.user.id)
      .neq('session_token', currentToken);
      
    if (error) {
      throw new Error('Failed to revoke sessions');
    }
    
    // Log the event
    const ipAddress = req.headers['x-forwarded-for'] || 
                      req.headers['x-real-ip'] || 
                      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    
    await enhancedAuthService.logSecurityEvent(
      req.user.id,
      'session_invalidate',
      ipAddress,
      userAgent,
      { allOtherSessions: true }
    );
    
    return res.json({
      success: true,
      message: 'All other sessions revoked successfully'
    });
  } catch (error) {
    logger.error('Failed to revoke sessions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to revoke sessions',
      message: error.message
    });
  }
});

/**
 * @route POST /api/sessions/refresh
 * @desc Refresh token
 * @access Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }
    
    const result = await enhancedAuthService.refreshSession(refreshToken);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Token refresh failed:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
      message: error.message
    });
  }
});

/**
 * @route POST /api/sessions/validate
 * @desc Validate current session
 * @access Public
 */
router.post('/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization header',
        valid: false
      });
    }
    
    const token = authHeader.split(' ')[1];
    const userData = await enhancedAuthService.validateSession(token);
    
    if (!userData) {
      return res.json({
        success: true,
        valid: false,
        message: 'Session is invalid or expired'
      });
    }
    
    return res.json({
      success: true,
      valid: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role
      }
    });
  } catch (error) {
    logger.error('Session validation failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate session',
      message: error.message
    });
  }
});

export default router;
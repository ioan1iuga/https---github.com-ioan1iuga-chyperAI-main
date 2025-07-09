/**
 * Session Management Service
 * Handles session-related API calls and token management
 */

import apiService from '../api/apiService';
import { logger } from '../../utils/errorHandling';

// API response interfaces
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  valid?: boolean;
}

interface TokenResponse {
  token: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  device_info: {
    browser: string;
    os: string;
    isMobile: boolean;
    raw?: string;
  };
  last_active: string;
  created_at: string;
  expires_at: string;
  is_valid: boolean;
  isCurrent?: boolean;
}

class SessionManagementService {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: Date | null = null;
  private refreshTimeoutId: number | null = null;

  constructor() {
    // Try to restore tokens from secure storage
    this.restoreTokens();
    
    // Set up refresh timer if we have tokens
    if (this.refreshToken && this.expiresAt) {
      this.setupRefreshTimer();
    }
  }

  /**
   * Set authentication tokens
   * @param token Access token
   * @param refreshToken Refresh token
   * @param expiresAt Expiry date
   */
  setTokens(token: string, refreshToken: string, expiresAt: Date) {
    this.token = token;
    this.refreshToken = refreshToken;
    this.expiresAt = expiresAt;
    
    // Store tokens securely
    this.storeTokens();
    
    // Set up refresh timer
    this.setupRefreshTimer();
    
    // Set token for API service
    apiService.setAuthToken(token);
  }

  /**
   * Get current access token
   * @returns Access token or null
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get current refresh token
   * @returns Refresh token or null
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * Clear all tokens
   */
  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    this.expiresAt = null;
    
    // Clear secure storage
    sessionStorage.removeItem('auth_refresh_token');
    sessionStorage.removeItem('auth_token_expiry');
    
    // Clear refresh timer
    if (this.refreshTimeoutId !== null) {
      window.clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    
    // Clear API service token
    apiService.clearAuthToken();
    
    logger.info('All tokens cleared');
  }

  /**
   * Check if token is expired
   * @returns True if token is expired or missing
   */
  isExpired(): boolean {
    if (!this.expiresAt) return true;
    
    // Consider token expired 5 minutes before actual expiry
    const expiryWithBuffer = new Date(this.expiresAt.getTime() - 5 * 60 * 1000);
    return new Date() >= expiryWithBuffer;
  }

  /**
   * Get all active sessions for current user
   * @returns Array of user sessions
   */
  async getUserSessions(): Promise<UserSession[]> {
    try {
      const response = await apiService.get<ApiResponse<UserSession[]>>('/api/sessions');
      return response?.data || [];
    } catch (error) {
      logger.error('Error fetching user sessions', error);
      return [];
    }
  }

  /**
   * Revoke a specific session
   * @param sessionId Session ID to revoke
   * @returns Success status and error message
   */
  async revokeSession(sessionId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      await apiService.delete(`/api/sessions/${sessionId}`);
      return { success: true, error: null };
    } catch (error) {
      logger.error('Error revoking session', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to revoke session' 
      };
    }
  }

  /**
   * Revoke all sessions except current
   * @returns Success status and error message
   */
  async revokeAllOtherSessions(): Promise<{ success: boolean; error: string | null }> {
    try {
      await apiService.delete('/api/sessions');
      return { success: true, error: null };
    } catch (error) {
      logger.error('Error revoking all sessions', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to revoke sessions' 
      };
    }
  }

  /**
   * Refresh the current session
   * @param retryCount Number of retry attempts made so far
   * @param maxRetries Maximum number of retry attempts
   * @param baseDelay Base delay in ms between retries (will be multiplied by 2^retryCount)
   * @returns Success status and error message
   */
  async refreshSession(
    retryCount = 0,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // FIRST PRIORITY: Check if we have a valid Supabase session in localStorage
      const supabaseSession = localStorage.getItem('supabase.auth.token');
      if (supabaseSession) {
        try {
          const parsedSession = JSON.parse(supabaseSession);
          if (parsedSession?.currentSession?.access_token) {
            // Check if the token is expired
            const isExpired = parsedSession.currentSession.expires_at &&
              new Date(parsedSession.currentSession.expires_at * 1000) <= new Date();
            
            if (!isExpired) {
              logger.info('Using valid Supabase session directly from localStorage');
              
              // Set the token from Supabase session
              this.token = parsedSession.currentSession.access_token;
              
              // Set refresh token if available
              if (parsedSession?.currentSession?.refresh_token) {
                this.refreshToken = parsedSession.currentSession.refresh_token;
              }
              
              // Set expiry if available
              if (parsedSession?.currentSession?.expires_at) {
                this.expiresAt = new Date(parsedSession.currentSession.expires_at * 1000);
              } else if (parsedSession?.currentSession?.expires_in) {
                this.expiresAt = new Date(Date.now() + parsedSession.currentSession.expires_in * 1000);
              } else {
                // Default expiry if not available
                this.expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
              }
              
              // Store tokens
              this.storeTokens();
              
              // Set up refresh timer
              this.setupRefreshTimer();
              
              // Update API service token
              if (this.token) {
                apiService.setAuthToken(this.token);
              }
              
              // Notify that token has been refreshed
              document.dispatchEvent(new CustomEvent('auth:token-refreshed'));
              
              return { success: true, error: null };
            } else {
              logger.info('Supabase session found but expired, will attempt refresh');
            }
          }
        } catch (e) {
          logger.error('Failed to parse Supabase session during refresh', e);
          // Continue to other refresh methods
        }
      }
      
      // SECOND PRIORITY: Check if we have a refresh token
      if (!this.refreshToken) {
        logger.warn('No refresh token available in session service');
        
        // Try to get token from Supabase session if available (already checked above, but double-check)
        if (supabaseSession) {
          try {
            const parsedSession = JSON.parse(supabaseSession);
            if (parsedSession?.currentSession?.refresh_token) {
              this.refreshToken = parsedSession.currentSession.refresh_token;
              logger.info('Retrieved refresh token from Supabase session for refresh');
            }
          } catch (e) {
            logger.error('Failed to parse Supabase session when looking for refresh token', e);
          }
        }
        
        // If we still don't have a refresh token, return error
        if (!this.refreshToken) {
          return {
            success: false,
            error: 'No refresh token available'
          };
        }
      }
      
      // THIRD PRIORITY: Try API refresh with the refresh token
      logger.info(`Attempting to refresh session${retryCount > 0 ? ` (retry ${retryCount}/${maxRetries})` : ''}`);
      
      // Log the refresh token (first few characters) for debugging
      const tokenPreview = this.refreshToken.substring(0, 10) + '...';
      logger.debug('Using refresh token for session refresh', { tokenPreview });
      
      try {
        // Attempt API refresh
        const response = await apiService.post<ApiResponse<TokenResponse>>('/api/sessions/refresh', {
          refreshToken: this.refreshToken
        });
        
        if (response?.success && response?.data) {
          const { token, refreshToken, expiresAt } = response.data;
          
          // Update token and expiry
          this.token = token;
          this.expiresAt = new Date(expiresAt);
          
          // Update refresh token if provided
          if (refreshToken) {
            this.refreshToken = refreshToken;
          }
          
          // Store tokens
          this.storeTokens();
          
          // Set up refresh timer
          this.setupRefreshTimer();
          
          // Update API service token
          apiService.setAuthToken(token);
          
          // Notify that token has been refreshed
          document.dispatchEvent(new CustomEvent('auth:token-refreshed'));
          
          logger.info('Session refreshed successfully via API');
          return { success: true, error: null };
        } else {
          // If the error indicates an invalid refresh token, clear tokens and don't retry
          if (response?.error?.includes('invalid_token') ||
              response?.error?.includes('expired_token') ||
              response?.error?.includes('unauthorized')) {
            logger.error('Invalid or expired refresh token', response?.error);
            
            // Try Supabase session one more time before giving up
            if (supabaseSession) {
              try {
                const parsedSession = JSON.parse(supabaseSession);
                if (parsedSession?.currentSession?.access_token) {
                  logger.info('Using Supabase session after invalid token error');
                  
                  // Set the token from Supabase session
                  this.token = parsedSession.currentSession.access_token;
                  if (this.token) {
                apiService.setAuthToken(this.token);
              }
                  
                  // Notify that token has been refreshed
                  document.dispatchEvent(new CustomEvent('auth:token-refreshed'));
                  
                  return { success: true, error: null };
                }
              } catch (e) {
                logger.error('Failed to parse Supabase session during invalid token handling', e);
              }
            }
            
            this.clearTokens();
            return {
              success: false,
              error: response?.error || 'Invalid or expired refresh token'
            };
          }
          
          // For other errors, attempt retry if we haven't exceeded maxRetries
          if (retryCount < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount);
            logger.warn(`Failed to refresh session, retrying in ${delay}ms`, response?.error);
            
            // Wait using exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Recursive retry with incremented counter
            return this.refreshSession(retryCount + 1, maxRetries, baseDelay);
          } else {
            logger.error(`Failed to refresh session after ${maxRetries} attempts`, response?.error);
            
            // Try Supabase session one more time before giving up
            if (supabaseSession) {
              try {
                const parsedSession = JSON.parse(supabaseSession);
                if (parsedSession?.currentSession?.access_token) {
                  logger.info('Using Supabase session after max retries');
                  
                  // Set the token from Supabase session
                  this.token = parsedSession.currentSession.access_token;
                  if (this.token) {
                apiService.setAuthToken(this.token);
              }
                  
                  // Notify that token has been refreshed
                  document.dispatchEvent(new CustomEvent('auth:token-refreshed'));
                  
                  return { success: true, error: null };
                }
              } catch (e) {
                logger.error('Failed to parse Supabase session during max retries handling', e);
              }
            }
            
            return {
              success: false,
              error: response?.error || `Failed to refresh token after ${maxRetries} attempts`
            };
          }
        }
      } catch (apiError) {
        // Handle CORS errors specifically
        if (apiError instanceof TypeError &&
            (apiError.message.includes('fetch') || apiError.message.includes('network') ||
             apiError.message.includes('CORS'))) {
          
          logger.error('CORS/network error during token refresh', apiError);
          
          // For CORS errors, immediately try to use Supabase session directly
          if (supabaseSession) {
            try {
              const parsedSession = JSON.parse(supabaseSession);
              if (parsedSession?.currentSession?.access_token) {
                logger.info('Using Supabase session directly due to CORS error');
                
                // Set the token from Supabase session
                this.token = parsedSession.currentSession.access_token;
                
                // Set refresh token if available
                if (parsedSession?.currentSession?.refresh_token) {
                  this.refreshToken = parsedSession.currentSession.refresh_token;
                }
                
                // Set expiry if available
                if (parsedSession?.currentSession?.expires_at) {
                  this.expiresAt = new Date(parsedSession.currentSession.expires_at * 1000);
                } else if (parsedSession?.currentSession?.expires_in) {
                  this.expiresAt = new Date(Date.now() + parsedSession.currentSession.expires_in * 1000);
                } else {
                  // Default expiry if not available
                  this.expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
                }
                
                // Store tokens
                this.storeTokens();
                
                // Set up refresh timer
                this.setupRefreshTimer();
                
                // Update API service token
                if (this.token) {
                  apiService.setAuthToken(this.token);
                }
                
                // Notify that token has been refreshed
                document.dispatchEvent(new CustomEvent('auth:token-refreshed'));
                
                return { success: true, error: null };
              }
            } catch (e) {
              logger.error('Failed to parse Supabase session during CORS error handling', e);
            }
          }
          
          // If we couldn't use Supabase session, retry if we haven't exceeded maxRetries
          if (retryCount < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount);
            logger.warn(`CORS error refreshing session, retrying with delay ${delay}ms`);
            
            // Wait using exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Recursive retry with incremented counter
            return this.refreshSession(retryCount + 1, maxRetries, baseDelay);
          }
        }
        
        // Re-throw for the outer catch block to handle
        throw apiError;
      }
    } catch (error) {
      // For network errors, attempt retry if we haven't exceeded maxRetries
      if (retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount);
        logger.warn(`Error refreshing session, retrying in ${delay}ms`, error);
        
        // Wait using exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Recursive retry with incremented counter
        return this.refreshSession(retryCount + 1, maxRetries, baseDelay);
      } else {
        logger.error(`Error refreshing session after ${maxRetries} attempts`, error);
        
        // Final attempt to use Supabase session
        const supabaseSession = localStorage.getItem('supabase.auth.token');
        if (supabaseSession) {
          try {
            const parsedSession = JSON.parse(supabaseSession);
            if (parsedSession?.currentSession?.access_token) {
              logger.info('Using Supabase session after all refresh attempts failed');
              
              // Set the token from Supabase session
              this.token = parsedSession.currentSession.access_token;
              if (this.token) {
                apiService.setAuthToken(this.token);
              }
              
              // Notify that token has been refreshed
              document.dispatchEvent(new CustomEvent('auth:token-refreshed'));
              
              return { success: true, error: null };
            }
          } catch (e) {
            logger.error('Failed to parse Supabase session during final error handling', e);
          }
        }
        
        return {
          success: false,
          error: error instanceof Error
            ? `${error.message} (after ${maxRetries} retry attempts)`
            : `Failed to refresh session after ${maxRetries} attempts`
        };
      }
    }
  }

  /**
   * Validate current session
   * @param autoRefresh Whether to automatically attempt to refresh the token if validation fails
   * @returns Validation status and error message
   */
  async validateSession(autoRefresh = true): Promise<{ valid: boolean; error: string | null }> {
    try {
      if (!this.token) {
        logger.warn('Cannot validate session: No token available');
        
        // If we have a refresh token, try to refresh the session
        if (autoRefresh && this.refreshToken) {
          logger.info('No token available but refresh token exists, attempting refresh');
          const refreshResult = await this.refreshSession();
          
          if (refreshResult.success) {
            logger.info('Session refreshed successfully during validation');
            return { valid: true, error: null };
          } else {
            return { valid: false, error: refreshResult.error };
          }
        }
        
        return { valid: false, error: 'No token available' };
      }
      
      // Check if token is expired
      if (this.isExpired()) {
        logger.info('Token is expired, attempting refresh');
        
        if (autoRefresh && this.refreshToken) {
          const refreshResult = await this.refreshSession();
          
          if (refreshResult.success) {
            logger.info('Session refreshed successfully during validation');
            return { valid: true, error: null };
          } else {
            return { valid: false, error: refreshResult.error };
          }
        }
        
        return { valid: false, error: 'Token is expired' };
      }
      
      // If token exists and is not expired, validate with server
      const response = await apiService.post<ApiResponse<{ valid: boolean }>>('/api/sessions/validate');
      
      const isValid = response?.data?.valid === true;
      
      // If server says token is invalid but we have a refresh token, try to refresh
      if (!isValid && autoRefresh && this.refreshToken) {
        logger.info('Server reports token as invalid, attempting refresh');
        const refreshResult = await this.refreshSession();
        
        if (refreshResult.success) {
          logger.info('Session refreshed successfully after invalid token');
          return { valid: true, error: null };
        }
      }
      
      // Return server validation result
      return {
        valid: isValid,
        error: isValid ? null : (response?.error || 'Session is invalid')
      };
    } catch (error) {
      logger.error('Error validating session', error);
      
      // If there was a network error but we have a refresh token, try to refresh
      if (autoRefresh && this.refreshToken) {
        try {
          logger.info('Network error during validation, attempting refresh');
          const refreshResult = await this.refreshSession();
          
          if (refreshResult.success) {
            logger.info('Session refreshed successfully after validation error');
            return { valid: true, error: null };
          }
        } catch (refreshError) {
          logger.error('Error during refresh after validation failure', refreshError);
        }
      }
      
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Failed to validate session'
      };
    }
  }

  /**
   * Log security event
   * @param eventType Type of security event
   * @param details Additional details
   */
  async logSecurityEvent(eventType: string, details: Record<string, any> = {}): Promise<void> {
    try {
      await apiService.post('/api/sessions/security-log', {
        event_type: eventType,
        details
      });
    } catch (error) {
      logger.error('Failed to log security event', error);
    }
  }

  /**
   * Store tokens securely
   * @private
   */
  private storeTokens() {
    if (this.refreshToken) {
      try {
        // Use sessionStorage for refresh token instead of localStorage
        // This ensures the token is cleared when the browser is closed
        sessionStorage.setItem('auth_refresh_token', this.refreshToken);
        
        // Log the stored refresh token (first few characters) for debugging
        const tokenPreview = this.refreshToken.substring(0, 10) + '...';
        logger.debug('Refresh token stored in sessionStorage', { tokenPreview });
      } catch (error) {
        logger.error('Failed to store refresh token', error);
      }
    } else {
      logger.warn('Cannot store refresh token: No refresh token available');
    }
    
    if (this.expiresAt) {
      try {
        // Store expiry in sessionStorage
        sessionStorage.setItem('auth_token_expiry', this.expiresAt.toISOString());
        logger.debug('Token expiry stored in sessionStorage', { expiresAt: this.expiresAt.toISOString() });
      } catch (error) {
        logger.error('Failed to store token expiry', error);
      }
    } else {
      logger.warn('Cannot store token expiry: No expiry date available');
    }
  }

  /**
   * Restore tokens from storage
   * @private
   */
  private restoreTokens() {
    try {
      // Try to restore refresh token from sessionStorage instead of localStorage
      this.refreshToken = sessionStorage.getItem('auth_refresh_token');
      
      // Log the retrieved refresh token (first few characters) for debugging
      if (this.refreshToken) {
        const tokenPreview = this.refreshToken.substring(0, 10) + '...';
        logger.debug('Restored refresh token from sessionStorage', { tokenPreview });
      } else {
        logger.warn('No refresh token found in sessionStorage');
        // Try to get token from Supabase session if available
        const supabaseSession = localStorage.getItem('supabase.auth.token');
        if (supabaseSession) {
          try {
            const parsedSession = JSON.parse(supabaseSession);
            if (parsedSession?.currentSession?.refresh_token) {
              this.refreshToken = parsedSession.currentSession.refresh_token;
              logger.info('Restored refresh token from Supabase session');
              
              // Store it in sessionStorage for future use
              if (this.refreshToken) {
                sessionStorage.setItem('auth_refresh_token', this.refreshToken);
              }
              logger.debug('Refresh token stored in sessionStorage from Supabase session');
            }
          } catch (e) {
            logger.error('Failed to parse Supabase session', e);
          }
        }
      }
      
      // Try to restore expiry
      const expiryStr = sessionStorage.getItem('auth_token_expiry');
      if (expiryStr) {
        try {
          this.expiresAt = new Date(expiryStr);
          
          // If token is already expired, don't restore it
          if (this.isExpired()) {
            logger.info('Restored token is expired, clearing tokens');
            this.clearTokens();
            return;
          }
          
          logger.debug('Token expiry restored from sessionStorage', { expiresAt: this.expiresAt.toISOString() });
        } catch (e) {
          logger.error('Failed to parse token expiry date', e);
          this.expiresAt = null;
        }
      } else {
        logger.warn('No token expiry found in sessionStorage');
        // Try to get expiry from Supabase session if available
        const supabaseSession = localStorage.getItem('supabase.auth.token');
        if (supabaseSession) {
          try {
            const parsedSession = JSON.parse(supabaseSession);
            if (parsedSession?.currentSession?.expires_at) {
              this.expiresAt = new Date(parsedSession.currentSession.expires_at * 1000);
              logger.info('Restored token expiry from Supabase session');
              
              // Store it in sessionStorage for future use
              sessionStorage.setItem('auth_token_expiry', this.expiresAt.toISOString());
              logger.debug('Token expiry stored in sessionStorage from Supabase session');
            } else if (parsedSession?.currentSession?.expires_in) {
              // If we have expires_in instead of expires_at, calculate expiry
              const expiresAt = new Date(Date.now() + parsedSession.currentSession.expires_in * 1000);
              this.expiresAt = expiresAt;
              logger.info('Calculated token expiry from Supabase session expires_in');
              
              // Store it in sessionStorage for future use
              sessionStorage.setItem('auth_token_expiry', this.expiresAt.toISOString());
              logger.debug('Calculated token expiry stored in sessionStorage');
            }
          } catch (e) {
            logger.error('Failed to parse Supabase session for expiry', e);
          }
        }
      }
      
      // If we have a refresh token but no expiry, set a default expiry
      if (this.refreshToken && !this.expiresAt) {
        this.expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now
        logger.info('Setting default token expiry since none was found');
        sessionStorage.setItem('auth_token_expiry', this.expiresAt.toISOString());
      }
    } catch (error) {
      logger.error('Error restoring tokens from storage', error);
      this.clearTokens();
    }
  }

  /**
   * Set up token refresh timer
   * @private
   */
  private setupRefreshTimer() {
    // Clear any existing timer
    if (this.refreshTimeoutId !== null) {
      window.clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    
    if (!this.expiresAt) {
      logger.warn('Cannot set up refresh timer: No expiry date available');
      return;
    }
    
    if (!this.refreshToken) {
      logger.warn('Cannot set up refresh timer: No refresh token available');
      return;
    }
    
    // Calculate time until refresh (5 minutes before expiry)
    const now = new Date();
    const refreshTime = new Date(this.expiresAt.getTime() - 5 * 60 * 1000);
    const timeUntilRefresh = Math.max(0, refreshTime.getTime() - now.getTime());
    
    // If token is already expired or will expire in less than 10 seconds, refresh immediately
    if (timeUntilRefresh <= 10000) {
      logger.info('Token is about to expire, refreshing immediately');
      // Use setTimeout with 0 delay to run asynchronously
      setTimeout(async () => {
        try {
          const result = await this.refreshSession();
          if (!result.success) {
            logger.error('Failed to refresh token during immediate refresh', result.error);
          }
        } catch (error) {
          logger.error('Error during immediate token refresh', error);
        }
      }, 0);
      return;
    }
    
    // Log when the refresh will happen
    const refreshDate = new Date(now.getTime() + timeUntilRefresh);
    logger.info(`Token refresh scheduled for ${refreshDate.toLocaleTimeString()} (in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes)`);
    
    // Set up timer to trigger token refresh
    this.refreshTimeoutId = window.setTimeout(async () => {
      try {
        logger.info('Refresh timer triggered, refreshing token');
        const result = await this.refreshSession();
        if (!result.success) {
          logger.error('Failed to refresh token from timer', result.error);
        }
      } catch (error) {
        logger.error('Error refreshing token from timer', error);
        
        // If refresh fails, try again in 30 seconds if token is still valid
        if (this.token && !this.isExpired()) {
          logger.info('Scheduling another refresh attempt in 30 seconds');
          this.refreshTimeoutId = window.setTimeout(() => {
            this.setupRefreshTimer();
          }, 30000);
        }
      }
    }, timeUntilRefresh);
  }
}

// Export singleton instance
const sessionManagementService = new SessionManagementService();
export default sessionManagementService;
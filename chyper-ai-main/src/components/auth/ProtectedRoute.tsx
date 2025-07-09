import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEnhancedAuth } from '../../contexts/EnhancedAuthContext';
import { logger } from '../../utils/errorHandling';
import { Loader } from 'lucide-react';
import apiService from '../../services/api/apiService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireValidSession?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
  requireValidSession = true
}) => {
  const {
    isLoading,
    isAuthenticated,
    isSupabaseConfigured,
    user,
    profile,
    validateSession,
    refreshSession
  } = useEnhancedAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isValidatingSession, setIsValidatingSession] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectionTriggered, setRedirectionTriggered] = useState(false);
  
  useEffect(() => {
    // Redirect to appropriate error page if there are configuration issues
    if (!isLoading && !isSupabaseConfigured) {
      logger.error('Supabase not configured, redirecting to error page');
      // If Supabase is not configured, redirect to the Supabase error page
      navigate('/error/supabase');
    }

    // Log authentication state if not loading
    !isLoading && logger.info('Protected route auth check', {
      isAuthenticated,
      userId: user?.id,
      hasProfile: !!profile
    });
    
  }, [isLoading, isSupabaseConfigured, navigate, isAuthenticated, user, profile]);

  // Validate session when authenticated and validation is required
  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      if (!isAuthenticated || !requireValidSession) return;
      
      setIsValidatingSession(true);
      
      try {
        logger.info('Validating session for protected route', { path: location.pathname });
        
        // First check if we have a token in sessionStorage
        const refreshToken = sessionStorage.getItem('auth_refresh_token');
        const tokenExpiry = sessionStorage.getItem('auth_token_expiry');
        
        if (!refreshToken) {
          logger.warn('No refresh token found in sessionStorage during route protection check');
          
          // Try to get token from Supabase session if available
          const supabaseSession = localStorage.getItem('supabase.auth.token');
          if (supabaseSession) {
            try {
              const parsedSession = JSON.parse(supabaseSession);
              if (parsedSession?.currentSession?.refresh_token) {
                // Store it in sessionStorage for future use
                sessionStorage.setItem('auth_refresh_token', parsedSession.currentSession.refresh_token);
                logger.info('Restored refresh token from Supabase session during route check');
                
                // Also set token expiry if available
                if (parsedSession?.currentSession?.expires_at) {
                  const expiresAt = new Date(parsedSession.currentSession.expires_at * 1000);
                  sessionStorage.setItem('auth_token_expiry', expiresAt.toISOString());
                  logger.info('Restored token expiry from Supabase session during route check');
                } else if (parsedSession?.currentSession?.expires_in) {
                  // If we have expires_in instead of expires_at, calculate expiry
                  const expiresAt = new Date(Date.now() + parsedSession.currentSession.expires_in * 1000);
                  sessionStorage.setItem('auth_token_expiry', expiresAt.toISOString());
                  logger.info('Calculated token expiry from Supabase session during route check');
                }
                
                // If we also have an access token, set it directly in the API service
                if (parsedSession?.currentSession?.access_token) {
                  logger.info('Setting access token from Supabase session directly');
                  apiService.setAuthToken(parsedSession.currentSession.access_token);
                }
              }
            } catch (e) {
              logger.error('Failed to parse Supabase session during route check', e);
            }
          }
        }
        
        // Now validate the session
        try {
          const result = await validateSession();
          
          if (isMounted) {
            if (!result.valid) {
              logger.warn('Session validation failed for protected route', {
                path: location.pathname,
                error: result.error
              });
              
              // If validation failed, try to refresh the session
              try {
                logger.info('Attempting to refresh session after validation failure');
                const refreshResult = await refreshSession();
                
                if (refreshResult.success) {
                  logger.info('Session refreshed successfully after validation failure');
                  setIsSessionValid(true);
                } else {
                  // If refresh failed with a network error, try to use Supabase session directly
                  if (refreshResult.error?.includes('fetch') || refreshResult.error?.includes('network')) {
                    logger.warn('Network error during refresh, trying to use Supabase session directly');
                    
                    const supabaseSession = localStorage.getItem('supabase.auth.token');
                    if (supabaseSession) {
                      try {
                        const parsedSession = JSON.parse(supabaseSession);
                        if (parsedSession?.currentSession?.access_token) {
                          logger.info('Using Supabase session directly due to network error');
                          apiService.setAuthToken(parsedSession.currentSession.access_token);
                          setIsSessionValid(true);
                          return;
                        }
                      } catch (e) {
                        logger.error('Failed to parse Supabase session during network error handling', e);
                      }
                    }
                  }
                  
                  logger.error('Failed to refresh session after validation failure', {
                    error: refreshResult.error
                  });
                  setIsSessionValid(false);
                }
              } catch (refreshError) {
                logger.error('Error during session refresh after validation failure', refreshError);
                setIsSessionValid(false);
              }
            } else {
              logger.info('Session validated successfully for protected route');
              setIsSessionValid(true);
            }
          }
        } catch (validationError) {
          // If validation fails with a network error, try to use Supabase session directly
          if (validationError instanceof Error &&
              (validationError.message.includes('fetch') || validationError.message.includes('network'))) {
            logger.warn('Network error during validation, trying to use Supabase session directly');
            
            const supabaseSession = localStorage.getItem('supabase.auth.token');
            if (supabaseSession) {
              try {
                const parsedSession = JSON.parse(supabaseSession);
                if (parsedSession?.currentSession?.access_token) {
                  logger.info('Using Supabase session directly due to network error');
                  apiService.setAuthToken(parsedSession.currentSession.access_token);
                  if (isMounted) {
                    setIsSessionValid(true);
                  }
                  return;
                }
              } catch (e) {
                logger.error('Failed to parse Supabase session during network error handling', e);
              }
            }
          }
          
          logger.error('Error validating session for protected route', validationError);
          if (isMounted) {
            setIsSessionValid(false);
          }
        }
      } catch (error) {
        logger.error('Unexpected error in session check', error);
        if (isMounted) {
          setIsSessionValid(false);
        }
      } finally {
        if (isMounted) {
          setIsValidatingSession(false);
        }
      }
    };
    
    checkSession();
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, location.pathname, requireValidSession, validateSession, refreshSession]);

  // Show loading indicator while checking authentication
  if (isLoading || isValidatingSession) {
    logger.debug('Protected route showing loading state', {
      isLoading,
      isValidatingSession
    });
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="flex flex-col items-center">
          <Loader size={32} className="text-blue-500 animate-spin mb-4" />
          <p className="text-gray-400">
            {isValidatingSession ? "Validating session..." : "Loading account..."}
          </p>
        </div>
      </div>
    );
  }
  
  // Handle redirection with delay
  useEffect(() => {
    if ((!isAuthenticated || (requireValidSession && !isSessionValid)) &&
        !isValidatingSession && !redirectionTriggered) {
      
      logger.info('User not authenticated or session invalid, preparing to redirect to login', {
        isAuthenticated,
        isSessionValid,
        isValidatingSession,
        path: location.pathname
      });
      
      setRedirectionTriggered(true);
      
      // Add a delay before redirecting to allow any pending auth state updates to complete
      const timer = setTimeout(() => {
        logger.info('Redirecting to login after delay');
        setShouldRedirect(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isSessionValid, isValidatingSession, redirectionTriggered, location.pathname]);
  
  // Redirect to login if needed
  if (shouldRedirect) {
    return <Navigate to={redirectTo} state={{ from: location, returnTo: location.pathname }} replace />;
  }
  
  // Show loading while waiting to redirect
  if (redirectionTriggered && !shouldRedirect) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="flex flex-col items-center">
          <Loader size={32} className="text-blue-500 animate-spin mb-4" />
          <p className="text-gray-400">Preparing login page...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
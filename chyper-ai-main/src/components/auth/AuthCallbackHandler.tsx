import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader, AlertCircle } from 'lucide-react';
import { useEnhancedAuth } from '../../contexts/EnhancedAuthContext';
import { logger } from '../../utils/errorHandling';
import { useTheme } from '../../contexts/ThemeContext';

export const AuthCallbackHandler: React.FC = () => {
  const { supabase, isAuthenticated, isSupabaseConfigured } = useEnhancedAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      logger.error('Supabase not configured in auth callback handler');
      setError('Supabase is not configured properly');
      setProcessing(false);
      return;
    }

    // Parse query parameters from URL
    const parseQueryParams = () => {
      const params = new URLSearchParams(location.search);
      const queryParams: Record<string, string> = {};
      
      for (const [key, value] of params.entries()) {
        queryParams[key] = value;
      }
      
      return queryParams;
    };

    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      setProcessing(true);
      const queryParams = parseQueryParams();
      
      logger.info('Processing auth callback', {
        path: location.pathname,
        search: location.search,
        hash: location.hash,
        queryParams,
        origin: window.location.origin,
        fullUrl: window.location.href
      });
      
      // Detect provider from URL or query params
      const provider = location.pathname.includes('github') ? 'github' :
                       queryParams.provider || 'unknown';
      
      logger.info('Detected OAuth provider', { provider });
      
      try {
        // Log detailed information about the callback
        logger.info('Auth callback details', {
          url: window.location.href,
          origin: window.location.origin,
          pathname: location.pathname,
          queryParams,
          hasCode: !!queryParams.code,
          hasError: !!queryParams.error,
          errorDescription: queryParams.error_description || null
        });
        
        // Check for error in query parameters
        if (queryParams.error) {
          logger.error('OAuth error from provider', {
            error: queryParams.error,
            description: queryParams.error_description
          });
          
          setError(`Authentication failed: ${queryParams.error_description || queryParams.error}`);
          setTimeout(() => navigate('/login', {
            state: { error: `Authentication failed: ${queryParams.error_description || queryParams.error}` }
          }), 2000);
          setProcessing(false);
          return;
        }
        
        // Get the session (this will automatically exchange the code from the URL for a session)
        logger.info('Exchanging code for session', {
          hasCode: !!queryParams.code,
          codeLength: queryParams.code ? queryParams.code.length : 0,
          provider
        });
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          logger.error('Auth callback error', {
            error: error.message,
            code: error.code || 'unknown',
            status: error.status || 'unknown'
          });
          
          setError(`Authentication failed: ${error.message}`);
          setTimeout(() => navigate('/login', {
            state: { error: `Authentication failed: ${error.message}` }
          }), 2000);
        } else if (data.session) {
          logger.info('Session established successfully', {
            provider,
            hasAccessToken: !!data.session.access_token,
            hasRefreshToken: !!data.session.refresh_token,
            expiresAt: data.session.expires_at
          });
          
          // Add a small delay to ensure session is properly stored
          setTimeout(() => {
            logger.info('Redirecting to dashboard after successful authentication');
            navigate('/dashboard');
          }, 500);
        } else {
          logger.warn('No session found in callback, redirecting to login', {
            provider,
            hasData: !!data
          });
          
          setError('No session found. Please try logging in again.');
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        logger.error('Unexpected error in auth callback', {
          error: err,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
          errorStack: err instanceof Error ? err.stack : null
        });
        
        setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setTimeout(() => navigate('/login'), 2000);
      } finally {
        setProcessing(false);
      }
    };

    logger.info('Auth callback handler mounted', {
      url: location.pathname + location.search + location.hash,
      isAuthPath: location.pathname.includes('/auth/'),
      isCallbackPath: location.pathname.includes('/callback')
    });
    
    handleAuthCallback();
  }, [supabase, navigate, isAuthenticated, isSupabaseConfigured, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className={`text-center p-8 max-w-md w-full rounded-lg border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {processing ? (
          <>
            <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className={`text-xl font-semibold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Completing sign in...</h2>
            <p className={`${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>Please wait while we authenticate your account.</p>
          </>
        ) : error ? (
          <>
            <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${
              isDark ? 'text-red-500' : 'text-red-600'
            }`} />
            <h2 className={`text-xl font-semibold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Authentication Error</h2>
            <p className={`mb-4 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className={`text-xl font-semibold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Redirecting...</h2>
            <p className={`${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>You'll be redirected to your dashboard shortly.</p>
          </>
        )}
      </div>
    </div>
  );
};
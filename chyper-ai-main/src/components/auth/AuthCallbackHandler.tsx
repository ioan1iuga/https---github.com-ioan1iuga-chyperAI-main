import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/errorHandling';
import { useTheme } from '../../contexts/ThemeContext';

export const AuthCallbackHandler: React.FC = () => {
  const { supabase, isAuthenticated, isSupabaseConfigured } = useAuth();
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

    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      setProcessing(true);
      logger.info('Processing auth callback');
      
      try {
        // Get the session (this will automatically exchange the code from the URL for a session)
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          logger.error('Auth callback error', { error: error.message });
          setError(`Authentication failed: ${error.message}`);
          setTimeout(() => navigate('/login', { 
            state: { error: `Authentication failed: ${error.message}` } 
          }), 2000);
        } else if (data.session) {
          logger.info('Session found in callback, redirecting to dashboard');
          navigate('/dashboard');
        } else {
          logger.warn('No session found in callback, redirecting to login');
          setError('No session found. Please try logging in again.');
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        logger.error('Unexpected error in auth callback', { error: err });
        setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setTimeout(() => navigate('/login'), 2000);
      } finally {
        setProcessing(false);
      }
    };

    logger.info('Auth callback handler mounted', { 
      url: location.pathname + location.search + location.hash 
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
import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/errorHandling';
import { Loader } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login'
}) => {
  const { isLoading, isAuthenticated, isSupabaseConfigured, user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
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

  // Show loading indicator while checking authentication
  if (isLoading) {
    logger.debug('Protected route showing loading state');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="flex flex-col items-center">
          <Loader size={32} className="text-blue-500 animate-spin mb-4" />
          <p className="text-gray-400">Loading account...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    logger.info('User not authenticated, redirecting to login');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
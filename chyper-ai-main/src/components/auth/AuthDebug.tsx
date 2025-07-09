import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Bug, RefreshCw, X } from 'lucide-react';

interface AuthDebugProps {
  isVisible?: boolean;
}

export const AuthDebug: React.FC<AuthDebugProps> = ({ isVisible = false }) => {
  const [visible, setVisible] = useState(isVisible);
  const [statusDetails, setStatusDetails] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  const { user, profile, session, isAuthenticated, isSupabaseConfigured, configError, checkAuthStatus } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!visible && !import.meta.env.DEV) return null;
  
  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const result = await checkAuthStatus();
      setStatusDetails(result);
    } catch (error) {
      setStatusDetails({
        error: 'Failed to check status',
        details: { error }
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 shadow-lg rounded-lg overflow-hidden max-w-md w-full border ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className={`p-3 flex justify-between items-center border-b ${
        isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-center gap-2">
          <Bug size={16} className={isAuthenticated ? 'text-green-500' : 'text-red-500'} />
          <span className="font-medium text-sm">Auth Debug</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isAuthenticated 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={checkStatus}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
            }`}
          >
            <RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setVisible(false)}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
            }`}
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      <div className="p-3 max-h-96 overflow-auto">
        <div className="space-y-3 text-xs">
          <div className={`rounded p-2 ${
            isSupabaseConfigured
              ? isDark ? 'bg-green-900/20' : 'bg-green-50'
              : isDark ? 'bg-red-900/20' : 'bg-red-50'
          }`}>
            <div className="font-medium mb-1">Supabase Configuration</div>
            <div>{isSupabaseConfigured ? 'Configured' : 'Not Configured'}</div>
            {configError && <div className="text-red-500 mt-1">{configError}</div>}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className={`rounded p-2 ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className="font-medium mb-1">User</div>
              {user ? (
                <pre className="whitespace-pre-wrap break-words">{JSON.stringify({
                  id: user.id,
                  email: user.email,
                  app_metadata: user.app_metadata,
                  user_metadata: user.user_metadata,
                }, null, 2)}</pre>
              ) : (
                <div className="text-gray-500">No user</div>
              )}
            </div>
            
            <div className={`rounded p-2 ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className="font-medium mb-1">Profile</div>
              {profile ? (
                <pre className="whitespace-pre-wrap break-words">{JSON.stringify({
                  id: profile.id,
                  email: profile.email,
                  name: profile.name,
                  subscription_tier: profile.subscription_tier,
                }, null, 2)}</pre>
              ) : (
                <div className="text-gray-500">No profile</div>
              )}
            </div>
          </div>
          
          <div className={`rounded p-2 ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <div className="font-medium mb-1">Session</div>
            {session ? (
              <pre className="whitespace-pre-wrap break-words">{JSON.stringify({
                expires_at: session.expires_at,
                access_token_sub: session.access_token.substring(0, 20) + '...',
              }, null, 2)}</pre>
            ) : (
              <div className="text-gray-500">No session</div>
            )}
          </div>
          
          {statusDetails && (
            <div className={`rounded p-2 mt-2 ${
              statusDetails.success
                ? isDark ? 'bg-green-900/20' : 'bg-green-50'
                : isDark ? 'bg-red-900/20' : 'bg-red-50'
            }`}>
              <div className="font-medium mb-1">Status Check Results</div>
              <pre className="whitespace-pre-wrap break-words">{JSON.stringify(statusDetails, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
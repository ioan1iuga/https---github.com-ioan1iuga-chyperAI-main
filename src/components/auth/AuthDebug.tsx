import React, { useState } from 'react';
import { useEnhancedAuth } from '../../contexts/EnhancedAuthContext';
import { logger } from '../../utils/errorHandling';
import sessionManagementService from '../../services/security/SessionManagementService';
import apiService from '../../services/api/apiService';

/**
 * AuthDebug component for debugging authentication issues
 * This component displays the current authentication state, session information,
 * and provides buttons to test session validation and refresh.
 */
export const AuthDebug: React.FC = () => {
  const { 
    user, 
    profile, 
    session, 
    isLoading, 
    isAuthenticated,
    validateSession,
    refreshSession,
    getUserSessions
  } = useEnhancedAuth();
  
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error: string | null } | null>(null);
  const [refreshResult, setRefreshResult] = useState<{ success: boolean; error: string | null } | null>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiResult, setApiResult] = useState<string | null>(null);

  // Test session validation
  const handleValidateSession = async () => {
    try {
      logger.info('Testing session validation');
      const result = await validateSession();
      setValidationResult(result);
    } catch (error) {
      logger.error('Error testing session validation', error);
      setValidationResult({
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Test session refresh
  const handleRefreshSession = async () => {
    try {
      logger.info('Testing session refresh');
      const result = await refreshSession();
      setRefreshResult(result);
    } catch (error) {
      logger.error('Error testing session refresh', error);
      setRefreshResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get active sessions
  const handleGetSessions = async () => {
    try {
      logger.info('Getting active sessions');
      const sessions = await getUserSessions();
      setActiveSessions(sessions);
      setShowSessions(true);
    } catch (error) {
      logger.error('Error getting sessions', error);
      setActiveSessions([]);
    }
  };

  // Test API call
  const handleTestApiCall = async () => {
    setIsTestingApi(true);
    setApiResult(null);
    
    try {
      logger.info('Testing API call');
      const response = await apiService.get('/api/sessions/validate');
      setApiResult(JSON.stringify(response, null, 2));
    } catch (error) {
      logger.error('Error testing API call', error);
      setApiResult(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsTestingApi(false);
    }
  };

  // Get token info
  const getTokenInfo = () => {
    const token = sessionManagementService.getToken();
    const refreshToken = sessionManagementService.getRefreshToken();
    const isExpired = sessionManagementService.isExpired();
    
    return {
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      isExpired,
      tokenFirstChars: token ? `${token.substring(0, 10)}...` : 'None',
      refreshTokenFirstChars: refreshToken ? `${refreshToken.substring(0, 10)}...` : 'None'
    };
  };

  const tokenInfo = getTokenInfo();

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg shadow-lg max-w-4xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">Authentication Debug Panel</h2>
      
      {/* Auth State */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-blue-300">Authentication State</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-700 p-4 rounded">
            <p className="font-medium text-gray-300">Loading: <span className={isLoading ? "text-yellow-400" : "text-green-400"}>{isLoading ? "Yes" : "No"}</span></p>
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <p className="font-medium text-gray-300">Authenticated: <span className={isAuthenticated ? "text-green-400" : "text-red-400"}>{isAuthenticated ? "Yes" : "No"}</span></p>
          </div>
        </div>
      </div>
      
      {/* Token Info */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-blue-300">Token Information</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-700 p-4 rounded">
            <p className="font-medium text-gray-300">Has Token: <span className={tokenInfo.hasToken ? "text-green-400" : "text-red-400"}>{tokenInfo.hasToken ? "Yes" : "No"}</span></p>
            {tokenInfo.hasToken && (
              <p className="font-medium text-gray-300 mt-2">Token: <span className="text-yellow-400">{tokenInfo.tokenFirstChars}</span></p>
            )}
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <p className="font-medium text-gray-300">Has Refresh Token: <span className={tokenInfo.hasRefreshToken ? "text-green-400" : "text-red-400"}>{tokenInfo.hasRefreshToken ? "Yes" : "No"}</span></p>
            {tokenInfo.hasRefreshToken && (
              <p className="font-medium text-gray-300 mt-2">Refresh Token: <span className="text-yellow-400">{tokenInfo.refreshTokenFirstChars}</span></p>
            )}
          </div>
          <div className="bg-gray-700 p-4 rounded col-span-2">
            <p className="font-medium text-gray-300">Token Expired: <span className={tokenInfo.isExpired ? "text-red-400" : "text-green-400"}>{tokenInfo.isExpired ? "Yes" : "No"}</span></p>
          </div>
        </div>
      </div>
      
      {/* User Info */}
      {user && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-blue-300">User Information</h3>
          <div className="bg-gray-700 p-4 rounded mb-4">
            <p className="font-medium text-gray-300">ID: <span className="text-white">{user.id}</span></p>
            <p className="font-medium text-gray-300 mt-2">Email: <span className="text-white">{user.email}</span></p>
            <p className="font-medium text-gray-300 mt-2">Created: <span className="text-white">{new Date(user.created_at).toLocaleString()}</span></p>
          </div>
        </div>
      )}
      
      {/* Profile Info */}
      {profile && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-blue-300">Profile Information</h3>
          <div className="bg-gray-700 p-4 rounded mb-4">
            <p className="font-medium text-gray-300">Name: <span className="text-white">{profile.name}</span></p>
            <p className="font-medium text-gray-300 mt-2">Subscription: <span className="text-white">{profile.subscription_tier || 'None'}</span></p>
          </div>
        </div>
      )}
      
      {/* Test Actions */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-blue-300">Test Actions</h3>
        <div className="flex flex-wrap gap-4 mb-6">
          <button 
            onClick={handleValidateSession}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors"
          >
            Validate Session
          </button>
          <button 
            onClick={handleRefreshSession}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-medium transition-colors"
          >
            Refresh Session
          </button>
          <button 
            onClick={handleGetSessions}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white font-medium transition-colors"
          >
            Get Active Sessions
          </button>
          <button 
            onClick={handleTestApiCall}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white font-medium transition-colors"
            disabled={isTestingApi}
          >
            {isTestingApi ? 'Testing...' : 'Test API Call'}
          </button>
        </div>
        
        {/* Validation Result */}
        {validationResult && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-2 text-blue-300">Validation Result</h4>
            <div className={`p-4 rounded ${validationResult.valid ? 'bg-green-800' : 'bg-red-800'}`}>
              <p className="font-medium">
                Valid: <span className={validationResult.valid ? "text-green-400" : "text-red-400"}>
                  {validationResult.valid ? "Yes" : "No"}
                </span>
              </p>
              {validationResult.error && (
                <p className="font-medium mt-2">
                  Error: <span className="text-red-400">{validationResult.error}</span>
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Refresh Result */}
        {refreshResult && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-2 text-blue-300">Refresh Result</h4>
            <div className={`p-4 rounded ${refreshResult.success ? 'bg-green-800' : 'bg-red-800'}`}>
              <p className="font-medium">
                Success: <span className={refreshResult.success ? "text-green-400" : "text-red-400"}>
                  {refreshResult.success ? "Yes" : "No"}
                </span>
              </p>
              {refreshResult.error && (
                <p className="font-medium mt-2">
                  Error: <span className="text-red-400">{refreshResult.error}</span>
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* API Test Result */}
        {apiResult && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-2 text-blue-300">API Test Result</h4>
            <div className="p-4 rounded bg-gray-700">
              <pre className="whitespace-pre-wrap text-sm text-gray-300">{apiResult}</pre>
            </div>
          </div>
        )}
        
        {/* Active Sessions */}
        {showSessions && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-2 text-blue-300">Active Sessions ({activeSessions.length})</h4>
            {activeSessions.length > 0 ? (
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className={`p-4 rounded bg-gray-700 ${session.isCurrent ? 'border-2 border-blue-500' : ''}`}>
                    <div className="flex justify-between">
                      <p className="font-medium text-gray-300">
                        {session.isCurrent && <span className="text-blue-400 mr-2">[Current]</span>}
                        {new Date(session.created_at).toLocaleString()}
                      </p>
                      <p className="font-medium text-gray-300">
                        Expires: <span className={new Date(session.expires_at) < new Date() ? "text-red-400" : "text-green-400"}>
                          {new Date(session.expires_at).toLocaleString()}
                        </span>
                      </p>
                    </div>
                    <p className="font-medium text-gray-300 mt-2">
                      Device: <span className="text-white">{session.device_info.browser} on {session.device_info.os}</span>
                    </p>
                    <p className="font-medium text-gray-300 mt-2">
                      IP: <span className="text-white">{session.ip_address}</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded bg-gray-700">
                <p className="text-gray-300">No active sessions found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthDebug;
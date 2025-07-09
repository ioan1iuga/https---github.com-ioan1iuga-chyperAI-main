import React, { useState, useEffect } from 'react';
import sessionManagementService, { UserSession } from '../../services/security/SessionManagementService';
import { logger } from '../../utils/errorHandling';
import { formatDistanceToNow } from 'date-fns';

// Icons for different browsers and devices
const getBrowserIcon = (browser: string) => {
  if (!browser) return '🌐';
  
  const browserLower = browser.toLowerCase();
  if (browserLower.includes('chrome')) return '🌐';
  if (browserLower.includes('firefox')) return '🦊';
  if (browserLower.includes('safari')) return '🧭';
  if (browserLower.includes('edge')) return '📱';
  return '🌐';
};

const getOSIcon = (os: string) => {
  if (!os) return '💻';
  
  const osLower = os.toLowerCase();
  if (osLower.includes('windows')) return '🪟';
  if (osLower.includes('mac')) return '🍎';
  if (osLower.includes('linux')) return '🐧';
  if (osLower.includes('android')) return '🤖';
  if (osLower.includes('ios')) return '📱';
  return '💻';
};

const SessionManagement: React.FC = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch all active sessions
  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userSessions = await sessionManagementService.getUserSessions();
      
      if (userSessions.length === 0) {
        // If no sessions are returned, there might be an issue with the API
        logger.warn('No sessions returned from API');
      }
      
      setSessions(userSessions);
    } catch (err) {
      logger.error('Failed to fetch sessions', err);
      setError('Failed to load active sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Revoke a specific session
  const handleRevokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    
    try {
      const result = await sessionManagementService.revokeSession(sessionId);
      
      if (result.success) {
        // Remove the session from the list
        setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
      } else {
        setError(result.error || 'Failed to revoke session');
      }
    } catch (err) {
      logger.error('Error revoking session', err);
      setError('An error occurred while revoking the session');
    } finally {
      setRevoking(null);
    }
  };

  // Revoke all other sessions
  const handleRevokeAllOtherSessions = async () => {
    if (!window.confirm('Are you sure you want to log out from all other devices?')) {
      return;
    }
    
    setRefreshing(true);
    
    try {
      const result = await sessionManagementService.revokeAllOtherSessions();
      
      if (result.success) {
        // Keep only the current session
        setSessions(prevSessions => prevSessions.filter(session => session.isCurrent));
      } else {
        setError(result.error || 'Failed to revoke other sessions');
      }
    } catch (err) {
      logger.error('Error revoking all sessions', err);
      setError('An error occurred while revoking sessions');
    } finally {
      setRefreshing(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (err) {
      return 'Unknown';
    }
  };

  // Format IP address (hide part of it for privacy)
  const formatIP = (ip: string) => {
    if (!ip) return 'Unknown';
    
    const parts = ip.split('.');
    if (parts.length === 4) {
      // IPv4
      return `${parts[0]}.${parts[1]}.*.*`;
    }
    
    // IPv6 or other format
    return ip.substring(0, 8) + '...';
  };

  if (loading) {
    return (
      <div className="session-management loading">
        <p>Loading active sessions...</p>
      </div>
    );
  }

  return (
    <div className="session-management">
      <div className="session-management-header">
        <h2>Active Sessions</h2>
        <button 
          className="refresh-button"
          onClick={fetchSessions}
          disabled={loading || refreshing}
        >
          🔄 Refresh
        </button>
      </div>
      
      {error && (
        <div className="session-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      {sessions.length === 0 ? (
        <p>No active sessions found.</p>
      ) : (
        <>
          <div className="session-actions">
            <button 
              className="revoke-all-button"
              onClick={handleRevokeAllOtherSessions}
              disabled={refreshing || sessions.length <= 1}
            >
              Sign out from all other devices
            </button>
          </div>
          
          <div className="sessions-list">
            {sessions.map(session => (
              <div 
                key={session.id} 
                className={`session-item ${session.isCurrent ? 'current-session' : ''}`}
              >
                <div className="session-info">
                  <div className="session-device">
                    <span className="device-icon">
                      {getOSIcon(session.device_info.os)} {getBrowserIcon(session.device_info.browser)}
                    </span>
                    <span className="device-name">
                      {session.device_info.os} - {session.device_info.browser}
                      {session.device_info.isMobile && ' (Mobile)'}
                      {session.isCurrent && ' (Current)'}
                    </span>
                  </div>
                  
                  <div className="session-details">
                    {session.ip_address && (
                      <div className="session-location">
                        <span className="detail-label">IP:</span> {formatIP(session.ip_address)}
                      </div>
                    )}
                    {session.last_active && (
                      <div className="session-time">
                        <span className="detail-label">Last active:</span> {formatDate(session.last_active)}
                      </div>
                    )}
                    {session.created_at && (
                      <div className="session-created">
                        <span className="detail-label">Created:</span> {formatDate(session.created_at)}
                      </div>
                    )}
                    {session.expires_at && (
                      <div className="session-expires">
                        <span className="detail-label">Expires:</span> {formatDate(session.expires_at)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="session-actions">
                  {!session.isCurrent && (
                    <button
                      className="revoke-button"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revoking === session.id}
                    >
                      {revoking === session.id ? 'Signing out...' : 'Sign out'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      <div className="session-security-info">
        <h3>Security Information</h3>
        <p>
          These are your active sessions across all devices. If you don't recognize a session, 
          sign out from it immediately and change your password.
        </p>
        <p>
          For security reasons, some information is partially hidden. Sessions automatically 
          expire after a period of inactivity.
        </p>
      </div>
    </div>
  );
};

export default SessionManagement;
/**
 * API Service for handling API requests and authentication
 */
import { logger } from '../../utils/errorHandling';

// Base API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Debug flag for API requests
const DEBUG_API = import.meta.env.VITE_DEBUG_API === 'true' || import.meta.env.VITE_DEBUG === 'true';

// Log API requests in debug mode
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG_API) {
    console.log(`[API Service] ${message}`, ...args);
  }
};

// Store auth token in memory only (not localStorage) for security
let authToken: string | null = null;

// Flag to prevent multiple concurrent token refresh attempts
let isRefreshingToken = false;

// Queue of requests waiting for token refresh
let refreshQueue: Array<() => void> = [];

// Event for token refresh
const TOKEN_REFRESH_EVENT = 'api:token-refresh-needed';

/**
 * Set the authentication token for API requests
 */
const setAuthToken = (token: string) => {
  authToken = token;
  // Don't store the token in localStorage for security reasons
  // It's kept in memory only to prevent XSS attacks
  logger.info('Auth token set for API service');
};

/**
 * Clear the authentication token
 */
const clearAuthToken = () => {
  authToken = null;
  logger.info('Auth token cleared from API service');
};

/**
 * Get the current authentication token
 */
const getAuthToken = (): string | null => {
  return authToken;
};

/**
 * Process the queue of requests waiting for token refresh
 */
const processRefreshQueue = () => {
  refreshQueue.forEach(callback => callback());
  refreshQueue = [];
};

/**
 * Create headers for API requests
 */
const createHeaders = (additionalHeaders = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add CSRF token if available
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
};

/**
 * Handle API response errors
 */
const handleResponseError = async (response: Response, endpoint: string) => {
  // If unauthorized and not already refreshing token, trigger token refresh
  if (response.status === 401 && !isRefreshingToken && endpoint !== '/api/sessions/refresh') {
    logger.warn('Received 401 Unauthorized, attempting token refresh');
    
    // Set flag to prevent multiple refresh attempts
    isRefreshingToken = true;
    
    try {
      // Dispatch event for token refresh
      const refreshEvent = new CustomEvent(TOKEN_REFRESH_EVENT);
      document.dispatchEvent(refreshEvent);
      
      // Wait for token refresh to complete (max 5 seconds)
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          logger.error('Token refresh timeout');
          resolve();
        }, 5000);
        
        const handleRefreshComplete = () => {
          clearTimeout(timeout);
          document.removeEventListener('api:token-refreshed', handleRefreshComplete);
          resolve();
        };
        
        document.addEventListener('api:token-refreshed', handleRefreshComplete);
      });
      
      // Process queued requests
      processRefreshQueue();
    } catch (error) {
      logger.error('Error during token refresh', error);
    } finally {
      isRefreshingToken = false;
    }
    
    // Throw error to be handled by caller
    throw new Error('Authentication failed. Token refresh attempted.');
  }
  
  // Handle other error cases
  let errorMessage = `API error: ${response.status} ${response.statusText}`;
  
  try {
    // Try to get more detailed error message from response
    const errorData = await response.json() as { error?: string; message?: string };
    if (errorData && (typeof errorData === 'object')) {
      if ('error' in errorData && errorData.error) {
        errorMessage = errorData.error;
      } else if ('message' in errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    }
  } catch (e) {
    // If response is not JSON, use status text
    logger.debug('Could not parse error response as JSON', e);
  }
  
  throw new Error(errorMessage);
};

/**
 * Make a GET request to the API
 * @template T The expected response type
 */
const get = async <T = any>(endpoint: string, params = {}) => {
  const url = new URL(`${API_URL}${endpoint}`);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  debugLog(`GET request to ${url.toString()}`);
  
  try {
    const headers = createHeaders();
    debugLog('Request headers:', headers);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      credentials: 'include', // Include cookies for CSRF protection
      mode: 'cors', // Explicitly set CORS mode
    });

    debugLog(`Response status: ${response.status} ${response.statusText}`);
    
    // Log response headers for debugging
    if (DEBUG_API) {
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      debugLog('Response headers:', responseHeaders);
    }

    if (!response.ok) {
      await handleResponseError(response, endpoint);
    }

    const data = await response.json();
    debugLog('Response data:', data);
    return data as T;
  } catch (error) {
    // If token refresh was attempted, retry the request once
    if (error instanceof Error && error.message.includes('Token refresh attempted')) {
      debugLog('Retrying GET request after token refresh', { endpoint });
      
      const retryResponse = await fetch(url.toString(), {
        method: 'GET',
        headers: createHeaders(),
        credentials: 'include',
        mode: 'cors', // Explicitly set CORS mode
      });
      
      if (!retryResponse.ok) {
        await handleResponseError(retryResponse, endpoint);
      }
      
      const data = await retryResponse.json();
      debugLog('Retry response data:', data);
      return data as T;
    }
    
    logger.error('GET request failed', {
      endpoint,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};

/**
 * Make a POST request to the API
 * @template T The expected response type
 */
const post = async <T = any>(endpoint: string, data = {}) => {
  debugLog(`POST request to ${API_URL}${endpoint}`, { data });
  
  try {
    const headers = createHeaders();
    debugLog('Request headers:', headers);
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'include', // Include cookies for CSRF protection
      mode: 'cors', // Explicitly set CORS mode
    });

    debugLog(`Response status: ${response.status} ${response.statusText}`);
    
    // Log response headers for debugging
    if (DEBUG_API) {
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      debugLog('Response headers:', responseHeaders);
    }

    if (!response.ok) {
      await handleResponseError(response, endpoint);
    }

    const responseData = await response.json();
    debugLog('Response data:', responseData);
    return responseData as T;
  } catch (error) {
    // If token refresh was attempted, retry the request once
    if (error instanceof Error && error.message.includes('Token refresh attempted')) {
      debugLog('Retrying POST request after token refresh', { endpoint });
      
      const retryResponse = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(data),
        credentials: 'include',
        mode: 'cors', // Explicitly set CORS mode
      });
      
      if (!retryResponse.ok) {
        await handleResponseError(retryResponse, endpoint);
      }
      
      const retryData = await retryResponse.json();
      debugLog('Retry response data:', retryData);
      return retryData as T;
    }
    
    logger.error('POST request failed', {
      endpoint,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};

/**
 * Make a PUT request to the API
 * @template T The expected response type
 */
const put = async <T = any>(endpoint: string, data = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
      credentials: 'include', // Include cookies for CSRF protection
    });

    if (!response.ok) {
      await handleResponseError(response, endpoint);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    // If token refresh was attempted, retry the request once
    if (error instanceof Error && error.message.includes('Token refresh attempted')) {
      logger.info('Retrying PUT request after token refresh', { endpoint });
      
      const retryResponse = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: createHeaders(),
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!retryResponse.ok) {
        await handleResponseError(retryResponse, endpoint);
      }
      
      return retryResponse.json() as Promise<T>;
    }
    
    throw error;
  }
};

/**
 * Make a DELETE request to the API
 * @template T The expected response type
 */
const del = async <T = any>(endpoint: string) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: createHeaders(),
      credentials: 'include', // Include cookies for CSRF protection
    });

    if (!response.ok) {
      await handleResponseError(response, endpoint);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    // If token refresh was attempted, retry the request once
    if (error instanceof Error && error.message.includes('Token refresh attempted')) {
      logger.info('Retrying DELETE request after token refresh', { endpoint });
      
      const retryResponse = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: createHeaders(),
        credentials: 'include',
      });
      
      if (!retryResponse.ok) {
        await handleResponseError(retryResponse, endpoint);
      }
      
      return retryResponse.json() as Promise<T>;
    }
    
    throw error;
  }
};

/**
 * Notify that token has been refreshed
 */
const notifyTokenRefreshed = () => {
  const event = new CustomEvent('api:token-refreshed');
  document.dispatchEvent(event);
  logger.info('Token refresh notification sent');
};

// Listen for token refresh events from SessionManagementService
document.addEventListener(TOKEN_REFRESH_EVENT, async () => {
  logger.info('Token refresh event received');
  
  try {
    // Dispatch event to EnhancedAuthContext to refresh the token
    const refreshEvent = new CustomEvent('auth:token-refresh-needed');
    document.dispatchEvent(refreshEvent);
    
    // Wait for token to be refreshed (max 5 seconds)
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        logger.error('Token refresh timeout in event listener');
        resolve();
      }, 5000);
      
      const handleRefreshComplete = () => {
        clearTimeout(timeout);
        document.removeEventListener('auth:token-refreshed', handleRefreshComplete);
        resolve();
      };
      
      document.addEventListener('auth:token-refreshed', handleRefreshComplete);
    });
    
    // Notify that token has been refreshed
    notifyTokenRefreshed();
    
    // Process queued requests
    processRefreshQueue();
  } catch (error) {
    logger.error('Error handling token refresh event', error);
  } finally {
    isRefreshingToken = false;
  }
});

// Export the API service methods
export default {
  setAuthToken,
  clearAuthToken,
  getAuthToken,
  get,
  post,
  put,
  delete: del,
  // Export constants for external use
  TOKEN_REFRESH_EVENT,
  // Export notification methods
  notifyTokenRefreshed
};
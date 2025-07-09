/**
 * API Service for handling API requests and authentication
 */

// Base API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Store auth token
let authToken: string | null = null;

/**
 * Set the authentication token for API requests
 */
const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('auth_token', token);
  console.log('Auth token set for API service');
};

/**
 * Clear the authentication token
 */
const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('auth_token');
  console.log('Auth token cleared from API service');
};

/**
 * Get the current authentication token
 */
const getAuthToken = (): string | null => {
  if (!authToken) {
    // Try to get from localStorage
    authToken = localStorage.getItem('auth_token');
  }
  return authToken;
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

  return headers;
};

/**
 * Make a GET request to the API
 */
const get = async (endpoint: string, params = {}) => {
  const url = new URL(`${API_URL}${endpoint}`);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Make a POST request to the API
 */
const post = async (endpoint: string, data = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Make a PUT request to the API
 */
const put = async (endpoint: string, data = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'PUT',
    headers: createHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Make a DELETE request to the API
 */
const del = async (endpoint: string) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'DELETE',
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Export the API service methods
export default {
  setAuthToken,
  clearAuthToken,
  getAuthToken,
  get,
  post,
  put,
  delete: del,
};
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Session,
  User,
  AuthError,
  AuthChangeEvent, 
  Provider,
  SupabaseClient 
} from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api/apiService';
import { logger, getErrorMessage } from '../utils/errorHandling';
import sessionManagementService from '../services/security/SessionManagementService';

// Define types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  subscription_tier?: string;
  preferences?: {
    theme: 'light' | 'dark';
    language: string;
    notifications: {
      push: boolean;
      email: boolean;
      desktop: boolean;
    };
    editor: {
      fontSize: number;
      fontFamily: string;
      tabSize: number;
      wordWrap: boolean;
      minimap: boolean;
      lineNumbers: boolean;
    };
  };
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

// Define specific error types for better handling
export interface SupabaseLoginError extends Error {
  name: string;
  message: string;
  status: number;
  code: string;
}

interface EnhancedAuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  supabase: SupabaseClient | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSupabaseConfigured: boolean;
  configError: string | null;
  signUp: (email: string, password: string, name: string) => Promise<{
    success: boolean;
    error: string | null;
  }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{
    success: boolean;
    error: string | null;
  }>;
  signInWithProvider: (provider: Provider) => Promise<{
    success: boolean;
    error: string | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    success: boolean;
    error: string | null;
  }>;
  updatePassword: (password: string) => Promise<{
    success: boolean;
    error: string | null;
  }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{
    success: boolean;
    error: string | null;
  }>;
  updateEmail: (email: string) => Promise<{
    success: boolean;
    error: string | null;
  }>;
  uploadAvatar: (file: File) => Promise<{
    success: boolean;
    url: string | null;
    error: string | null;
  }>;
  getUserSessions: () => Promise<UserSession[]>;
  revokeSession: (sessionId: string) => Promise<{
    success: boolean;
    error: string | null;
  }>;
  revokeAllOtherSessions: () => Promise<{
    success: boolean;
    error: string | null;
  }>;
  refreshSession: () => Promise<{
    success: boolean;
    error: string | null;
  }>;
  validateSession: () => Promise<{
    valid: boolean;
    error: string | null;
  }>;
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | undefined>(undefined);

// Create Supabase client with proper error handling
let supabase: SupabaseClient | null = null;
let isSupabaseConfigured = false;
let configError: string | null = null;

// Debug logging function that we can control with an environment variable
const debugLog = (message: string, ...args: any[]) => {
  if (import.meta.env.VITE_DEBUG_AUTH === 'true' || import.meta.env.VITE_DEBUG === 'true') {
    console.log(`[EnhancedAuthContext] ${message}`, ...args);
  }
};

try {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  // Always log Supabase configuration status during initialization to help debugging
  console.log('Supabase configuration status:', {
    hasSupabaseUrl: !!supabaseUrl && supabaseUrl !== 'https://your-project.supabase.co',
    hasSupabaseAnonKey: !!supabaseAnonKey && supabaseAnonKey !== 'your-anon-key',
    isDevelopment: import.meta.env.DEV,
    envMode: import.meta.env.MODE,
  });

  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'https://your-project.supabase.co' || 
      supabaseAnonKey === 'your-supabase-anon-key') {
    configError = `Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file with your actual Supabase project credentials.`;
    console.error(configError);
    isSupabaseConfigured = false;
  } else {
    try {
      // Get GitHub OAuth credentials from environment variables
      const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      const githubClientSecret = import.meta.env.VITE_GITHUB_CLIENT_SECRET;
      
      // Log GitHub OAuth configuration status
      console.log('GitHub OAuth configuration status:', {
        hasGithubClientId: !!githubClientId,
        hasGithubClientSecret: !!githubClientSecret
      });
      
      // Initialize Supabase client with auth configuration
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      });
      
      isSupabaseConfigured = true;
      debugLog('Supabase client initialized successfully');
    } catch (error) {
      configError = `Failed to initialize Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(configError);
      isSupabaseConfigured = false;
    }
  }
} catch (error) {
  configError = `Supabase configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  console.error(configError);
  isSupabaseConfigured = false;
}

export const useEnhancedAuth = () => {
  const context = useContext(EnhancedAuthContext);
  if (!context) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider');
  }
  return context;
};

// Secure token storage in memory with periodic refresh
class TokenManager {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: Date | null = null;
  private refreshTimeoutId: number | null = null;

  constructor() {
    // Try to restore tokens from secure storage
    this.restoreTokens();
  }

  setTokens(token: string, refreshToken: string, expiresAt: Date) {
    this.token = token;
    this.refreshToken = refreshToken;
    this.expiresAt = expiresAt;
    
    // Store tokens securely
    this.storeTokens();
    
    // Set up refresh timer
    this.setupRefreshTimer();
  }

  getToken(): string | null {
    return this.token;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

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
    
    logger.debug('All tokens cleared from TokenManager');
  }

  isExpired(): boolean {
    if (!this.expiresAt) return true;
    
    // Consider token expired 5 minutes before actual expiry
    const expiryWithBuffer = new Date(this.expiresAt.getTime() - 5 * 60 * 1000);
    return new Date() >= expiryWithBuffer;
  }

  private storeTokens() {
    if (this.refreshToken) {
      try {
        // Store refresh token in sessionStorage instead of localStorage for security
        // This ensures the token is cleared when the browser is closed
        sessionStorage.setItem('auth_refresh_token', this.refreshToken);
        logger.debug('Refresh token stored in sessionStorage');
      } catch (error) {
        logger.error('Failed to store refresh token', error);
      }
    }
    
    if (this.expiresAt) {
      try {
        // Store expiry in sessionStorage
        sessionStorage.setItem('auth_token_expiry', this.expiresAt.toISOString());
        logger.debug('Token expiry stored in sessionStorage');
      } catch (error) {
        logger.error('Failed to store token expiry', error);
      }
    }
    
    // Note: We don't store the access token itself for security reasons
  }

  private restoreTokens() {
    try {
      // Try to restore refresh token from sessionStorage instead of localStorage
      this.refreshToken = sessionStorage.getItem('auth_refresh_token');
      
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
          
          logger.debug('Tokens restored from sessionStorage');
        } catch (e) {
          logger.error('Failed to parse token expiry date', e);
          this.expiresAt = null;
        }
      }
    } catch (error) {
      logger.error('Error restoring tokens from storage', error);
      this.clearTokens();
    }
  }

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
      logger.info('Token is about to expire, triggering immediate refresh');
      // Dispatch event immediately
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('auth:token-refresh-needed'));
      }, 0);
      return;
    }
    
    // Log when the refresh will happen
    const refreshDate = new Date(now.getTime() + timeUntilRefresh);
    logger.info(`Token refresh scheduled for ${refreshDate.toLocaleTimeString()} (in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes)`);
    
    // Set up timer to trigger token refresh
    this.refreshTimeoutId = window.setTimeout(() => {
      logger.info('Refresh timer triggered, dispatching refresh event');
      // This will be implemented by the auth provider
      document.dispatchEvent(new CustomEvent('auth:token-refresh-needed'));
    }, timeUntilRefresh);
  }
}

export const EnhancedAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State and hooks defined above
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Create token manager
  const tokenManager = new TokenManager();

  // Helper function to check if Supabase is available
  const checkSupabaseAvailable = () => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: configError || 'Supabase is not configured' };
    }
    return { success: true, error: null };
  };

  // Initialize auth state
  useEffect(() => {
    // Only initialize auth if Supabase is properly configured
    if (!isSupabaseConfigured || !supabase) {
      console.error('Supabase not configured, skipping auth initialization');
      setIsLoading(false);
      debugLog('Skipping auth initialization - Supabase not configured');
      return;
    }

    // Get initial session
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        // Get the current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        logger.debug('Auth initialization - session check', {
          hasSession: !!currentSession,
          session: currentSession ? 'exists' : 'null',
          hasError: !!sessionError
        });
        
        if (sessionError) {
          logger.error('Error getting session:', sessionError);
          setIsLoading(false);
          return;
        }
        
        // Set the session state if it exists
        if (currentSession) {
          setSession(currentSession);
          logger.info('User session found', { userId: currentSession.user?.id });
          setUser(currentSession.user);
          
          // Set tokens in token manager and session management service
          if (currentSession.access_token && currentSession.refresh_token) {
            const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now
            
            // Set tokens in token manager
            tokenManager.setTokens(
              currentSession.access_token,
              currentSession.refresh_token,
              expiresAt
            );
            
            // Also set tokens in session management service for consistency
            sessionManagementService.setTokens(
              currentSession.access_token,
              currentSession.refresh_token,
              expiresAt
            );
            
            // Set auth token for API service
            apiService.setAuthToken(currentSession.access_token);
            
            // Validate session with backend
            logger.info('Validating session with backend');
            const validationResult = await validateSession();
            
            if (!validationResult.valid) {
              logger.warn('Session validation failed during initialization', {
                error: validationResult.error
              });
              
              // If validation failed but we have a refresh token, try to refresh
              if (currentSession.refresh_token) {
                logger.info('Attempting to refresh invalid session');
                const refreshResult = await refreshSession();
                
                if (!refreshResult.success) {
                  logger.error('Failed to refresh invalid session', {
                    error: refreshResult.error
                  });
                  // Clear tokens if refresh failed
                  tokenManager.clearTokens();
                  sessionManagementService.clearTokens();
                  setUser(null);
                  setSession(null);
                  setIsLoading(false);
                  return;
                } else {
                  logger.info('Successfully refreshed session during initialization');
                }
              }
            } else {
              logger.info('Session validated successfully');
            }
          }
          
          // Get user profile
          if (currentSession.user) {
            logger.info('Fetching user profile for', currentSession.user.id);
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .single();
            
            if (profileError) {
              console.error('Error fetching user profile:', profileError);
              logger.error('Profile fetch error', profileError);
              
              // If the profile doesn't exist, try to create it
              if (profileError.code === 'PGRST116') { // PostgreSQL error for no rows returned
                logger.info('Profile not found, attempting to create one');
                
                try {
                  const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert({
                      id: currentSession.user.id,
                      email: currentSession.user.email,
                      name: currentSession.user.user_metadata.name ||
                            currentSession.user.user_metadata.full_name ||
                            currentSession.user.email?.split('@')[0] || 'User',
                      subscription_tier: 'free'
                    })
                    .select('*')
                    .single();
                    
                  if (createError) {
                    console.error('Error creating profile:', createError);
                    logger.error('Profile creation error', createError);
                  } else if (newProfile) {
                    setProfile(newProfile);
                    logger.info('New profile created successfully');
                  }
                } catch (err) {
                  console.error('Error in profile creation:', err);
                }
              }
            } else if (profileData) {
              setProfile(profileData);
              logger.info('Profile fetched successfully');
            } else {
              logger.warn('No profile found and no error returned');
            }
          }
        } else {
          logger.info('No active session found');
          
          // Try to refresh the session using stored refresh token
          const refreshToken = tokenManager.getRefreshToken();
          if (refreshToken) {
            try {
              logger.info('Attempting to restore session from refresh token');
              const result = await refreshSession();
              if (result.success) {
                logger.info('Successfully restored session from refresh token');
                
                // Validate the refreshed session
                const validationResult = await validateSession();
                if (!validationResult.valid) {
                  logger.warn('Refreshed session validation failed', {
                    error: validationResult.error
                  });
                  tokenManager.clearTokens();
                }
              } else {
                // Clear tokens if refresh failed
                logger.warn('Failed to restore session from refresh token', {
                  error: result.error
                });
                tokenManager.clearTokens();
              }
            } catch (error) {
              logger.error('Error refreshing session during initialization:', error);
              tokenManager.clearTokens();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logger.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: Session | null) => {
        logger.info('Auth state change', { event, sessionExists: !!currentSession });
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        if (event === 'SIGNED_IN' && currentSession?.user) {
          // Set tokens in token manager
          if (currentSession.access_token && currentSession.refresh_token) {
            const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now
            tokenManager.setTokens(
              currentSession.access_token,
              currentSession.refresh_token,
              expiresAt
            );
            
            // Set auth token for API service
            apiService.setAuthToken(currentSession.access_token);
          }
          
          // Get user profile
          logger.info('User signed in, fetching profile', { userId: currentSession.user.id });
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();
          
          if (profileData) {  
            setProfile(profileData);
             logger.info('Profile loaded after sign-in');
          } else {
            logger.info('No profile found after sign-in, creating one');
            try {
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: currentSession.user.id,
                  email: currentSession.user.email,
                  name: currentSession.user.user_metadata.name || 
                        currentSession.user.user_metadata.full_name || 
                        currentSession.user.email?.split('@')[0] || 'User',
                  subscription_tier: 'free'
                })
                .select('*')
                .single();
                
              if (createError) {
                console.error('Error creating profile after sign-in:', createError);
              } else if (newProfile) {
                logger.info('Profile created after sign-in');
                setProfile(newProfile);
              }
            } catch (err) {
              console.error('Error in profile creation after sign-in:', err);
            }
          }
          
          // Add a longer delay to ensure auth state is fully updated before navigation
          setTimeout(() => {
            logger.info('Navigating to dashboard after successful sign-in');
            navigate('/dashboard');
          }, 500);
        }
        
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          // Clear tokens
          tokenManager.clearTokens();
          // Clear the auth token from the API service
          apiService.clearAuthToken();
          logger.info('User signed out, redirecting to login');
          setTimeout(() => navigate('/login'), 0);
        }
        
        if (event === 'TOKEN_REFRESHED' && currentSession?.user) {
          logger.info('Token refreshed event', { userId: currentSession.user.id });
          
          // Update token manager
          if (currentSession.access_token) {
            const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now
            
            // Keep the existing refresh token if not provided in the event
            const refreshToken = currentSession.refresh_token || tokenManager.getRefreshToken();
            
            if (refreshToken) {
              tokenManager.setTokens(
                currentSession.access_token,
                refreshToken,
                expiresAt
              );
            }
            
            // Update API service token
            apiService.setAuthToken(currentSession.access_token);
          }
        }
        
        if (event === 'USER_UPDATED' && currentSession?.user) {
          logger.info('User updated event', { userId: currentSession.user.id });
          setUser(currentSession.user);
          
          // Update profile if needed
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();
            
          if (profileData) {
            setProfile(profileData);
          }
        }
      }
    );
    
    // Listen for token refresh events
    const handleTokenRefreshNeeded = async () => {
      logger.info('Token refresh needed');
      await refreshSession();
    };
    
    document.addEventListener('auth:token-refresh-needed', handleTokenRefreshNeeded);
    
    // Cleanup subscriptions
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('auth:token-refresh-needed', handleTokenRefreshNeeded);
    };
  }, [navigate]);
  
  // Register new user
  const signUp = async (email: string, password: string, name: string) => {
    const check = checkSupabaseAvailable();
    if (!check.success) {
      logger.error('Supabase not available during signup', { error: check.error });
      return check;
    }
    
    try {
      console.log("Attempting to sign up with email:", email);
      logger.info("Signup attempt", { email });
      
      const { data, error } = await supabase!.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (error) {
        logger.error("Signup error", { error: error.message });
        return { success: false, error: error.message };
      }
      
      if (data?.user) {
        // Manually check if profile was created
        setTimeout(async () => {
          const { data: profileData, error: profileError } = await supabase!
            .from('profiles').select('id').eq('id', data.user!.id).single();
            
          if (profileError || !profileData) {
            logger.warn("Profile wasn't created, attempting to create manually");
            
            // Manually create profile
            const { error: insertError } = await supabase!
              .from('profiles')
              .insert({
                id: data.user!.id,
                email: data.user!.email,
                name,
                subscription_tier: 'free'
              });
              
            if (insertError) {
              logger.error("Failed to manually create profile:", insertError);
            } else {
              logger.info("Successfully created profile manually");
            }
          }
        }, 1000);
      }
      
      // Set tokens in token manager if available
      if (data.session?.access_token && data.session?.refresh_token) {
        const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now
        tokenManager.setTokens(
          data.session.access_token,
          data.session.refresh_token,
          expiresAt
        );
        
        // Set the auth token for API calls
        apiService.setAuthToken(data.session.access_token);
      }
      
      return { success: true, error: null };
    } catch (error) {
      logger.error('Unexpected signup error', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  };
  
  // Sign in with email and password
  const signIn = async (email: string, password: string, rememberMe = false) => {
    logger.info('Sign in attempt', { email });
    const check = checkSupabaseAvailable();
    if (!check.success) {
      logger.error('Supabase not available during signin', { error: check.error });
      return check;
    }
    
    try {
      console.log("Attempting to sign in with email:", email);
      
      // Attempt to sign in
      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password,
        options: {
          // expiresIn is not a valid property for this options object
          // We'll handle token expiration in the token manager
        }
      });
      
      if (error) {
        logger.error("Sign-in error:", error);
        
        // Provide more specific error messages
        if (error.message.includes('fetch')) {
          return { 
            success: false, 
            error: 'Unable to connect to authentication server. Please check your internet connection and Supabase configuration.' 
          };
        }
        
        return { success: false, error: error.message };
      }
      
      // Set tokens in both token management systems
      if (data.session?.access_token && data.session?.refresh_token) {
        const expiresAt = new Date(Date.now() + (rememberMe ? 7 * 24 * 3600 * 1000 : 3600 * 1000));
        
        // Set tokens in token manager
        tokenManager.setTokens(
          data.session.access_token,
          data.session.refresh_token,
          expiresAt
        );
        
        // Also set tokens in session management service for consistency
        sessionManagementService.setTokens(
          data.session.access_token,
          data.session.refresh_token,
          expiresAt
        );
        
        // Set the auth token for API calls
        apiService.setAuthToken(data.session.access_token);
        logger.info('Auth token set for API service');
      }
      
      return { success: true, error: null };
    } catch (error) {
      logger.error("Unexpected sign-in error:", error);
      
      // Handle network errors specifically
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error: Unable to connect to authentication server. Please check if your Supabase URL is correct and accessible.'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  };
  
  // Sign in with OAuth provider
  const signInWithProvider = async (provider: Provider) => {
    try {
      logger.info('Attempting OAuth signin', { provider });
      
      if (!isSupabaseConfigured || !supabase) {
        logger.error('Supabase not configured for OAuth', { provider });
        return { success: false, error: configError || 'Supabase is not configured' };
      }
      
      // Use the callback URL from environment variables if available
      const callbackUrl = import.meta.env.VITE_GITHUB_CALLBACK_URL || `${window.location.origin}/auth/callback`;
      
      // Get additional provider-specific options
      let options: any = {
        redirectTo: callbackUrl
      };
      
      // Add provider-specific configuration
      if (provider === 'github') {
        logger.info('Using GitHub OAuth configuration', {
          callbackUrl,
          origin: window.location.origin,
          protocol: callbackUrl.startsWith('https') ? 'HTTPS' : 'HTTP'
        });
        options = {
          ...options,
          scopes: 'user:email'
        };
      }
      
      logger.info('Using OAuth configuration', {
        provider,
        callbackUrl,
        hasScopes: !!options.scopes,
        scopes: options.scopes || 'none',
        origin: window.location.origin,
        protocol: callbackUrl.startsWith('https') ? 'HTTPS' : 'HTTP'
      });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options
      });
      
      if (error) {
        logger.error(`OAuth sign-in error (${provider}):`, error);
        return { success: false, error: error.message };
      }
      
      logger.info('OAuth sign-in initiated', { provider });
      return { success: true, error: null };
    } catch (error) {
      logger.error(`Unexpected OAuth error (${provider}):`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  };
  
  // Sign out
  const signOut = async () => {
    logger.info('Sign out attempt');
    if (!isSupabaseConfigured || !supabase) {
      // Clear local state even if Supabase is not available
      setUser(null);
      setProfile(null);
      setSession(null);
      tokenManager.clearTokens();
      apiService.clearAuthToken();
      return;
    }

    try {
      // Get current token for session invalidation
      const token = tokenManager.getToken();
      
      // Invalidate session on backend if token exists
      if (token) {
        try {
          await apiService.post('/api/sessions/invalidate', { token });
        } catch (error) {
          logger.error('Error invalidating session on backend:', error);
          // Continue with sign out even if session invalidation fails
        }
      }
      
      await supabase.auth.signOut();
      
      // Clear tokens from all token management systems
      tokenManager.clearTokens();
      sessionManagementService.clearTokens();
      
      // Clear the auth token from the API service
      apiService.clearAuthToken();
      
      // Also clear any tokens from sessionStorage directly as a fallback
      sessionStorage.removeItem('auth_refresh_token');
      sessionStorage.removeItem('auth_token_expiry');
      
      logger.info('User signed out successfully');
    } catch (error) {
      logger.error('Error during sign out:', error);
      throw error;
    }
  };
  
  // Reset password (send reset email)
  const resetPassword = async (email: string) => {
    const check = checkSupabaseAvailable();
    logger.info('Password reset requested', { email });
    if (!check.success) return check;
    
    try {
      const { error } = await supabase!.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        logger.error('Password reset error', { error: error.message });
        return { success: false, error: error.message };
      }
      
      logger.info('Password reset email sent successfully');
      return { success: true, error: null };
    } catch (error) {
      logger.error('Unexpected password reset error', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  };
  
  // Update password
  const updatePassword = async (password: string) => {
    const check = checkSupabaseAvailable();
    logger.info('Password update requested');
    if (!check.success) return check;
    
    try {
      const { error } = await supabase!.auth.updateUser({ password });
      
      if (error) {
        logger.error('Password update error', { error: error.message });
        return { success: false, error: error.message };
      }
      
      logger.info('Password updated successfully');
      
      // Log security event
      try {
        await apiService.post('/api/sessions/security-log', {
          event_type: 'password_change',
          details: {}
        });
      } catch (logError) {
        logger.error('Failed to log password change:', logError);
      }
      
      return { success: true, error: null };
    } catch (error) {
      logger.error('Unexpected password update error', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  };
  
  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    const check = checkSupabaseAvailable();
    logger.info('Profile update requested');
    if (!check.success) return check;
    
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }
    
    try {
      const { error } = await supabase!
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
        
      if (error) {
        logger.error('Profile update error', { error: error.message });
        return { success: false, error: error.message };
      }
      
      // Update local state
      setProfile(current => current ? { ...current, ...updates } : null);
      logger.info('Profile updated successfully');
      
      // Log security event
      try {
        await apiService.post('/api/sessions/security-log', {
          event_type: 'profile_update',
          details: {
            updatedFields: Object.keys(updates)
          }
        });
      } catch (logError) {
        logger.error('Failed to log profile update:', logError);
      }
      
      return { success: true, error: null };
    } catch (error) {
      logger.error('Unexpected profile update error', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  };
  
  // Update email
  const updateEmail = async (email: string) => {
    const check = checkSupabaseAvailable();
    logger.info('Email update requested');
    if (!check.success) return check;
    
    try {
      const { error } = await supabase!.auth.updateUser({ email });
      
      if (error) {
        logger.error('Email update error', { error: error.message });
        return { success: false, error: error.message };
      }
      
      logger.info('Email updated successfully');
      
      // Log security event
      try {
        await apiService.post('/api/sessions/security-log', {
          event_type: 'email_change',
          details: {
            oldEmail: user?.email,
            newEmail: email
          }
        });
      } catch (logError) {
        logger.error('Failed to log email change:', logError);
      }
      
      return { success: true, error: null };
    } catch (error) {
      logger.error('Unexpected email update error', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  };
  
  // Upload avatar
  const uploadAvatar = async (file: File) => {
    const check = checkSupabaseAvailable();
    logger.info('Avatar upload requested');
    if (!check.success) return { success: false, url: null, error: check.error };
    
    if (!user) {
      return { success: false, url: null, error: 'No user logged in' };
    }
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase!.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) {
        logger.error('Avatar upload error', { error: uploadError.message });
        return { success: false, url: null, error: uploadError.message };
      }
      
      const { data: { publicUrl } } = supabase!.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl });
      
      logger.info('Avatar uploaded successfully');
      return { success: true, url: publicUrl, error: null };
    } catch (error) {
      logger.error('Unexpected avatar upload error', { error });
      return {
        success: false,
        url: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  };

  // Get user sessions
  const getUserSessions = async (): Promise<UserSession[]> => {
    logger.info('Fetching user sessions');
    
    try {
      const sessions = await sessionManagementService.getUserSessions();
      return sessions;
    } catch (error) {
      logger.error('Error fetching user sessions', error);
      return [];
    }
  };

  // Revoke a specific session
  const revokeSession = async (sessionId: string): Promise<{ success: boolean; error: string | null }> => {
    logger.info('Revoking session', { sessionId });
    
    try {
      const result = await sessionManagementService.revokeSession(sessionId);
      
      // Log security event
      if (result.success) {
        try {
          await apiService.post('/api/sessions/security-log', {
            event_type: 'session_revoked',
            details: {
              sessionId
            }
          });
        } catch (logError) {
          logger.error('Failed to log session revocation:', logError);
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Error revoking session', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to revoke session'
      };
    }
  };

  // Revoke all sessions except current
  const revokeAllOtherSessions = async (): Promise<{ success: boolean; error: string | null }> => {
    logger.info('Revoking all other sessions');
    
    try {
      const result = await sessionManagementService.revokeAllOtherSessions();
      
      // Log security event
      if (result.success) {
        try {
          await apiService.post('/api/sessions/security-log', {
            event_type: 'all_sessions_revoked',
            details: {
              userId: user?.id
            }
          });
        } catch (logError) {
          logger.error('Failed to log sessions revocation:', logError);
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Error revoking all sessions', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to revoke sessions'
      };
    }
  };

  // Refresh the current session
  const refreshSession = async (): Promise<{ success: boolean; error: string | null }> => {
    logger.info('Refreshing session');
    
    try {
      // FIRST PRIORITY: Check if we have a valid Supabase session in localStorage
      // This is the most reliable source since it's managed by Supabase directly
      try {
        const supabaseSession = localStorage.getItem('supabase.auth.token');
        if (supabaseSession) {
          const parsedSession = JSON.parse(supabaseSession);
          
          if (parsedSession?.currentSession?.access_token) {
            // Check if the token is expired
            const isExpired = parsedSession.currentSession.expires_at &&
              new Date(parsedSession.currentSession.expires_at * 1000) <= new Date();
            
            if (!isExpired) {
              logger.info('Using valid Supabase session directly from localStorage');
              
              // Calculate expiry time
              const expiresAt = parsedSession?.currentSession?.expires_at
                ? new Date(parsedSession.currentSession.expires_at * 1000)
                : new Date(Date.now() + 3600 * 1000); // Default to 1 hour if no expiry
              
              // Get refresh token if available
              const refreshToken = parsedSession?.currentSession?.refresh_token ||
                                  tokenManager.getRefreshToken();
              
              if (refreshToken) {
                // Update token manager
                tokenManager.setTokens(
                  parsedSession.currentSession.access_token,
                  refreshToken,
                  expiresAt
                );
                
                // Update session management service
                sessionManagementService.setTokens(
                  parsedSession.currentSession.access_token,
                  refreshToken,
                  expiresAt
                );
              }
              
              // Update API service token
              apiService.setAuthToken(parsedSession.currentSession.access_token);
              
              // Update session state if available
              if (parsedSession.currentSession.user) {
                setSession(parsedSession.currentSession);
                setUser(parsedSession.currentSession.user);
              }
              
              // Emit event to notify that token has been refreshed
              const event = new CustomEvent('auth:token-refreshed');
              document.dispatchEvent(event);
              logger.debug('auth:token-refreshed event dispatched from localStorage session');
              
              return { success: true, error: null };
            } else {
              logger.info('Supabase session found but expired, will attempt refresh');
            }
          }
        }
      } catch (localStorageError) {
        logger.error('Error accessing Supabase session from localStorage', localStorageError);
        // Continue to other refresh methods
      }
      
      // SECOND PRIORITY: Try to refresh using Supabase's built-in refresh method
      if (supabase && isSupabaseConfigured) {
        try {
          logger.info('Attempting to refresh session with Supabase');
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error) {
            logger.warn('Supabase session refresh failed, will try other methods', { error: error.message });
          } else if (data.session) {
            logger.info('Supabase session refreshed successfully');
            
            // Update our session state
            setSession(data.session);
            setUser(data.session.user);
            
            // Update tokens in both token managers
            if (data.session.access_token && data.session.refresh_token) {
              const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now
              
              // Update token manager
              tokenManager.setTokens(
                data.session.access_token,
                data.session.refresh_token,
                expiresAt
              );
              
              // Update session management service
              sessionManagementService.setTokens(
                data.session.access_token,
                data.session.refresh_token,
                expiresAt
              );
              
              // Update API service token
              apiService.setAuthToken(data.session.access_token);
              
              // Emit event to notify that token has been refreshed
              const event = new CustomEvent('auth:token-refreshed');
              document.dispatchEvent(event);
              logger.debug('auth:token-refreshed event dispatched');
              
              return { success: true, error: null };
            }
          }
        } catch (supabaseError) {
          logger.error('Error during Supabase refresh', supabaseError);
          // Continue to other refresh methods
        }
      }
      
      // THIRD PRIORITY: Try to get the current session from Supabase
      if (supabase && isSupabaseConfigured) {
        try {
          logger.info('Attempting to get current session from Supabase');
          const { data } = await supabase.auth.getSession();
          
          if (data.session?.access_token) {
            logger.info('Successfully retrieved current Supabase session');
            
            // Update our session state
            setSession(data.session);
            setUser(data.session.user);
            
            // Update tokens in both token managers
            if (data.session.access_token) {
              const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now
              const refreshToken = data.session.refresh_token || tokenManager.getRefreshToken();
              
              if (refreshToken) {
                // Update token manager
                tokenManager.setTokens(
                  data.session.access_token,
                  refreshToken,
                  expiresAt
                );
                
                // Update session management service
                sessionManagementService.setTokens(
                  data.session.access_token,
                  refreshToken,
                  expiresAt
                );
              }
              
              // Update API service token
              apiService.setAuthToken(data.session.access_token);
              
              // Emit event to notify that token has been refreshed
              const event = new CustomEvent('auth:token-refreshed');
              document.dispatchEvent(event);
              logger.debug('auth:token-refreshed event dispatched from getSession');
              
              return { success: true, error: null };
            }
          }
        } catch (getSessionError) {
          logger.error('Error getting current Supabase session', getSessionError);
          // Continue to session management service
        }
      }
      
      // FOURTH PRIORITY: Fall back to session management service
      try {
        logger.info('Attempting to refresh session via session management service');
        const result = await sessionManagementService.refreshSession();
        
        if (result.success) {
          logger.info('Session refreshed successfully via session management service');
          
          // Update API service token
          const token = sessionManagementService.getToken();
          if (token) {
            apiService.setAuthToken(token);
            
            // Also update token manager to keep them in sync
            const refreshToken = sessionManagementService.getRefreshToken();
            const expiresAt = new Date(Date.now() + 3600 * 1000); // Default to 1 hour if we don't know
            
            if (token && refreshToken) {
              tokenManager.setTokens(token, refreshToken, expiresAt);
            }
          }
          
          // Emit event to notify that token has been refreshed
          const event = new CustomEvent('auth:token-refreshed');
          document.dispatchEvent(event);
          logger.debug('auth:token-refreshed event dispatched');
          
          return { success: true, error: null };
        } else {
          // If API refresh failed with a network error, try to use Supabase session one more time
          if (result.error?.includes('fetch') || result.error?.includes('network') ||
              result.error?.includes('CORS')) {
            
            logger.warn('API refresh failed with network error, trying Supabase session one more time');
            
            // Try to get the session from localStorage again as a last resort
            try {
              const supabaseSession = localStorage.getItem('supabase.auth.token');
              if (supabaseSession) {
                const parsedSession = JSON.parse(supabaseSession);
                
                if (parsedSession?.currentSession?.access_token) {
                  logger.info('Using Supabase session as final fallback');
                  
                  // Update API service token
                  apiService.setAuthToken(parsedSession.currentSession.access_token);
                  
                  // Emit event to notify that token has been refreshed
                  const event = new CustomEvent('auth:token-refreshed');
                  document.dispatchEvent(event);
                  logger.debug('auth:token-refreshed event dispatched from final fallback');
                  
                  return { success: true, error: null };
                }
              }
            } catch (finalError) {
              logger.error('Error in final Supabase session fallback', finalError);
            }
          }
          
          logger.error('Failed to refresh session', { error: result.error });
          return result;
        }
      } catch (sessionServiceError) {
        logger.error('Error during session service refresh', sessionServiceError);
        
        // Final attempt to use Supabase session
        try {
          const supabaseSession = localStorage.getItem('supabase.auth.token');
          if (supabaseSession) {
            const parsedSession = JSON.parse(supabaseSession);
            
            if (parsedSession?.currentSession?.access_token) {
              logger.info('Using Supabase session after all refresh methods failed');
              
              // Update API service token
              apiService.setAuthToken(parsedSession.currentSession.access_token);
              
              // Emit event to notify that token has been refreshed
              const event = new CustomEvent('auth:token-refreshed');
              document.dispatchEvent(event);
              
              return { success: true, error: null };
            }
          }
        } catch (finalError) {
          logger.error('Error in emergency Supabase session fallback', finalError);
        }
        
        // If all refresh attempts fail, return error
        return {
          success: false,
          error: sessionServiceError instanceof Error ? sessionServiceError.message : 'Failed to refresh session'
        };
      }
    } catch (error) {
      logger.error('Error refreshing session', error);
      
      // Last-ditch effort to use Supabase session
      try {
        const supabaseSession = localStorage.getItem('supabase.auth.token');
        if (supabaseSession) {
          const parsedSession = JSON.parse(supabaseSession);
          
          if (parsedSession?.currentSession?.access_token) {
            logger.info('Using Supabase session after catastrophic error');
            
            // Update API service token
            apiService.setAuthToken(parsedSession.currentSession.access_token);
            
            return { success: true, error: null };
          }
        }
      } catch (finalError) {
        logger.error('Error in last-resort Supabase session fallback', finalError);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh session'
      };
    }
  };

  // Validate current session
  const validateSession = async (): Promise<{ valid: boolean; error: string | null }> => {
    logger.info('Validating session');
    
    try {
      const result = await sessionManagementService.validateSession();
      
      if (!result.valid) {
        logger.warn('Session validation failed', { error: result.error });
      }
      
      return result;
    } catch (error) {
      logger.error('Error validating session', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Failed to validate session'
      };
    }
  };
  
  // Provide the auth context to children
  return (
    <EnhancedAuthContext.Provider
      value={{
        user,
        profile,
        session,
        supabase,
        isLoading,
        isAuthenticated: !!user,
        isSupabaseConfigured,
        configError,
        signUp,
        signIn,
        signInWithProvider,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        updateEmail,
        uploadAvatar,
        getUserSessions,
        revokeSession,
        revokeAllOtherSessions,
        refreshSession,
        validateSession
      }}
    >
      {children}
    </EnhancedAuthContext.Provider>
  );
};
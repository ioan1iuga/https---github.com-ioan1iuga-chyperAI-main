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

// Define specific error types for better handling
export interface SupabaseLoginError extends Error {
  name: string;
  message: string;
  status: number;
  code: string;
}

interface AuthContextType {
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
  signInWithProvider: (provider: Provider) => Promise<void>;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create Supabase client with proper error handling
let supabase: SupabaseClient | null = null;
let isSupabaseConfigured = false;
let configError: string | null = null;

// Debug logging function that we can control with an environment variable
const debugLog = (message: string, ...args: any[]) => {
  if (import.meta.env.VITE_DEBUG_AUTH === 'true' || import.meta.env.VITE_DEBUG === 'true') {
    console.log(`[AuthContext] ${message}`, ...args);
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
    configError = `Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file with your actual Supabase project credentials.
    
Debug Info:
- VITE_SUPABASE_URL: ${supabaseUrl || 'NOT_SET'}
- VITE_SUPABASE_ANON_KEY length: ${supabaseAnonKey?.length || 0}
- Available VITE_ env vars: ${Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')).join(', ')}

Common solutions:
1. Restart your development server (npm run dev or yarn dev)
2. Ensure your .env file is in the project root directory
3. Check that environment variables don't have spaces around the = sign
4. Verify your .env file is not in .gitignore`;
    console.error(configError);
    console.error('Environment debugging info:', {
      supabaseUrl,
      supabaseAnonKeyLength: supabaseAnonKey?.length,
      allEnvVars: import.meta.env
    });
    isSupabaseConfigured = false;
  } else {
    try {
      supabase = createClient(supabaseUrl, supabaseAnonKey);
      isSupabaseConfigured = true;
      debugLog('Supabase client initialized successfully');
    } catch (error) {
      configError = `Failed to initialize Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(configError);
      console.error('Supabase initialization error details:', error);
      isSupabaseConfigured = false;
    }
  }
} catch (error) {
  configError = `Supabase configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  console.error(configError);
  console.error('Supabase configuration error details:', error);
  isSupabaseConfigured = false;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
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
          
          navigate('/dashboard');
        }
        
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          logger.info('User signed out, redirecting to login');
          setTimeout(() => navigate('/login'), 0);
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
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);
  
  // Helper function to check if Supabase is available
  const checkSupabaseAvailable = () => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: configError || 'Supabase is not configured' };
    }
    return { success: true, error: null };
  };
  
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
      
      // Try to set the auth token for API calls
      if (data.session?.access_token) {
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
          expiresIn: rememberMe ? 604800 : 3600
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
      
      // Set the auth token for API calls
      if (data.session?.access_token) {
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
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
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
      return;
    }

    try {
      await supabase.auth.signOut();
      
      // Clear the auth token from the API service
      apiService.clearAuthToken();
      
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
  
  // Check authentication status
  const checkAuthStatus = async (): Promise<any> => {
    logger.info('Checking auth status');
    const check = checkSupabaseAvailable();
    if (!check.success) {
      return { 
        success: false, 
        error: check.error,
        status: 'supabase_unconfigured' 
      };
    }
    
    try {
      const { data, error } = await supabase!.auth.getSession();
      
      if (error) {
        logger.error('Auth status check error', { error: error.message });
        return { 
          success: false, 
          error: error.message,
          status: 'auth_error' 
        };
      }
      
      if (!data.session) {
        logger.info('No active session found');
        return { 
          success: false, 
          error: 'No active session',
          status: 'no_session' 
        };
      }
      
      return {
        success: true,
        status: 'authenticated',
        session: data.session
      };
    } catch (error) {
      logger.error('Unexpected auth status check error', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'unexpected_error'
      };
    }
  };
  
  const contextValue: AuthContextType = {
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
    checkAuthStatus
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
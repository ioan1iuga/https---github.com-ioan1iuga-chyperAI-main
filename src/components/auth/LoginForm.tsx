import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Eye, EyeOff, AlertCircle, Loader, Github as GitHub, Mail, ExternalLink } from 'lucide-react';
import { useEnhancedAuth, SupabaseLoginError } from '../../contexts/EnhancedAuthContext';
import { logger } from '../../utils/errorHandling';
import { useTheme } from '../../contexts/ThemeContext';

interface LoginFormInputs {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginFormProps {
  redirectPath?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  redirectPath = '/dashboard'
}) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { signIn, signInWithProvider, isSupabaseConfigured, configError } = useEnhancedAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid } 
  } = useForm<LoginFormInputs>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  // Check Supabase configuration on component mount
  React.useEffect(() => {
    logger.info('Checking Supabase configuration in login form');
    
    // Debug environment variables
    console.log('Environment variables in LoginForm:', {
      hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasSupabaseAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'NOT_SET',
      nodeEnv: import.meta.env.MODE
    });
    
    if (!isSupabaseConfigured && configError) {
      logger.error('Supabase configuration error in login form', { error: configError });
      setFormError(configError);
    }
  }, [isSupabaseConfigured, configError]);

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    // Check if Supabase is configured before attempting login
    if (!isSupabaseConfigured) {
      logger.error('Login attempt with unconfigured Supabase');
      setFormError('Supabase is not properly configured. Please check your environment variables.');
      return;
    }
    
    setIsLoading(true);
    setFormError(null);

    try {  
      const { success, error } = await signIn(
        data.email, 
        data.password,
        data.rememberMe
      );
      
      if (!success) {
        logger.error('Login failed', { errorMessage: error });
        // Handle specific error types with more helpful messages
        if (error?.includes('Network error') || error?.includes('Unable to connect')) {
          setFormError('Connection to Supabase failed. Please check:\n\n• Your internet connection\n• Supabase configuration in .env file\n• Ensure you\'ve set up Supabase correctly');
          setTimeout(() => {
            navigate('/error/supabase', { replace: true });
          }, 3000);
        } else if (error?.includes('Email not confirmed')) {
          setFormError(error);
        } else if (error?.includes('Invalid login credentials')) {
          setFormError('Invalid email or password. Please try again.');
        } else {
          logger.error('Unknown login error', { error });
          setFormError(error || 'Invalid email or password');
        }
      }
    } catch (error) {
      console.error('Login form error:', error);
      setFormError(
        error instanceof Error 
          ? `Error: ${error.message}` 
          : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'github') => {
    try {
      logger.info('Attempting social login', {
        provider,
        callbackUrl: import.meta.env.VITE_GITHUB_CALLBACK_URL || `${window.location.origin}/auth/callback`,
        origin: window.location.origin
      });
      
      // Check if Supabase is configured before attempting OAuth
      if (!isSupabaseConfigured) {
        logger.error('Social login attempt with unconfigured Supabase');
        setFormError('Supabase is not properly configured. Please check your environment variables.');
        return;
      }
      
      setSocialLoading(provider);
      
      const result = await signInWithProvider(provider);
      
      logger.info('Social login initiated', {
        success: result.success,
        provider,
        callbackUrl: import.meta.env.VITE_GITHUB_CALLBACK_URL || `${window.location.origin}/auth/callback`
      });
      
      if (!result.success) {
        logger.error(`Social login error`, {
          error: result.error,
          provider,
          callbackUrl: import.meta.env.VITE_GITHUB_CALLBACK_URL || `${window.location.origin}/auth/callback`
        });
        setFormError(result.error || 'Failed to sign in with social provider');
        setSocialLoading(null);
      } else {
        // For OAuth, we don't need to redirect here since the OAuth flow will handle the redirect
        logger.info('Social login flow started successfully', {
          provider,
          redirecting: true
        });
        // No need to clear social loading as we'll be redirecting away
      }
    } catch (error) {
      logger.error(`Social login error`, { error });
      setFormError(
        error instanceof Error 
          ? `Social login error: ${error.message}` 
          : 'Failed to sign in with social provider'
      );
      setSocialLoading(null);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className={`rounded-lg ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } p-6 shadow-lg border auth-form ${
        isDark ? 'dark' : 'light'
      }`}>
        <h2 className={`text-lg font-semibold mb-1 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>Sign in to your account</h2>
        <p className={`text-xs mb-6 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Welcome back to ChyperAI
        </p>
        
        {formError && (
          <div className={`p-3 mb-4 rounded-md ${
            isDark 
              ? 'bg-red-900/20 border border-red-900/30 text-red-500' 
              : 'bg-red-50 border border-red-200 text-red-800'
          } text-xs flex items-start gap-2`}>
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="whitespace-pre-line">{formError}</span>
                {(formError?.includes('Connection') || formError?.includes('Supabase')) && (
                  <div className="mt-2">
                    <Link 
                      to="/error/supabase" 
                      className="inline-flex items-center text-blue-500 hover:underline"
                    >
                      View setup guide <ExternalLink className="ml-1" size={12} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-4 flex flex-col gap-2">
          <button
            type="button" 
            onClick={() => handleSocialLogin('github')}
            disabled={!!socialLoading || isLoading}
            className={`w-full py-2 px-4 flex items-center justify-center gap-2 rounded-md text-sm font-medium ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-white disabled:bg-gray-800 disabled:text-gray-500'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            } transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed ${
              socialLoading === 'github' || isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {socialLoading === 'github' ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <GitHub size={16} />
            )}
            <span>Sign in with GitHub</span>
          </button>
        </div>

        <div className="flex items-center my-4">
          <div className={`flex-grow h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
          <span className={`px-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            or continue with email
          </span>
          <div className={`flex-grow h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email */}
          <div className="mb-4">
            <label 
              htmlFor="email" 
              className={`block text-xs font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
              </div>
              <input
                type="email"
                id="email"
                autoComplete="username"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Please enter a valid email address'
                  }
                })}
                className={`w-full pl-10 pr-3 py-2 rounded border transition-colors text-sm ${
                  errors.email 
                    ? isDark 
                      ? 'border-red-500 bg-red-900/10' 
                      : 'border-red-500 bg-red-50'
                    : isDark 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                } focus:outline-none focus:ring-1 ${
                  errors.email
                    ? 'focus:ring-red-500'
                    : 'focus:ring-blue-500 focus:border-blue-500'
                }`}
                disabled={isLoading}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>
          
          {/* Password */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <label 
                htmlFor="password" 
                className={`block text-xs font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Password
              </label>
              <Link 
                to="/forgot-password"
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                {...register('password', { 
                  required: 'Password is required'
                })}
                className={`w-full px-3 py-2 rounded border transition-colors text-sm ${
                  errors.password 
                    ? isDark 
                      ? 'border-red-500 bg-red-900/20' 
                      : 'border-red-500 bg-red-50'
                    : isDark 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                } focus:outline-none focus:ring-1 ${
                  errors.password
                    ? 'focus:ring-red-500'
                    : 'focus:ring-blue-500 focus:border-blue-500'
                }`}
                disabled={isLoading}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>
          
          {/* Remember Me */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer" htmlFor="rememberMe">
              <input
                type="checkbox"
                id="rememberMe"
                {...register('rememberMe')}
                className={`h-4 w-4 rounded ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-blue-500' 
                    : 'bg-gray-100 border-gray-300 text-blue-600'
                } focus:ring-blue-500`}
                disabled={isLoading}
              />
              <span className={`text-xs ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Keep me signed in for 30 days
              </span>
            </label>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isValid}
            className={`auth-button auth-button-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
              isLoading || !isValid ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader size={16} className="animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <div className={`mt-6 text-center text-xs ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-500 hover:underline font-medium">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};
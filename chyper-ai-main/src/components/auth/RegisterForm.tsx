import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Check, Loader, ExternalLink } from 'lucide-react'; 
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/errorHandling';
import { useTheme } from '../../contexts/ThemeContext';
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';

interface RegisterFormInputs {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

interface RegisterFormProps {
  redirectPath?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  redirectPath = '/dashboard'
}) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { signUp } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors, dirtyFields, isValid } 
  } = useForm<RegisterFormInputs>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false
    }
  });

  // Password validation rules
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const passwordRules = [
    { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { id: 'lowercase', label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { id: 'uppercase', label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { id: 'number', label: 'Contains number', test: (p: string) => /\d/.test(p) },
    { id: 'special', label: 'Contains special character', test: (p: string) => /[@$!%*?&]/.test(p) },
  ];
  
  const currentPassword = watch('password');

  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    setIsLoading(true);
    setFormError(null);
    logger.info('Registration form submitted');
    setFormSuccess(null);
    
    if (data.password !== data.confirmPassword) {
      logger.warn('Password mismatch during registration');
      setFormError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    try {
      const { success, error } = await signUp(data.email, data.password, data.name);
      
      if (!success) {
        logger.error('Registration failed', { error });
        setFormError(error || 'Registration failed. Please try again.');
        console.error('Registration failed:', error);

        // Special handling for database errors
        if (error?.toLowerCase().includes('database') || 
            error?.toLowerCase().includes('profile') || 
            error?.toLowerCase().includes('invalid') || 
            error?.toLowerCase().includes('fetch')) {
          logger.error('Database or connection error during registration');
          setFormError('Connection issue or database problem. Please check your Supabase configuration.');
          setTimeout(() => {
            navigate('/error/supabase', { replace: true });
          }, 3000);
        } else if (error?.toLowerCase().includes('password')) {
          logger.warn('Password requirements not met during registration');
          setFormError('Password does not meet requirements. Please make sure it\'s at least 6 characters long.');
        } else {
          setFormError(error || 'Registration failed. Please try again.');
        }
      } else {
        logger.info('Registration successful');
        setFormSuccess('Registration successful! You can now sign in.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      logger.error('Unexpected registration error', { error });
      setFormError(
        error instanceof Error 
          ? `Registration error: ${error.message}` 
          : 'An unexpected error occurred. Please try again.'
      );
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className={`rounded-lg ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } p-6 shadow-sm border ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <h2 className={`text-lg font-semibold mb-1 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>Create an account</h2>
        <p className={`text-xs mb-6 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Start building amazing projects with ChyperAI
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
                {(formError?.includes('Connection') || formError?.includes('Supabase') || formError?.includes('database')) && (
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
        
        {formSuccess && (
          <div className={`p-3 mb-4 rounded-md ${
            isDark 
              ? 'bg-green-900/20 border border-green-900/30 text-green-500' 
              : 'bg-green-50 border border-green-200 text-green-800'
          } text-xs flex items-start gap-2`}>
            <Check size={16} className="shrink-0 mt-0.5" />
            <span>{formSuccess}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Full Name */}
          <div className="mb-4">
            <label 
              htmlFor="name" 
              className={`block text-xs font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              placeholder="John Smith"
              autoComplete="name"
              {...register('name', { 
                required: 'Full name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters'
                }
              })}
              className={`w-full px-3 py-2 rounded border transition-colors text-sm ${
                errors.name 
                  ? isDark 
                    ? 'border-red-500 bg-red-900/10' 
                    : 'border-red-500 bg-red-50'
                  : isDark 
                    ? 'border-gray-700 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
              } focus:outline-none focus:ring-1 ${
                errors.name
                  ? 'focus:ring-red-500'
                  : 'focus:ring-blue-500 focus:border-blue-500'
              }`}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>
          
          {/* Email */}
          <div className="mb-4">
            <label 
              htmlFor="email" 
              className={`block text-xs font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: 'Please enter a valid email address'
                }
              })}
              className={`w-full px-3 py-2 rounded border transition-colors text-sm ${
                errors.email 
                  ? isDark 
                    ? 'border-red-500 bg-red-900/10' 
                    : 'border-red-500 bg-red-50'
                  : isDark 
                    ? 'border-gray-700 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
              } focus:outline-none focus:ring-1 ${
                errors.email
                  ? 'focus:ring-red-500'
                  : 'focus:ring-blue-500 focus:border-blue-500'
              }`}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>
          
          {/* Password */}
          <div className="mb-4">
            <label 
              htmlFor="password" 
              className={`block text-xs font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                {...register('password', { 
                  required: 'Password is required',
                  pattern: {
                    value: passwordPattern,
                    message: 'Password must meet all requirements'
                  }
                })}
                className={`w-full px-3 py-2 rounded border transition-colors text-sm ${
                  errors.password 
                    ? isDark 
                      ? 'border-red-500 bg-red-900/10' 
                      : 'border-red-500 bg-red-50'
                    : isDark 
                      ? 'border-gray-700 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                } focus:outline-none focus:ring-1 ${
                  errors.password
                    ? 'focus:ring-red-500'
                    : 'focus:ring-blue-500 focus:border-blue-500'
                }`}
                disabled={isLoading}
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
            
            {/* Password strength meter */}
            {dirtyFields.password && (
              <div className="mt-2 space-y-1">
                {passwordRules.map(rule => {
                  const passed = rule.test(currentPassword);
                  return (
                    <div key={rule.id} className="flex items-center gap-2">
                      {passed ? (
                        <Check size={12} className="text-green-500" />
                      ) : (
                        <AlertCircle size={12} className="text-gray-400" />
                      )}
                      <span className={`text-xs ${
                        passed
                          ? isDark ? 'text-green-500' : 'text-green-700'
                          : isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>
          
          {/* Confirm Password */}
          <div className="mb-6">
            <label 
              htmlFor="confirmPassword" 
              className={`block text-xs font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => 
                    value === watch('password') || 'Passwords do not match'
                })}
                className={`w-full px-3 py-2 rounded border transition-colors text-sm ${
                  errors.confirmPassword 
                    ? isDark 
                      ? 'border-red-500 bg-red-900/10' 
                      : 'border-red-500 bg-red-50'
                    : isDark 
                      ? 'border-gray-700 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                } focus:outline-none focus:ring-1 ${
                  errors.confirmPassword
                    ? 'focus:ring-red-500'
                    : 'focus:ring-blue-500 focus:border-blue-500'
                }`}
                disabled={isLoading}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>
          
          {/* Terms and Conditions */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('agreeTerms', { 
                  required: 'You must agree to the terms and conditions'
                })}
                className={`mt-0.5 h-4 w-4 rounded ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-blue-500' 
                    : 'bg-gray-100 border-gray-300 text-blue-600'
                } focus:ring-blue-500`}
                disabled={isLoading}
              />
              <span className={`text-xs ${
                errors.agreeTerms
                  ? 'text-red-500'
                  : isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                I agree to the <a href="#" className="text-blue-500 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-500 hover:underline">Privacy Policy</a>
              </span>
            </label>
            {errors.agreeTerms && (
              <p className="mt-1 text-xs text-red-500 ml-7">{errors.agreeTerms.message}</p>
            )}
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isValid}
            className={`w-full py-2.5 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors text-sm font-medium ${
              isLoading || !isValid ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader size={16} className="animate-spin" />
                <span>Creating Account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
        
        <div className={`mt-6 text-center text-xs ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Already have an account?{' '}
          <Link to="/login" className="text-blue-500 hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
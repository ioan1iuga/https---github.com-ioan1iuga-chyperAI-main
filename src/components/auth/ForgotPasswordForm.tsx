import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { AlertCircle, Check, Loader, Mail, ArrowLeft } from 'lucide-react';
import { useEnhancedAuth } from '../../contexts/EnhancedAuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface ForgotPasswordFormInputs {
  email: string;
}

export const ForgotPasswordForm: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { resetPassword } = useEnhancedAuth();
  
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    register, 
    handleSubmit,
    formState: { errors, isValid } 
  } = useForm<ForgotPasswordFormInputs>({
    mode: 'onChange',
    defaultValues: {
      email: ''
    }
  });

  const onSubmit: SubmitHandler<ForgotPasswordFormInputs> = async (data) => {
    setIsLoading(true);
    setFormError(null);
    setFormSuccess(null);
    
    try {
      const { success, error } = await resetPassword(data.email);
      
      if (!success) {
        setFormError(error || 'Failed to send password reset email. Please try again.');
      } else {
        setFormSuccess('Password reset email sent! Check your inbox for instructions.');
      }
    } catch (error) {
      setFormError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', error);
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
        <Link to="/login" className={`flex items-center gap-1 text-xs mb-4 ${
          isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
        }`}>
          <ArrowLeft size={14} />
          <span>Back to login</span>
        </Link>
        
        <h2 className={`text-lg font-semibold mb-1 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>Reset your password</h2>
        <p className={`text-xs mb-6 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          We'll send you an email with a link to reset your password
        </p>
        
        {formError && (
          <div className={`p-3 mb-4 rounded-md ${
            isDark 
              ? 'bg-red-900/20 border border-red-900/30 text-red-500' 
              : 'bg-red-50 border border-red-200 text-red-800'
          } text-xs flex items-start gap-2`}>
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{formError}</span>
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
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
              </div>
              <input
                type="email"
                id="email"
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
                      ? 'border-gray-700 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                } focus:outline-none focus:ring-1 ${
                  errors.email
                    ? 'focus:ring-red-500'
                    : 'focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
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
                <span>Sending...</span>
              </div>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
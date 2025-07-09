import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Eye, EyeOff, AlertCircle, Check, Loader, ArrowLeft } from 'lucide-react';
import { useEnhancedAuth } from '../../contexts/EnhancedAuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface ResetPasswordFormInputs {
  password: string;
  confirmPassword: string;
}

export const ResetPasswordForm: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { updatePassword } = useEnhancedAuth();
  const navigate = useNavigate();
  
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
  } = useForm<ResetPasswordFormInputs>({
    mode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: ''
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

  const onSubmit: SubmitHandler<ResetPasswordFormInputs> = async (data) => {
    setIsLoading(true);
    setFormError(null);
    setFormSuccess(null);
    
    if (data.password !== data.confirmPassword) {
      setFormError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    try {
      const { success, error } = await updatePassword(data.password);
      
      if (!success) {
        setFormError(error || 'Failed to reset password. Please try again.');
      } else {
        setFormSuccess('Password has been reset successfully!');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
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
        }`}>Create new password</h2>
        <p className={`text-xs mb-6 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Your new password must be different from previously used passwords
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
          {/* Password */}
          <div className="mb-4">
            <label 
              htmlFor="password" 
              className={`block text-xs font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
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
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
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
                <span>Setting Password...</span>
              </div>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
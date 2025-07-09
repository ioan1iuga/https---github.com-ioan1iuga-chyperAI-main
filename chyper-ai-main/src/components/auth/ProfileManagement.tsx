import React, { useState, useRef, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Camera, Upload, Check, AlertCircle, Loader, Save, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { UserProfile } from '../../contexts/AuthContext';

interface ProfileFormInputs {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  avatar?: FileList;
}

export const ProfileManagement: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { profile, updateProfile, updateEmail, updatePassword, uploadAvatar } = useAuth();
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordUpdate, setIsPasswordUpdate] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    register, 
    handleSubmit, 
    watch,
    reset,
    setValue,
    formState: { errors, dirtyFields, isValid, isDirty } 
  } = useForm<ProfileFormInputs>({
    mode: 'onChange'
  });

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        email: profile.email || ''
      });
    }
  }, [profile, reset]);

  // Password validation rules
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const passwordRules = [
    { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { id: 'lowercase', label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { id: 'uppercase', label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { id: 'number', label: 'Contains number', test: (p: string) => /\d/.test(p) },
    { id: 'special', label: 'Contains special character', test: (p: string) => /[@$!%*?&]/.test(p) },
  ];
  
  const currentPassword = watch('currentPassword');
  const newPassword = watch('newPassword');
  const avatarFile = watch('avatar');

  // Handle avatar file selection
  useEffect(() => {
    if (avatarFile && avatarFile[0]) {
      const file = avatarFile[0];
      
      // Validate file size and type
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setFormError('Avatar image must be less than 5MB');
        return;
      }
      
      if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
        setFormError('File must be an image (JPEG, PNG, GIF)');
        return;
      }
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewAvatar(url);
      
      // Clean up URL on unmount
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [avatarFile]);
  
  // Handle avatar upload click
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const onSubmit: SubmitHandler<ProfileFormInputs> = async (data) => {
    setIsLoading(true);
    setFormError(null);
    setFormSuccess(null);
    
    try {
      // Handle profile update (name)
      if (dirtyFields.name && profile) {
        const { success, error } = await updateProfile({ name: data.name });
        
        if (!success) {
          setFormError(`Failed to update profile: ${error}`);
          setIsLoading(false);
          return;
        }
      }
      
      // Handle email update
      if (dirtyFields.email && data.email !== profile?.email) {
        const { success, error } = await updateEmail(data.email);
        
        if (!success) {
          setFormError(`Failed to update email: ${error}`);
          setIsLoading(false);
          return;
        }
      }
      
      // Handle password update
      if (isPasswordUpdate && data.currentPassword && data.newPassword) {
        if (data.newPassword !== data.confirmPassword) {
          setFormError('New passwords do not match');
          setIsLoading(false);
          return;
        }
        
        const { success, error } = await updatePassword(data.newPassword);
        
        if (!success) {
          setFormError(`Failed to update password: ${error}`);
          setIsLoading(false);
          return;
        }
        
        // Reset password fields
        setValue('currentPassword', '');
        setValue('newPassword', '');
        setValue('confirmPassword', '');
        setIsPasswordUpdate(false);
      }
      
      // Handle avatar upload
      if (avatarFile && avatarFile[0]) {
        const { success, error, url } = await uploadAvatar(avatarFile[0]);
        
        if (!success || !url) {
          setFormError(`Failed to upload avatar: ${error}`);
          setIsLoading(false);
          return;
        }
        
        // Reset avatar field
        setValue('avatar', undefined);
        setPreviewAvatar(null);
      }
      
      setFormSuccess('Profile updated successfully');
      setIsLoading(false);
    } catch (error) {
      setFormError('An unexpected error occurred. Please try again.');
      console.error('Profile update error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className={`rounded-lg ${
      isDark ? 'bg-gray-800' : 'bg-white'
    } p-6 shadow-sm border ${
      isDark ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <h2 className={`text-lg font-semibold mb-6 ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>Account Settings</h2>
      
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
        {/* Avatar */}
        <div className="mb-6">
          <label 
            className={`block text-xs font-medium mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Profile Photo
          </label>
          
          <div className="flex items-center gap-4">
            <div 
              className={`relative w-20 h-20 rounded-full overflow-hidden cursor-pointer border-2 ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              } flex items-center justify-center group`}
              onClick={handleAvatarClick}
            >
              {previewAvatar || profile?.avatar_url ? (
                <img 
                  src={previewAvatar || profile?.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className={`text-2xl font-bold ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {profile?.name?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
              
              <div className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity`}>
                <Camera size={20} className="text-white" />
              </div>
            </div>
            
            <div>
              <button
                type="button"
                onClick={handleAvatarClick}
                className={`px-3 py-1.5 rounded text-xs font-medium ${
                  isDark 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                } transition-colors flex items-center gap-1`}
              >
                <Upload size={14} />
                <span>Change Photo</span>
              </button>
              <p className={`mt-1 text-xs ${
                isDark ? 'text-gray-500' : 'text-gray-500'
              }`}>
                JPG, GIF or PNG. Max size 5MB.
              </p>
            </div>
            
            <input
              type="file"
              id="avatar"
              accept="image/jpeg, image/png, image/gif"
              className="hidden"
              ref={fileInputRef}
              {...register('avatar')}
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Name */}
          <div>
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
          <div>
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
            <p className={`mt-1 text-xs ${
              isDark ? 'text-gray-500' : 'text-gray-500'
            }`}>
              We'll send a verification email if you change this
            </p>
          </div>
        </div>
        
        {/* Password Change Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Password
            </h3>
            
            {!isPasswordUpdate && (
              <button
                type="button"
                onClick={() => setIsPasswordUpdate(true)}
                className="px-3 py-1 text-xs font-medium text-blue-500 hover:text-blue-600"
              >
                Change Password
              </button>
            )}
          </div>
          
          {!isPasswordUpdate ? (
            <p className={`text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              ••••••••
            </p>
          ) : (
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label 
                  htmlFor="currentPassword" 
                  className={`block text-xs font-medium mb-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="currentPassword"
                    {...register('currentPassword', { 
                      required: 'Current password is required'
                    })}
                    className={`w-full px-3 py-2 rounded border transition-colors text-sm ${
                      errors.currentPassword 
                        ? isDark 
                          ? 'border-red-500 bg-red-900/10' 
                          : 'border-red-500 bg-red-50'
                        : isDark 
                          ? 'border-gray-700 bg-gray-700 text-white' 
                          : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-1 ${
                      errors.currentPassword
                        ? 'focus:ring-red-500'
                        : 'focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 text-xs text-red-500">{errors.currentPassword.message}</p>
                )}
              </div>
              
              {/* New Password */}
              <div>
                <label 
                  htmlFor="newPassword" 
                  className={`block text-xs font-medium mb-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    {...register('newPassword', { 
                      required: 'New password is required',
                      pattern: {
                        value: passwordPattern,
                        message: 'Password must meet all requirements'
                      }
                    })}
                    className={`w-full px-3 py-2 rounded border transition-colors text-sm ${
                      errors.newPassword 
                        ? isDark 
                          ? 'border-red-500 bg-red-900/10' 
                          : 'border-red-500 bg-red-50'
                        : isDark 
                          ? 'border-gray-700 bg-gray-700 text-white' 
                          : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-1 ${
                      errors.newPassword
                        ? 'focus:ring-red-500'
                        : 'focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                {/* Password strength meter */}
                {dirtyFields.newPassword && (
                  <div className="mt-2 space-y-1">
                    {passwordRules.map(rule => {
                      const passed = rule.test(newPassword);
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
                
                {errors.newPassword && (
                  <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>
                )}
              </div>
              
              {/* Confirm Password */}
              <div>
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
                        value === watch('newPassword') || 'Passwords do not match'
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
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordUpdate(false)}
                  className={`py-2 px-4 rounded border text-sm transition-colors ${
                    isDark 
                      ? 'border-gray-700 hover:bg-gray-700 text-gray-300' 
                      : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                  }`}
                  disabled={isLoading}
                >
                  <X size={16} className="inline-block mr-1" />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={isLoading || (!isDirty && !previewAvatar)}
            className={`py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors text-sm font-medium flex items-center gap-2 ${
              isLoading || (!isDirty && !previewAvatar) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <Loader size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
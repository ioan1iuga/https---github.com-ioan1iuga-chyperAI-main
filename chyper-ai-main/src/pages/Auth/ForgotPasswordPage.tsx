import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ForgotPasswordForm } from '../../components/auth/ForgotPasswordForm';
import { Code } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-2 mb-3">
            <Code className="w-full h-full text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Reset your password
          </h1>
          <p className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            We'll email you instructions to reset your password
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
};
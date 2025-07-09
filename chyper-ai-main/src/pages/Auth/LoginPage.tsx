import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { LoginForm } from '../../components/auth/LoginForm';
import { Code, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { isSupabaseConfigured, configError } = useAuth();

  return (
    <div className={`flex min-h-screen ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            {!isSupabaseConfigured && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                isDark ? 'bg-red-900/30 text-red-400 border border-red-800/30' : 'bg-red-50 border border-red-100 text-red-700'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="flex-shrink-0" size={16} />
                  <span className="font-medium">Supabase Configuration Error</span>
                </div>
                <p className="text-sm">
                  {configError || 'Could not connect to Supabase. Check your configuration.'}
                </p>
                <div className="mt-2 text-xs">
                  <Link to="/error/supabase" className="underline">
                    See troubleshooting guide
                  </Link>
                </div>
              </div>
            )}

            <div className="inline-block w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-2 mb-3">
              <Code className="w-full h-full text-white" />
            </div>
            <h1 className={`text-2xl font-bold mb-1 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              ChyperAI Platform
            </h1>
            <p className={`text-sm mb-6 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              AI-powered development environment
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
      
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 opacity-90 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')] bg-cover bg-center mix-blend-overlay z-0"></div>
        <div className="absolute inset-0 flex items-center justify-center p-10">
          <div className="max-w-lg relative z-20">
            <h2 className="text-3xl font-bold text-white mb-6 drop-shadow-md">Enhance your development with AI</h2>
            <p className="text-lg text-white/90 mb-8 drop-shadow-sm">
              Boost your productivity with AI-assisted coding, intelligent code analysis, and automated optimizations.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">Smart code completion and suggestions</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">Automated code reviews and optimization</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">Seamless deployments with one click</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
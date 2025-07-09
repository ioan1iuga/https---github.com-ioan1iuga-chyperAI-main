import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { Code, Check } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`flex min-h-screen ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-block w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-2 mb-3">
              <Code className="w-full h-full text-white" />
            </div>
            <h1 className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Create your account
            </h1>
            <p className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Join thousands of developers using ChyperAI
            </p>
          </div>
          <RegisterForm />
        </div>
      </div>
      
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 flex items-center justify-center p-10">
          <div className="max-w-lg">
            <h2 className="text-3xl font-bold text-white mb-6">Take your development to the next level</h2>
            <p className="text-lg text-white/80 mb-8">
              Join ChyperAI and experience the future of software development with AI-powered tools and collaboration.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">Free tier available with core features</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">No credit card required to get started</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">24/7 AI-powered development assistance</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
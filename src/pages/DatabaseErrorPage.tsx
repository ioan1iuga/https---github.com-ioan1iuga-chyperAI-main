import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { AlertCircle, Home, ArrowLeft, RefreshCw, Database, Code } from 'lucide-react';

export const DatabaseErrorPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${
      isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className={`max-w-md w-full rounded-lg ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      } p-8 shadow-lg`}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
            <Database size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Database Error</h1>
          <p className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            We're having trouble connecting to the database. This might be due to a migration issue or configuration problem.
          </p>
        </div>
        
        <div className={`rounded-lg p-4 mb-6 ${
          isDark ? 'bg-red-900/20 border border-red-800/30' : 'bg-red-50 border border-red-100'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className={`mt-0.5 ${
              isDark ? 'text-red-500' : 'text-red-600'
            }`} />
            <div>
              <h3 className={`text-sm font-medium ${
                isDark ? 'text-red-400' : 'text-red-800'
              }`}>
                What happened?
              </h3>
              <p className={`mt-1 text-xs ${
                isDark ? 'text-red-300' : 'text-red-700'
              }`}>
                The application couldn't create or access user profiles in the database. This may be due to an incomplete database setup or migration error.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-sm font-medium mb-2">Possible solutions:</h3>
          
          <div className={`rounded p-3 ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                isDark ? 'bg-gray-600' : 'bg-gray-200'
              }`}>
                <span>1</span>
              </div>
              <div>
                <p className="text-xs">
                  Make sure Supabase is running and properly configured in your .env file.
                </p>
              </div>
            </div>
          </div>
          
          <div className={`rounded p-3 ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                isDark ? 'bg-gray-600' : 'bg-gray-200'
              }`}>
                <span>2</span>
              </div>
              <div>
                <p className="text-xs">
                  Ensure all database migrations have been applied successfully by running:
                </p>
                <pre className={`mt-2 p-2 rounded text-xs overflow-x-auto ${
                  isDark ? 'bg-gray-900' : 'bg-gray-200'
                }`}>
                  <code>npx supabase migration up</code>
                </pre>
              </div>
            </div>
          </div>
          
          <div className={`rounded p-3 ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                isDark ? 'bg-gray-600' : 'bg-gray-200'
              }`}>
                <span>3</span>
              </div>
              <div>
                <p className="text-xs">
                  Check the database logs for specific error messages that might help diagnose the issue.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 mt-8">
          <button 
            onClick={refreshPage}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          
          <div className="flex gap-2">
            <Link 
              to="/"
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Home size={16} />
              Home
            </Link>
            
            <a
              href="https://docs.chyper.ai/troubleshooting"
              target="_blank"
              rel="noreferrer"
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Code size={16} />
              Docs
            </a>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-gray-500">
        Need more help? Contact our support team at support@chyper.ai
      </p>
    </div>
  );
};
import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { AlertCircle, Home, RefreshCw, Database, Code, Server } from 'lucide-react';

export const SupabaseErrorPage: React.FC = () => {
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-4">
            <Server size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Supabase Connection Error</h1>
          <p className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            We couldn't connect to the Supabase backend. This is required for authentication and data storage.
          </p>
        </div>
        
        <div className={`rounded-lg p-4 mb-6 ${
          isDark ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-100'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className={`mt-0.5 ${
              isDark ? 'text-amber-500' : 'text-amber-600'
            }`} />
            <div>
              <h3 className={`text-sm font-medium ${
                isDark ? 'text-amber-400' : 'text-amber-800'
              }`}>
                What happened?
              </h3>
              <p className={`mt-1 text-xs ${
                isDark ? 'text-amber-300' : 'text-amber-700'
              }`}>
                The application couldn't connect to Supabase. This is required for authentication, database access, and other key features.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-sm font-medium mb-2">Possible solutions:</h3>
          
          <div className={`my-4 p-4 rounded-lg ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                Sign up for a Supabase account at supabase.com
              </li>
              <li className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                Create a new project (or use an existing one)
              </li>
              <li className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                Go to Project Settings → API
              </li>
              <li className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                Copy the <strong>Project URL</strong> and <strong>anon/public</strong> key
              </li>
              <li className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                Create a <code className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>.env</code> file in your project root with the following:
                <pre className={`mt-2 p-2 rounded overflow-x-auto text-xs ${
                  isDark ? 'bg-gray-900' : 'bg-gray-200'
                }`}>{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key`}</pre>
              </li>
            </ol>
          </div>
          
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
                  Make sure Supabase is running locally:
                </p>
                <pre className={`mt-2 p-2 rounded text-xs overflow-x-auto ${
                  isDark ? 'bg-gray-900' : 'bg-gray-200'
                }`}>
                  <code>npx supabase start</code>
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
                <span>2</span>
              </div>
              <div>
                <p className="text-xs">
                  Check your .env file has the correct Supabase URL and anon key:
                </p>
                <pre className={`mt-2 p-2 rounded text-xs overflow-x-auto ${
                  isDark ? 'bg-gray-900' : 'bg-gray-200'
                }`}>
                  <code>VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0</code>
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
                  Ensure migrations are applied:
                </p>
                <pre className={`mt-2 p-2 rounded text-xs overflow-x-auto ${
                  isDark ? 'bg-gray-900' : 'bg-gray-200'
                }`}>
                  <code>npx supabase migration up</code>
                </pre>
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
          
          <Link 
            to="/"
            className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
              isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Home size={16} />
            Back to Home
          </Link>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-gray-500">
        Need more help? Contact our support team at support@chyper.ai
      </p>
    </div>
  );
};
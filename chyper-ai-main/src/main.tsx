import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css'; // Ensure CSS is imported
import { ErrorBoundaryService } from './services/errorHandling/ErrorBoundaryService';
import App from './App';

// Initialize error handling
ErrorBoundaryService.setupGlobalErrorHandlers();

// Log environment configuration on startup to help with debugging
console.info('Application environment:', {
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  supabaseConfigured: !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  environmentVariables: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')).join(', ')
});

// Add unhandled rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled Promise Rejection:', event.reason);
  // Prevent the default handler
  event.preventDefault();
});

// Find and mount the application
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          // Custom styling based on theme (properly escaped for className)
          className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
          duration: 4000,
          // Custom styling for success toasts
          success: {
            duration: 5000,
            iconTheme: {
              primary: '#10B981',
              secondary: 'white',
            },
          },
          // Custom styling for error toasts
          error: {
            duration: 6000,
            iconTheme: {
              primary: '#EF4444',
              secondary: 'white',
            },
          },
        }}
      />
      <App />
    </BrowserRouter>
  </StrictMode>
);

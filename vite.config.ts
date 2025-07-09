import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Get environment variables or fallback to defaults
  const BACKEND_URL = env.VITE_BACKEND_URL || 'http://localhost:3001';
  const PROXY_TIMEOUT = parseInt(env.VITE_PROXY_TIMEOUT || '60000');
  const SUPABASE_URL = env.VITE_SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || '';

  return {
    plugins: [
      react({
        // Use the new JSX transform introduced in React 17
        jsxRuntime: 'automatic',
        jsxImportSource: 'react',
        babel: {
          plugins: [],
          // Make sure we're using the correct preset for React
          presets: [['@babel/preset-react', { runtime: 'automatic' }]],
        },
      }),
    ],
    server: {
      port: 5173,
      host: true,
      open: false,
      strictPort: false,
      hmr: {
        // Explicitly configure HMR
        protocol: 'ws',
        host: 'localhost',
        // Don't specify port to use server port automatically
        // Increase timeout for WebSocket connection
        timeout: 30000,
        // Don't specify clientPort to use server port automatically
        overlay: true
      },
      proxy: {
        // Main API proxy configuration
        '^/api/(?!terminals/.*\\/ws$).*': { // Don't proxy WebSocket upgrades
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          ws: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.error(`API Proxy error: ${err.message}`);
            });
          },
          timeout: PROXY_TIMEOUT,
          proxyTimeout: PROXY_TIMEOUT
        },
        // Proxy direct API paths (without /api prefix)
        '^/(projects|deployments|integrations|terminals)': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          ws: false,
          timeout: PROXY_TIMEOUT
        },
        // Direct API endpoints
        '/health': { 
          target: BACKEND_URL, 
          changeOrigin: true,
          rewrite: (path) => path
        },
        // WebSocket endpoint for terminals
        '^/api/terminals/.*/ws': { 
          target: BACKEND_URL, 
          ws: true,
          changeOrigin: true,
          secure: false
        }
      }
    },
    resolve: {
      alias: {
        // Add any aliases needed
      }
    },
    optimizeDeps: {
      exclude: ['lucide-react']
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      // Explicitly define environment variables for client-side access
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(SUPABASE_ANON_KEY),
      'import.meta.env.VITE_SUPABASE_FUNCTIONS_URL': JSON.stringify(env.VITE_SUPABASE_FUNCTIONS_URL || ''),
    },
    // Enable source maps for better debugging
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            router: ['react-router-dom'],
            lucide: ['lucide-react'],
          }
        }
      }
    },
  };
});
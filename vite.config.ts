{
      proxy: {
        // Main API proxy configuration
        '^/api/(?!terminals/.*\\/ws$).*': { // Don't proxy WebSocket upgrades
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          ws: false,
          configure: (proxy, options) => {
            proxy.on('error', (err, _req, _res) => {
              console.error(`API Proxy error: ${err.message}`);
            });
          },
          timeout: PROXY_TIMEOUT
        },
        // WebSocket endpoint for terminals
        '/api/terminals': { 
          target: BACKEND_URL, 
          ws: true, 
          changeOrigin: true,
          secure: false
        }
      }
    },
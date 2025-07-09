// Middleware for Cloudflare Pages Functions
// This handles CORS, authentication, and error handling for all functions

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-API-Key, apikey',
};

export const onRequest = async ({ request, next }) => {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Start request timer
  const requestStart = Date.now();

  // Generate a unique request ID
  const requestId = crypto.randomUUID();

  // Log request
  console.log(`[${requestId}] ${request.method} ${new URL(request.url).pathname}`);

  try {
    // Call the next handler
    const response = await next();
    
    // Add CORS headers to the response
    const newHeaders = new Headers(response.headers);
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
    
    // Add request ID header for tracking
    newHeaders.set('X-Request-ID', requestId);
    
    // Add timing information
    const duration = Date.now() - requestStart;
    newHeaders.set('X-Response-Time', `${duration}ms`);
    
    // Log response
    console.log(`[${requestId}] Response: ${response.status} (${duration}ms)`);
    
    // Return the response with added headers
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    // Log error
    console.error(`[${requestId}] Error:`, error.stack || error);
    
    // Return error response
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
      requestId
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
    });
  }
};
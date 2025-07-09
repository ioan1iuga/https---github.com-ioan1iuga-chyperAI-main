// Supabase Edge Function for Health Check API
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('CORS_ALLOW_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      status: 204,
    });
  }

  // Handle GET and POST requests
  if (req.method === 'GET' || req.method === 'POST') {
    return new Response(JSON.stringify({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: Deno.env.get('ENVIRONMENT') || 'production',
        version: Deno.env.get('API_VERSION') || '1.0.0',
        services: [
          { name: 'api', status: 'online' },
          { name: 'database', status: 'online' },
          { name: 'auth', status: 'online' },
          { name: 'storage', status: 'online' }
        ]
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  // Method not supported
  return new Response(JSON.stringify({
    success: false,
    error: 'Method not supported',
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 405,
  });
});
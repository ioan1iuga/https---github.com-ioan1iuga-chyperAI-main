// Supabase Edge Function for Health Check API
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import { 
  corsHeaders, 
  handleCORS,
  successResponse,
  errorResponse,
  toResponse
} from "../_shared/api.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    // Handle GET and POST requests
    if (req.method === 'GET' || req.method === 'POST') {
      return toResponse(successResponse({
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
      }), corsHeaders);
    }

    // Method not supported
    return toResponse(errorResponse('Method not supported', 405), corsHeaders);
  } catch (error) {
    // Handle any errors
    console.error('Error processing health request:', error.message);
    
    return toResponse(errorResponse(error.message, 400), corsHeaders);
  }
});
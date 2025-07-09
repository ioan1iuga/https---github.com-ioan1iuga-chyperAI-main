// Supabase Edge Function for Usage Statistics API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  // Check for authorization
  const token = req.headers.get('Authorization')?.split(' ')[1]
  if (!token) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unauthorized. Missing authentication token.',
      }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    // Return mock usage data
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          tokens: {
            used: 12345,
            limit: 100000
          },
          requests: {
            used: 42,
            limit: 1000
          },
          cost: '$0.83',
          usageByModel: {
            'gpt-4': 8765,
            'gpt-3.5-turbo': 3580
          },
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error processing usage request:', error.message)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
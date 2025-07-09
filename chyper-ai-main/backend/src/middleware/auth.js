// Supabase Edge Function for Authentication Middleware
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  corsHeaders, 
  handleCORS, 
  createSupabaseClient,
  getUser,
  successResponse,
  errorResponse,
  unauthorizedResponse,
  toResponse
} from "/shared/api/index.ts"
import { getConfig } from '/shared/config.js';
import { logger } from '/shared/utils/logger.js';

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORS(req)
  if (corsResponse) return corsResponse

  try {
    // Create Supabase client
    const supabase = createSupabaseClient(req)
    
    // Get user
    const user = await getUser(supabase)

    // Handle POST request for authentication
    if (req.method === 'POST') {
      if (!user) {
        return toResponse(unauthorizedResponse(), corsHeaders)
      }

      const { token } = await req.json()
      
      // Validate token
      const { data: { user: validatedUser }, error } = await supabase.auth.getUser(token)
      
      if (error || !validatedUser) {
        return toResponse(unauthorizedResponse(), corsHeaders)
      }

      const response = {
        user: validatedUser,
        authenticated: true
      }

      return toResponse(successResponse(response), corsHeaders)
    }

    // Method not supported
    return toResponse(errorResponse('Method not supported', 405), corsHeaders)
  } catch (error) {
    // Handle any errors
    console.error('Error processing authentication request:', error.message)
    
    return toResponse(errorResponse(error, 400), corsHeaders)
  }
})
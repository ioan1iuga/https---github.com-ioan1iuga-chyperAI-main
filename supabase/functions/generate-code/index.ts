// Supabase Edge Function for Code Generation API
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
} from "../_shared/api.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORS(req)
  if (corsResponse) return corsResponse

  try {
    // Create Supabase client
    const supabase = createSupabaseClient(req)
    
    // Get user
    const user = await getUser(supabase)

    // Handle POST request for code generation
    if (req.method === 'POST') {
      if (!user) {
        return toResponse(unauthorizedResponse(), corsHeaders)
      }

      const { prompt, language, context } = await req.json()
      
      // Mock response
      const response = {
        code: `// Generated code for: ${prompt}\n\nfunction example() {\n  console.log("Hello world");\n  return true;\n}`,
        language: language || 'javascript',
        explanation: "This is a sample implementation generated based on your prompt."
      }
      
      // Record usage stats
      const { error: usageError } = await supabase
        .from('usage_stats')
        .insert({
          user_id: user.id,
          provider: 'system',
          model: 'mock',
          type: 'code-generation',
          input_tokens: 100,
          output_tokens: 50
        })
      
      if (usageError) {
        console.error('Failed to record usage:', usageError)
      }

      return toResponse(successResponse(response), corsHeaders)
    }

    // Method not supported
    return toResponse(errorResponse('Method not supported', 405), corsHeaders)
  } catch (error) {
    // Handle any errors
    console.error('Error processing code generation request:', error.message)
    
    return toResponse(errorResponse(error.message, 400), corsHeaders)
  }
})
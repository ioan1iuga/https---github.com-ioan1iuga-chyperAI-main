// Supabase Edge Function for AI Chat API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  corsHeaders, 
  handleCORS, 
  createSupabaseClient,
  getUser, 
  successResponse, 
  errorResponse, 
  unauthorizedResponse,
  toResponse,
  calculateCost
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

    // Handle POST request for chat completion
    if (req.method === 'POST') {
      if (!user) {
        return toResponse(unauthorizedResponse(), corsHeaders)
      }

      const { provider, model, messages, sessionId } = await req.json()

      // Record this chat in the database
      const { data: sessionData, error: sessionError } = await supabase
        .from('ai_sessions')
        .select('id')
        .eq('id', sessionId)
        .single()

      if (sessionError && sessionError.code !== 'PGRST116') {
        throw sessionError
      }

      // Mock response
      const response = {
        content: "I can help you with that! This is a response from the Supabase Edge Function. In a production environment, this would connect to an AI provider API.",
        usage: {
          prompt_tokens: 150,
          completion_tokens: 100,
          total_tokens: 250
        },
        model: model,
        provider: provider,
        metadata: {
          sessionId,
          timestamp: new Date().toISOString()
        }
      }

      // Track usage in the database
      const { error: usageError } = await supabase
        .from('usage_stats')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          provider: provider,
          model: model,
          type: 'chat',
          input_tokens: response.usage.prompt_tokens,
          output_tokens: response.usage.completion_tokens,
          cost: calculateCost(provider, model, response.usage)
        })

      if (usageError) {
        console.error('Error recording usage stats:', usageError)
      }

      return toResponse(successResponse(response), corsHeaders)
    }

    // Method not supported
    return toResponse(errorResponse('Method not supported', 405), corsHeaders)
  } catch (error) {
    // Handle any errors
    console.error('Error processing chat request:', error.message)
    
    return toResponse(errorResponse(error.message, 400), corsHeaders)
  }
})
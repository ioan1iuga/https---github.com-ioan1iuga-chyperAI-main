// Supabase Edge Function for AI Chat API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleCORS } from "../_shared/cors.ts"
import { createSupabaseClient, getUser, calculateCost } from "../_shared/db.ts"

serve(async (req: Request) => {
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
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      interface ChatRequest {
        provider: string;
        model: string;
        sessionId: string;
      }

      const { provider, model, sessionId } = await req.json() as ChatRequest;

      // Record this chat in the database
      const { error: sessionError } = await supabase
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

      return new Response(
        JSON.stringify({ success: true, data: response }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Method not supported
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Method not supported'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    )
  } catch (e) {
    const error = e as Error;
    // Handle any errors
    console.error('Error processing chat request:', error.message)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
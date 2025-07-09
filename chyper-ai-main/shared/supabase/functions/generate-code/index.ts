// Supabase Edge Function for Code Generation API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleCORS } from "../_shared/cors.ts"
import { createSupabaseClient, getUser } from "../_shared/db.ts"

serve(async (req: Request) => {
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
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      interface GenerateCodeRequest {
        prompt: string;
        language: string;
      }

      const { prompt, language } = await req.json() as GenerateCodeRequest;
      
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
    console.error('Error processing code generation request:', error.message)
    
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
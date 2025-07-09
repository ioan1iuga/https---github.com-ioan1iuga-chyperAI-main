// Supabase Edge Function for AI Models API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleCORS } from "../_shared/cors.ts"
import {} from "../_shared/db.ts"

serve(async (req: Request) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORS(req)
  if (corsResponse) return corsResponse

  try {
    // Support both GET and POST methods
    if (req.method === 'GET' || req.method === 'POST') {
      // Return mock data
      const mockProviders = [
        {
          id: 'openai',
          name: 'OpenAI',
          type: 'openai',
          status: 'connected',
          models: [
            {
              id: 'gpt-4',
              name: 'GPT-4',
              displayName: 'GPT-4',
              maxTokens: 8192,
              inputCost: 0.03,
              outputCost: 0.06,
              capabilities: [
                { type: 'code-generation', supported: true },
                { type: 'code-analysis', supported: true },
                { type: 'chat', supported: true },
                { type: 'function-calling', supported: true }
              ]
            },
            {
              id: 'gpt-3.5-turbo',
              name: 'GPT-3.5 Turbo',
              displayName: 'GPT-3.5 Turbo',
              maxTokens: 4096,
              inputCost: 0.0015,
              outputCost: 0.002,
              capabilities: [
                { type: 'code-generation', supported: true },
                { type: 'code-analysis', supported: true },
                { type: 'chat', supported: true },
                { type: 'function-calling', supported: true }
              ]
            }
          ]
        },
        {
          id: 'anthropic',
          name: 'Anthropic',
          type: 'anthropic',
          status: 'connected',
          models: [
            {
              id: 'claude-3-opus',
              name: 'Claude 3 Opus',
              displayName: 'Claude 3 Opus',
              maxTokens: 200000,
              inputCost: 0.015,
              outputCost: 0.075,
              capabilities: [
                { type: 'code-generation', supported: true },
                { type: 'code-analysis', supported: true },
                { type: 'chat', supported: true }
              ]
            },
            {
              id: 'claude-3-sonnet',
              name: 'Claude 3 Sonnet',
              displayName: 'Claude 3 Sonnet',
              maxTokens: 200000,
              inputCost: 0.003,
              outputCost: 0.015,
              capabilities: [
                { type: 'code-generation', supported: true },
                { type: 'code-analysis', supported: true },
                { type: 'chat', supported: true }
              ]
            }
          ]
        }
      ]

      // Respond with consistent format
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            providers: mockProviders,
            defaultProvider: 'openai',
            defaultModel: 'gpt-3.5-turbo'
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Method not supported
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Method not supported. Use GET or POST'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    )
  } catch (e) {
    const error = e as Error;
    // Handle any errors
    console.error('Error processing request:', error.message)
    
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
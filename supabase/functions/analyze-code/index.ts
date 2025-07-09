// Supabase Edge Function for Code Analysis API
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

    // Handle POST request for code analysis
    if (req.method === 'POST') {
      if (!user) {
        return toResponse(unauthorizedResponse(), corsHeaders)
      }

      const { code, language, analysisType = 'all' } = await req.json()
      
      // Mock response
      const response = {
        suggestions: [
          {
            id: Date.now().toString(),
            type: 'optimization',
            title: 'Performance Improvement',
            description: 'Consider optimizing this code for better performance',
            code: 'const optimizedVersion = memoize(expensiveFunction);',
            language: language || 'javascript',
            confidence: 0.85
          },
          {
            id: (Date.now() + 1).toString(),
            type: 'security',
            title: 'Security Vulnerability',
            description: 'Potential security issue detected in input handling',
            code: 'const sanitizedInput = sanitizeInput(userInput);',
            language: language || 'javascript',
            confidence: 0.92
          }
        ],
        issues: [
          {
            type: 'warning',
            severity: 'medium',
            message: 'Potential performance issue detected',
            line: 42
          },
          {
            type: 'error',
            severity: 'high',
            message: 'Unhandled promise rejection',
            line: 67
          }
        ]
      }
      
      // Record usage stats
      const { error: usageError } = await supabase
        .from('usage_stats')
        .insert({
          user_id: user.id,
          provider: 'system',
          model: 'mock',
          type: 'code-analysis',
          input_tokens: 200,
          output_tokens: 150
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
    console.error('Error processing code analysis request:', error)
    
    return toResponse(errorResponse(error.message, 400), corsHeaders)
  }
})
// Main index file for the AI API
// This file is used for local testing
// The actual functions are in their respective folders

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        message: 'AI API Router',
        availableEndpoints: [
          '/ai/models',
          '/ai/chat', 
          '/ai/generate-code',
          '/ai/analyze-code'
        ],
        timestamp: new Date().toISOString()
      }
    }),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  )
})
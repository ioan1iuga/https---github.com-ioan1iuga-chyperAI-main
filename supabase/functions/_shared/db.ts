import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export function createSupabaseClient(req: Request): SupabaseClient {
  const authorization = req.headers.get('Authorization')
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: { headers: { Authorization: authorization ?? '' } },
      auth: { persistSession: false },
    }
  )
}

export async function getUser(supabase: SupabaseClient) {
  try {
    const { data } = await supabase.auth.getUser()
    return data.user
  } catch (error) {
    console.error('Authentication error:', error.message)
    return null
  }
}

// Helper function to calculate costs
export function calculateCost(provider: string, model: string, usage: { prompt_tokens: number, completion_tokens: number }): number {
  const pricing: Record<string, Record<string, { input: number, output: number }>> = {
    'openai': {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
    },
    'anthropic': {
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 }
    }
  }

  const modelPricing = pricing[provider]?.[model] || { input: 0, output: 0 }
  return (usage.prompt_tokens * modelPricing.input + usage.completion_tokens * modelPricing.output) / 1000
}
/**
 * Authentication utilities for serverless functions
 * Used by both Supabase Edge Functions and Cloudflare Pages Functions
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client from a request
 */
export function createSupabaseClient(req: Request): SupabaseClient {
  const authorization = req.headers.get('Authorization');
  
  // Get Supabase URL and key from environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authorization ?? '' } },
    auth: { persistSession: false },
  });
}

/**
 * Get the authenticated user from a Supabase client
 */
export async function getUser(supabase: SupabaseClient) {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch (error) {
    console.error('Authentication error:', error.message);
    return null;
  }
}

/**
 * Get the user profile from a Supabase client
 */
export async function getUserProfile(supabase: SupabaseClient, userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    return null;
  }
}

/**
 * Calculate cost for AI usage
 */
export function calculateCost(
  provider: string, 
  model: string, 
  usage: { prompt_tokens: number, completion_tokens: number }
): number {
  const pricing: Record<string, Record<string, { input: number, output: number }>> = {
    'openai': {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
    },
    'anthropic': {
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 }
    },
    'google': {
      'gemini-pro': { input: 0.00025, output: 0.0005 },
      'gemini-pro-vision': { input: 0.00025, output: 0.0005 }
    }
  };

  const modelPricing = pricing[provider]?.[model] || { input: 0, output: 0 };
  return (usage.prompt_tokens * modelPricing.input + usage.completion_tokens * modelPricing.output) / 1000;
}
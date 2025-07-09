/**
 * Shared API utilities for Supabase Edge Functions
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * Handle CORS preflight requests
 */
export function handleCORS(req: Request): Response | null {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return null;
}

/**
 * Create a Supabase client from a request
 */
export function createSupabaseClient(req: Request): any {
  const authorization = req.headers.get('Authorization');
  
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: { headers: { Authorization: authorization ?? '' } },
      auth: { persistSession: false },
    }
  );
}

/**
 * Get the authenticated user from a Supabase client
 */
export async function getUser(supabase: any) {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch (error) {
    console.error('Authentication error:', error.message);
    return null;
  }
}

/**
 * Create a successful API response
 */
export function successResponse<T = any>(data: T, message?: string): any {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Create an error API response
 */
export function errorResponse(error: string | Error, status: number = 400): any {
  return {
    success: false,
    error: error instanceof Error ? error.message : error,
    status
  };
}

/**
 * Create an unauthorized API response
 */
export function unauthorizedResponse(): any {
  return {
    success: false,
    error: 'Unauthorized',
    status: 401
  };
}

/**
 * Convert an API response to a Response object
 */
export function toResponse(apiResponse: any, headers: Record<string, string> = {}): Response {
  return new Response(
    JSON.stringify(apiResponse),
    {
      status: apiResponse.status || (apiResponse.success ? 200 : 400),
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }
  );
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
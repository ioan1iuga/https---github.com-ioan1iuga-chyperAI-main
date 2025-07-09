/**
 * Shared API utilities for serverless functions
 * Used by both Supabase Edge Functions and Cloudflare Pages Functions
 */

export * from './auth';
export * from './cors';
export * from './logging';
export * from './responses';
export * from './validation';

/**
 * Get environment variables with fallbacks
 */
export function getEnv(key: string, fallback: string = ''): string {
  // Try Deno.env first (Supabase Edge Functions)
  if (typeof Deno !== 'undefined' && 'env' in Deno) {
    return Deno.env.get(key) || fallback;
  }
  
  // Try process.env next (Node.js / Cloudflare Workers with nodejs_compat)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }
  
  // Try env object next (Cloudflare Workers)
  if (typeof env !== 'undefined') {
    return (env as any)[key] || fallback;
  }
  
  return fallback;
}

/**
 * Parse request body as JSON with error handling
 */
export async function parseJsonBody<T = unknown>(request: Request): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error(`Invalid JSON body: ${error.message}`);
  }
}

/**
 * Extract query parameters from a URL
 */
export function getQueryParams(url: string | URL): Record<string, string> {
  const urlObj = typeof url === 'string' ? new URL(url) : url;
  const params: Record<string, string> = {};
  
  for (const [key, value] of urlObj.searchParams.entries()) {
    params[key] = value;
  }
  
  return params;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  // Use crypto.randomUUID() if available
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  
  // Fallback to timestamp + random
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
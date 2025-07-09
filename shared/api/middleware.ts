/**
 * Shared middleware utilities for serverless functions
 * Used by both Supabase Edge Functions and Cloudflare Pages Functions
 */
import { corsHeaders, toResponse, unauthorizedResponse } from './index.ts';
import { createSupabaseClient, getUser } from './auth.ts';
import { Logger } from './logging.ts';

const logger = new Logger({ module: 'middleware' });

/**
 * Authentication middleware
 */
export async function authMiddleware(req: Request) {
  try {
    // Create Supabase client
    const supabase = createSupabaseClient(req);
    
    // Get authenticated user
    const user = await getUser(supabase);
    
    if (!user) {
      return toResponse(unauthorizedResponse(), corsHeaders);
    }
    
    // Return user to be used in the handler
    return { user, supabase };
  } catch (error) {
    logger.error('Authentication error', { error });
    return toResponse(unauthorizedResponse('Authentication error'), corsHeaders);
  }
}

/**
 * Request logging middleware
 */
export function loggingMiddleware(req: Request) {
  const start = performance.now();
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;
  
  logger.info(`${method} ${path}`, {
    query: Object.fromEntries(url.searchParams),
    headers: Object.fromEntries(req.headers)
  });
  
  return {
    end: () => {
      const duration = performance.now() - start;
      logger.debug(`${method} ${path} completed in ${duration.toFixed(2)}ms`);
    }
  };
}

/**
 * Rate limit middleware (simplified for edge functions)
 */
export function rateLimitMiddleware(req: Request, options: { limit: number; windowMs: number }) {
  // Simple in-memory rate limiting is not practical for serverless functions
  // In a real implementation, you would use KV storage or similar
  // This is just a placeholder for the pattern
  logger.debug('Rate limit check (placeholder)', { options });
  
  // Return null to continue processing the request
  return null;
}
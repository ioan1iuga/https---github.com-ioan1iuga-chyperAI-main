// Rate Limiting Middleware for Cloudflare Workers
import { WorkerRequest, WorkerEnvironment, RateLimitConfig } from '../../types/worker-configuration';

const defaultRateLimitConfig: RateLimitConfig = {
  windowMs: parseInt(Deno.env.get('RATE_LIMIT_WINDOW') || '900') * 1000, // Default: 15 minutes (900s)
  maxRequests: parseInt(Deno.env.get('RATE_LIMIT_MAX_REQUESTS') || '100'), // Default: 100 requests per window
  keyGenerator: (request) => {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    const keyPrefix = Deno.env.get('RATE_LIMIT_KEY_PREFIX') || 'ratelimit:';
    return `${keyPrefix}${ip}:${userAgent}`;
  }
};

export async function rateLimitMiddleware(
  request: WorkerRequest,
  env: WorkerEnvironment,
  config: RateLimitConfig = defaultRateLimitConfig
): Promise<Response | null> {
  try {
    const key = config.keyGenerator ? config.keyGenerator(request) : getDefaultKey(request);
    const rateLimitKey = `ratelimit:${key}`;
    
    // Get current count from KV
    const currentData = await env.CACHE.get(rateLimitKey, 'json') as { count: number; windowStart: number } | null;
    const now = Date.now();
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
    
    let count = 1;
    
    if (currentData && currentData.windowStart === windowStart) {
      count = currentData.count + 1;
    }
    
    // Check if rate limit exceeded
    if (count > config.maxRequests) {
      const resetTime = windowStart + config.windowMs;
      const retryAfter = Math.ceil((resetTime - now) / 1000);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Rate Limit Exceeded',
        message: `Too many requests. Try again in ${retryAfter} seconds.`,
        retryAfter
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.floor(resetTime / 1000).toString()
        }
      });
    }
    
    // Update count in KV
    const ttl = Math.ceil((windowStart + config.windowMs - now) / 1000);
    await env.CACHE.put(rateLimitKey, JSON.stringify({
      count,
      windowStart
    }), { expirationTtl: ttl });
    
    // Rate limit not exceeded, continue with request
    return null;
    
  } catch (error) {
    console.error('Rate limit middleware error:', error);
    // On error, allow the request to continue
    return null;
  }
}

function getDefaultKey(request: WorkerRequest): string {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  return `${ip}:${userAgent.substring(0, 50)}`;
}

export function addRateLimitHeaders(
  response: Response,
  limit: number,
  remaining: number,
  resetTime: number
): Response {
  const newHeaders = new Headers(response.headers);
  
  newHeaders.set('X-RateLimit-Limit', limit.toString());
  newHeaders.set('X-RateLimit-Remaining', remaining.toString());
  newHeaders.set('X-RateLimit-Reset', Math.floor(resetTime / 1000).toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
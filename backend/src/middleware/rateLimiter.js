// Rate Limiting Middleware for AI Services
import Redis from 'redis';

export class RateLimiter {
  constructor() {
    this.redis = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    this.limits = {
      'chat': { requests: 100, window: 3600 }, // 100 requests per hour
      'code-generation': { requests: 50, window: 3600 }, // 50 requests per hour
      'code-analysis': { requests: 30, window: 3600 } // 30 requests per hour
    };
  }

  async checkLimit(userId, operation) {
    const key = `rate_limit:${userId}:${operation}`;
    const limit = this.limits[operation];
    
    if (!limit) {
      throw new Error(`Unknown operation: ${operation}`);
    }

    try {
      const current = await this.redis.get(key);
      const requests = parseInt(current) || 0;

      if (requests >= limit.requests) {
        const ttl = await this.redis.ttl(key);
        throw new Error(`Rate limit exceeded. Try again in ${ttl} seconds.`);
      }

      // Increment counter
      await this.redis.incr(key);
      await this.redis.expire(key, limit.window);

      return {
        remaining: limit.requests - requests - 1,
        resetTime: new Date(Date.now() + (limit.window * 1000))
      };
    } catch (error) {
      if (error.message.includes('Rate limit exceeded')) {
        throw error;
      }
      // If Redis is down, allow the request but log the error
      console.error('Rate limiter error:', error);
      return { remaining: null, resetTime: null };
    }
  }

  async getRemainingRequests(userId, operation) {
    const key = `rate_limit:${userId}:${operation}`;
    const limit = this.limits[operation];
    
    if (!limit) return null;

    try {
      const current = await this.redis.get(key);
      const requests = parseInt(current) || 0;
      const ttl = await this.redis.ttl(key);

      return {
        remaining: Math.max(0, limit.requests - requests),
        resetTime: ttl > 0 ? new Date(Date.now() + (ttl * 1000)) : null,
        limit: limit.requests
      };
    } catch (error) {
      console.error('Get remaining requests error:', error);
      return null;
    }
  }
}

export const rateLimiterMiddleware = async (req, res, next) => {
  try {
    const rateLimiter = new RateLimiter();
    const operation = req.path.includes('chat') ? 'chat' : 
                    req.path.includes('generate') ? 'code-generation' :
                    req.path.includes('analyze') ? 'code-analysis' : 'chat';
    
    const result = await rateLimiter.checkLimit(req.user.id, operation);
    
    // Add rate limit headers
    if (result.remaining !== null) {
      res.set({
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': result.resetTime?.toISOString()
      });
    }
    
    next();
  } catch (error) {
    res.status(429).json({
      success: false,
      error: error.message,
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
};
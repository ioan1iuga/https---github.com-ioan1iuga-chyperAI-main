// Cache Manager for AI Responses
import Redis from 'redis';

export class CacheManager {
  constructor() {
    this.redis = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    this.defaultTtl = 3600; // 1 hour default
  }

  async get(key) {
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTtl) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async flush(pattern = '*') {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  // Generate semantic cache key for similar queries
  generateSemanticKey(content, type) {
    // In production, use proper semantic hashing
    const hash = Buffer.from(content).toString('base64').slice(0, 32);
    return `semantic:${type}:${hash}`;
  }

  // Cache frequently used responses
  async cacheResponse(key, response, metadata = {}) {
    const cacheData = {
      response,
      metadata: {
        ...metadata,
        cached_at: new Date().toISOString(),
        cache_version: '1.0'
      }
    };

    // Use longer TTL for frequently accessed content
    const ttl = metadata.frequent ? 7200 : this.defaultTtl; // 2 hours vs 1 hour
    
    return await this.set(key, cacheData, ttl);
  }

  async getCachedResponse(key) {
    const cached = await this.get(key);
    if (cached && cached.response) {
      return {
        ...cached.response,
        from_cache: true,
        cached_at: cached.metadata.cached_at
      };
    }
    return null;
  }
}

export default CacheManager;
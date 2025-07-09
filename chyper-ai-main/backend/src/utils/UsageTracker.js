// Usage Tracking for AI Services
export class UsageTracker {
  constructor() {
    // In production, use a proper database
    this.usage = new Map();
  }

  async recordUsage(userId, sessionId, data) {
    const usage = {
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
      ...data
    };

    // Store usage data
    const key = `${userId}:${Date.now()}`;
    this.usage.set(key, usage);

    // In production, save to database
    console.log('Usage recorded:', usage);
    
    return usage;
  }

  async recordCacheHit(userId, sessionId) {
    return this.recordUsage(userId, sessionId, {
      type: 'cache_hit',
      inputTokens: 0,
      outputTokens: 0,
      cost: 0
    });
  }

  async recordError(userId, sessionId, error) {
    return this.recordUsage(userId, sessionId, {
      type: 'error',
      error: error.message,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0
    });
  }

  async getStats(userId, timeframe = '30d') {
    // Convert timeframe to milliseconds
    const timeframeMappings = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };

    const timeframeMs = timeframeMappings[timeframe] || timeframeMappings['30d'];
    const cutoffTime = new Date(Date.now() - timeframeMs);

    // Filter usage data for the user and timeframe
    const userUsage = Array.from(this.usage.values())
      .filter(usage => 
        usage.userId === userId && 
        new Date(usage.timestamp) >= cutoffTime
      );

    // Calculate statistics
    const stats = {
      totalRequests: userUsage.length,
      totalTokensUsed: userUsage.reduce((sum, u) => sum + (u.inputTokens || 0) + (u.outputTokens || 0), 0),
      totalCost: userUsage.reduce((sum, u) => sum + (u.cost || 0), 0),
      requestsByProvider: {},
      requestsByType: {},
      errorRate: 0,
      cacheHitRate: 0,
      averageResponseTime: 0,
      dailyUsage: {}
    };

    // Calculate provider breakdown
    userUsage.forEach(usage => {
      if (usage.provider) {
        stats.requestsByProvider[usage.provider] = (stats.requestsByProvider[usage.provider] || 0) + 1;
      }
      
      if (usage.type) {
        stats.requestsByType[usage.type] = (stats.requestsByType[usage.type] || 0) + 1;
      }
    });

    // Calculate rates
    const errors = userUsage.filter(u => u.type === 'error').length;
    const cacheHits = userUsage.filter(u => u.type === 'cache_hit').length;
    
    stats.errorRate = userUsage.length > 0 ? (errors / userUsage.length) * 100 : 0;
    stats.cacheHitRate = userUsage.length > 0 ? (cacheHits / userUsage.length) * 100 : 0;

    // Daily usage breakdown
    userUsage.forEach(usage => {
      const date = usage.timestamp.split('T')[0];
      if (!stats.dailyUsage[date]) {
        stats.dailyUsage[date] = {
          requests: 0,
          tokens: 0,
          cost: 0
        };
      }
      stats.dailyUsage[date].requests += 1;
      stats.dailyUsage[date].tokens += (usage.inputTokens || 0) + (usage.outputTokens || 0);
      stats.dailyUsage[date].cost += usage.cost || 0;
    });

    return {
      timeframe,
      period: {
        start: cutoffTime.toISOString(),
        end: new Date().toISOString()
      },
      ...stats
    };
  }

  async getUserQuota(userId) {
    // Get user's current usage and limits
    const todayUsage = await this.getStats(userId, '24h');
    
    // Default quotas (in production, get from user settings/subscription)
    const quotas = {
      daily: {
        requests: 1000,
        tokens: 100000,
        cost: 50.00
      },
      monthly: {
        requests: 30000,
        tokens: 3000000,
        cost: 1500.00
      }
    };

    const monthlyUsage = await this.getStats(userId, '30d');

    return {
      daily: {
        used: {
          requests: todayUsage.totalRequests,
          tokens: todayUsage.totalTokensUsed,
          cost: todayUsage.totalCost
        },
        limit: quotas.daily,
        remaining: {
          requests: Math.max(0, quotas.daily.requests - todayUsage.totalRequests),
          tokens: Math.max(0, quotas.daily.tokens - todayUsage.totalTokensUsed),
          cost: Math.max(0, quotas.daily.cost - todayUsage.totalCost)
        }
      },
      monthly: {
        used: {
          requests: monthlyUsage.totalRequests,
          tokens: monthlyUsage.totalTokensUsed,
          cost: monthlyUsage.totalCost
        },
        limit: quotas.monthly,
        remaining: {
          requests: Math.max(0, quotas.monthly.requests - monthlyUsage.totalRequests),
          tokens: Math.max(0, quotas.monthly.tokens - monthlyUsage.totalTokensUsed),
          cost: Math.max(0, quotas.monthly.cost - monthlyUsage.totalCost)
        }
      }
    };
  }
}

export default UsageTracker;
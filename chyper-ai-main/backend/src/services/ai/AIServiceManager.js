// AI Service Manager - Central LLM orchestration
import OpenAIService from './providers/OpenAIService.js';
import AnthropicService from './providers/AnthropicService.js';
import GoogleAIService from './providers/GoogleAIService.js';
import { RateLimiter } from '../middleware/rateLimiter.js';
import { CacheManager } from '../utils/CacheManager.js';
import { UsageTracker } from '../utils/UsageTracker.js';

export class AIServiceManager {
  constructor() {
    this.providers = new Map();
    this.rateLimiter = new RateLimiter();
    this.cache = new CacheManager();
    this.usageTracker = new UsageTracker();
    
    this.initializeProviders();
  }

  initializeProviders() {
    // Initialize providers with server-side API keys
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIService(process.env.OPENAI_API_KEY));
    }
    
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', new AnthropicService(process.env.ANTHROPIC_API_KEY));
    }
    
    if (process.env.GOOGLE_AI_API_KEY) {
      this.providers.set('google', new GoogleAIService(process.env.GOOGLE_AI_API_KEY));
    }
  }

  async chatCompletion(request) {
    const { provider, model, messages, userId, sessionId } = request;
    
    // Rate limiting check
    await this.rateLimiter.checkLimit(userId, 'chat');
    
    // Check cache for similar requests
    const cacheKey = this.generateCacheKey(provider, model, messages);
    const cachedResponse = await this.cache.get(cacheKey);
    
    if (cachedResponse) {
      await this.usageTracker.recordCacheHit(userId, sessionId);
      return cachedResponse;
    }

    // Get provider service
    const service = this.providers.get(provider);
    if (!service) {
      throw new Error(`Provider ${provider} not available`);
    }

    try {
      const response = await service.chatCompletion({
        model,
        messages,
        userId,
        sessionId
      });

      // Cache successful responses
      await this.cache.set(cacheKey, response, 3600); // 1 hour cache
      
      // Track usage
      await this.usageTracker.recordUsage(userId, sessionId, {
        provider,
        model,
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
        cost: this.calculateCost(provider, model, response.usage)
      });

      return response;
    } catch (error) {
      await this.usageTracker.recordError(userId, sessionId, error);
      throw error;
    }
  }

  async codeGeneration(request) {
    const { provider, model, prompt, language, userId, sessionId } = request;
    
    await this.rateLimiter.checkLimit(userId, 'code-generation');
    
    const service = this.providers.get(provider);
    if (!service) {
      throw new Error(`Provider ${provider} not available`);
    }

    const response = await service.codeGeneration({
      model,
      prompt,
      language,
      userId,
      sessionId
    });

    await this.usageTracker.recordUsage(userId, sessionId, {
      provider,
      model,
      type: 'code-generation',
      inputTokens: response.usage.prompt_tokens,
      outputTokens: response.usage.completion_tokens,
      cost: this.calculateCost(provider, model, response.usage)
    });

    return response;
  }

  async codeAnalysis(request) {
    const { provider, model, code, language, userId, sessionId } = request;
    
    await this.rateLimiter.checkLimit(userId, 'code-analysis');
    
    const service = this.providers.get(provider);
    const response = await service.codeAnalysis({
      model,
      code,
      language,
      userId,
      sessionId
    });

    await this.usageTracker.recordUsage(userId, sessionId, {
      provider,
      model,
      type: 'code-analysis',
      inputTokens: response.usage.prompt_tokens,
      outputTokens: response.usage.completion_tokens,
      cost: this.calculateCost(provider, model, response.usage)
    });

    return response;
  }

  generateCacheKey(provider, model, messages) {
    const messageHash = this.hashMessages(messages);
    return `ai:${provider}:${model}:${messageHash}`;
  }

  hashMessages(messages) {
    // Simple hash for caching (use proper hashing in production)
    return Buffer.from(JSON.stringify(messages)).toString('base64').slice(0, 32);
  }

  calculateCost(provider, model, usage) {
    const pricing = this.getPricing(provider, model);
    return (usage.prompt_tokens * pricing.input + usage.completion_tokens * pricing.output) / 1000;
  }

  getPricing(provider, model) {
    // Pricing data for different models
    const pricing = {
      openai: {
        'gpt-4': { input: 0.03, output: 0.06 },
        'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
      },
      anthropic: {
        'claude-3-opus': { input: 0.015, output: 0.075 },
        'claude-3-sonnet': { input: 0.003, output: 0.015 }
      }
    };

    return pricing[provider]?.[model] || { input: 0, output: 0 };
  }

  async getAvailableModels(userId) {
    const models = [];
    
    for (const [provider, service] of this.providers) {
      try {
        const providerModels = await service.getModels();
        models.push({
          provider,
          models: providerModels,
          status: 'available'
        });
      } catch (error) {
        models.push({
          provider,
          models: [],
          status: 'error',
          error: error.message
        });
      }
    }

    return models;
  }

  async getUsageStats(userId, timeframe = '30d') {
    return await this.usageTracker.getStats(userId, timeframe);
  }
}

export default new AIServiceManager();
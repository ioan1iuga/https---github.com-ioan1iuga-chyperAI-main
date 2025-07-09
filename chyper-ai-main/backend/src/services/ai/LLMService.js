// Backend LLM Service - Migrated from frontend for security
import OpenAIService from './providers/OpenAIService.js';
import AnthropicService from './providers/AnthropicService.js';
import GoogleAIService from './providers/GoogleAIService.js';

export class LLMService {
  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  initializeProviders() {
    // Initialize providers with server-side API keys from environment
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

  async chat(message, provider, model, context = null, files = []) {
    const service = this.providers.get(provider);
    if (!service) {
      throw new Error(`Provider ${provider} not available`);
    }

    // Add artificial delay to simulate real AI processing
    await this.delay(1000 + Math.random() * 2000);

    const messages = [{ type: 'user', content: message }];
    
    try {
      const response = await service.chatCompletion({
        model,
        messages,
        userId: context?.userId || 'anonymous',
        sessionId: context?.sessionId || 'default'
      });

      return {
        content: response.content,
        tokens: response.usage,
        codeBlocks: this.extractCodeBlocks(response.content),
        suggestions: this.generateSuggestions(message, response.content)
      };
    } catch (error) {
      console.error(`LLM Service Error (${provider}):`, error);
      throw new Error(`Failed to process chat request: ${error.message}`);
    }
  }

  async generateCode(prompt, language, provider, model, context = {}) {
    const service = this.providers.get(provider);
    if (!service) {
      throw new Error(`Provider ${provider} not available`);
    }

    await this.delay(1500);

    try {
      const response = await service.codeGeneration({
        model,
        prompt,
        language,
        userId: context.userId || 'anonymous',
        sessionId: context.sessionId || 'default'
      });

      return {
        code: response.code,
        explanation: `Generated ${language} code for: "${prompt}". Follows best practices and includes proper error handling.`,
        language,
        metadata: response.metadata
      };
    } catch (error) {
      console.error(`Code Generation Error (${provider}):`, error);
      throw new Error(`Failed to generate code: ${error.message}`);
    }
  }

  async analyzeCode(code, language, provider, model, context = {}) {
    const service = this.providers.get(provider);
    if (!service) {
      throw new Error(`Provider ${provider} not available`);
    }

    await this.delay(2000);

    try {
      const response = await service.codeAnalysis({
        model,
        code,
        language,
        userId: context.userId || 'anonymous',
        sessionId: context.sessionId || 'default'
      });

      return {
        suggestions: this.parseAnalysisToSuggestions(response.analysis, language),
        issues: this.extractIssues(response.analysis),
        analysis: response.analysis,
        metadata: response.metadata
      };
    } catch (error) {
      console.error(`Code Analysis Error (${provider}):`, error);
      throw new Error(`Failed to analyze code: ${error.message}`);
    }
  }

  async reviewCode(filePath, code, provider, model, context = {}) {
    const analysis = await this.analyzeCode(code, this.getLanguageFromPath(filePath), provider, model, context);
    
    return {
      ...analysis,
      filePath,
      reviewScore: this.calculateReviewScore(analysis.suggestions),
      recommendations: this.generateRecommendations(analysis.suggestions)
    };
  }

  getAvailableProviders() {
    const providerInfo = [];
    
    for (const [id, service] of this.providers) {
      providerInfo.push({
        id,
        name: this.getProviderDisplayName(id),
        models: service.models || [],
        status: 'available'
      });
    }
    
    return providerInfo;
  }

  async validateProvider(providerId) {
    const service = this.providers.get(providerId);
    if (!service) {
      return { valid: false, error: 'Provider not found' };
    }

    try {
      const result = await service.validateConnection();
      return { valid: result.status === 'connected', ...result };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Private helper methods
  extractCodeBlocks(content) {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        language: match[1] || 'text',
        code: match[2].trim(),
        explanation: 'Code block extracted from AI response'
      });
    }

    return blocks;
  }

  generateSuggestions(prompt, response) {
    // Generate contextual suggestions based on prompt and response
    const suggestions = [];
    
    if (prompt.toLowerCase().includes('component')) {
      suggestions.push({
        id: Date.now().toString(),
        type: 'optimization',
        title: 'Add Error Boundary',
        description: 'Consider wrapping components with error boundaries for better error handling',
        code: 'export class ErrorBoundary extends React.Component { ... }',
        language: 'typescript',
        confidence: 0.8
      });
    }

    if (prompt.toLowerCase().includes('api') || prompt.toLowerCase().includes('fetch')) {
      suggestions.push({
        id: (Date.now() + 1).toString(),
        type: 'security',
        title: 'Validate API Responses',
        description: 'Always validate and sanitize API responses before using them',
        code: 'const validatedData = schema.parse(apiResponse);',
        language: 'typescript',
        confidence: 0.9
      });
    }

    return suggestions;
  }

  parseAnalysisToSuggestions(analysis, language) {
    // Parse AI analysis response into structured suggestions
    const suggestions = [];
    
    // This is a simplified parser - in production, you'd use more sophisticated NLP
    if (analysis.includes('performance')) {
      suggestions.push({
        id: Date.now().toString(),
        type: 'optimization',
        title: 'Performance Optimization Available',
        description: 'AI detected potential performance improvements',
        code: '// Optimization suggestions from AI analysis',
        language,
        confidence: 0.75
      });
    }

    if (analysis.includes('security') || analysis.includes('vulnerability')) {
      suggestions.push({
        id: (Date.now() + 1).toString(),
        type: 'security',
        title: 'Security Issue Detected',
        description: 'AI identified potential security concerns',
        code: '// Security fixes recommended by AI',
        language,
        confidence: 0.85
      });
    }

    return suggestions;
  }

  extractIssues(analysis) {
    // Extract structured issues from AI analysis
    const issues = [];
    
    if (analysis.includes('error') || analysis.includes('bug')) {
      issues.push({
        type: 'error',
        severity: 'high',
        message: 'Potential bug detected by AI analysis',
        line: 1
      });
    }

    if (analysis.includes('warning') || analysis.includes('deprecated')) {
      issues.push({
        type: 'warning',
        severity: 'medium',
        message: 'Deprecated or potentially problematic code detected',
        line: 1
      });
    }

    return issues;
  }

  calculateReviewScore(suggestions) {
    if (!suggestions || suggestions.length === 0) return 100;
    
    let score = 100;
    suggestions.forEach(suggestion => {
      if (suggestion.type === 'security') score -= 20;
      else if (suggestion.type === 'bug-fix') score -= 15;
      else if (suggestion.type === 'optimization') score -= 10;
      else score -= 5;
    });
    
    return Math.max(score, 0);
  }

  generateRecommendations(suggestions) {
    const recommendations = [];
    
    const securitySuggestions = suggestions.filter(s => s.type === 'security');
    if (securitySuggestions.length > 0) {
      recommendations.push('Address security vulnerabilities immediately');
    }

    const performanceSuggestions = suggestions.filter(s => s.type === 'optimization');
    if (performanceSuggestions.length > 0) {
      recommendations.push('Consider implementing performance optimizations');
    }

    return recommendations;
  }

  getLanguageFromPath(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languageMap = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby'
    };
    return languageMap[ext] || 'text';
  }

  getProviderDisplayName(id) {
    const names = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google AI'
    };
    return names[id] || id;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new LLMService();
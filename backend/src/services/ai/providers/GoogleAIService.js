// Google AI Provider Service
export default class GoogleAIService {
  constructor(apiKey) {
    if (!apiKey) {
      console.warn('Google AI API key not provided. Some functionality may be limited.');
    }
    
    this.apiKey = apiKey;
    this.baseUrl = process.env.GOOGLE_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
    
    this.models = [
      {
        id: process.env.GOOGLE_GEMINI_PRO_MODEL_ID || 'gemini-pro',
        name: process.env.GOOGLE_GEMINI_PRO_MODEL_NAME || 'Gemini Pro',
        displayName: process.env.GOOGLE_GEMINI_PRO_DISPLAY_NAME || 'Gemini Pro',
        maxTokens: parseInt(process.env.GOOGLE_GEMINI_PRO_MAX_TOKENS || '30720'),
        capabilities: ['chat', 'code-generation', 'code-analysis']
      },
      {
        id: process.env.GOOGLE_GEMINI_VISION_MODEL_ID || 'gemini-pro-vision',
        name: process.env.GOOGLE_GEMINI_VISION_MODEL_NAME || 'Gemini Pro Vision',
        displayName: process.env.GOOGLE_GEMINI_VISION_DISPLAY_NAME || 'Gemini Pro Vision',
        maxTokens: parseInt(process.env.GOOGLE_GEMINI_VISION_MAX_TOKENS || '30720'),
        capabilities: ['chat', 'code-generation', 'code-analysis', 'vision']
      }
    ];
  }

  async chatCompletion({ model, messages, userId, sessionId }) {
    try {
      const response = await this.makeRequest(`/models/${model}:generateContent`, {
        contents: [{
          parts: [{
            text: messages.map(msg => `${msg.type}: ${msg.content}`).join('\n')
          }]
        }]
      });

      const content = response.candidates[0]?.content?.parts[0]?.text || '';
      const usage = response.usageMetadata || {};

      return {
        content,
        usage: {
          prompt_tokens: usage.promptTokenCount || 0,
          completion_tokens: usage.candidatesTokenCount || 0,
          total_tokens: usage.totalTokenCount || 0
        },
        model,
        provider: 'google',
        metadata: {
          sessionId,
          userId,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Google AI API Error:', error);
      throw new Error(`Google AI API Error: ${error.message}`);
    }
  }

  async codeGeneration({ model, prompt, language, userId, sessionId }) {
    const enhancedPrompt = `As an expert ${language} developer, generate clean, well-documented, production-ready code for: ${prompt}`;
    
    try {
      const response = await this.makeRequest(`/models/${model}:generateContent`, {
        contents: [{
          parts: [{
            text: enhancedPrompt
          }]
        }]
      });

      const content = response.candidates[0]?.content?.parts[0]?.text || '';
      const usage = response.usageMetadata || {};

      return {
        code: content,
        language,
        usage: {
          prompt_tokens: usage.promptTokenCount || 0,
          completion_tokens: usage.candidatesTokenCount || 0,
          total_tokens: usage.totalTokenCount || 0
        },
        model,
        provider: 'google',
        metadata: {
          sessionId,
          userId,
          timestamp: new Date().toISOString(),
          type: 'code-generation'
        }
      };
    } catch (error) {
      console.error('Google AI Code Generation Error:', error);
      throw new Error(`Google AI Code Generation Error: ${error.message}`);
    }
  }

  async codeAnalysis({ model, code, language, userId, sessionId }) {
    const analysisPrompt = `Analyze this ${language} code for bugs, security issues, performance optimizations, and best practices:

\`\`\`${language}
${code}
\`\`\`

Provide specific, actionable feedback with examples.`;

    try {
      const response = await this.makeRequest(`/models/${model}:generateContent`, {
        contents: [{
          parts: [{
            text: analysisPrompt
          }]
        }]
      });

      const content = response.candidates[0]?.content?.parts[0]?.text || '';
      const usage = response.usageMetadata || {};

      return {
        analysis: content,
        language,
        usage: {
          prompt_tokens: usage.promptTokenCount || 0,
          completion_tokens: usage.candidatesTokenCount || 0,
          total_tokens: usage.totalTokenCount || 0
        },
        model,
        provider: 'google',
        metadata: {
          sessionId,
          userId,
          timestamp: new Date().toISOString(),
          type: 'code-analysis'
        }
      };
    } catch (error) {
      console.error('Google AI Code Analysis Error:', error);
      throw new Error(`Google AI Code Analysis Error: ${error.message}`);
    }
  }

  async makeRequest(endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Google AI API request failed');
    }

    return await response.json();
  }

  async getModels() {
    return this.models;
  }

  async validateConnection() {
    try {
      // Simple validation request
      await this.makeRequest('/models/gemini-pro:generateContent', {
        contents: [{
          parts: [{
            text: 'test'
          }]
        }]
      });
      return { status: 'connected', provider: 'google' };
    } catch (error) {
      return { status: 'error', provider: 'google', error: error.message };
    }
  }
}
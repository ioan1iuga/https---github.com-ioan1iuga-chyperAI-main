// OpenAI Provider Service
import OpenAI from 'openai';

export default class OpenAIService {
  constructor(apiKey) {
    if (!apiKey) {
      console.warn('OpenAI API key not provided. Some functionality may be limited.');
    }
    
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: process.env.OPENAI_API_BASE_URL,
      timeout: parseInt(process.env.OPENAI_API_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.OPENAI_API_MAX_RETRIES || '2')
    });
    
    this.models = [
      {
        id: process.env.OPENAI_GPT4_MODEL_ID || 'gpt-4',
        name: process.env.OPENAI_GPT4_MODEL_NAME || 'GPT-4',
        displayName: process.env.OPENAI_GPT4_DISPLAY_NAME || 'GPT-4',
        maxTokens: parseInt(process.env.OPENAI_GPT4_MAX_TOKENS || '8192'),
        capabilities: ['chat', 'code-generation', 'code-analysis']
      },
      {
        id: process.env.OPENAI_GPT35_MODEL_ID || 'gpt-3.5-turbo',
        name: process.env.OPENAI_GPT35_MODEL_NAME || 'GPT-3.5 Turbo',
        displayName: process.env.OPENAI_GPT35_DISPLAY_NAME || 'GPT-3.5 Turbo',
        maxTokens: parseInt(process.env.OPENAI_GPT35_MAX_TOKENS || '4096'),
        capabilities: ['chat', 'code-generation', 'code-analysis']
      }
    ];
  }

  async chatCompletion({ model, messages, userId, sessionId }) {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: messages.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 2000
      });

      return {
        content: response.choices[0].message.content,
        usage: response.usage,
        model: response.model,
        provider: 'openai',
        metadata: {
          sessionId,
          userId,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error(`OpenAI API Error: ${error.message}`);
    }
  }

  async codeGeneration({ model, prompt, language, userId, sessionId }) {
    const systemPrompt = `You are an expert ${language} developer. Generate clean, well-documented, production-ready code based on the following requirements:`;
    
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 3000
      });

      return {
        code: response.choices[0].message.content,
        language,
        usage: response.usage,
        model: response.model,
        provider: 'openai',
        metadata: {
          sessionId,
          userId,
          timestamp: new Date().toISOString(),
          type: 'code-generation'
        }
      };
    } catch (error) {
      console.error('OpenAI Code Generation Error:', error);
      throw new Error(`OpenAI Code Generation Error: ${error.message}`);
    }
  }

  async codeAnalysis({ model, code, language, userId, sessionId }) {
    const systemPrompt = `You are an expert code reviewer. Analyze the following ${language} code for:
1. Bugs and potential issues
2. Performance optimizations
3. Security vulnerabilities
4. Best practice improvements
5. Code quality suggestions

Provide specific, actionable feedback with examples.`;

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `\`\`\`${language}\n${code}\n\`\`\`` }
        ],
        temperature: 0.1,
        max_tokens: 2500
      });

      return {
        analysis: response.choices[0].message.content,
        language,
        usage: response.usage,
        model: response.model,
        provider: 'openai',
        metadata: {
          sessionId,
          userId,
          timestamp: new Date().toISOString(),
          type: 'code-analysis'
        }
      };
    } catch (error) {
      console.error('OpenAI Code Analysis Error:', error);
      throw new Error(`OpenAI Code Analysis Error: ${error.message}`);
    }
  }

  async getModels() {
    return this.models;
  }

  async validateConnection() {
    try {
      await this.client.models.list();
      return { status: 'connected', provider: 'openai' };
    } catch (error) {
      return { status: 'error', provider: 'openai', error: error.message };
    }
  }
}
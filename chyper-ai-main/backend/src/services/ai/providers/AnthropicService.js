// Anthropic Provider Service
export default class AnthropicService {
  /** @param {string} apiKey
   *  @param {object} [env]   – optional injection for non-Node runtimes */
  constructor(apiKey, env = import.meta?.env ?? {}) {
    if (!apiKey) {
      console.warn('Anthropic API key not provided. Some functionality may be limited.');
    }
    
    this.apiKey  = apiKey;
    this.baseUrl = env.VITE_ANTHROPIC_API_BASE_URL || 'https://api.anthropic.com/v1';
    
    const makeModel = (id, name, cap = 4096) => ({
      id, name, displayName: name, maxTokens: cap,
      capabilities: ['chat', 'code-generation', 'code-analysis'],
    });
    
    /** static cache so we don't re-allocate every "new" */
    if (!AnthropicService._models) {
      AnthropicService._models = [
        makeModel(env.VITE_ANTHROPIC_OPUS_MODEL_ID  || 'claude-3-opus-20240229',  'Claude 3 Opus',   16000),
        makeModel(env.VITE_ANTHROPIC_SONNET_MODEL_ID|| 'claude-3-sonnet-20240229','Claude 3 Sonnet',  16000),
        makeModel(env.VITE_ANTHROPIC_HAIKU_MODEL_ID || 'claude-3-haiku-20240307', 'Claude 3 Haiku',    4096),
      ];
    }
  }

  /** ---------------- public helpers --------------- */

  get models() { return AnthropicService._models; }

  async initialize() {
    // Optionally verify token: await this.getCurrentUser().catch(() => this.clearToken());
  }

  async chatCompletion({ model, messages, system = '', ...meta }) {
    const body = {
      model,
      max_tokens: 2000,
      system,
      messages: messages.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content })),
    };
    const res = await this._post('/messages', body);
    return this._shapeChat(res, meta, 'chat');
  }

  async codeGeneration({ model, prompt, language, ...meta }) {
    const res = await this._post('/messages', {
      model,
      max_tokens: 3000,
      system: `You are an expert ${language} developer. Generate clean, well-documented, production-ready code based on the following requirements:`,
      messages: [{ role: 'user', content: prompt }],
    });
    return this._shapeChat(res, { ...meta, language }, 'code-generation', 'code');
  }

  async codeAnalysis({ model, code, language, ...meta }) {
    const res = await this._post('/messages', {
      model,
      max_tokens: 2500,
      system: `You are an expert code reviewer. Analyse the following ${language} code …`,
      messages: [{ role: 'user', content: `\`\`\`${language}\n${code}\n\`\`\`` }],
    });
    return this._shapeChat(res, { ...meta, language }, 'code-analysis', 'analysis');
  }

  /** ---------------- internal --------------- */

  async _post(endpoint, data, attempt = 0) {
    const resp = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
        'x-api-key': this.apiKey,   // some envs lowercase headers
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(data),
    });

    if (resp.status === 429 && attempt < 2) {
      const wait = Number(resp.headers.get('Retry-After') || 2) * 1000;
      await new Promise(r => setTimeout(r, wait));
      return this._post(endpoint, data, attempt + 1);
    }
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `Anthropic API ${resp.status}`);
    }
    return resp.json();
  }

  _shapeChat(raw, meta, type, key = 'content') {
    const block = Array.isArray(raw.content) ? raw.content.find(b => b.type === 'text') : null;
    const text = block?.text ?? '[No text content]';
    return {
      [key]: text,
      usage: {
        prompt_tokens: raw.usage?.input_tokens ?? 0,
        completion_tokens: raw.usage?.output_tokens ?? 0,
        total_tokens: (raw.usage?.input_tokens ?? 0) + (raw.usage?.output_tokens ?? 0),
      },
      model: raw.model,
      provider: 'anthropic',
      metadata: { ...meta, type, timestamp: new Date().toISOString() },
    };
  }

  // Get the repository by name
  async getRepository(name) {
    if (!this.username) await this.getCurrentUser();
    return this.request(`/repos/${this.username}/${name}`);
  }

  async validateConnection() {
    try {
      await this._post('/messages', {
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      });
      return { status: 'connected', provider: 'anthropic' };
    } catch (e) {
      return { status: 'error', provider: 'anthropic', error: e.message };
    }
  }
}
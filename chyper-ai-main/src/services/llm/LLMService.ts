// LLM Service for AI Development Assistant
import { LLMProvider, ProjectContext, CodeSuggestion, CodeBlock } from '../../types/ai';

interface LLMResponse {
  content: string;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  codeBlocks?: CodeBlock[];
  suggestions?: CodeSuggestion[];
}

interface CodeGenerationResponse {
  code: string;
  explanation?: string;
  language: string;
}

interface CodeAnalysisResponse {
  suggestions: CodeSuggestion[];
  issues: Array<{
    type: string;
    severity: string;
    message: string;
    line?: number;
  }>;
}

export class LLMService {
  private static apiKeys: Record<string, string> = {};
  
  static setApiKey(provider: string, apiKey: string) {
    this.apiKeys[provider] = apiKey;
  }

  static async chat(
    message: string,
    provider: LLMProvider,
    model: string,
    context?: ProjectContext | null,
    files?: string[]
  ): Promise<LLMResponse> {
    try {
      // Prepare the request
      const requestData = {
        message,
        provider: provider.id,
        model,
        context,
        files
      };
      
      // Make the API call
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKeys[provider.id] || ''}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error in LLM chat service:', error);
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }

  static async generateCode(
    prompt: string,
    language: string,
    provider: LLMProvider,
    model: string
  ): Promise<CodeGenerationResponse> {
    try {
      // Prepare the request
      const requestData = {
        prompt,
        language,
        provider: provider.id,
        model
      };
      
      // Make the API call
      const response = await fetch('/api/ai/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKeys[provider.id] || ''}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`Code generation API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error in code generation service:', error);
      throw new Error(`Failed to generate code: ${error.message}`);
    }
  }

  static async analyzeCode(
    code: string,
    language: string,
    provider: LLMProvider,
    model: string
  ): Promise<CodeAnalysisResponse> {
    try {
      // Prepare the request
      const requestData = {
        code,
        language,
        provider: provider.id,
        model
      };
      
      // Make the API call
      const response = await fetch('/api/ai/analyze-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKeys[provider.id] || ''}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`Code analysis API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error in code analysis service:', error);
      throw new Error(`Failed to analyze code: ${error.message}`);
    }
  }

  static async reviewCode(
    filePath: string,
    code: string,
    provider: LLMProvider,
    model: string
  ): Promise<CodeAnalysisResponse> {
    try {
      // Prepare the request
      const requestData = {
        filePath,
        code,
        provider: provider.id,
        model
      };
      
      // Make the API call
      const response = await fetch('/api/ai/review-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKeys[provider.id] || ''}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`Code review API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in code review service:', error);
      throw new Error(`Failed to review code: ${error.message}`);
    }
  }

}
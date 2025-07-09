// AI API Client for handling communication with AI services
import { logger } from '../../utils/errorHandling';

// Additional global declarations for the MasterChatAgent
interface Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
  AIApiClient: any;
}

// Ensure TypeScript knows about speechSynthesis
interface Window {
  speechSynthesis: SpeechSynthesis;
}

// Ensure the SpeechRecognition interface is available
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: (event: Event) => void;
  onsoundstart: (event: Event) => void;
  onspeechstart: (event: Event) => void;
  onspeechend: (event: Event) => void;
  onsoundend: (event: Event) => void;
  onaudioend: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onnomatch: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionError) => void;
  onstart: (event: Event) => void;
  onend: (event: Event) => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: any;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

class AIApiClient {
  private baseUrl: string;
  private authToken?: string;
  private supabaseUrl: string | null;
  private supabaseKey: string | null;

  constructor() {
    // Always use relative paths or Supabase URL
    this.baseUrl = '';
    this.authToken = localStorage.getItem('authToken') || '';
    
    // Get Supabase configuration
    try {
      this.supabaseUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || null;
      this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || null; 
      
      logger.debug('AIApiClient initialized', {
        hasSupabaseUrl: !!this.supabaseUrl,
        hasSupabaseKey: !!this.supabaseKey,
        hasAuthToken: !!this.authToken
      });
    } catch (error) {
      // Handle errors when environment variables are not available
      logger.error('Environment variables not available:', error);
      this.supabaseUrl = null;
      this.supabaseKey = null;
    }
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token: string): void {
    if (token && typeof token === 'string') {
      this.authToken = token;
      localStorage.setItem('authToken', token);
      logger.debug('Auth token set for AI API client');
    }
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authToken = undefined;
    localStorage.removeItem('authToken');
    logger.debug('Auth token cleared from AI API client');
  }

  /**
   * Make a request to the AI API
   */
  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      // Determine the full URL based on environment
      let url = endpoint;
      
      // If we have a Supabase Functions URL and this is a relative path
      if (this.supabaseUrl && !endpoint.startsWith('http')) {
        url = `${this.supabaseUrl}/${endpoint.replace(/^\/+/, '')}`;
      }
      
      // Add authentication headers if we have a token
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }
      
      if (this.supabaseKey) {
        headers['apikey'] = this.supabaseKey;
      }
      
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json() as T;
      } else {
        return await response.text() as unknown as T;
      }
    } catch (error) {
      logger.error('AIApiClient request failed', { 
        endpoint, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Generate code using AI
   */
  async generateCode(params: {
    prompt: string;
    language: string;
    context?: string;
  }): Promise<any> {
    return this.request('ai/generate-code', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  /**
   * Analyze code using AI
   */
  async analyzeCode(params: {
    code: string;
    language: string;
    analysisType: string;
  }): Promise<any> {
    return this.request('ai/analyze-code', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  /**
   * Send chat message to AI
   */
  async chatCompletion(params: {
    messages: Array<{ role: string; content: string }>;
    model: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<any> {
    return this.request('ai/chat', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }
  
  /**
   * Process voice input using Speech Recognition API
   */
  startVoiceRecognition(onResult: (transcript: string) => void, onError: (error: Error) => void): { stop: () => void } {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      onError(new Error('Speech recognition not supported in this browser'));
      return { stop: () => {} };
    }
    
    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let finalTranscript = '';
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
          onResult(finalTranscript);
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
    };
    
    recognition.onerror = (event) => {
      onError(new Error(`Speech recognition error: ${event.error}`));
    };
    
    recognition.start();
    
    // Return stop function
    return {
      stop: () => {
        recognition.stop();
      }
    };
  }
  
  /**
   * Text-to-speech synthesis
   */
  speakText(text: string, options: { voice?: string, rate?: number, pitch?: number } = {}): void {
    if (!window.speechSynthesis) {
      logger.error('Speech synthesis not supported in this browser');
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice if specified
    if (options.voice) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.name === options.voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }
    
    // Set rate and pitch if specified
    if (options.rate) utterance.rate = options.rate;
    if (options.pitch) utterance.pitch = options.pitch;
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
  }
}

const instance = new AIApiClient();

// Make AIApiClient available globally for debugging
if (typeof window !== 'undefined') {
  window.AIApiClient = instance;
}

export default instance;
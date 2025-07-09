import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/errorHandling';

// Define types
export interface AISession {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  modelId: string;
  providerId: string;
  messages: AIMessage[];
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  contextSize: number;
  isAvailable: boolean;
}

export interface AIProvider {
  id: string;
  name: string;
  models: string[]; // Model IDs
  isConfigured: boolean;
}

interface AIContextType {
  sessions: AISession[];
  activeSession: AISession | null;
  activeProvider: AIProvider | null;
  availableProviders: AIProvider[];
  availableModels: AIModel[];
  currentModel: AIModel | null;
  isProcessing: boolean;
  
  // Session management
  createSession: (projectId: string, name: string) => AISession;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  
  // Message handling
  sendMessage: (content: string, sessionId?: string) => Promise<AIMessage>;
  
  // Provider and model management
  setActiveProvider: (providerId: string) => void;
  setCurrentModel: (modelId: string) => void;
  configureProvider: (providerId: string, config: any) => Promise<boolean>;
}

const AIContext = createContext<AIContextType | null>(null);

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export const AIProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [activeSession, setActiveSession] = useState<AISession | null>(null);
  const [availableProviders, setAvailableProviders] = useState<AIProvider[]>([]);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [activeProvider, setActiveProviderState] = useState<AIProvider | null>(null);
  const [currentModel, setCurrentModelState] = useState<AIModel | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Initialize providers and models on mount
  useEffect(() => {
    initializeAI();
  }, []);

  const initializeAI = () => {
    // Set up default providers
    const providers: AIProvider[] = [
      {
        id: 'openai',
        name: 'OpenAI',
        models: ['gpt-4', 'gpt-3.5-turbo'],
        isConfigured: true
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        models: ['claude-3-opus', 'claude-3-sonnet'],
        isConfigured: true
      },
      {
        id: 'google',
        name: 'Google AI',
        models: ['gemini-pro', 'gemini-ultra'],
        isConfigured: false
      }
    ];
    
    // Set up default models
    const models: AIModel[] = [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        capabilities: ['code-generation', 'reasoning', 'instruction-following'],
        contextSize: 8192,
        isAvailable: true
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        capabilities: ['code-generation', 'instruction-following'],
        contextSize: 4096,
        isAvailable: true
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        capabilities: ['code-generation', 'reasoning', 'instruction-following'],
        contextSize: 100000,
        isAvailable: true
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        capabilities: ['code-generation', 'reasoning', 'instruction-following'],
        contextSize: 100000,
        isAvailable: true
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'google',
        capabilities: ['code-generation', 'reasoning'],
        contextSize: 32768,
        isAvailable: false
      },
      {
        id: 'gemini-ultra',
        name: 'Gemini Ultra',
        provider: 'google',
        capabilities: ['code-generation', 'reasoning', 'instruction-following'],
        contextSize: 32768,
        isAvailable: false
      }
    ];
    
    setAvailableProviders(providers);
    setAvailableModels(models);
    
    // Set default active provider and model
    const defaultProvider = providers.find(p => p.isConfigured) || providers[0];
    setActiveProviderState(defaultProvider);
    
    const defaultModel = models.find(m => m.provider === defaultProvider.id && m.isAvailable) || models[0];
    setCurrentModelState(defaultModel);
    
    // Load any saved sessions from localStorage
    try {
      const savedSessions = localStorage.getItem('chyper-ai-sessions');
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions);
        // Convert string timestamps back to Date objects for messages
        const processedSessions = parsedSessions.map((session: any) => ({
          ...session,
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setSessions(processedSessions);
      }
    } catch (error) {
      logger.error('Error loading AI sessions', error);
    }
  };

  const createSession = (projectId: string, name: string): AISession => {
    const newSession: AISession = {
      id: uuidv4(),
      projectId,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      modelId: currentModel?.id || 'gpt-4',
      providerId: activeProvider?.id || 'openai',
      messages: [
        {
          id: uuidv4(),
          role: 'system',
          content: 'I am an AI assistant that helps with coding, development, and project management.',
          timestamp: new Date()
        }
      ]
    };
    
    setSessions(prev => [...prev, newSession]);
    setActiveSession(newSession);
    
    // Persist to localStorage
    try {
      localStorage.setItem('chyper-ai-sessions', JSON.stringify([...sessions, newSession]));
    } catch (error) {
      logger.error('Error saving AI session', error);
    }
    
    logger.info('Created new AI session', { sessionId: newSession.id, projectId });
    return newSession;
  };

  const loadSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSession(session);
      logger.info('Loaded AI session', { sessionId });
    } else {
      logger.error('Session not found', { sessionId });
    }
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    
    if (activeSession?.id === sessionId) {
      setActiveSession(null);
    }
    
    // Update localStorage
    try {
      localStorage.setItem('chyper-ai-sessions', JSON.stringify(sessions.filter(s => s.id !== sessionId)));
    } catch (error) {
      logger.error('Error updating AI sessions', error);
    }
    
    logger.info('Deleted AI session', { sessionId });
  };

  const sendMessage = async (content: string, sessionId?: string): Promise<AIMessage> => {
    const targetSessionId = sessionId || activeSession?.id;
    
    if (!targetSessionId) {
      throw new Error('No active session');
    }
    
    setIsProcessing(true);
    
    try {
      // Create user message
      const userMessage: AIMessage = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: new Date()
      };
      
      // Add to session
      const updatedSessions = sessions.map(session => {
        if (session.id === targetSessionId) {
          return {
            ...session,
            messages: [...session.messages, userMessage],
            updatedAt: new Date().toISOString()
          };
        }
        return session;
      });
      
      setSessions(updatedSessions);
      
      if (activeSession?.id === targetSessionId) {
        setActiveSession({
          ...activeSession,
          messages: [...activeSession.messages, userMessage],
          updatedAt: new Date().toISOString()
        });
      }
      
      // In a real implementation, this would call the AI API
      // For now, simulate a response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create AI response
      const aiResponse: AIMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `I've received your message: "${content}". I'll help you with that.`,
        timestamp: new Date()
      };
      
      // Add to session
      const finalSessions = updatedSessions.map(session => {
        if (session.id === targetSessionId) {
          return {
            ...session,
            messages: [...session.messages, aiResponse],
            updatedAt: new Date().toISOString()
          };
        }
        return session;
      });
      
      setSessions(finalSessions);
      
      if (activeSession?.id === targetSessionId) {
        setActiveSession({
          ...activeSession,
          messages: [...activeSession.messages, userMessage, aiResponse],
          updatedAt: new Date().toISOString()
        });
      }
      
      // Persist to localStorage
      try {
        localStorage.setItem('chyper-ai-sessions', JSON.stringify(finalSessions));
      } catch (error) {
        logger.error('Error saving AI messages', error);
      }
      
      logger.info('Sent message to AI', { sessionId: targetSessionId });
      return aiResponse;
    } catch (error) {
      logger.error('Error sending message to AI', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const setActiveProvider = (providerId: string) => {
    const provider = availableProviders.find(p => p.id === providerId);
    if (provider) {
      setActiveProviderState(provider);
      
      // Also update current model if needed
      if (!currentModel || currentModel.provider !== providerId) {
        const providerModel = availableModels.find(m => m.provider === providerId && m.isAvailable);
        if (providerModel) {
          setCurrentModelState(providerModel);
        }
      }
      
      logger.info('Set active AI provider', { providerId });
    }
  };

  const setCurrentModel = (modelId: string) => {
    const model = availableModels.find(m => m.id === modelId);
    if (model) {
      setCurrentModelState(model);
      logger.info('Set current AI model', { modelId });
    }
  };

  const configureProvider = async (providerId: string, config: any): Promise<boolean> => {
    try {
      // In a real implementation, this would validate and store API keys
      const updatedProviders = availableProviders.map(provider => {
        if (provider.id === providerId) {
          return {
            ...provider,
            isConfigured: true
          };
        }
        return provider;
      });
      
      setAvailableProviders(updatedProviders);
      
      // Update models availability
      const updatedModels = availableModels.map(model => {
        if (model.provider === providerId) {
          return {
            ...model,
            isAvailable: true
          };
        }
        return model;
      });
      
      setAvailableModels(updatedModels);
      
      logger.info('Configured AI provider', { providerId });
      return true;
    } catch (error) {
      logger.error('Error configuring AI provider', error);
      return false;
    }
  };

  const value: AIContextType = {
    sessions,
    activeSession,
    activeProvider,
    availableProviders,
    availableModels,
    currentModel,
    isProcessing,
    
    createSession,
    loadSession,
    deleteSession,
    
    sendMessage,
    
    setActiveProvider,
    setCurrentModel,
    configureProvider
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};

export default AIProvider;
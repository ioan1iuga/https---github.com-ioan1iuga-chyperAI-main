// Mock data for development mode
// This file provides fallback data when APIs are not available

import { v4 as uuidv4 } from 'uuid';

/**
 * Mock projects for development
 */
export const mockProjects = [
  {
    id: uuidv4(),
    name: 'E-commerce Platform',
    description: 'Full-stack e-commerce application with React frontend and Node.js backend',
    framework: 'React',
    status: 'active',
    environment: 'development',
    deployments: [],
    lastModified: '2 hours ago',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago
  },
  {
    id: uuidv4(),
    name: 'Personal Blog',
    description: 'A simple blog built with Next.js and Tailwind CSS',
    framework: 'Next.js',
    status: 'active',
    environment: 'development',
    deployments: [],
    lastModified: '1 day ago',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
  },
  {
    id: uuidv4(),
    name: 'Task Manager',
    description: 'A simple task manager with React and Firebase',
    framework: 'React',
    status: 'active',
    environment: 'development',
    deployments: [],
    lastModified: 'just now',
    createdAt: new Date()
  }
];

/**
 * Mock AI providers for development
 */
export const mockProviders = [
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'openai',
    status: 'connected',
    models: [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        displayName: 'GPT-4',
        maxTokens: 8192,
        inputCost: 0.03,
        outputCost: 0.06,
        capabilities: [
          { type: 'code-generation', supported: true },
          { type: 'code-analysis', supported: true },
          { type: 'chat', supported: true },
          { type: 'function-calling', supported: true }
        ]
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        displayName: 'GPT-3.5 Turbo',
        maxTokens: 4096,
        inputCost: 0.0015,
        outputCost: 0.002,
        capabilities: [
          { type: 'code-generation', supported: true },
          { type: 'code-analysis', supported: true },
          { type: 'chat', supported: true },
          { type: 'function-calling', supported: true }
        ]
      }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    type: 'anthropic',
    status: 'connected',
    models: [
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        displayName: 'Claude 3 Opus',
        maxTokens: 200000,
        inputCost: 0.015,
        outputCost: 0.075,
        capabilities: [
          { type: 'code-generation', supported: true },
          { type: 'code-analysis', supported: true },
          { type: 'chat', supported: true }
        ]
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        displayName: 'Claude 3 Sonnet',
        maxTokens: 200000,
        inputCost: 0.003,
        outputCost: 0.015,
        capabilities: [
          { type: 'code-generation', supported: true },
          { type: 'code-analysis', supported: true },
          { type: 'chat', supported: true }
        ]
      }
    ]
  }
];

/**
 * Mock AI response for chat messages
 */
export const generateMockResponse = (message: string) => {
  const responses = [
    "I've analyzed your request and I'm ready to help. This is a mock response in development mode.",
    "Great question! In a production environment, I would connect to an actual AI model to generate a response.",
    "I understand what you're asking for. Here's a simulated response while we're in development mode.",
    "Thanks for your query. This is a placeholder response that would be replaced with real AI in production."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

/**
 * Mock usage statistics
 */
export const mockUsageStats = {
  tokens: {
    used: 12345,
    limit: 100000
  },
  requests: {
    used: 42,
    limit: 1000
  },
  cost: '$0.83',
  usageByModel: {
    'gpt-4': 8765,
    'gpt-3.5-turbo': 3580
  }
};
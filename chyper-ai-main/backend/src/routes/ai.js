import express from 'express';
import { body, validationResult } from 'express-validator';

// Get environment variables for AI configuration
// Force connected status for development to avoid frontend errors
const OPENAI_STATUS = process.env.MOCK_OPENAI_STATUS || process.env.OPENAI_API_KEY ? 'connected' : 'disconnected';
const ANTHROPIC_STATUS = process.env.MOCK_ANTHROPIC_STATUS || process.env.ANTHROPIC_API_KEY ? 'connected' : 'disconnected';

const router = express.Router();

// Set up middleware for logging AI route access
router.use((req, res, next) => {
  console.log(`AI API Request: ${req.method} ${req.path}`);
  next();
});

// Middleware to handle CORS
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ALLOW_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', process.env.CORS_ALLOW_METHODS || 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', process.env.CORS_ALLOW_HEADERS || 'Content-Type, Authorization, X-Requested-With, X-API-Key, apikey');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// Mock AI providers and models data
const mockProviders = [
  {
    id: process.env.OPENAI_PROVIDER_ID || 'openai',
    name: process.env.OPENAI_PROVIDER_NAME || 'OpenAI',
    type: process.env.OPENAI_PROVIDER_TYPE || 'openai',
    status: OPENAI_STATUS,
    models: [
      {
        id: process.env.OPENAI_GPT4_MODEL_ID || 'gpt-4',
        name: process.env.OPENAI_GPT4_MODEL_NAME || 'GPT-4',
        displayName: process.env.OPENAI_GPT4_DISPLAY_NAME || 'GPT-4',
        maxTokens: parseInt(process.env.OPENAI_GPT4_MAX_TOKENS || '8192'),
        inputCost: parseFloat(process.env.OPENAI_GPT4_INPUT_COST || '0.03'),
        outputCost: parseFloat(process.env.OPENAI_GPT4_OUTPUT_COST || '0.06'),
        capabilities: [
          { type: 'code-generation', supported: true },
          { type: 'code-analysis', supported: true },
          { type: 'chat', supported: true },
          { type: 'function-calling', supported: true }
        ]
      },
      {
        id: process.env.OPENAI_GPT35_MODEL_ID || 'gpt-3.5-turbo',
        name: process.env.OPENAI_GPT35_MODEL_NAME || 'GPT-3.5 Turbo',
        displayName: process.env.OPENAI_GPT35_DISPLAY_NAME || 'GPT-3.5 Turbo',
        maxTokens: parseInt(process.env.OPENAI_GPT35_MAX_TOKENS || '4096'),
        inputCost: parseFloat(process.env.OPENAI_GPT35_INPUT_COST || '0.0015'),
        outputCost: parseFloat(process.env.OPENAI_GPT35_OUTPUT_COST || '0.002'),
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
    id: process.env.ANTHROPIC_PROVIDER_ID || 'anthropic',
    name: process.env.ANTHROPIC_PROVIDER_NAME || 'Anthropic',
    type: process.env.ANTHROPIC_PROVIDER_TYPE || 'anthropic',
    status: ANTHROPIC_STATUS,
    models: [
      {
        id: process.env.ANTHROPIC_OPUS_MODEL_ID || 'claude-3-opus',
        name: process.env.ANTHROPIC_OPUS_MODEL_NAME || 'Claude 3 Opus',
        displayName: process.env.ANTHROPIC_OPUS_DISPLAY_NAME || 'Claude 3 Opus',
        maxTokens: parseInt(process.env.ANTHROPIC_OPUS_MAX_TOKENS || '200000'),
        inputCost: parseFloat(process.env.ANTHROPIC_OPUS_INPUT_COST || '0.015'),
        outputCost: parseFloat(process.env.ANTHROPIC_OPUS_OUTPUT_COST || '0.075'),
        capabilities: [
          { type: 'code-generation', supported: true },
          { type: 'code-analysis', supported: true },
          { type: 'chat', supported: true }
        ]
      },
      {
        id: process.env.ANTHROPIC_SONNET_MODEL_ID || 'claude-3-sonnet',
        name: process.env.ANTHROPIC_SONNET_MODEL_NAME || 'Claude 3 Sonnet',
        displayName: process.env.ANTHROPIC_SONNET_DISPLAY_NAME || 'Claude 3 Sonnet',
        maxTokens: parseInt(process.env.ANTHROPIC_SONNET_MAX_TOKENS || '200000'),
        inputCost: parseFloat(process.env.ANTHROPIC_SONNET_INPUT_COST || '0.003'),
        outputCost: parseFloat(process.env.ANTHROPIC_SONNET_OUTPUT_COST || '0.015'),
        capabilities: [
          { type: 'code-generation', supported: true },
          { type: 'code-analysis', supported: true },
          { type: 'chat', supported: true }
        ]
      }
    ]
  }
];

// GET and POST methods for AI models
router.get('/models', getAIModels); 
router.post('/models', getAIModels);

// Health check endpoint for AI service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'online',
      models: OPENAI_STATUS === 'connected' ? ['gpt-3.5-turbo', 'gpt-4'] : [],
      timestamp: new Date().toISOString()
    }
  });
});

// Usage statistics endpoint
router.get('/usage', (req, res) => {
  res.json({
    success: true,
    data: {
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
    }
  });
});

function getAIModels(req, res) {
  try {
    console.log(`${req.method} request to AI models endpoint`);
    
    // Add user ID to response for debugging in dev mode
    const userInfo = req.user ? 
      { userId: req.user.id, role: req.user.role } : 
      { userId: 'anonymous', role: 'anonymous' };
    
    const response = {
      success: true,
      data: {
        providers: mockProviders,
        defaultProvider: 'openai',
        defaultModel: 'gpt-3.5-turbo',
        user: process.env.NODE_ENV === 'development' ? userInfo : undefined
      }
    };
    
    console.log('Returning AI models data');
    res.json(response);
    
  } catch (error) {
    console.error('Error fetching AI models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI models'
    });
  }
}

// Handle chat completion - supports both GET and POST
router.get('/chat', handleChatCompletion);
router.post('/chat', [
    body('message').notEmpty().withMessage('Message is required'),
    body('model').notEmpty().withMessage('Model is required'),
    body('provider').notEmpty().withMessage('Provider is required')
  ], handleChatCompletion);

// Handle streaming chat completion
router.get('/chat/stream', (req, res) => {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Get query parameters
  const { message, model, provider } = req.query;

  // Send initial message
  res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);

  // Simulate streaming chunks of text
  const responseChunks = [
    "I can help you ",
    "with that! ",
    "This is ",
    "a simulated ",
    "streaming response ",
    "for development purposes. ",
    "In production, ",
    "this would stream ",
    "tokens directly ",
    "from the AI model."
  ];

  let index = 0;
  const interval = setInterval(() => {
    if (index < responseChunks.length) {
      res.write(`data: ${JSON.stringify({ 
        type: 'chunk', 
        content: responseChunks[index],
        done: false
      })}\n\n`);
      index++;
    } else {
      res.write(`data: ${JSON.stringify({ 
        type: 'end',
        done: true,
        metadata: {
          usage: {
            prompt_tokens: 25,
            completion_tokens: 50,
            total_tokens: 75
          },
          model: model || 'gpt-3.5-turbo',
          provider: provider || 'openai'
        }
      })}\n\n`);
      clearInterval(interval);
      res.end();
    }
  }, 200);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});

function handleChatCompletion(req, res) {
  // Validate POST request body
  if (req.method === 'POST') {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
  }

  try {
    console.log(`${req.method} request to AI chat completion endpoint`);
    // Extract data from either body (POST) or query params (GET)
    const data = req.method === 'POST' ? req.body : req.query;
    
    // Mock response for now
    const response = {
      success: true,
      data: {
        content: "I can help you with that! This is a mock response until AI providers are fully configured.",
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        },
        model: data.model || 'gpt-3.5-turbo',
        provider: data.provider || 'openai',
        metadata: {
          sessionId: data.sessionId || 'default-session',
          timestamp: new Date().toISOString()
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in chat completion:', error);
    res.status(500).json({
      success: false,
      error: 'Chat completion failed'
    });
  } 
}

// Handle code generation - supports both GET and POST
router.get('/generate-code', handleGenerateCode);
router.post('/generate-code', [
    body('prompt').notEmpty().withMessage('Prompt is required'),
    body('language').notEmpty().withMessage('Language is required')
  ], handleGenerateCode);

function handleGenerateCode(req, res) {
  // Validate POST request body
  if (req.method === 'POST') {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
  }

  try {
    console.log(`${req.method} request to AI code generation endpoint from ${req.originalUrl}`);
    // Extract data from either body (POST) or query params (GET)
    const data = req.method === 'POST' ? req.body : req.query;
    
    // Mock response for now
    const response = {
      success: true,
      data: {
        code: `// Generated code for: ${data.prompt || 'Example'}\nfunction example() {\n  console.log("Hello world");\n  return true;\n}`,
        language: data.language || 'javascript',
        explanation: "This is a sample implementation generated by the AI assistant."
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in code generation:', error);
    res.status(500).json({
      success: false,
      error: 'Code generation failed'
    });
  } 
}

// Handle code analysis - supports both GET and POST
router.get('/analyze-code', handleAnalyzeCode);
router.post('/analyze-code', [
    body('code').notEmpty().withMessage('Code is required'),
    body('language').notEmpty().withMessage('Language is required')
  ], handleAnalyzeCode);

function handleAnalyzeCode(req, res) {
  // Validate POST request body
  if (req.method === 'POST') {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
  }

  try {
    console.log(`${req.method} request to AI code analysis endpoint from ${req.originalUrl}`);
    // Extract data from either body (POST) or query params (GET)
    const data = req.method === 'POST' ? req.body : req.query;
    
    // Mock response for now
    const response = {
      success: true,
      data: {
        suggestions: [
          {
            id: Date.now().toString(),
            type: 'optimization',
            title: 'Performance Improvement',
            description: 'Consider optimizing this code for better performance',
            code: 'const optimizedVersion = memoize(expensiveFunction);',
            language: data.language || 'javascript',
            confidence: 0.85
          }
        ],
        issues: [
          {
            type: 'warning',
            severity: 'medium',
            message: 'Potential performance issue detected',
            line: 42
          }
        ]
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in code analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Code analysis failed'
    });
  } 
}

export default router;
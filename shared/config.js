/**
 * Shared configuration for the entire application
 * This file is imported by both backend and serverless functions
 */

// Default configuration values
const defaultConfig = {
  // API base URLs
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
    version: process.env.API_VERSION || 'v1',
    timeout: parseInt(process.env.API_TIMEOUT || '30000'),
    retries: parseInt(process.env.API_RETRIES || '3')
  },
  
  // Authentication
  auth: {
    jwtExpiryTime: parseInt(process.env.JWT_EXPIRY_TIME || '3600'), // 1 hour
    refreshTokenExpiryTime: parseInt(process.env.REFRESH_TOKEN_EXPIRY_TIME || '2592000'), // 30 days
    tokenSecret: process.env.JWT_SECRET || 'your-jwt-secret-key'
  },
  
  // CORS settings
  cors: {
    allowOrigins: (process.env.CORS_ALLOW_ORIGIN || '*').split(','),
    allowMethods: (process.env.CORS_ALLOW_METHODS || 'GET,POST,PUT,DELETE,OPTIONS,PATCH').split(','),
    allowHeaders: (process.env.CORS_ALLOW_HEADERS || 'Content-Type,Authorization,X-Requested-With,X-API-Key').split(','),
    exposeHeaders: (process.env.CORS_EXPOSE_HEADERS || 'Content-Length,X-Request-Id').split(','),
    maxAge: parseInt(process.env.CORS_MAX_AGE || '86400')
  },
  
  // Database
  database: {
    url: process.env.DATABASE_URL || process.env.SUPABASE_URL,
    provider: process.env.DATABASE_PROVIDER || 'supabase'
  },
  
  // Deployment
  deployment: {
    providers: ['cloudflare', 'vercel', 'netlify'],
    domain: process.env.DEPLOYMENT_DOMAIN || 'chyper-workers.dev'
  },
  
  // AI configuration
  ai: {
    providers: {
      openai: {
        baseUrl: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
        apiKey: process.env.OPENAI_API_KEY,
        defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-3.5-turbo',
        modelIds: ['gpt-4', 'gpt-3.5-turbo'],
        timeout: parseInt(process.env.OPENAI_TIMEOUT || '60000')
      },
      anthropic: {
        baseUrl: process.env.ANTHROPIC_API_BASE_URL || 'https://api.anthropic.com/v1',
        apiKey: process.env.ANTHROPIC_API_KEY,
        defaultModel: process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-sonnet',
        modelIds: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || '60000')
      },
      google: {
        baseUrl: process.env.GOOGLE_AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1',
        apiKey: process.env.GOOGLE_AI_API_KEY,
        defaultModel: process.env.GOOGLE_AI_DEFAULT_MODEL || 'gemini-pro',
        modelIds: ['gemini-pro', 'gemini-pro-vision'],
        timeout: parseInt(process.env.GOOGLE_AI_TIMEOUT || '60000')
      }
    }
  },
  
  // Feature flags
  features: {
    enableWebSockets: process.env.ENABLE_WEBSOCKETS !== 'false',
    enableDeployments: process.env.ENABLE_DEPLOYMENTS !== 'false',
    enableAI: process.env.ENABLE_AI !== 'false',
    enableCollaboration: process.env.ENABLE_COLLABORATION !== 'false'
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    consoleLogging: process.env.CONSOLE_LOGGING !== 'false'
  },
  
  // Terminal
  terminal: {
    commandTimeout: parseInt(process.env.TERMINAL_COMMAND_TIMEOUT || '30000')
  },
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development' || process.env.ENVIRONMENT === 'development',
  isProduction: process.env.NODE_ENV === 'production' || process.env.ENVIRONMENT === 'production'
};

/**
 * Get configuration
 * @param {string} path - Dot-notation path to the config property
 * @param {any} defaultValue - Default value if the path is not found
 * @returns {any} The configuration value
 */
export function getConfig(path, defaultValue) {
  try {
    return path.split('.').reduce((acc, part) => acc && acc[part], defaultConfig) ?? defaultValue;
  } catch (error) {
    console.warn(`Config path not found: ${path}`);
    return defaultValue;
  }
}

/**
 * Get all configuration
 * @returns {Object} The entire configuration object
 */
export function getAllConfig() {
  return { ...defaultConfig };
}

/**
 * Override configuration values (useful for testing)
 * @param {Object} overrides - Configuration overrides
 */
export function overrideConfig(overrides) {
  Object.assign(defaultConfig, overrides);
}

export default { getConfig, getAllConfig, overrideConfig };
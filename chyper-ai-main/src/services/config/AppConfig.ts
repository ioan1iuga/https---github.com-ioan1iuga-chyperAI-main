import { logger } from '../../utils/errorHandling';

/**
 * Configuration manager for the application
 * Provides a unified way to access environment variables and configuration settings
 */
class AppConfig {
  // Database configuration
  readonly database = {
    provider: this.getEnv('VITE_DATABASE_PROVIDER', 'supabase') as 'supabase' | 'neon' | 'memory',
    supabase: {
      url: this.getEnv('VITE_SUPABASE_URL'),
      anonKey: this.getEnv('VITE_SUPABASE_ANON_KEY'),
      functionsUrl: this.getEnv('VITE_SUPABASE_FUNCTIONS_URL')
    },
    neon: {
      databaseUrl: this.getEnv('VITE_NEON_DATABASE_URL')
    }
  };

  // Deployment configuration
  readonly deployment = {
    provider: this.getEnv('VITE_DEFAULT_DEPLOYMENT_PROVIDER', 'netlify') as 'cloudflare' | 'netlify' | 'vercel',
    domain: this.getEnv('VITE_DEPLOYMENT_DOMAIN', 'chyper-workers.dev'),
    prefix: this.getEnv('VITE_DEPLOYMENT_PREFIX', ''),
    cloudflare: {
      apiToken: this.getEnv('VITE_CLOUDFLARE_API_TOKEN'),
      accountId: this.getEnv('VITE_CLOUDFLARE_ACCOUNT_ID')
    },
    netlify: {
      authToken: this.getEnv('VITE_NETLIFY_AUTH_TOKEN'),
      siteId: this.getEnv('VITE_NETLIFY_SITE_ID')
    },
    vercel: {
      authToken: this.getEnv('VITE_VERCEL_AUTH_TOKEN'),
      teamId: this.getEnv('VITE_VERCEL_TEAM_ID')
    }
  };

  // Backend configuration
  readonly backend = {
    url: this.getEnv('VITE_BACKEND_URL', 'http://localhost:3001'),
    proxyTimeout: parseInt(this.getEnv('VITE_PROXY_TIMEOUT', '60000')),
    apiVersion: this.getEnv('VITE_API_VERSION', 'v1')
  };

  // AI configuration
  readonly ai = {
    provider: this.getEnv('VITE_AI_PROVIDER', 'openai') as 'openai' | 'anthropic' | 'google',
    defaultModel: this.getEnv('VITE_DEFAULT_AI_MODEL'),
    openai: {
      apiKey: this.getEnv('VITE_OPENAI_API_KEY')
    },
    anthropic: {
      apiKey: this.getEnv('VITE_ANTHROPIC_API_KEY')
    },
    google: {
      apiKey: this.getEnv('VITE_GOOGLE_AI_API_KEY')
    }
  };

  // GitHub integration
  readonly github = {
    accessToken: this.getEnv('VITE_GITHUB_ACCESS_TOKEN')
  };

  // Feature flags
  readonly features = {
    enableVoiceRecording: this.getBooleanEnv('VITE_ENABLE_VOICE_RECORDING', true),
    enableFileUploads: this.getBooleanEnv('VITE_ENABLE_FILE_UPLOADS', true),
    enableDeployment: this.getBooleanEnv('VITE_ENABLE_DEPLOYMENT', true),
    enableGitHubIntegration: this.getBooleanEnv('VITE_ENABLE_GITHUB_INTEGRATION', true)
  };

  // Logging configuration
  readonly logging = {
    level: this.getEnv('VITE_LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',
    consoleLogging: this.getBooleanEnv('VITE_CONSOLE_LOGGING', true),
    debug: this.getBooleanEnv('VITE_DEBUG', false),
    debugAuth: this.getBooleanEnv('VITE_DEBUG_AUTH', false)
  };

  // Application environment
  readonly environment = {
    isDevelopment: import.meta.env.DEV || false,
    isProduction: import.meta.env.PROD || false,
    mode: import.meta.env.MODE as string
  };

  constructor() {
    // Log configuration on startup to aid debugging
    if (this.logging.debug) {
      logger.debug('App configuration loaded', {
        database: {
          ...this.database,
          supabase: {
            ...this.database.supabase,
            anonKey: this.database.supabase.anonKey ? '[REDACTED]' : undefined
          },
          neon: {
            databaseUrl: this.database.neon.databaseUrl ? '[REDACTED]' : undefined
          }
        }
      });
    }
  }

  /**
   * Get environment variable with fallback
   */
  private getEnv(key: string, fallback: string = ''): string {
    return import.meta.env[key] || fallback;
  }

  /**
   * Get boolean environment variable with fallback
   */
  private getBooleanEnv(key: string, fallback: boolean = false): boolean {
    const value = import.meta.env[key];
    if (value === undefined) return fallback;
    return value === 'true' || value === '1';
  }

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(type: 'database' | 'deployment' | 'ai', provider: string): boolean {
    switch (type) {
      case 'database':
        if (provider === 'supabase') {
          return !!this.database.supabase.url && !!this.database.supabase.anonKey;
        }
        if (provider === 'neon') {
          return !!this.database.neon.databaseUrl;
        }
        break;
      case 'deployment':
        if (provider === 'cloudflare') {
          return !!this.deployment.cloudflare.apiToken && !!this.deployment.cloudflare.accountId;
        }
        if (provider === 'netlify') {
          return !!this.deployment.netlify.authToken;
        }
        if (provider === 'vercel') {
          return !!this.deployment.vercel.authToken;
        }
        break;
      case 'ai':
        if (provider === 'openai') {
          return !!this.ai.openai.apiKey;
        }
        if (provider === 'anthropic') {
          return !!this.ai.anthropic.apiKey;
        }
        if (provider === 'google') {
          return !!this.ai.google.apiKey;
        }
        break;
    }
    
    return false;
  }
  
  /**
   * Get all configured providers for a type
   */
  getConfiguredProviders(type: 'database' | 'deployment' | 'ai'): string[] {
    const providers: string[] = [];
    
    switch (type) {
      case 'database':
        if (this.isProviderConfigured('database', 'supabase')) providers.push('supabase');
        if (this.isProviderConfigured('database', 'neon')) providers.push('neon');
        break;
      case 'deployment':
        if (this.isProviderConfigured('deployment', 'cloudflare')) providers.push('cloudflare');
        if (this.isProviderConfigured('deployment', 'netlify')) providers.push('netlify');
        if (this.isProviderConfigured('deployment', 'vercel')) providers.push('vercel');
        break;
      case 'ai':
        if (this.isProviderConfigured('ai', 'openai')) providers.push('openai');
        if (this.isProviderConfigured('ai', 'anthropic')) providers.push('anthropic');
        if (this.isProviderConfigured('ai', 'google')) providers.push('google');
        break;
    }
    
    return providers;
  }
}

// Export a singleton instance
export default new AppConfig();
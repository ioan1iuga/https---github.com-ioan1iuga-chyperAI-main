/**
 * Database Adapter Interface
 * 
 * This interface defines the common operations that any database provider
 * must implement. This allows the application to switch between different
 * database providers (Supabase, Neon, etc.) without changing the core logic.
 */

export interface DatabaseAdapter {
  /**
   * Initialize the database connection
   */
  initialize(): Promise<void>;
  
  /**
   * Check if the database connection is healthy
   */
  healthCheck(): Promise<boolean>;
  
  /**
   * Get the current provider name
   */
  getProviderName(): string;
  
  /**
   * Execute a query and return the results
   */
  query<T = any>(query: string, params?: any[]): Promise<T[]>;
  
  /**
   * Execute a query that returns a single row
   */
  queryOne<T = any>(query: string, params?: any[]): Promise<T | null>;
  
  /**
   * Execute a query that doesn't return results (INSERT, UPDATE, DELETE)
   */
  execute(query: string, params?: any[]): Promise<number>;
  
  /**
   * Begin a transaction
   */
  beginTransaction(): Promise<void>;
  
  /**
   * Commit a transaction
   */
  commitTransaction(): Promise<void>;
  
  /**
   * Rollback a transaction
   */
  rollbackTransaction(): Promise<void>;
  
  /**
   * Close the database connection
   */
  close(): Promise<void>;
}

/**
 * Database configuration options
 */
export interface DatabaseConfig {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  url?: string;
  ssl?: boolean;
  poolSize?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
  maxLifetime?: number;
  debug?: boolean;
  [key: string]: any; // Allow provider-specific options
}

/**
 * Database factory to create the appropriate adapter
 */
export class DatabaseFactory {
  /**
   * Create a database adapter for the specified provider
   */
  static createAdapter(provider: 'supabase' | 'neon' | 'planetscale', config: DatabaseConfig): DatabaseAdapter {
    switch (provider) {
      case 'supabase':
        // Dynamically import to avoid bundling all adapters
        return import('./adapters/SupabaseAdapter').then(module => {
          return new module.SupabaseAdapter(config);
        }) as unknown as DatabaseAdapter;
      
      case 'neon':
        return import('./adapters/NeonAdapter').then(module => {
          return new module.NeonAdapter(config);
        }) as unknown as DatabaseAdapter;
      
      case 'planetscale':
        return import('./adapters/PlanetScaleAdapter').then(module => {
          return new module.PlanetScaleAdapter(config);
        }) as unknown as DatabaseAdapter;
      
      default:
        throw new Error(`Unsupported database provider: ${provider}`);
    }
  }
  
  /**
   * Create a database adapter based on environment variables
   */
  static createFromEnvironment(): Promise<DatabaseAdapter> {
    const provider = process.env.DATABASE_PROVIDER || 'supabase';
    
    const config: DatabaseConfig = {
      // Common options
      debug: process.env.DATABASE_DEBUG === 'true',
      
      // Provider-specific options
      url: process.env.DATABASE_URL,
      
      // Supabase-specific
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      supabaseKey: process.env.VITE_SUPABASE_ANON_KEY,
      
      // Neon-specific
      neonApiKey: process.env.NEON_API_KEY,
      
      // PlanetScale-specific
      planetscaleUsername: process.env.PLANETSCALE_USERNAME,
      planetscalePassword: process.env.PLANETSCALE_PASSWORD,
    };
    
    return this.createAdapter(provider as any, config);
  }
}
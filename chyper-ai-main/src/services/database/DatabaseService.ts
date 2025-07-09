import { DatabaseAdapter, QueryOptions } from './DatabaseAdapter';
import { SupabaseAdapter } from './SupabaseAdapter';
import { NeonAdapter } from './NeonAdapter';
import { logger } from '../../utils/errorHandling';
import { toastManager } from '../../utils/toastManager';

// Available database providers
export type DatabaseProvider = 'supabase' | 'neon' | 'memory';

/**
 * Central service for database operations
 * Acts as a factory and facade for database adapters
 */
class DatabaseService {
  private adapter: DatabaseAdapter | null = null;
  private provider: DatabaseProvider | null = null;
  private initialized = false;
  
  /**
   * Initialize the database service with the specified provider
   */
  async initialize(provider?: DatabaseProvider): Promise<void> {
    try {
      // Determine provider from parameter, environment, or default
      this.provider = provider || this.getDefaultProvider();
      
      logger.info(`Initializing database with provider: ${this.provider}`);
      
      // Create the appropriate adapter
      this.adapter = this.createAdapter(this.provider);
      
      // Initialize the adapter
      await this.adapter.initialize();
      
      // Check if connection is healthy
      const isHealthy = await this.adapter.healthCheck();
      
      if (!isHealthy) {
        throw new Error(`Failed to connect to ${this.provider} database`);
      }
      
      this.initialized = true;
      logger.info(`Database initialized successfully with provider: ${this.provider}`);
    } catch (error) {
      logger.error('Database initialization error', error);
      toastManager.error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
  
  /**
   * Check if database service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Get the current database provider
   */
  getProvider(): DatabaseProvider | null {
    return this.provider;
  }
  
  /**
   * Get record by ID
   */
  async getById<T>(table: string, id: string): Promise<T | null> {
    this.ensureInitialized();
    return this.adapter!.getById<T>(table, id);
  }
  
  /**
   * Query records
   */
  async query<T>(table: string, options?: QueryOptions): Promise<T[]> {
    this.ensureInitialized();
    return this.adapter!.query<T>(table, options);
  }
  
  /**
   * Insert a new record
   */
  async insert<T>(table: string, data: Omit<T, 'id'>): Promise<T> {
    this.ensureInitialized();
    return this.adapter!.insert<T>(table, data);
  }
  
  /**
   * Update an existing record
   */
  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    this.ensureInitialized();
    return this.adapter!.update<T>(table, id, data);
  }
  
  /**
   * Delete a record
   */
  async delete(table: string, id: string): Promise<boolean> {
    this.ensureInitialized();
    return this.adapter!.delete(table, id);
  }
  
  /**
   * Execute a raw query (provider-specific)
   */
  async raw<T>(query: string, params?: any[]): Promise<T> {
    this.ensureInitialized();
    return this.adapter!.raw<T>(query, params);
  }
  
  /**
   * Execute a transaction
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    this.ensureInitialized();
    return this.adapter!.transaction<T>(callback);
  }
  
  /**
   * Get the underlying adapter for provider-specific operations
   */
  getAdapter<T extends DatabaseAdapter>(): T {
    this.ensureInitialized();
    return this.adapter as T;
  }
  
  /**
   * Create a database adapter for the specified provider
   */
  private createAdapter(provider: DatabaseProvider): DatabaseAdapter {
    switch (provider) {
      case 'supabase':
        return new SupabaseAdapter();
      case 'neon':
        return new NeonAdapter();
      case 'memory':
        throw new Error('Memory adapter not implemented yet');
      default:
        throw new Error(`Unsupported database provider: ${provider}`);
    }
  }
  
  /**
   * Get the default database provider from environment or fallback
   */
  private getDefaultProvider(): DatabaseProvider {
    // Try to get from environment
    const envProvider = import.meta.env.VITE_DATABASE_PROVIDER as DatabaseProvider;
    
    if (envProvider && ['supabase', 'neon', 'memory'].includes(envProvider)) {
      return envProvider;
    }
    
    // Check if Supabase is configured
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return 'supabase';
    }
    
    // Check if Neon is configured
    if (import.meta.env.VITE_NEON_DATABASE_URL) {
      return 'neon';
    }
    
    // Default to Supabase as fallback
    return 'supabase';
  }
  
  /**
   * Ensure the service is initialized before use
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.adapter) {
      throw new Error('Database service not initialized. Call initialize() first.');
    }
  }
}

// Export a singleton instance
export default new DatabaseService();
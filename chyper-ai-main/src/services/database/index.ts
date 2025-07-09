import { DatabaseAdapter, DatabaseFactory, DatabaseConfig } from './DatabaseAdapter';

/**
 * Database service singleton that provides access to the current database adapter
 */
class DatabaseService {
  private static instance: DatabaseService;
  private adapter: DatabaseAdapter | null = null;
  private provider: string = 'supabase';
  private isInitialized: boolean = false;
  
  private constructor() {
    // Private constructor to enforce singleton pattern
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  /**
   * Initialize the database service with the specified provider
   */
  public async initialize(provider?: 'supabase' | 'neon' | 'planetscale', config?: DatabaseConfig): Promise<void> {
    if (this.isInitialized) {
      console.warn('Database service is already initialized');
      return;
    }
    
    try {
      // Use provided config or create from environment
      if (provider && config) {
        this.adapter = await DatabaseFactory.createAdapter(provider, config);
        this.provider = provider;
      } else {
        this.adapter = await DatabaseFactory.createFromEnvironment();
        this.provider = this.adapter.getProviderName();
      }
      
      // Initialize the adapter
      await this.adapter.initialize();
      this.isInitialized = true;
      
      console.log(`Database service initialized with ${this.provider} provider`);
    } catch (error) {
      console.error('Failed to initialize database service:', error);
      throw error;
    }
  }
  
  /**
   * Get the current database adapter
   */
  public getAdapter(): DatabaseAdapter {
    if (!this.adapter || !this.isInitialized) {
      throw new Error('Database service is not initialized');
    }
    return this.adapter;
  }
  
  /**
   * Get the current provider name
   */
  public getProviderName(): string {
    return this.provider;
  }
  
  /**
   * Check if the database service is initialized
   */
  public isInitialized(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Switch to a different database provider
   */
  public async switchProvider(provider: 'supabase' | 'neon' | 'planetscale', config: DatabaseConfig): Promise<void> {
    // Close the current adapter if it exists
    if (this.adapter) {
      await this.adapter.close();
    }
    
    // Create and initialize the new adapter
    this.adapter = await DatabaseFactory.createAdapter(provider, config);
    await this.adapter.initialize();
    
    this.provider = provider;
    this.isInitialized = true;
    
    console.log(`Switched to ${provider} database provider`);
  }
  
  /**
   * Close the database connection
   */
  public async close(): Promise<void> {
    if (this.adapter) {
      await this.adapter.close();
      this.adapter = null;
      this.isInitialized = false;
    }
  }
}

// Export the singleton instance
export const db = DatabaseService.getInstance();

// Export types
export type { DatabaseAdapter, DatabaseConfig } from './DatabaseAdapter';
export { DatabaseFactory } from './DatabaseAdapter';
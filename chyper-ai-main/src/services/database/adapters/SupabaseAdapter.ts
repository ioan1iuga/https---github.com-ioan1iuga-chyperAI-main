import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseAdapter, DatabaseConfig } from '../DatabaseAdapter';

/**
 * Supabase implementation of the DatabaseAdapter interface
 */
export class SupabaseAdapter implements DatabaseAdapter {
  private client: SupabaseClient;
  private isInitialized: boolean = false;
  private inTransaction: boolean = false;
  
  constructor(private config: DatabaseConfig) {
    // Validate required configuration
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }
    
    // Create Supabase client
    this.client = createClient(
      config.supabaseUrl,
      config.supabaseKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: true,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: config.headers as Record<string, string>,
        },
      }
    );
  }
  
  async initialize(): Promise<void> {
    try {
      // Test the connection
      const { data, error } = await this.client.from('_health').select('*').limit(1);
      
      if (error) {
        console.error('Supabase initialization error:', error);
        throw error;
      }
      
      this.isInitialized = true;
      console.log('Supabase adapter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Supabase adapter:', error);
      throw error;
    }
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.client.from('_health').select('count').single();
      return !error;
    } catch (error) {
      console.error('Supabase health check failed:', error);
      return false;
    }
  }
  
  getProviderName(): string {
    return 'supabase';
  }
  
  async query<T = any>(query: string, params?: any[]): Promise<T[]> {
    this.ensureInitialized();
    
    try {
      // For Supabase, we need to use the appropriate API based on the query type
      if (query.trim().toLowerCase().startsWith('select')) {
        // For SELECT queries, use the from().select() API
        const tableName = this.extractTableName(query);
        const { data, error } = await this.client.from(tableName).select('*');
        
        if (error) throw error;
        return data as T[];
      } else {
        // For other queries, use the rpc() API
        const { data, error } = await this.client.rpc('execute_sql', { 
          sql_query: query,
          params: params || []
        });
        
        if (error) throw error;
        return data as T[];
      }
    } catch (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
  }
  
  async queryOne<T = any>(query: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(query, params);
    return results.length > 0 ? results[0] : null;
  }
  
  async execute(query: string, params?: any[]): Promise<number> {
    this.ensureInitialized();
    
    try {
      // Use the rpc() API for non-SELECT queries
      const { data, error } = await this.client.rpc('execute_sql', { 
        sql_query: query,
        params: params || []
      });
      
      if (error) throw error;
      
      // Return the number of affected rows
      return data?.rowCount || 0;
    } catch (error) {
      console.error('Supabase execute error:', error);
      throw error;
    }
  }
  
  async beginTransaction(): Promise<void> {
    if (this.inTransaction) {
      throw new Error('Transaction already in progress');
    }
    
    await this.execute('BEGIN');
    this.inTransaction = true;
  }
  
  async commitTransaction(): Promise<void> {
    if (!this.inTransaction) {
      throw new Error('No transaction in progress');
    }
    
    await this.execute('COMMIT');
    this.inTransaction = false;
  }
  
  async rollbackTransaction(): Promise<void> {
    if (!this.inTransaction) {
      throw new Error('No transaction in progress');
    }
    
    await this.execute('ROLLBACK');
    this.inTransaction = false;
  }
  
  async close(): Promise<void> {
    // Supabase client doesn't need explicit closing
  }
  
  // Helper methods
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Supabase adapter is not initialized');
    }
  }
  
  private extractTableName(query: string): string {
    // Simple regex to extract table name from a SELECT query
    // This is a basic implementation and might not work for complex queries
    const match = query.match(/from\s+([a-zA-Z0-9_]+)/i);
    if (!match || !match[1]) {
      throw new Error('Could not extract table name from query');
    }
    return match[1];
  }
}
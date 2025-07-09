import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseAdapter, DatabaseRecord, QueryOptions } from './DatabaseAdapter';
import { logger } from '../../utils/errorHandling';

/**
 * Supabase Database Adapter Implementation
 */
export class SupabaseAdapter implements DatabaseAdapter {
  private client: SupabaseClient | null = null;
  private url: string;
  private key: string;
  private options?: any;

  constructor(url?: string, key?: string, options?: any) {
    // Use constructor params or environment variables
    this.url = url || import.meta.env.VITE_SUPABASE_URL;
    this.key = key || import.meta.env.VITE_SUPABASE_ANON_KEY;
    this.options = options;
    
    logger.debug('SupabaseAdapter created', { 
      hasUrl: !!this.url,
      hasKey: !!this.key
    });
  }

  /**
   * Initialize the Supabase client
   */
  async initialize(): Promise<void> {
    try {
      if (!this.url || !this.key) {
        throw new Error('Supabase URL and key are required');
      }
      
      this.client = createClient(this.url, this.key, this.options);
      
      const { data, error } = await this.client.auth.getSession();
      
      if (!error && data.session) {
        logger.info('Supabase adapter initialized with auth session');
      } else {
        logger.info('Supabase adapter initialized without auth session');
      }
    } catch (error) {
      logger.error('Error initializing Supabase adapter', error);
      throw error;
    }
  }

  /**
   * Get a record by ID
   */
  async getById<T extends DatabaseRecord>(
    table: string, 
    id: string
  ): Promise<T | null> {
    try {
      if (!this.client) await this.initialize();
      
      const { data, error } = await this.client!
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data as T || null;
    } catch (error) {
      logger.error(`Error getting ${table} by ID`, error);
      throw error;
    }
  }

  /**
   * Query records
   */
  async query<T extends DatabaseRecord>(
    table: string, 
    options?: QueryOptions
  ): Promise<T[]> {
    try {
      if (!this.client) await this.initialize();
      
      let query = this.client!.from(table).select('*');
      
      // Apply query options
      if (options) {
        // Apply filters
        if (options.where) {
          Object.entries(options.where).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        
        // Apply ordering
        if (options.orderBy) {
          query = query.order(options.orderBy, {
            ascending: options.orderDirection !== 'desc',
          });
        }
        
        // Apply pagination
        if (options.limit) {
          query = query.limit(options.limit);
        }
        
        if (options.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as T[] || [];
    } catch (error) {
      logger.error(`Error querying ${table}`, error);
      throw error;
    }
  }

  /**
   * Insert a new record
   */
  async insert<T extends DatabaseRecord>(
    table: string, 
    data: Omit<T, 'id'>
  ): Promise<T> {
    try {
      if (!this.client) await this.initialize();
      
      const { data: insertedData, error } = await this.client!
        .from(table)
        .insert(data as any)
        .select()
        .single();
      
      if (error) throw error;
      
      return insertedData as T;
    } catch (error) {
      logger.error(`Error inserting into ${table}`, error);
      throw error;
    }
  }

  /**
   * Update an existing record
   */
  async update<T extends DatabaseRecord>(
    table: string, 
    id: string, 
    data: Partial<T>
  ): Promise<T> {
    try {
      if (!this.client) await this.initialize();
      
      const { data: updatedData, error } = await this.client!
        .from(table)
        .update(data as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return updatedData as T;
    } catch (error) {
      logger.error(`Error updating ${table}`, error);
      throw error;
    }
  }

  /**
   * Delete a record
   */
  async delete(table: string, id: string): Promise<boolean> {
    try {
      if (!this.client) await this.initialize();
      
      const { error } = await this.client!
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      logger.error(`Error deleting from ${table}`, error);
      throw error;
    }
  }

  /**
   * Execute a raw query
   */
  async raw<T>(query: string, params?: any[]): Promise<T> {
    try {
      if (!this.client) await this.initialize();
      
      const { data, error } = await this.client!.rpc(query, params || {});
      
      if (error) throw error;
      
      return data as T;
    } catch (error) {
      logger.error(`Error executing raw query`, error);
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    // Note: Supabase doesn't have direct transaction support in the client
    // In a real application, you would need to implement this using
    // serverless functions or a custom API endpoint
    return callback();
  }

  /**
   * Check database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) await this.initialize();
      
      // Simple health check - if we can successfully execute a simple query
      const { data, error } = await this.client!.from('profiles').select('count').limit(1);
      
      return !error;
    } catch (error) {
      logger.error('Supabase health check failed', error);
      return false;
    }
  }

  /**
   * Get the native Supabase client
   * Useful for operations not covered by the adapter interface
   */
  getNativeClient(): SupabaseClient | null {
    return this.client;
  }
}
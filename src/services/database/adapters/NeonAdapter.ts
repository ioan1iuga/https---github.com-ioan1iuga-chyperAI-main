import { DatabaseAdapter, DatabaseConfig } from '../DatabaseAdapter';

/**
 * Neon PostgreSQL implementation of the DatabaseAdapter interface
 */
export class NeonAdapter implements DatabaseAdapter {
  private pool: any; // Will be pg.Pool
  private client: any; // Will be pg.PoolClient for transactions
  private isInitialized: boolean = false;
  private inTransaction: boolean = false;
  
  constructor(private config: DatabaseConfig) {
    // Validate required configuration
    if (!config.url && !(config.host && config.database && config.username && config.password)) {
      throw new Error('Neon connection details are required (either url or host/database/username/password)');
    }
  }
  
  async initialize(): Promise<void> {
    try {
      // Dynamically import pg to avoid bundling issues
      const { Pool } = await import('pg');
      
      // Create connection pool
      this.pool = new Pool({
        connectionString: this.config.url,
        host: this.config.host,
        port: this.config.port || 5432,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl !== false,
        max: this.config.poolSize || 10,
        idleTimeoutMillis: this.config.idleTimeout || 30000,
        connectionTimeoutMillis: this.config.connectionTimeout || 10000,
      });
      
      // Test the connection
      await this.pool.query('SELECT 1');
      
      this.isInitialized = true;
      console.log('Neon adapter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Neon adapter:', error);
      throw error;
    }
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Neon health check failed:', error);
      return false;
    }
  }
  
  getProviderName(): string {
    return 'neon';
  }
  
  async query<T = any>(query: string, params?: any[]): Promise<T[]> {
    this.ensureInitialized();
    
    try {
      const client = this.inTransaction ? this.client : this.pool;
      const result = await client.query(query, params);
      return result.rows as T[];
    } catch (error) {
      console.error('Neon query error:', error);
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
      const client = this.inTransaction ? this.client : this.pool;
      const result = await client.query(query, params);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Neon execute error:', error);
      throw error;
    }
  }
  
  async beginTransaction(): Promise<void> {
    if (this.inTransaction) {
      throw new Error('Transaction already in progress');
    }
    
    this.ensureInitialized();
    
    try {
      this.client = await this.pool.connect();
      await this.client.query('BEGIN');
      this.inTransaction = true;
    } catch (error) {
      if (this.client) {
        this.client.release();
        this.client = null;
      }
      console.error('Neon begin transaction error:', error);
      throw error;
    }
  }
  
  async commitTransaction(): Promise<void> {
    if (!this.inTransaction || !this.client) {
      throw new Error('No transaction in progress');
    }
    
    try {
      await this.client.query('COMMIT');
      this.inTransaction = false;
    } catch (error) {
      console.error('Neon commit transaction error:', error);
      throw error;
    } finally {
      this.client.release();
      this.client = null;
    }
  }
  
  async rollbackTransaction(): Promise<void> {
    if (!this.inTransaction || !this.client) {
      throw new Error('No transaction in progress');
    }
    
    try {
      await this.client.query('ROLLBACK');
      this.inTransaction = false;
    } catch (error) {
      console.error('Neon rollback transaction error:', error);
      throw error;
    } finally {
      this.client.release();
      this.client = null;
    }
  }
  
  async close(): Promise<void> {
    if (this.client) {
      this.client.release();
      this.client = null;
    }
    
    if (this.pool) {
      await this.pool.end();
    }
    
    this.isInitialized = false;
  }
  
  // Helper methods
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Neon adapter is not initialized');
    }
  }
}
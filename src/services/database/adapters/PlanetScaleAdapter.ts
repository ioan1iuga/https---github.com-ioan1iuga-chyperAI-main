import { DatabaseAdapter, DatabaseConfig } from '../DatabaseAdapter';

/**
 * PlanetScale MySQL implementation of the DatabaseAdapter interface
 */
export class PlanetScaleAdapter implements DatabaseAdapter {
  private connection: any; // Will be mysql2.Connection
  private isInitialized: boolean = false;
  private inTransaction: boolean = false;
  
  constructor(private config: DatabaseConfig) {
    // Validate required configuration
    if (!config.url && !(config.host && config.database && config.username && config.password)) {
      throw new Error('PlanetScale connection details are required (either url or host/database/username/password)');
    }
  }
  
  async initialize(): Promise<void> {
    try {
      // Dynamically import mysql2/promise to avoid bundling issues
      const mysql = await import('mysql2/promise');
      
      // Create connection
      this.connection = await mysql.createConnection({
        uri: this.config.url,
        host: this.config.host,
        port: this.config.port || 3306,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl !== false ? {} : undefined,
        connectTimeout: this.config.connectionTimeout || 10000,
        // PlanetScale-specific options
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      });
      
      // Test the connection
      await this.connection.query('SELECT 1');
      
      this.isInitialized = true;
      console.log('PlanetScale adapter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PlanetScale adapter:', error);
      throw error;
    }
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      await this.connection.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('PlanetScale health check failed:', error);
      return false;
    }
  }
  
  getProviderName(): string {
    return 'planetscale';
  }
  
  async query<T = any>(query: string, params?: any[]): Promise<T[]> {
    this.ensureInitialized();
    
    try {
      const [rows] = await this.connection.query(query, params);
      return rows as T[];
    } catch (error) {
      console.error('PlanetScale query error:', error);
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
      const [result] = await this.connection.query(query, params);
      return result.affectedRows || 0;
    } catch (error) {
      console.error('PlanetScale execute error:', error);
      throw error;
    }
  }
  
  async beginTransaction(): Promise<void> {
    if (this.inTransaction) {
      throw new Error('Transaction already in progress');
    }
    
    this.ensureInitialized();
    
    try {
      await this.connection.beginTransaction();
      this.inTransaction = true;
    } catch (error) {
      console.error('PlanetScale begin transaction error:', error);
      throw error;
    }
  }
  
  async commitTransaction(): Promise<void> {
    if (!this.inTransaction) {
      throw new Error('No transaction in progress');
    }
    
    try {
      await this.connection.commit();
      this.inTransaction = false;
    } catch (error) {
      console.error('PlanetScale commit transaction error:', error);
      throw error;
    }
  }
  
  async rollbackTransaction(): Promise<void> {
    if (!this.inTransaction) {
      throw new Error('No transaction in progress');
    }
    
    try {
      await this.connection.rollback();
      this.inTransaction = false;
    } catch (error) {
      console.error('PlanetScale rollback transaction error:', error);
      throw error;
    }
  }
  
  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
    }
    
    this.isInitialized = false;
  }
  
  // Helper methods
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('PlanetScale adapter is not initialized');
    }
  }
}
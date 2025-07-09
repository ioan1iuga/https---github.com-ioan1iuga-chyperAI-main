import { Pool, PoolClient } from 'pg';
import { DatabaseAdapter, DatabaseRecord, QueryOptions } from './DatabaseAdapter';
import { logger } from '../../utils/errorHandling';

/**
 * Neon Database Adapter Implementation
 * Uses the pg library to connect to Neon Postgres
 */
export class NeonAdapter implements DatabaseAdapter {
  private pool: Pool | null = null;
  private connectionString: string;
  private options?: any;

  constructor(connectionString?: string, options?: any) {
    // Use constructor params or environment variables
    this.connectionString = connectionString || import.meta.env.VITE_NEON_DATABASE_URL;
    this.options = options || {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

    logger.debug('NeonAdapter created', { 
      hasConnectionString: !!this.connectionString 
    });
  }

  /**
   * Initialize the Neon Postgres pool
   */
  async initialize(): Promise<void> {
    try {
      if (!this.connectionString) {
        throw new Error('Neon connection string is required');
      }

      // Create a connection pool
      this.pool = new Pool({
        connectionString: this.connectionString,
        ...this.options
      });

      // Test the connection
      const client = await this.pool.connect();
      try {
        await client.query('SELECT NOW()');
        logger.info('Neon adapter initialized successfully');
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error initializing Neon adapter', error);
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
      if (!this.pool) await this.initialize();

      const result = await this.pool!.query(
        `SELECT * FROM ${this.sanitizeIdentifier(table)} WHERE id = $1 LIMIT 1`,
        [id]
      );

      return result.rows[0] as T || null;
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
      if (!this.pool) await this.initialize();

      // Build the query
      let query = `SELECT * FROM ${this.sanitizeIdentifier(table)}`;
      const params: any[] = [];
      let paramCounter = 1;

      // Add WHERE clauses if needed
      if (options?.where && Object.keys(options.where).length > 0) {
        const whereClauses = [];
        for (const [key, value] of Object.entries(options.where)) {
          whereClauses.push(`${this.sanitizeIdentifier(key)} = $${paramCounter}`);
          params.push(value);
          paramCounter++;
        }
        query += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      // Add ORDER BY if needed
      if (options?.orderBy) {
        query += ` ORDER BY ${this.sanitizeIdentifier(options.orderBy)} ${
          options.orderDirection === 'desc' ? 'DESC' : 'ASC'
        }`;
      }

      // Add LIMIT if needed
      if (options?.limit) {
        query += ` LIMIT $${paramCounter}`;
        params.push(options.limit);
        paramCounter++;
      }

      // Add OFFSET if needed
      if (options?.offset) {
        query += ` OFFSET $${paramCounter}`;
        params.push(options.offset);
      }

      const result = await this.pool!.query(query, params);
      return result.rows as T[];
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
      if (!this.pool) await this.initialize();

      const keys = Object.keys(data);
      if (keys.length === 0) {
        throw new Error('No data to insert');
      }

      const columns = keys.map(this.sanitizeIdentifier).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(data);

      const query = `
        INSERT INTO ${this.sanitizeIdentifier(table)} (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await this.pool!.query(query, values);
      return result.rows[0] as T;
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
      if (!this.pool) await this.initialize();

      const keys = Object.keys(data);
      if (keys.length === 0) {
        throw new Error('No data to update');
      }

      const setClause = keys
        .map((key, i) => `${this.sanitizeIdentifier(key)} = $${i + 1}`)
        .join(', ');
      const values = [...Object.values(data), id];

      const query = `
        UPDATE ${this.sanitizeIdentifier(table)}
        SET ${setClause}
        WHERE id = $${keys.length + 1}
        RETURNING *
      `;

      const result = await this.pool!.query(query, values);

      if (result.rows.length === 0) {
        throw new Error(`Record with id ${id} not found`);
      }

      return result.rows[0] as T;
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
      if (!this.pool) await this.initialize();

      const result = await this.pool!.query(
        `DELETE FROM ${this.sanitizeIdentifier(table)} WHERE id = $1 RETURNING id`,
        [id]
      );

      return result.rows.length > 0;
    } catch (error) {
      logger.error(`Error deleting from ${table}`, error);
      throw error;
    }
  }

  /**
   * Execute a raw SQL query
   */
  async raw<T>(query: string, params?: any[]): Promise<T> {
    try {
      if (!this.pool) await this.initialize();
      
      const result = await this.pool!.query(query, params);
      return result.rows as T;
    } catch (error) {
      logger.error('Error executing raw query', error);
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) await this.initialize();
    
    const client = await this.pool!.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction error', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.pool) await this.initialize();
      
      const result = await this.pool!.query('SELECT 1');
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Neon health check failed', error);
      return false;
    }
  }

  /**
   * Sanitize identifier to prevent SQL injection
   */
  private sanitizeIdentifier(identifier: string): string {
    // Remove any characters that aren't alphanumeric or underscores
    // Then wrap in double quotes
    return `"${identifier.replace(/[^a-zA-Z0-9_]/g, '')}"`;
  }

  /**
   * Close the pool when done
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  /**
   * Get the native pg Pool
   * Useful for operations not covered by the adapter interface
   */
  getNativeClient(): Pool | null {
    return this.pool;
  }
}
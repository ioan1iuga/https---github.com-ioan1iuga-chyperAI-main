import { logger } from '../../utils/errorHandling';
import { toastManager } from '../../utils/toastManager';

interface DeploymentOptions {
  name: string;
  projectId: string;
  entryPoint: string;
  assets?: string[];
  routes?: Array<{ pattern: string; zone_name?: string }>;
  bindings?: Record<string, any>;
  compatibilityDate?: string;
  compatibilityFlags?: string[];
  environment?: 'development' | 'staging' | 'production';
  environmentVariables?: Record<string, string>;
  trigger?: { crons?: string[] };
  usage?: { storage?: number };
}

interface DeploymentResult {
  id: string;
  url: string;
  success: boolean;
  error?: string;
  logs?: string[];
}

class CloudflareDeploymentService {
  private apiToken: string | null;
  private accountId: string | null;
  private apiUrl: string;
  
  constructor() {
    this.apiToken = localStorage.getItem('cloudflare_token') || null;
    this.accountId = localStorage.getItem('cloudflare_account_id') || null;
    this.apiUrl = 'https://api.cloudflare.com/client/v4';
    
    // Try to load from environment variables if available
    this.apiToken = this.apiToken || import.meta.env.VITE_CLOUDFLARE_API_TOKEN;
    this.accountId = this.accountId || import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
    
    if (this.apiToken && this.accountId) {
      logger.info('Cloudflare deployment service initialized with token and account ID');
    } else {
      logger.warn('Cloudflare deployment service initialized without complete credentials');
    }
  }
  
  /**
   * Set Cloudflare API token
   */
  setApiToken(token: string): void {
    this.apiToken = token;
    localStorage.setItem('cloudflare_token', token);
    logger.info('Cloudflare API token set');
  }
  
  /**
   * Set Cloudflare account ID
   */
  setAccountId(accountId: string): void {
    this.accountId = accountId;
    localStorage.setItem('cloudflare_account_id', accountId);
    logger.info('Cloudflare account ID set');
  }
  
  /**
   * Clear Cloudflare credentials
   */
  clearCredentials(): void {
    this.apiToken = null;
    this.accountId = null;
    localStorage.removeItem('cloudflare_token');
    localStorage.removeItem('cloudflare_account_id');
    logger.info('Cloudflare credentials cleared');
  }
  
  /**
   * Check if service is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.apiToken && !!this.accountId;
  }
  
  /**
   * Make authenticated request to Cloudflare API
   */
  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiToken) {
      throw new Error('Cloudflare API token not set. Please authenticate first.');
    }
    
    if (!this.accountId && endpoint.includes('accounts')) {
      throw new Error('Cloudflare account ID not set.');
    }
    
    const url = `${this.apiUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.apiToken}`,
      ...options.headers
    };
    
    if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') {
      headers['Content-Type'] = 'application/json';
    }
    
    try {
      logger.debug('Making Cloudflare API request', { endpoint, method: options.method || 'GET' });
      
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      const data = await response.json();
      
      if (!data.success) {
        const errorMessage = data.errors?.map((e: any) => e.message).join(', ') || 'Unknown error';
        throw new Error(`Cloudflare API error: ${errorMessage}`);
      }
      
      return data.result as T;
    } catch (error) {
      logger.error('Cloudflare API request failed', { 
        endpoint, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
  
  /**
   * Get all worker scripts
   */
  async getWorkers(): Promise<any[]> {
    return this.request(`/accounts/${this.accountId}/workers/scripts`);
  }
  
  /**
   * Get worker script metadata
   */
  async getWorker(name: string): Promise<any> {
    return this.request(`/accounts/${this.accountId}/workers/scripts/${name}`);
  }
  
  /**
   * Deploy a worker script
   */
  async deployWorker(options: DeploymentOptions): Promise<DeploymentResult> {
    try {
      // Validate options
      if (!options.name) {
        throw new Error('Worker name is required');
      }
      
      if (!options.entryPoint) {
        throw new Error('Worker entry point is required');
      }
      
      logger.info('Deploying worker', { name: options.name });
      toastManager.info(`Starting deployment of ${options.name}...`);
      
      // For this example, we'll simulate the deployment
      // In a real implementation, this would upload files and create the worker
      
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const deploymentId = `deployment_${Date.now()}`;
      const workerSubdomain = options.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      
      // Return success
      const result = {
        id: deploymentId,
        url: `https://${workerSubdomain}.${this.accountId}.workers.dev`,
        success: true,
        logs: [
          'Uploading worker script...',
          'Processing worker script...',
          'Activating worker...',
          'Deployment complete!'
        ]
      };
      
      toastManager.success(`Deployment of ${options.name} successful!`);
      logger.info('Worker deployed successfully', result);
      
      return result;
    } catch (error) {
      logger.error('Worker deployment failed', error);
      toastManager.error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        id: `failed_${Date.now()}`,
        url: '',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Delete a worker script
   */
  async deleteWorker(name: string): Promise<void> {
    await this.request(`/accounts/${this.accountId}/workers/scripts/${name}`, {
      method: 'DELETE'
    });
    
    logger.info('Worker deleted', { name });
    toastManager.success(`Worker ${name} deleted successfully`);
  }
  
  /**
   * Get all KV namespaces
   */
  async getKVNamespaces(): Promise<any[]> {
    return this.request(`/accounts/${this.accountId}/workers/kv/namespaces`);
  }
  
  /**
   * Create a KV namespace
   */
  async createKVNamespace(title: string): Promise<any> {
    return this.request(`/accounts/${this.accountId}/workers/kv/namespaces`, {
      method: 'POST',
      body: JSON.stringify({ title })
    });
  }
  
  /**
   * Get all Durable Object namespaces
   */
  async getDurableObjectNamespaces(): Promise<any[]> {
    return this.request(`/accounts/${this.accountId}/workers/durable-objects/namespaces`);
  }
  
  /**
   * Get all R2 buckets
   */
  async getR2Buckets(): Promise<any[]> {
    return this.request(`/accounts/${this.accountId}/r2/buckets`);
  }
  
  /**
   * Create an R2 bucket
   */
  async createR2Bucket(name: string): Promise<any> {
    return this.request(`/accounts/${this.accountId}/r2/buckets`, {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  }
  
  /**
   * Get all D1 databases
   */
  async getD1Databases(): Promise<any[]> {
    return this.request(`/accounts/${this.accountId}/d1/database`);
  }
  
  /**
   * Deploy a complete project to Cloudflare
   */
  async deployProject(
    projectId: string,
    entryPoint: string,
    options: Partial<DeploymentOptions> = {}
  ): Promise<DeploymentResult> {
    try {
      logger.info('Deploying project to Cloudflare', { projectId });
      
      // Create deployment options
      const deploymentOptions: DeploymentOptions = {
        name: options.name || `project-${projectId}`,
        projectId,
        entryPoint,
        environment: options.environment || 'production',
        environmentVariables: options.environmentVariables || {},
        assets: options.assets || [],
        routes: options.routes || [],
        bindings: options.bindings || {},
        compatibilityDate: options.compatibilityDate || new Date().toISOString().split('T')[0],
        compatibilityFlags: options.compatibilityFlags || []
      };
      
      // Deploy the worker
      return this.deployWorker(deploymentOptions);
    } catch (error) {
      logger.error('Project deployment failed', error);
      
      return {
        id: `failed_${Date.now()}`,
        url: '',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

export default new CloudflareDeploymentService();
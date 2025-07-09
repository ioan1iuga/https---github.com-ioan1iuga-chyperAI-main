import { logger } from '../../utils/errorHandling';
import { toastManager } from '../../utils/toastManager';

interface DeploymentOptions {
  projectId: string;
  environment?: 'development' | 'staging' | 'production' | 'preview';
  provider?: 'cloudflare' | 'vercel' | 'netlify';
  buildCommand?: string;
  outputDir?: string;
  environmentVariables?: Record<string, string>;
}

interface DeploymentResult {
  id: string;
  url: string | null;
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed';
  logs: string[];
  error?: string;
}

interface DeploymentLogEntry {
  message: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
}

/**
 * Service for handling deployments
 */
class DeploymentService {
  private apiUrl: string;
  private activeProjectId: string | null = null;
  private deploymentSubscribers: Set<(deployment: any) => void> = new Set();
  
  constructor() {
    // Initialize with API URL based on environment
    this.apiUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL
      ? `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/deployments`
      : '/api/deployments';
      
    logger.debug('DeploymentService initialized', { apiUrl: this.apiUrl });
  }
  
  /**
   * Sets the active project for deployment operations
   */
  setActiveProject(projectId: string): void {
    this.activeProjectId = projectId;
    logger.info('Set active project for deployment', { projectId });
  }
  
  /**
   * Get all deployments, optionally filtered by project ID
   */
  async getDeployments(projectId?: string): Promise<any[]> {
    try {
      logger.info('Fetching deployments', { projectId });
      
      // Build URL with optional project ID filter
      const url = projectId
        ? `${this.apiUrl}?projectId=${encodeURIComponent(projectId)}`
        : this.apiUrl;
      
      // Make API request
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch deployments: ${response.statusText}`);
      }
      
      const result = await response.json() as any;
      
      // Handle both response formats (direct array or success/data object)
      const deployments = Array.isArray(result) ? result : (result.data || []);
      
      return deployments;
    } catch (error) {
      logger.error('Error fetching deployments', { error });
      throw error;
    }
  }
  
  /**
   * Get a specific deployment by ID
   */
  async getDeployment(id: string): Promise<any> {
    try {
      logger.info('Fetching deployment details', { id });
      
      // Make API request
      const response = await fetch(`${this.apiUrl}/${id}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch deployment: ${response.statusText}`);
      }
      
      const result = await response.json() as any;
      
      // Handle both response formats
      return result.data || result;
    } catch (error) {
      logger.error('Error fetching deployment', { error, id });
      throw error;
    }
  }
  
  /**
   * Create a new deployment
   */
  async createDeployment(options: DeploymentOptions): Promise<DeploymentResult> {
    try {
      logger.info('Creating deployment', { options });
      toastManager.info('Starting deployment...');
      
      // Default options
      const deploymentOptions = {
        projectId: options.projectId,
        environment: options.environment || 'production',
        provider: options.provider || 'netlify',
        buildCommand: options.buildCommand || 'npm run build',
        outputDir: options.outputDir || 'dist',
        environmentVariables: options.environmentVariables || {}
      };
      
      // Make API request
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(deploymentOptions)
      });
      
      if (!response.ok) {
        const errorData = await response.json() as any;
        throw new Error(errorData.error || `Failed to create deployment: ${response.statusText}`);
      }
      
      const result = await response.json() as any;
      const deploymentData = result.data || result;
      
      // Start polling for deployment status updates
      this.pollDeploymentStatus(deploymentData.id);
      
      toastManager.success('Deployment initiated successfully');
      logger.info('Deployment created', { id: deploymentData.id });
      
      return {
        id: deploymentData.id,
        url: deploymentData.url,
        status: deploymentData.status,
        logs: deploymentData.logs || []
      };
    } catch (error) {
      logger.error('Error creating deployment', { error, projectId: options.projectId });
      toastManager.error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      throw error;
    }
  }
  
  /**
   * Cancel an in-progress deployment
   */
  async cancelDeployment(id: string): Promise<void> {
    try {
      logger.info('Cancelling deployment', { id });
      
      // Make API request
      const response = await fetch(`${this.apiUrl}/${id}/cancel`, {
        method: 'POST',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to cancel deployment: ${response.statusText}`);
      }
      
      toastManager.success('Deployment cancelled');
      logger.info('Deployment cancelled successfully', { id });
    } catch (error) {
      logger.error('Error cancelling deployment', { error, id });
      toastManager.error(`Failed to cancel deployment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      throw error;
    }
  }
  
  /**
   * Poll for deployment status updates
   */
  private async pollDeploymentStatus(id: string): Promise<void> {
    try {
      const maxAttempts = 20;  // 5 minutes maximum (15s * 20)
      let attempts = 0;
      
      const poll = async () => {
        if (attempts >= maxAttempts) {
          logger.warn('Stopped polling deployment status after maximum attempts', { id });
          return;
        }
        
        attempts++;
        
        try {
          const deployment = await this.getDeployment(id);
          
          // Notify subscribers of the updated deployment
          this.notifySubscribers(deployment);
          
          // Update UI based on status
          if (deployment.status === 'success') {
            toastManager.success(`Deployment successful! Site is live at ${deployment.url}`);
            logger.info('Deployment completed successfully', { id, url: deployment.url });
            return;
          } else if (deployment.status === 'failed') {
            toastManager.error(`Deployment failed: ${deployment.error || 'Unknown error'}`);
            logger.error('Deployment failed', { id, error: deployment.error });
            return;
          } else if (deployment.status === 'building') {
            toastManager.info('Building application...', { id: 'deployment-status' });
          } else if (deployment.status === 'deploying') {
            toastManager.info('Deploying to production...', { id: 'deployment-status' });
          }
          
          // Continue polling if deployment is still in progress
          setTimeout(poll, 15000);  // Poll every 15 seconds
        } catch (error) {
          logger.error('Error polling deployment status', { error, id });
          setTimeout(poll, 15000);  // Continue polling despite error
        }
      };
      
      // Start polling
      setTimeout(poll, 5000);  // Start polling after 5 seconds
    } catch (error) {
      logger.error('Error setting up deployment polling', { error, id });
    }
  }
  
  /**
   * Get deployment logs
   */
  async getDeploymentLogs(id: string): Promise<DeploymentLogEntry[]> {
    try {
      logger.info('Fetching deployment logs', { id });
      
      const deployment = await this.getDeployment(id);
      
      // Format logs with timestamps
      return (deployment.logs || []).map((log: string, index: number) => {
        // Generate timestamp based on index for visual separation
        const timestamp = new Date(new Date(deployment.created_at).getTime() + index * 2000).toISOString();
        
        return {
          message: log,
          timestamp,
          level: log.toLowerCase().includes('error') || log.toLowerCase().includes('fail') 
            ? 'error' 
            : log.toLowerCase().includes('warn') 
              ? 'warn' 
              : 'info'
        };
      });
    } catch (error) {
      logger.error('Error fetching deployment logs', { error, id });
      throw error;
    }
  }
  
  /**
   * Get headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add Supabase anon key if available (for Supabase Functions)
    if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
      headers['apikey'] = import.meta.env.VITE_SUPABASE_ANON_KEY;
    }
    
    return headers;
  }
  /**
   * Deploy a project to the specified provider and environment
   */
  async deployProject(
    provider: 'netlify' | 'vercel' | 'cloudflare',
    environment: 'production' | 'staging' | 'preview',
    options: {
      buildCommand: string;
      outputDir: string;
      environmentVariables?: Record<string, string>;
    }
  ): Promise<DeploymentResult> {
    if (!this.activeProjectId) {
      throw new Error('No active project selected');
    }
    
    return this.createDeployment({
      projectId: this.activeProjectId,
      provider,
      environment,
      buildCommand: options.buildCommand,
      outputDir: options.outputDir,
      environmentVariables: options.environmentVariables
    });
  }
  
  /**
   * Subscribe to deployment updates
   * Returns an unsubscribe function
   */
  subscribeToDeployments(callback: (updatedDeployment: any) => void): () => void {
    this.deploymentSubscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.deploymentSubscribers.delete(callback);
    };
  }
  
  
  /**
   * Notify subscribers of deployment updates
   * This is called internally when a deployment status changes
   */
  private notifySubscribers(deployment: any): void {
    this.deploymentSubscribers.forEach(callback => {
      try {
        callback(deployment);
      } catch (error) {
        logger.error('Error in deployment subscriber callback', { error });
      }
    });
  }
}

export default new DeploymentService();
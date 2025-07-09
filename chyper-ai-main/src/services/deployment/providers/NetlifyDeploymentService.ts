import { DeploymentService, DeploymentResult, DeploymentStatus } from '../DeploymentFactory';
import { DeploymentConfig } from '../../../types/deployment';

/**
 * Netlify Deployment Service
 * 
 * Handles deployments to Netlify
 */
export class NetlifyDeploymentService implements DeploymentService {
  private token: string | null = null;
  private siteId: string | null = null;
  private baseUrl = 'https://api.netlify.com/api/v1';
  
  constructor() {
    // Get token from environment variables
    this.token = process.env.NETLIFY_AUTH_TOKEN || null;
    this.siteId = process.env.NETLIFY_SITE_ID || null;
  }
  
  async initialize(): Promise<void> {
    // Validate token
    if (!this.token) {
      console.warn('Netlify auth token not found. Set NETLIFY_AUTH_TOKEN environment variable.');
      return;
    }
    
    try {
      // Test the API connection
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Netlify API error: ${response.statusText}`);
      }
      
      console.log('Netlify deployment service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Netlify deployment service:', error);
      throw error;
    }
  }
  
  async deployProject(projectId: string, config: DeploymentConfig): Promise<DeploymentResult> {
    if (!this.token) {
      throw new Error('Netlify auth token not found');
    }
    
    try {
      // Determine site ID to use
      const siteId = this.siteId || await this.findOrCreateSite(projectId, config);
      
      // Create a new deployment
      const deploymentId = await this.createDeployment(siteId, config);
      
      // Return initial deployment result
      return {
        id: deploymentId,
        status: 'pending',
        logs: ['Deployment initiated']
      };
    } catch (error) {
      console.error('Netlify deployment error:', error);
      throw error;
    }
  }
  
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    if (!this.token) {
      throw new Error('Netlify auth token not found');
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/deploys/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Netlify API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Map Netlify status to our status
      switch (data.state) {
        case 'ready':
          return 'success';
        case 'error':
          return 'failed';
        case 'building':
          return 'building';
        case 'uploading':
          return 'deploying';
        case 'canceled':
          return 'cancelled';
        default:
          return 'pending';
      }
    } catch (error) {
      console.error('Error getting Netlify deployment status:', error);
      throw error;
    }
  }
  
  async cancelDeployment(deploymentId: string): Promise<boolean> {
    if (!this.token) {
      throw new Error('Netlify auth token not found');
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/deploys/${deploymentId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error cancelling Netlify deployment:', error);
      throw error;
    }
  }
  
  async getDeploymentLogs(deploymentId: string): Promise<string[]> {
    if (!this.token) {
      throw new Error('Netlify auth token not found');
    }
    
    try {
      // Netlify doesn't have a direct API for logs, so we'll simulate it
      const response = await fetch(`${this.baseUrl}/deploys/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Netlify API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Generate logs based on deployment state
      const logs: string[] = [
        `Deployment started at ${new Date(data.created_at).toISOString()}`
      ];
      
      if (data.state === 'building' || data.state === 'ready' || data.state === 'error') {
        logs.push('Build process started');
      }
      
      if (data.state === 'uploading' || data.state === 'ready' || data.state === 'error') {
        logs.push('Build completed');
      }
      
      if (data.state === 'ready') {
        logs.push('Deployment successful');
        logs.push(`Site is live at ${data.deploy_ssl_url}`);
      }
      
      if (data.state === 'error') {
        logs.push(`Deployment failed: ${data.error_message || 'Unknown error'}`);
      }
      
      return logs;
    } catch (error) {
      console.error('Error getting Netlify deployment logs:', error);
      throw error;
    }
  }
  
  getProviderName(): string {
    return 'netlify';
  }
  
  // Private helper methods
  
  private async findOrCreateSite(projectId: string, config: DeploymentConfig): Promise<string> {
    try {
      // Try to find an existing site for this project
      const response = await fetch(`${this.baseUrl}/sites?filter=all`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Netlify API error: ${response.statusText}`);
      }
      
      const sites = await response.json();
      
      // Look for a site with matching name or custom domain
      const siteName = `chyper-${projectId}`;
      const existingSite = sites.find((site: any) => 
        site.name === siteName || 
        (site.custom_domain && site.custom_domain === config.domain)
      );
      
      if (existingSite) {
        return existingSite.site_id;
      }
      
      // Create a new site
      const createResponse = await fetch(`${this.baseUrl}/sites`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: siteName,
          custom_domain: config.domain,
          build_settings: {
            cmd: config.buildCommand || 'npm run build',
            dir: config.outputDir || 'dist',
            env: config.environmentVariables || {}
          }
        })
      });
      
      if (!createResponse.ok) {
        throw new Error(`Failed to create Netlify site: ${createResponse.statusText}`);
      }
      
      const newSite = await createResponse.json();
      return newSite.site_id;
    } catch (error) {
      console.error('Error finding or creating Netlify site:', error);
      throw error;
    }
  }
  
  private async createDeployment(siteId: string, config: DeploymentConfig): Promise<string> {
    try {
      // In a real implementation, you would:
      // 1. Zip the build directory
      // 2. Upload it to Netlify
      // 3. Trigger a deployment
      
      // For now, we'll simulate this with a direct deploy API call
      const response = await fetch(`${this.baseUrl}/sites/${siteId}/deploys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Deployment from ChyperAI - ${new Date().toISOString()}`,
          branch: config.branch || 'main',
          deploy_key: config.deployKey
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create Netlify deployment: ${response.statusText}`);
      }
      
      const deployment = await response.json();
      return deployment.id;
    } catch (error) {
      console.error('Error creating Netlify deployment:', error);
      throw error;
    }
  }
}
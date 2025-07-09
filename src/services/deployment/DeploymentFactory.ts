/**
 * Deployment Factory
 * 
 * This factory creates deployment service instances for different providers.
 * It allows the application to switch between deployment providers without
 * changing the core logic.
 */

import { DeploymentConfig } from '../../types/deployment';

// Define the interface that all deployment services must implement
export interface DeploymentService {
  /**
   * Initialize the deployment service
   */
  initialize(): Promise<void>;
  
  /**
   * Deploy a project
   */
  deployProject(projectId: string, config: DeploymentConfig): Promise<DeploymentResult>;
  
  /**
   * Get deployment status
   */
  getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus>;
  
  /**
   * Cancel a deployment
   */
  cancelDeployment(deploymentId: string): Promise<boolean>;
  
  /**
   * Get deployment logs
   */
  getDeploymentLogs(deploymentId: string): Promise<string[]>;
  
  /**
   * Get provider name
   */
  getProviderName(): string;
}

// Deployment result interface
export interface DeploymentResult {
  id: string;
  url?: string;
  status: DeploymentStatus;
  logs: string[];
}

// Deployment status type
export type DeploymentStatus = 'pending' | 'building' | 'deploying' | 'success' | 'failed' | 'cancelled';

// Deployment factory class
export class DeploymentFactory {
  private static instances: Map<string, DeploymentService> = new Map();
  
  /**
   * Create a deployment service for the specified provider
   */
  static async createService(provider: 'netlify' | 'vercel' | 'cloudflare'): Promise<DeploymentService> {
    // Check if we already have an instance for this provider
    if (this.instances.has(provider)) {
      return this.instances.get(provider)!;
    }
    
    let service: DeploymentService;
    
    // Create the appropriate service based on the provider
    switch (provider) {
      case 'netlify':
        const { NetlifyDeploymentService } = await import('./providers/NetlifyDeploymentService');
        service = new NetlifyDeploymentService();
        break;
        
      case 'vercel':
        const { VercelDeploymentService } = await import('./providers/VercelDeploymentService');
        service = new VercelDeploymentService();
        break;
        
      case 'cloudflare':
        const { CloudflareDeploymentService } = await import('./providers/CloudflareDeploymentService');
        service = new CloudflareDeploymentService();
        break;
        
      default:
        throw new Error(`Unsupported deployment provider: ${provider}`);
    }
    
    // Initialize the service
    await service.initialize();
    
    // Cache the instance
    this.instances.set(provider, service);
    
    return service;
  }
  
  /**
   * Create a deployment service based on environment variables
   */
  static async createFromEnvironment(): Promise<DeploymentService> {
    const provider = process.env.DEPLOYMENT_PROVIDER || 'netlify';
    return this.createService(provider as any);
  }
  
  /**
   * Get all available deployment providers
   */
  static getAvailableProviders(): string[] {
    return ['netlify', 'vercel', 'cloudflare'];
  }
}

export default DeploymentFactory
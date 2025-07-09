import { logger } from '../../utils/errorHandling';
import GitHubIntegrationService from '../github/GitHubIntegrationService';

// Repository providers
export type RepositoryProvider = 'github' | 'gitlab' | 'bitbucket';

/**
 * Common repository options interface
 */
export interface RepositoryOptions {
  name: string;
  description?: string;
  isPrivate?: boolean;
  autoInit?: boolean;
  gitIgnoreTemplate?: string;
  licenseTemplate?: string;
}

/**
 * Repository creation result
 */
export interface RepositoryResult {
  name: string;
  url: string;
  cloneUrl: string;
  success: boolean;
  error?: string;
}

/**
 * Repository service interface
 */
export interface RepositoryService {
  initialize(): Promise<void>;
  isAuthenticated(): boolean;
  createRepository(options: RepositoryOptions): Promise<RepositoryResult>;
  getRepositories(): Promise<any[]>;
  getRepository(name: string): Promise<any>;
  deleteRepository?(name: string): Promise<boolean>;
}

/**
 * Factory for creating repository services
 */
class RepositoryFactory {
  private services: Map<RepositoryProvider, RepositoryService> = new Map();

  /**
   * Get a repository service for the specified provider
   */
  async getService(provider: RepositoryProvider): Promise<RepositoryService> {
    // Return cached service if available
    if (this.services.has(provider)) {
      return this.services.get(provider)!;
    }
    
    // Create and initialize service
    const service = this.createService(provider);
    await service.initialize();
    
    // Cache for future use
    this.services.set(provider, service);
    
    return service;
  }
  
  /**
   * Create a repository with the specified provider
   */
  async createRepository(
    provider: RepositoryProvider,
    options: RepositoryOptions
  ): Promise<RepositoryResult> {
    try {
      logger.info(`Creating repository with provider: ${provider}`, { options });
      
      const service = await this.getService(provider);
      
      if (!service.isAuthenticated()) {
        throw new Error(`Not authenticated with ${provider}. Please check your credentials.`);
      }
      
      return await service.createRepository(options);
    } catch (error) {
      logger.error(`Repository creation error with ${provider}`, error);
      
      return {
        name: options.name,
        url: '',
        cloneUrl: '',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Create a repository service for the specified provider
   */
  private createService(provider: RepositoryProvider): RepositoryService {
    switch (provider) {
      case 'github':
        return GitHubIntegrationService;
      case 'gitlab':
        throw new Error('GitLab integration not implemented yet');
      case 'bitbucket':
        throw new Error('Bitbucket integration not implemented yet');
      default:
        throw new Error(`Unsupported repository provider: ${provider}`);
    }
  }
  
  /**
   * Get the default repository provider from environment variables
   */
  getDefaultProvider(): RepositoryProvider {
    const envProvider = import.meta.env.VITE_DEFAULT_REPOSITORY_PROVIDER as RepositoryProvider;
    
    if (envProvider && ['github', 'gitlab', 'bitbucket'].includes(envProvider)) {
      return envProvider;
    }
    
    return 'github';
  }
  
  /**
   * Check if a provider is configured with credentials
   */
  async isProviderConfigured(provider: RepositoryProvider): Promise<boolean> {
    try {
      const service = await this.getService(provider);
      return service.isAuthenticated();
    } catch (error) {
      logger.error(`Error checking provider configuration: ${provider}`, error);
      return false;
    }
  }
}

// Export a singleton instance
export default new RepositoryFactory();
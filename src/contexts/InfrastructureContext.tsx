import React, { createContext, useContext, useState, useEffect } from 'react';
import { logger } from '../utils/errorHandling';
import { toastManager } from '../utils/toastManager';
import AppConfig from '../services/config/AppConfig';
import DatabaseService from '../services/database/DatabaseService';
import DeploymentFactory from '../services/deployment/DeploymentFactory';
import RepositoryFactory from '../services/repository/RepositoryFactory';

// Supported infrastructure providers
type DatabaseProvider = 'supabase' | 'neon' | 'memory';
type DeploymentProvider = 'cloudflare' | 'netlify' | 'vercel';
type RepositoryProvider = 'github' | 'gitlab' | 'bitbucket';

// Provider status
interface ProviderStatus {
  configured: boolean;
  authenticated: boolean;
  error?: string;
}

// Infrastructure context state
interface InfrastructureState {
  // Database
  databaseProvider: DatabaseProvider;
  databaseStatus: ProviderStatus;
  availableDatabaseProviders: DatabaseProvider[];
  
  // Deployment
  deploymentProvider: DeploymentProvider;
  deploymentStatus: ProviderStatus;
  availableDeploymentProviders: DeploymentProvider[];
  
  // Repository
  repositoryProvider: RepositoryProvider;
  repositoryStatus: ProviderStatus;
  availableRepositoryProviders: RepositoryProvider[];
}

// Infrastructure context methods
interface InfrastructureContextType extends InfrastructureState {
  // Database operations
  setDatabaseProvider(provider: DatabaseProvider): Promise<boolean>;
  
  // Deployment operations
  setDeploymentProvider(provider: DeploymentProvider): Promise<boolean>;
  
  // Repository operations
  setRepositoryProvider(provider: RepositoryProvider): Promise<boolean>;
  
  // Authentication
  authenticateProvider(type: 'database' | 'deployment' | 'repository', provider: string, credentials: any): Promise<boolean>;
  
  // Status
  refreshProviderStatus(type: 'database' | 'deployment' | 'repository', provider?: string): Promise<void>;
}

// Create context
const InfrastructureContext = createContext<InfrastructureContextType | undefined>(undefined);

// Provider component
export const InfrastructureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial state
  const [state, setState] = useState<InfrastructureState>({
    // Database
    databaseProvider: AppConfig.database.provider,
    databaseStatus: { configured: false, authenticated: false },
    availableDatabaseProviders: ['supabase', 'neon', 'memory'],
    
    // Deployment
    deploymentProvider: AppConfig.deployment.provider as DeploymentProvider,
    deploymentStatus: { configured: false, authenticated: false },
    availableDeploymentProviders: ['cloudflare', 'netlify', 'vercel'],
    
    // Repository
    repositoryProvider: 'github',
    repositoryStatus: { configured: false, authenticated: false },
    availableRepositoryProviders: ['github', 'gitlab', 'bitbucket'],
  });
  
  // Initialize providers on component mount
  useEffect(() => {
    const initProviders = async () => {
      try {
        await refreshDatabaseStatus();
        await refreshDeploymentStatus();
        await refreshRepositoryStatus();
        
        // Initialize database service
        try {
          await DatabaseService.initialize(state.databaseProvider);
        } catch (error) {
          logger.error('Failed to initialize database service', error);
          // Continue even if database initialization fails
        }
      } catch (error) {
        logger.error('Failed to initialize infrastructure providers', error);
        toastManager.error('Failed to initialize infrastructure. Some features may not work correctly.');
      }
    };
    
    initProviders();
  }, []);
  
  // Set database provider
  const setDatabaseProvider = async (provider: DatabaseProvider): Promise<boolean> => {
    try {
      // Check if provider is configured
      const isConfigured = AppConfig.isProviderConfigured('database', provider);
      
      if (!isConfigured) {
        toastManager.error(`Database provider ${provider} is not configured`);
        return false;
      }
      
      // Initialize database service with new provider
      await DatabaseService.initialize(provider);
      
      // Update state
      setState(prev => ({
        ...prev,
        databaseProvider: provider
      }));
      
      // Refresh status
      await refreshDatabaseStatus(provider);
      
      toastManager.success(`Switched to ${provider} database provider`);
      return true;
    } catch (error) {
      logger.error(`Failed to set database provider to ${provider}`, error);
      toastManager.error(`Failed to switch database provider: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };
  
  // Set deployment provider
  const setDeploymentProvider = async (provider: DeploymentProvider): Promise<boolean> => {
    try {
      // Check if provider is configured
      const service = await DeploymentFactory.getService(provider);
      const isAuthenticated = service.isAuthenticated();
      
      if (!isAuthenticated) {
        toastManager.warning(`Deployment provider ${provider} is not authenticated. Some features may not work.`);
      }
      
      // Update state
      setState(prev => ({
        ...prev,
        deploymentProvider: provider
      }));
      
      // Refresh status
      await refreshDeploymentStatus(provider);
      
      toastManager.success(`Switched to ${provider} deployment provider`);
      return true;
    } catch (error) {
      logger.error(`Failed to set deployment provider to ${provider}`, error);
      toastManager.error(`Failed to switch deployment provider: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };
  
  // Set repository provider
  const setRepositoryProvider = async (provider: RepositoryProvider): Promise<boolean> => {
    try {
      // Check if provider is configured
      const service = await RepositoryFactory.getService(provider);
      const isAuthenticated = service.isAuthenticated();
      
      if (!isAuthenticated) {
        toastManager.warning(`Repository provider ${provider} is not authenticated. Some features may not work.`);
      }
      
      // Update state
      setState(prev => ({
        ...prev,
        repositoryProvider: provider
      }));
      
      // Refresh status
      await refreshRepositoryStatus(provider);
      
      toastManager.success(`Switched to ${provider} repository provider`);
      return true;
    } catch (error) {
      logger.error(`Failed to set repository provider to ${provider}`, error);
      toastManager.error(`Failed to switch repository provider: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };
  
  // Authenticate provider
  const authenticateProvider = async (
    type: 'database' | 'deployment' | 'repository',
    provider: string,
    credentials: any
  ): Promise<boolean> => {
    try {
      switch (type) {
        case 'database':
          // Database authentication is typically handled at the application level
          // This is a no-op for now
          return true;
          
        case 'deployment':
          if (provider === 'cloudflare') {
            const { apiToken, accountId } = credentials;
            if (!apiToken) throw new Error('API token is required');
            
            const cloudflareService = await DeploymentFactory.getService('cloudflare' as DeploymentProvider);
            (cloudflareService as any).setApiToken(apiToken);
            if (accountId) {
              (cloudflareService as any).setAccountId(accountId);
            }
          } else if (provider === 'netlify') {
            const { authToken, siteId } = credentials;
            if (!authToken) throw new Error('Auth token is required');
            
            const netlifyService = await DeploymentFactory.getService('netlify' as DeploymentProvider);
            (netlifyService as any).setApiToken(authToken);
            if (siteId) {
              (netlifyService as any).setSiteId(siteId);
            }
          } else if (provider === 'vercel') {
            const { authToken, teamId } = credentials;
            if (!authToken) throw new Error('Auth token is required');
            
            const vercelService = await DeploymentFactory.getService('vercel' as DeploymentProvider);
            (vercelService as any).setApiToken(authToken);
            if (teamId) {
              (vercelService as any).setTeamId(teamId);
            }
          }
          break;
          
        case 'repository':
          if (provider === 'github') {
            const { accessToken } = credentials;
            if (!accessToken) throw new Error('Access token is required');
            
            const githubService = await RepositoryFactory.getService('github' as RepositoryProvider);
            (githubService as any).setToken(accessToken);
          }
          break;
      }
      
      // Refresh provider status
      await refreshProviderStatus(type, provider as any);
      
      toastManager.success(`Successfully authenticated with ${provider}`);
      return true;
    } catch (error) {
      logger.error(`Failed to authenticate ${type} provider ${provider}`, error);
      toastManager.error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };
  
  // Refresh provider status
  const refreshProviderStatus = async (
    type: 'database' | 'deployment' | 'repository',
    provider?: string
  ): Promise<void> => {
    switch (type) {
      case 'database':
        await refreshDatabaseStatus(provider as DatabaseProvider);
        break;
      case 'deployment':
        await refreshDeploymentStatus(provider as DeploymentProvider);
        break;
      case 'repository':
        await refreshRepositoryStatus(provider as RepositoryProvider);
        break;
    }
  };
  
  // Refresh database status
  const refreshDatabaseStatus = async (provider?: DatabaseProvider): Promise<void> => {
    try {
      const checkProvider = provider || state.databaseProvider;
      
      // Check if provider is configured
      const isConfigured = AppConfig.isProviderConfigured('database', checkProvider);
      
      // Check if database is authenticated
      let isAuthenticated = false;
      
      if (isConfigured) {
        if (checkProvider === state.databaseProvider && DatabaseService.isInitialized()) {
          isAuthenticated = await DatabaseService.healthCheck();
        } else {
          // For providers other than the currently active one, check configuration
          isAuthenticated = isConfigured;
        }
      }
      
      // Update state
      setState(prev => ({
        ...prev,
        databaseStatus: {
          configured: isConfigured,
          authenticated: isAuthenticated
        }
      }));
    } catch (error) {
      logger.error('Failed to refresh database status', error);
      setState(prev => ({
        ...prev,
        databaseStatus: {
          configured: false,
          authenticated: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };
  
  // Refresh deployment status
  const refreshDeploymentStatus = async (provider?: DeploymentProvider): Promise<void> => {
    try {
      const checkProvider = provider || state.deploymentProvider;
      
      // Check if provider is configured
      const isConfigured = AppConfig.isProviderConfigured('deployment', checkProvider);
      
      // Check if deployment service is authenticated
      let isAuthenticated = false;
      
      if (isConfigured) {
        const service = await DeploymentFactory.getService(checkProvider);
        isAuthenticated = service.isAuthenticated();
      }
      
      // Update state
      setState(prev => ({
        ...prev,
        deploymentStatus: {
          configured: isConfigured,
          authenticated: isAuthenticated
        }
      }));
    } catch (error) {
      logger.error('Failed to refresh deployment status', error);
      setState(prev => ({
        ...prev,
        deploymentStatus: {
          configured: false,
          authenticated: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };
  
  // Refresh repository status
  const refreshRepositoryStatus = async (provider?: RepositoryProvider): Promise<void> => {
    try {
      const checkProvider = provider || state.repositoryProvider;
      
      // Check if provider is configured (always github for now)
      const isConfigured = !!AppConfig.github.accessToken;
      
      // Check if repository service is authenticated
      let isAuthenticated = false;
      
      if (isConfigured && checkProvider === 'github') {
        const service = await RepositoryFactory.getService(checkProvider);
        isAuthenticated = service.isAuthenticated();
      }
      
      // Update state
      setState(prev => ({
        ...prev,
        repositoryStatus: {
          configured: isConfigured,
          authenticated: isAuthenticated
        }
      }));
    } catch (error) {
      logger.error('Failed to refresh repository status', error);
      setState(prev => ({
        ...prev,
        repositoryStatus: {
          configured: false,
          authenticated: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };
  
  // Context value
  const contextValue: InfrastructureContextType = {
    ...state,
    setDatabaseProvider,
    setDeploymentProvider,
    setRepositoryProvider,
    authenticateProvider,
    refreshProviderStatus
  };
  
  return (
    <InfrastructureContext.Provider value={contextValue}>
      {children}
    </InfrastructureContext.Provider>
  );
};

// Hook for consuming the context
export const useInfrastructure = () => {
  const context = useContext(InfrastructureContext);
  if (context === undefined) {
    throw new Error('useInfrastructure must be used within an InfrastructureProvider');
  }
  return context;
};
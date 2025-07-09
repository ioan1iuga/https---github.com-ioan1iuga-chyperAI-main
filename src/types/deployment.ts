/**
 * Deployment configuration options
 */
export interface DeploymentConfig {
  /**
   * The environment to deploy to (production, staging, preview)
   */
  environment: 'production' | 'staging' | 'preview';
  
  /**
   * The command to run to build the project
   */
  buildCommand?: string;
  
  /**
   * The directory containing the built files to deploy
   */
  outputDir?: string;
  
  /**
   * Environment variables to set for the deployment
   */
  environmentVariables?: Record<string, string>;
  
  /**
   * The branch to deploy from (for Git-based deployments)
   */
  branch?: string;
  
  /**
   * Custom domain to use for the deployment
   */
  domain?: string;
  
  /**
   * Deployment key or token (provider-specific)
   */
  deployKey?: string;
  
  /**
   * Whether to use HTTPS for the deployment
   */
  https?: boolean;
  
  /**
   * Custom headers to set for the deployment
   */
  headers?: Record<string, string>;
  
  /**
   * Redirect rules for the deployment
   */
  redirects?: Array<{
    source: string;
    destination: string;
    permanent: boolean;
  }>;
  
  /**
   * Whether to clean the output directory before building
   */
  clean?: boolean;
  
  /**
   * Additional provider-specific options
   */
  [key: string]: any;
}

/**
 * Deployment provider type
 */
export type DeploymentProvider = 'netlify' | 'vercel' | 'cloudflare';

/**
 * Deployment status type
 */
export type DeploymentStatus = 'pending' | 'building' | 'deploying' | 'success' | 'failed' | 'cancelled';

/**
 * Deployment result interface
 */
export interface DeploymentResult {
  /**
   * The deployment ID
   */
  id: string;
  
  /**
   * The URL of the deployed site
   */
  url?: string;
  
  /**
   * The status of the deployment
   */
  status: DeploymentStatus;
  
  /**
   * Deployment logs
   */
  logs: string[];
  
  /**
   * Error message if the deployment failed
   */
  error?: string;
  
  /**
   * The time the deployment was created
   */
  createdAt?: Date;
  
  /**
   * The time the deployment was completed
   */
  completedAt?: Date;
  
  /**
   * The provider used for the deployment
   */
  provider?: DeploymentProvider;
  
  /**
   * The environment the deployment was made to
   */
  environment?: 'production' | 'staging' | 'preview';
  
  /**
   * Whether the deployment can be promoted to production
   */
  promotable?: boolean;
  
  /**
   * Whether the deployment can be rolled back
   */
  rollbackable?: boolean;
}
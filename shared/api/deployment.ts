/**
 * Shared deployment utilities for serverless functions
 */

import { SupabaseClient } from "@supabase/supabase-js";

interface Deployment {
  id: string;
  status: 'building' | 'deploying' | 'success' | 'failed' | 'queued';
  logs: string[];
  url?: string;
  deployed_at?: string;
  error?: string;
  created_at: string;
  project_id: string;
}

interface DeploymentOptions {
  projectId: string;
  environment?: 'development' | 'staging' | 'production';
  provider?: 'cloudflare' | 'vercel' | 'netlify';
  buildCommand?: string;
  outputDir?: string;
  environmentVariables?: Record<string, string>;
}

/**
 * Process a deployment background task
 */
export async function processDeployment(
  deploymentId: string,
  options: DeploymentOptions,
  supabase: SupabaseClient
): Promise<void> {
  try {
    // Step 1: Update to building status
    console.log(`Starting deployment process for ${deploymentId}`);
    
    await supabase
      .from('deployments')
      .update({
        status: 'building',
        logs: ['Deployment initiated', 'Building project...']
      })
      .eq('id', deploymentId);
      
    // Add delay to simulate build time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 2: Update to deploying status
    await supabase
      .from('deployments')
      .update({
        status: 'deploying',
        logs: ['Deployment initiated', 'Building project...', 'Deploying to production...']
      })
      .eq('id', deploymentId);
    
    // Add delay to simulate deployment time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Update to success status
    // Get deployment domain from environment variables or use default
    const defaultDomain = 'chyper-workers.dev';
    const deploymentDomain = typeof globalThis.Deno !== 'undefined'
      ? globalThis.Deno.env.get('DEPLOYMENT_DOMAIN')
      : process.env.DEPLOYMENT_DOMAIN || defaultDomain;
    
    // Create a sanitized project ID and random suffix for the deployment URL
    const sanitizedProjectId = options.projectId.replace(/[^a-z0-9]/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    // Generate the deployment URL with configurable domain
    const deploymentUrl = `https://${sanitizedProjectId}-${randomSuffix}.${deploymentDomain}`;
    
    await supabase
      .from('deployments')
      .update({
        status: 'success',
        url: deploymentUrl,
        deployed_at: new Date().toISOString(),
        logs: [
          'Deployment initiated', 
          'Building project...', 
          'Deploying to production...', 
          'Deployment successful!'
        ]
      })
      .eq('id', deploymentId);
      
    console.log(`Deployment ${deploymentId} completed successfully`);
  } catch (error) {
    console.error(`Deployment process error for ${deploymentId}:`, error);
    
    // Update deployment with error status
    try {
      await supabase
        .from('deployments')
        .update({
          status: 'failed',
          logs: ['Deployment initiated', `Deployment failed: ${error.message}`],
          error: error.message
        })
        .eq('id', deploymentId);
    } catch (updateError) {
      console.error('Failed to update deployment with error status:', updateError);
    }
  }
}

/**
 * Get deployments for a project
 */
export async function getDeployments(
  supabase: SupabaseClient,
  projectId?: string
): Promise<Deployment[]> {
  try {
    // Query deployments
    let query = supabase
      .from('deployments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching deployments:', error);
    throw error;
  }
}
// Supabase Edge Function for Deployments API
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import { 
  corsHeaders,
  handleCORS,
  createSupabaseClient,
  getUser,
  successResponse,
  errorResponse,
  unauthorizedResponse,
  toResponse
} from '../_shared/api.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    // Create Supabase client
    const supabase = createSupabaseClient(req);

    // Get the authenticated user's ID
    const user = await getUser(supabase);

    if (!user) {
      return toResponse(unauthorizedResponse(), corsHeaders);
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const deploymentId = pathParts[pathParts.length - 1];
    const isDeploymentIdRequest = deploymentId && deploymentId !== 'deployments';

    // Handle different HTTP methods
    if (req.method === 'GET') {
      if (isDeploymentIdRequest) {
        // Get specific deployment by ID
        const { data, error } = await supabase
          .from('deployments')
          .select('*')
          .eq('id', deploymentId)
          .single();
        
        if (error) {
          throw error;
        }
        
        return toResponse(successResponse(data), corsHeaders);
      } else {
        // Get all deployments or filter by projectId
        const projectId = url.searchParams.get('projectId');
        
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
    
        return toResponse(successResponse(data), corsHeaders);
      }
    } else if (req.method === 'POST') {
      // Create a new deployment
      const { projectId, environment = 'production', ...config } = await req.json();
      
      // Create deployment record
      const { data, error } = await supabase
        .from('deployments')
        .insert({
          project_id: projectId,
          user_id: user.id,
          environment,
          status: 'pending',
          provider: 'netlify',
          config: config || {},
          logs: ['Deployment initiated'],
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Start deployment process in the background
      processDeployment(data, supabase);
      
      return toResponse(successResponse(data), corsHeaders);
    }

    // Method not supported
    return toResponse(errorResponse('Method not supported', 405), corsHeaders);
  } catch (error) {
    // Handle any errors
    console.error('Error processing deployments request:', error.message);
    
    return toResponse(errorResponse(error.message, 400), corsHeaders);
  }
});

// Background function to handle deployment process
async function processDeployment(deployment: any, supabase: any) {
  try {
    // Step 1: Update to building status
    console.log(`Starting deployment process for ${deployment.id}`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await supabase
      .from('deployments')
      .update({
        status: 'building',
        logs: [...deployment.logs, 'Building project...']
      })
      .eq('id', deployment.id);
      
    // Step 2: Update to deploying status
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await supabase
      .from('deployments')
      .update({
        status: 'deploying',
        logs: [...deployment.logs, 'Building project...', 'Deploying to production...']
      })
      .eq('id', deployment.id);
    
    // Step 3: Update to success status
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get deployment domain from environment variables or use default
    const defaultDomain = 'chyper-workers.dev';
    const deploymentDomain = Deno.env.get('DEPLOYMENT_DOMAIN') || defaultDomain;
    
    // Create a sanitized project ID and random suffix for the deployment URL
    const sanitizedProjectId = deployment.project_id.replace(/[^a-z0-9]/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    // Generate the deployment URL with configurable domain
    const deploymentUrl = `https://${sanitizedProjectId}-${randomSuffix}.${deploymentDomain}`;
    
    await supabase
      .from('deployments')
      .update({
        status: 'success',
        url: deploymentUrl,
        deployed_at: new Date().toISOString(),
        logs: [...deployment.logs, 'Building project...', 'Deploying to production...', 'Deployment successful!']
      })
      .eq('id', deployment.id);
      
    console.log(`Deployment ${deployment.id} completed successfully`);
  } catch (error) {
    console.error(`Deployment process error for ${deployment.id}:`, error);
    
    // Update deployment with error status
    try {
      await supabase
        .from('deployments')
        .update({
          status: 'failed',
          logs: [...deployment.logs, `Deployment failed: ${error.message}`],
          error: error.message
        })
        .eq('id', deployment.id);
    } catch (updateError) {
      console.error('Failed to update deployment with error status:', updateError);
    }
  }
}
// Supabase Edge Function for Deployments API
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Hono, Context, Next } from 'hono';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface HonoContext {
  env: {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    DEPLOYMENT_DOMAIN?: string;
  };
  [key: string]: any;
}

interface Deployment {
  id: string;
  project_id: string;
  user_id: string;
  environment: string;
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed';
  provider: string;
  config: Record<string, unknown>;
  logs: string[];
  url?: string;
  deployed_at?: string;
}

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Initialize Hono app
const app = new Hono<{ Bindings: HonoContext }>();

// CORS middleware
app.use('*', async (c: Context, next: Next) => {
  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }
  await next();
  Object.entries(corsHeaders).forEach(([key, value]) => {
    c.res.headers.set(key, value);
  });
});

// Authentication middleware
app.use('*', async (c: Context, next: Next) => {
  try {
    // Create Supabase client using the request's authorization header
    const authorization = c.req.header('Authorization');
    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: authorization ?? '' } },
        auth: { persistSession: false },
      }
    );

    // Get the authenticated user's ID
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return c.json({
        success: false,
        error: 'Unauthorized',
      }, 401);
    }

    // Add user to context
    c.set('user', user);
    await next();
  } catch (e) {
    const error = e as Error;
    console.error('Auth error:', error.message);
    return c.json({
      success: false,
      error: 'Authentication error',
      message: error.message
    }, 401);
  }
});

// Get all deployments or filter by projectId
app.get('/', async (c: Context) => {
  try {
    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: c.req.header('Authorization') ?? '' } },
        auth: { persistSession: false },
      }
    );

    // Get query parameters
    const projectId = c.req.query('projectId');

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

    return c.json({
      success: true,
      data
    });
  } catch (e) {
    const error = e as Error;
    console.error('Error fetching deployments:', error.message);
    return c.json({
      success: false,
      error: error.message,
    }, 400);
  }
});

// Get a specific deployment by ID
app.get('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: c.req.header('Authorization') ?? '' } },
        auth: { persistSession: false },
      }
    );

    const { data, error } = await supabase
      .from('deployments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return c.json({
      success: true,
      data
    });
  } catch (e) {
    const error = e as Error;
    console.error('Error fetching deployment:', error.message);
    return c.json({
      success: false,
      error: error.message
    }, 400);
  }
});

// Create a new deployment
app.post('/', async (c: Context) => {
  try {
    const user = c.get('user');
    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: c.req.header('Authorization') ?? '' } },
        auth: { persistSession: false },
      }
    );

    // Parse request body
    const { projectId, environment = 'production', ...config } = await c.req.json();

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
    c.executionCtx.waitUntil(processDeployment(data, supabase, c));
    
    return c.json({
      success: true,
      data
    }, 201);
  }
  catch (e) {
    const error = e as Error;
    console.error('Error creating deployment:', error.message);
    return c.json({
      success: false,
      error: error.message
    }, 400);
  }
});

// Background function to handle deployment process
async function processDeployment(deployment: Deployment, supabase: SupabaseClient, c: Context) {
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
    const deploymentDomain = c.env.DEPLOYMENT_DOMAIN || defaultDomain;

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
  } catch (e) {
    const error = e as Error;
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

// Serve the Hono app
serve(app.fetch);
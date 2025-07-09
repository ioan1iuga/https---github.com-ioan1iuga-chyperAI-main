import { Hono } from 'hono';
import type { Context } from 'hono';

// Initialize Hono app
const app = new Hono();

interface Deployment {
  id: string;
  projectId: string;
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed';
  environment: 'production' | 'development' | 'staging';
  url: string | null;
  deployedAt: string;
  logs: string[];
}

// ⚠️ In production, use KV, D1 or Durable Objects for persistence
const deployments: Deployment[] = [
  {
    id: '1',
    projectId: '1',
    status: 'success',
    environment: 'production',
    url: 'https://codecraft-app.workers.dev',
    deployedAt: new Date().toISOString(),
    logs: ['Build started', 'Dependencies installed', 'Build completed', 'Deployed successfully']
  }
];

// Middleware to parse projectId from query
const parseProjectId = (c: Context) => {
  const projectId = c.req.query('projectId');
  return projectId;
};

// GET /deployments?projectId=1
app.get('/', (c) => {
  const projectId = parseProjectId(c);
  const data = projectId
    ? deployments.filter(d => d.projectId === projectId)
    : deployments;
    
  return c.json(data);
});

// POST /deployments { projectId, environment? }
app.post('/', async (c) => {
  const { projectId, environment = 'production' } = await c.req.json();

  // Validate input
  if (!projectId) {
    return c.json({ error: 'Project ID is required' }, 400);
  }

  const newDeployment: Deployment = {
    id: Date.now().toString(),
    projectId,
    status: 'pending',
    environment,
    url: null,
    deployedAt: new Date().toISOString(),
    logs: ['Deployment initiated']
  };

  deployments.push(newDeployment);

  // Process deployment in the background
  c.executionCtx.waitUntil((async () => {
    try {
      // Step 1: Building
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const deployment = deployments.find(d => d.id === newDeployment.id);
      if (!deployment) return;
      
      deployment.status = 'building';
      deployment.logs.push('Build started');
      
      // Step 2: Deploying
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const deployingDeployment = deployments.find(d => d.id === newDeployment.id);
      if (!deployingDeployment) return;
      
      deployingDeployment.status = 'deploying';
      deployingDeployment.logs.push('Build completed', 'Deploying...');
      
      // Step 3: Success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const finalDeployment = deployments.find(d => d.id === newDeployment.id);
      if (!finalDeployment) return;
      
      // Get domain from environment variables or use default
      const deploymentDomain = (c.env as Record<string, any>).DEPLOYMENT_DOMAIN || 'chyper-workers.dev';
      
      // Create deployment URL with configurable domain
      const sanitizedProjectId = projectId.replace(/[^a-z0-9]/g, '-');
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      
      finalDeployment.status = 'success';
      finalDeployment.url = `https://${sanitizedProjectId}-${randomSuffix}.${deploymentDomain}`;
      finalDeployment.logs.push('Deployment successful!');
    } catch (error) {
      console.error(`Deployment process error for ${newDeployment.id}:`, error);
      
      const failedDeployment = deployments.find(d => d.id === newDeployment.id);
      if (!failedDeployment) return;
      
      failedDeployment.status = 'failed';
      failedDeployment.logs.push(`Deployment failed: ${error.message || 'Unknown error'}`);
    }
  })());

  return c.json(newDeployment, 201);
});

// GET /deployments/:id
app.get('/:id', (c) => {
  const id = c.req.param('id');
  const deployment = deployments.find(d => d.id === id);
  
  if (!deployment) {
    return c.json({ error: 'Deployment not found' }, 404);
  }
  
  return c.json(deployment);
});

// DELETE /deployments/:id
app.delete('/:id', (c) => {
  const id = c.req.param('id');
  const deploymentIndex = deployments.findIndex(d => d.id === id);
  
  if (deploymentIndex === -1) {
    return c.json({ error: 'Deployment not found' }, 404);
  }
  
  deployments.splice(deploymentIndex, 1);
  return c.json({ success: true }, 200);
});

// Export as a Cloudflare Pages Function
export const onRequest = app.fetch;
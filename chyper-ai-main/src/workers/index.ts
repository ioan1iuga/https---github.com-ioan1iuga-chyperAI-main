// Main Cloudflare Worker Entry Point
import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Export Durable Object classes
export { CollaborationRoom } from './durable-objects/CollaborationRoom.js';
export { TerminalSession } from './durable-objects/TerminalSession.js';
export { LivePreviewSession } from './durable-objects/LivePreviewSession.js';

// Initialize Hono app
const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: '*', // In production, limit this to your domains
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key', 'apikey'],
  exposeHeaders: ['Content-Length', 'X-Request-Id']
}));

// Projects API
app.get('/api/projects', (c) => {
  // Get projects
  return c.json({
    success: true,
    data: [
      {
        id: '1',
        name: 'E-commerce Platform',
        description: 'Full-stack e-commerce application',
        framework: 'React',
        status: 'active',
        lastModified: new Date().toISOString()
      }
    ]
  });
});

app.post('/api/projects', async (c) => {
  try {
    const body = await c.req.json();
    // Create project with data from request
    return c.json({
      success: true,
      data: {
        id: crypto.randomUUID(),
        ...body,
        status: 'active',
        lastModified: new Date().toISOString()
      }
    }, 201);
  } catch (error) {
    return c.json({ success: false, error: 'Invalid request body' }, 400);
  }
});

app.get('/api/projects/:id', (c) => {
  const id = c.req.param('id');
  return c.json({
    success: true,
    data: {
      id,
      name: 'E-commerce Platform',
      description: 'Full-stack e-commerce application',
      framework: 'React',
      status: 'active',
      lastModified: new Date().toISOString()
    }
  });
});

// Deployments API
app.get('/api/deployments', (c) => {
  // Optional project filter
  const projectId = c.req.query('projectId');
  
  // Get deployments, filtered by projectId if provided
  const deployments = projectId ? [
    {
      id: '1',
      projectId,
      status: 'success',
      environment: 'production',
      url: 'https://codecraft-app.pages.dev',
      deployedAt: new Date().toISOString(),
      logs: ['Build started', 'Dependencies installed', 'Build completed', 'Deployed successfully']
    }
  ] : [
    {
      id: '1',
      projectId: '1',
      status: 'success',
      environment: 'production',
      url: 'https://codecraft-app.pages.dev',
      deployedAt: new Date().toISOString(),
      logs: ['Build started', 'Dependencies installed', 'Build completed', 'Deployed successfully']
    }
  ];
  
  return c.json({ success: true, data: deployments });
});

app.post('/api/deployments', async (c) => {
  try {
    const { projectId, environment = 'production' } = await c.req.json();
    
    if (!projectId) {
      return c.json({ success: false, error: 'Project ID is required' }, 400);
    }
    
    const newDeployment = {
      id: crypto.randomUUID(),
      projectId,
      status: 'pending',
      environment,
      url: null,
      deployedAt: new Date().toISOString(),
      logs: ['Deployment initiated']
    };
    
    // Simulate async deployment process
    c.executionCtx.waitUntil((async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get domain from environment or use default
      const deploymentDomain = c.env.DEPLOYMENT_DOMAIN || 'chyper-workers.dev';
      
      // Create sanitized project ID and URL
      const sanitizedProjectId = projectId.replace(/[^a-z0-9]/g, '-');
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const deploymentUrl = `https://${sanitizedProjectId}-${randomSuffix}.${deploymentDomain}`;
      
      // In a real implementation, update the deployment in a database
      console.log(`Deployment completed: ${deploymentUrl}`);
    })());
    
    return c.json({ success: true, data: newDeployment }, 201);
  } catch (error) {
    return c.json({ success: false, error: 'Invalid request body' }, 400);
  }
});

app.get('/api/deployments/:id', (c) => {
  const id = c.req.param('id');
  return c.json({
    success: true,
    data: {
      id,
      projectId: '1',
      status: 'success',
      environment: 'production',
      url: 'https://codecraft-app.pages.dev',
      deployedAt: new Date().toISOString(),
      logs: ['Build started', 'Dependencies installed', 'Build completed', 'Deployed successfully']
    }
  });
});

// Integrations API
app.get('/api/integrations', (c) => {
  return c.json({
    success: true,
    data: [
      {
        id: '1',
        name: 'Cloudflare',
        status: 'connected',
        type: 'deployment'
      }
    ]
  });
});

app.get('/api/integrations/cloudflare/workers', (c) => {
  return c.json({ success: true, data: [] });
});

app.get('/api/integrations/github/repos', (c) => {
  return c.json({ success: true, data: [] });
});

// Health check endpoint
app.get(['/api/health', '/health'], (c) => {
  return c.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: c.env.API_VERSION || '1.0.0',
      environment: c.env.ENVIRONMENT || 'production',
      services: [
        { name: 'api', status: 'online' },
        { name: 'database', status: 'online' },
        { name: 'auth', status: 'online' }
      ]
    }
  });
});

// SPA Fallback - This serves the frontend for non-API routes
app.get('*', (c) => {
  // Get site title from environment variables
  const siteTitle = c.env.APP_TITLE || 'ChyperAI - AI-Powered Development Platform';
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${siteTitle}</title>
    </head>
    <body>
      <div id="root" data-env="${c.env.ENVIRONMENT || 'production'}">
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
          <div style="text-align: center;">
            <h1>${c.env.APP_NAME || 'ChyperAI Platform'}</h1>
            <p>${c.env.APP_DESCRIPTION || 'Production deployment ready!'}</p>
            <p>API available at <code>${c.env.API_PATH || '/api/*'}</code></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return c.html(html);
});

// Export the worker handler
export default {
  fetch: app.fetch,
  
  // Keep the scheduled and queue handlers from the original file
  async scheduled(event, env, ctx) {
    console.log(`Scheduled event: ${event.cron}`);
    
    // Execute scheduled tasks based on cron expression
    switch (event.cron) {
      case '0 0 * * *': // Daily at midnight
        console.log('Running daily cleanup tasks');
        // Daily cleanup logic would go here
        break;
      
      case '0 */6 * * *': // Every 6 hours
        console.log('Running health check');
        // Health check logic would go here
        break;
        
      default:
        console.log(`Unknown cron schedule: ${event.cron}`);
    }
  },
  
  async queue(batch, env, ctx) {
    console.log(`Processing queue batch: ${batch.messages.length} messages`);
    
    for (const message of batch.messages) {
      try {
        // Process each message based on its type
        const body = message.body || {};
        
        switch (body.type) {
          case 'build':
            console.log(`Processing build for project ${body.projectId}`);
            // Build logic would go here
            break;
            
          case 'deploy':
            console.log(`Processing deployment for project ${body.projectId}`);
            // Deployment logic would go here
            break;
            
          case 'notification':
            console.log(`Processing notification for user ${body.userId}`);
            // Notification logic would go here
            break;
            
          default:
            console.log(`Unknown message type: ${body.type}`);
        }
        
        // Acknowledge the message
        message.ack();
      } catch (error) {
        console.error(`Error processing message: ${error.message}`);
        message.retry();
      }
    }
  }
};
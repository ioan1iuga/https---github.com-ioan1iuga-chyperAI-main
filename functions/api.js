// API Router for Cloudflare Pages Functions
// Using shared utilities from the shared/api directory

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { 
  corsHeaders, 
  errorResponse, 
  successResponse 
} from '../shared/api/index.js';

// Initialize Hono app
const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: '*', // In production, limit this to your domains
  allowMethods: ['GET', 'POST', 'PUT', DELETE, 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'apikey'],
  exposeHeaders: ['Content-Length', 'X-Request-Id']
}));

// Projects API
app.get('/projects', (c) => {
  return c.json(successResponse([
    {
      id: '1',
      name: 'E-commerce Platform',
      description: 'Full-stack e-commerce application',
      framework: 'React',
      status: 'active',
      lastModified: new Date().toISOString()
    }
  ]));
});

app.post('/projects', async (c) => {
  try {
    const body = await c.req.json();
    if (!body.name) {
      return c.json(errorResponse('Project name is required', 400), 400);
    }
    
    // Create a new project
    const newProject = {
      id: crypto.randomUUID(),
      name: body.name,
      description: body.description || '',
      framework: body.framework || 'React',
      status: 'active',
      lastModified: new Date().toISOString()
    };
    
    return c.json(successResponse(newProject), 201);
  } catch (err) {
    return c.json(errorResponse('Invalid request body', 400), 400);
  }
});

app.get('/projects/:id', (c) => {
  const id = c.req.param('id');
  
  return c.json(successResponse({
    id,
    name: 'E-commerce Platform',
    description: 'Full-stack e-commerce application',
    framework: 'React',
    status: 'active',
    lastModified: new Date().toISOString()
  }));
});

// Deployments API
app.get('/deployments', (c) => {
  const projectId = c.req.query('projectId');
  
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
  
  return c.json(successResponse(deployments));
});

// Health check
app.get('/health', (c) => {
  return c.json(successResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: c.env.ENVIRONMENT || 'production'
  }));
});

// Catch all other routes with 404
app.all('*', (c) => {
  return c.json(errorResponse('Not Found', 404), 404);
});

export function onRequest(context) {
  // Add path prefix for API routes
  const url = new URL(context.request.url);
  
  // Check if the URL path starts with /api/
  if (url.pathname.startsWith('/api/')) {
    // Remove the /api prefix for processing
    url.pathname = url.pathname.substring(4);
    
    // Create a new request with the modified URL
    const newRequest = new Request(url.toString(), context.request);
    
    // Handle the request with the Hono app
    return app.fetch(newRequest, context.env, context.executionCtx);
  }
  
  // If the URL doesn't start with /api/, pass it through to the Hono app
  return app.fetch(context.request, context.env, context.executionCtx);
}
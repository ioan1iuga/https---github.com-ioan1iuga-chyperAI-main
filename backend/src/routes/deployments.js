import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Base domain for deployments - can be configured via environment variables
const BASE_DEPLOYMENT_DOMAIN = process.env.DEPLOYMENT_DOMAIN || 'chyper.ai';

// In-memory storage for deployments
let deployments = [
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

// Get all deployments
router.get('/', (req, res) => {
  logger.info('GET /deployments', { query: req.query });
  const { projectId } = req.query;
  const filteredDeployments = projectId 
    ? deployments.filter(d => d.projectId === projectId)
    : deployments;
  res.json(filteredDeployments);
});

// Create new deployment
router.post('/', (req, res) => {
  logger.info('POST /deployments', { body: req.body });
  const { projectId, environment = 'production' } = req.body;
  
  if (!projectId) {
    logger.warn('POST /deployments - Missing projectId');
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }
  
  const newDeployment = {
    id: Date.now().toString(),
    projectId,
    status: 'pending',
    environment,
    url: null,
    deployedAt: new Date().toISOString(),
    logs: ['Deployment initiated']
  };
  
  deployments.push(newDeployment);
  
  // Simulate deployment process
  // Note: In a production environment with Cloudflare Workers,
  // this would use waitUntil() and a durable object or D1 database
  const simulateDeploymentProcess = async () => {
    try {
      logger.debug(`Starting deployment process for ${newDeployment.id}`);
      
      // Step 1: Building
      setTimeout(() => {
        const deployment = deployments.find(d => d.id === newDeployment.id);
        if (deployment) {
          deployment.status = 'building';
          deployment.logs.push('Build started');
          logger.debug(`Deployment ${newDeployment.id} status: building`);
        }
      }, 1000);
      
      // Step 2: Deploying
      setTimeout(() => {
        const deployment = deployments.find(d => d.id === newDeployment.id);
        if (deployment) {
          deployment.status = 'success';
          
          // Create sanitized deployment URL with configurable domain
          const sanitizedProjectId = projectId.replace(/[^a-z0-9]/g, '-');
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          
          // Use configurable base domain
          const deploymentUrl = `https://${sanitizedProjectId}-${randomSuffix}.${BASE_DEPLOYMENT_DOMAIN}`;
          deployment.url = deploymentUrl;
          
          deployment.logs.push('Build completed', 'Deployed successfully');
          logger.debug(`Deployment ${newDeployment.id} status: success`);
        }
      }, 5000);
    } catch (error) {
      logger.error(`Deployment process error for ${newDeployment.id}:`, error);
      
      // Handle errors in the deployment process
      const deployment = deployments.find(d => d.id === newDeployment.id);
      if (deployment) {
        deployment.status = 'failed';
        deployment.logs.push(`Deployment failed: ${error.message || 'Unknown error'}`);
      }
    }
  };
  
  // Start the deployment process
  setTimeout(() => {
    const deployment = deployments.find(d => d.id === newDeployment.id);
    if (deployment) {
      deployment.status = 'pending';
      deployment.logs.push('Build started');
      simulateDeploymentProcess();
    }
  }, 1000);
  
  res.status(201).json(newDeployment);
});

// Get deployment by ID
router.get('/:id', (req, res) => {
  logger.info(`GET /deployments/${req.params.id}`);
  const deployment = deployments.find(d => d.id === req.params.id);
  if (!deployment) {
    logger.warn(`Deployment not found: ${req.params.id}`);
    return res.status(404).json({ error: 'Deployment not found' });
  }
  res.json(deployment);
});

// Get deployment logs
router.get('/:id/logs', (req, res) => {
  logger.info(`GET /deployments/${req.params.id}/logs`);
  const deployment = deployments.find(d => d.id === req.params.id);
  
  if (!deployment) {
    logger.warn(`Deployment not found: ${req.params.id}`);
    return res.status(404).json({ error: 'Deployment not found' });
  }
  
  // Return the logs for this deployment
  res.json({
    success: true,
    data: deployment.logs || []
  });
});

export default router;
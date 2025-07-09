import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Mock environment variables store (replace with database in production)
const envVariables = new Map();

// Get environment variables for a project
router.get('/projects/:id/env', (req, res) => {
  const projectId = req.params.id;
  const environment = req.query.environment || 'development';
  
  logger.info(`GET /projects/${projectId}/env`, { environment });
  
  const envKey = `${projectId}:${environment}`;
  const variables = envVariables.get(envKey) || {
    // Default variables for demo
    DATABASE_URL: environment === 'production' ? '******' : 'postgresql://localhost:5432/codecraft_dev',
    API_BASE_URL: environment === 'production' ? 'https://api.chyper.ai' : 'http://localhost:3001',
    NODE_ENV: environment
  };
  
  // Mark secrets with asterisks for GET requests if they're production secrets
  const maskSecrets = environment === 'production';
  const maskedVariables = { ...variables };
  
  if (maskSecrets) {
    for (const [key, value] of Object.entries(maskedVariables)) {
      if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD') || key.includes('TOKEN')) {
        maskedVariables[key] = '******';
      }
    }
  }
  
  res.json({
    success: true,
    data: {
      environment,
      variables: maskedVariables
    }
  });
});

// Update environment variables for a project
router.put('/projects/:id/env', (req, res) => {
  const projectId = req.params.id;
  const { environment = 'development', variables } = req.body;
  
  if (!variables || typeof variables !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Variables must be provided as an object'
    });
  }
  
  logger.info(`PUT /projects/${projectId}/env`, { 
    environment,
    variableCount: Object.keys(variables).length
  });
  
  const envKey = `${projectId}:${environment}`;
  envVariables.set(envKey, variables);
  
  res.json({
    success: true,
    data: {
      environment,
      variables
    }
  });
});

// Delete an environment variable
router.delete('/projects/:id/env/:key', (req, res) => {
  const projectId = req.params.id;
  const key = req.params.key;
  const environment = req.query.environment || 'development';
  
  logger.info(`DELETE /projects/${projectId}/env/${key}`, { environment });
  
  const envKey = `${projectId}:${environment}`;
  const variables = envVariables.get(envKey);
  
  if (!variables) {
    return res.status(404).json({
      success: false,
      error: 'Environment variables not found'
    });
  }
  
  if (!(key in variables)) {
    return res.status(404).json({
      success: false,
      error: `Variable '${key}' not found`
    });
  }
  
  // Remove the variable
  const updatedVariables = { ...variables };
  delete updatedVariables[key];
  
  envVariables.set(envKey, updatedVariables);
  
  res.json({
    success: true,
    message: `Variable '${key}' deleted`,
    data: {
      environment,
      variables: updatedVariables
    }
  });
});

export default router;
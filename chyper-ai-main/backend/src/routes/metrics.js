import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Mock metrics data
const metricsData = {
  projects: new Map(),
  users: new Map()
};

// Helper to generate random metrics data for demo
const generateProjectMetrics = (projectId, range = '24h') => {
  // Generate time-series data
  const timePoints = range === '24h' ? 24 : range === '7d' ? 7 : range === '30d' ? 30 : 24;
  const now = new Date();
  
  const cpuSeries = [];
  const memorySeries = [];
  const requestSeries = [];
  const responseSeries = [];
  
  for (let i = 0; i < timePoints; i++) {
    const timestamp = new Date(now.getTime() - (timePoints - i) * 3600000);
    
    cpuSeries.push({
      timestamp: timestamp.toISOString(),
      value: Math.floor(Math.random() * 40) + 10 // 10-50%
    });
    
    memorySeries.push({
      timestamp: timestamp.toISOString(),
      value: Math.floor(Math.random() * 500) + 100 // 100-600 MB
    });
    
    requestSeries.push({
      timestamp: timestamp.toISOString(),
      value: Math.floor(Math.random() * 50) + 5 // 5-55 requests
    });
    
    responseSeries.push({
      timestamp: timestamp.toISOString(),
      value: Math.floor(Math.random() * 200) + 50 // 50-250ms
    });
  }
  
  return {
    projectId,
    range,
    timestamp: new Date().toISOString(),
    metrics: {
      cpu: {
        current: cpuSeries[cpuSeries.length - 1].value,
        average: Math.floor(cpuSeries.reduce((sum, point) => sum + point.value, 0) / cpuSeries.length),
        peak: Math.max(...cpuSeries.map(point => point.value)),
        series: cpuSeries
      },
      memory: {
        current: memorySeries[memorySeries.length - 1].value,
        average: Math.floor(memorySeries.reduce((sum, point) => sum + point.value, 0) / memorySeries.length),
        peak: Math.max(...memorySeries.map(point => point.value)),
        series: memorySeries
      },
      requests: {
        total: requestSeries.reduce((sum, point) => sum + point.value, 0),
        average: Math.floor(requestSeries.reduce((sum, point) => sum + point.value, 0) / requestSeries.length),
        peak: Math.max(...requestSeries.map(point => point.value)),
        series: requestSeries
      },
      response_time: {
        current: responseSeries[responseSeries.length - 1].value,
        average: Math.floor(responseSeries.reduce((sum, point) => sum + point.value, 0) / responseSeries.length),
        p95: Math.floor(Math.max(...responseSeries.map(point => point.value)) * 0.95),
        series: responseSeries
      }
    }
  };
};

// Get project metrics
router.get('/projects/:id/metrics', (req, res) => {
  const projectId = req.params.id;
  const range = req.query.range || '24h';
  
  logger.info(`GET /projects/${projectId}/metrics`, { range });
  
  // Generate or retrieve metrics for this project
  let projectMetrics = metricsData.projects.get(projectId);
  
  if (!projectMetrics || projectMetrics.range !== range) {
    // Generate new metrics data
    projectMetrics = generateProjectMetrics(projectId, range);
    metricsData.projects.set(projectId, projectMetrics);
  }
  
  res.json({
    success: true,
    data: projectMetrics
  });
});

// Get network metrics
router.get('/projects/:id/network', (req, res) => {
  const projectId = req.params.id;
  
  logger.info(`GET /projects/${projectId}/network`);
  
  // Mock network data
  const networkRequests = [];
  
  // Generate some mock requests
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  const statusCodes = [200, 201, 204, 400, 401, 403, 404, 500];
  const paths = [
    '/api/users', 
    '/api/products', 
    '/api/auth/login', 
    '/api/orders',
    '/api/analytics',
    '/api/search'
  ];
  
  for (let i = 0; i < 10; i++) {
    const method = methods[Math.floor(Math.random() * methods.length)];
    const path = paths[Math.floor(Math.random() * paths.length)];
    const status = statusCodes[Math.floor(Math.random() * statusCodes.length)];
    const time = Math.floor(Math.random() * 500) + 20; // 20-520ms
    const size = Math.floor(Math.random() * 5000) + 100; // 100-5100B
    
    networkRequests.push({
      id: `req_${Date.now()}_${i}`,
      method,
      url: path,
      status,
      duration: time,
      size: `${size} B`,
      timestamp: new Date(Date.now() - i * 60000).toISOString() // Past 10 minutes
    });
  }
  
  res.json({
    success: true,
    data: {
      requests: networkRequests,
      summary: {
        totalRequests: networkRequests.length,
        averageResponseTime: Math.floor(networkRequests.reduce((sum, req) => sum + req.duration, 0) / networkRequests.length),
        successRate: Math.floor(networkRequests.filter(req => req.status < 400).length / networkRequests.length * 100)
      }
    }
  });
});

// Get performance data for specific UI components
router.get('/projects/:id/performance/components', (req, res) => {
  const projectId = req.params.id;
  
  logger.info(`GET /projects/${projectId}/performance/components`);
  
  // Mock component performance data
  const components = [
    {
      name: 'Dashboard',
      renderTime: Math.floor(Math.random() * 50) + 10,
      reRenders: Math.floor(Math.random() * 5) + 1,
      memoryUsage: Math.floor(Math.random() * 1000) + 200
    },
    {
      name: 'UserTable',
      renderTime: Math.floor(Math.random() * 100) + 20,
      reRenders: Math.floor(Math.random() * 8) + 2,
      memoryUsage: Math.floor(Math.random() * 2000) + 500
    },
    {
      name: 'ProductList',
      renderTime: Math.floor(Math.random() * 80) + 15,
      reRenders: Math.floor(Math.random() * 6) + 1,
      memoryUsage: Math.floor(Math.random() * 1500) + 300
    },
    {
      name: 'CartSummary',
      renderTime: Math.floor(Math.random() * 30) + 5,
      reRenders: Math.floor(Math.random() * 10) + 1,
      memoryUsage: Math.floor(Math.random() * 800) + 100
    }
  ];
  
  res.json({
    success: true,
    data: {
      components,
      timestamp: new Date().toISOString()
    }
  });
});

// Get user-specific metrics
router.get('/users/:id/usage', (req, res) => {
  const userId = req.params.id;
  
  // Only allow users to access their own metrics
  if (req.user.id !== userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
  
  logger.info(`GET /users/${userId}/usage`);
  
  // Mock user usage data
  const usage = {
    apiCalls: {
      total: 2456,
      last24h: 142,
      last7d: 876,
      byEndpoint: {
        '/api/projects': 245,
        '/api/files': 1022,
        '/api/deployments': 89,
        '/api/ai': 1100
      }
    },
    storage: {
      total: 256, // MB
      byProject: {
        'project-1': 120,
        'project-2': 85,
        'project-3': 51
      }
    },
    deployments: {
      total: 14,
      active: 3,
      byProvider: {
        'netlify': 8,
        'vercel': 3,
        'cloudflare': 3
      }
    },
    aiUsage: {
      tokens: {
        total: 125000,
        byModel: {
          'gpt-4': 45000,
          'gpt-3.5-turbo': 80000
        }
      }
    }
  };
  
  res.json({
    success: true,
    data: usage
  });
});

export default router;
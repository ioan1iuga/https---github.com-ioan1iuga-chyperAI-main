// Health Check Router
import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: { 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

export default router;
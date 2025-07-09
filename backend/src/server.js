// Express Server for ChyperAI Backend
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import healthRoutes from './routes/health.js';
import aiRoutes from './routes/ai.js';
import authRoutes from './routes/auth.js';
import deploymentsRoutes from './routes/deployments.js';
import envRoutes from './routes/env.js';
import integrationsRoutes from './routes/integrations.js';
import metricsRoutes from './routes/metrics.js';
import projectsRoutes from './routes/projects.js';
import sessionRoutes from './routes/sessionRoutes.js';
import terminalsRoutes from './routes/terminals.js';
import workspaceRoutes from './routes/workspace.js';

// Load environment variables
config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/deployments', deploymentsRoutes);
app.use('/api/env', envRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/terminals', terminalsRoutes);
app.use('/api/workspace', workspaceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`🔍 Health check endpoint: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down server gracefully...');
  process.exit(0);
});
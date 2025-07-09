import express from 'express';

const router = express.Router();

// File system operations
router.get('/files', (req, res) => {
  // Mock file system structure
  const files = {
    'src': {
      type: 'directory',
      children: {
        'components': {
          type: 'directory',
          children: {
            'App.tsx': { type: 'file', size: 1234, modified: new Date().toISOString() },
            'Dashboard.tsx': { type: 'file', size: 2345, modified: new Date().toISOString() }
          }
        },
        'utils': {
          type: 'directory',
          children: {
            'helpers.ts': { type: 'file', size: 567, modified: new Date().toISOString() }
          }
        }
      }
    },
    'package.json': { type: 'file', size: 890, modified: new Date().toISOString() },
    'README.md': { type: 'file', size: 1234, modified: new Date().toISOString() }
  };
  
  res.json(files);
});

// Read file content
router.get('/files/*', (req, res) => {
  const filePath = req.params[0];
  
  // Mock file content based on file type
  let content = '';
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    content = `// ${filePath}\nimport React from 'react';\n\nexport default function Component() {\n  return <div>Hello World</div>;\n}`;
  } else if (filePath.endsWith('.json')) {
    content = '{\n  "name": "codecraft",\n  "version": "1.0.0"\n}';
  } else if (filePath.endsWith('.md')) {
    content = `# ${filePath}\n\nThis is a markdown file.`;
  }
  
  res.json({ content, path: filePath });
});

// Write file content
router.put('/files/*', (req, res) => {
  const filePath = req.params[0];
  const { content } = req.body;
  
  // Mock file save operation
  console.log(`Saving file: ${filePath}`);
  console.log(`Content: ${content.substring(0, 100)}...`);
  
  res.json({ success: true, path: filePath });
});

// Environment variables
router.get('/env', (req, res) => {
  const { environment = 'development' } = req.query;
  
  const envVars = {
    development: {
      DATABASE_URL: 'postgresql://localhost:5432/codecraft_dev',
      API_BASE_URL: 'http://localhost:3001',
      NODE_ENV: 'development'
    },
    staging: {
      DATABASE_URL: 'postgresql://staging-db/codecraft',
      API_BASE_URL: 'https://api-staging.codecraft.dev',
      NODE_ENV: 'staging'
    },
    production: {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://prod-db/chyper_ai',
      API_BASE_URL: 'https://api.chyper.ai',
      NODE_ENV: 'production'
    }
  };
  
  res.json(envVars[environment] || {});
});

router.post('/env', (req, res) => {
  const { environment, key, value, isSecret } = req.body;
  
  // Mock environment variable creation
  console.log(`Setting ${key}=${isSecret ? '[HIDDEN]' : value} for ${environment}`);
  
  res.json({ success: true, key, environment });
});

export default router;
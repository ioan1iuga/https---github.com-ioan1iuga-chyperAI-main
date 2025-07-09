import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const logger = console;

// In-memory storage (replace with database in production)
let projects = [
  {
    id: uuidv4(),
    name: 'E-commerce Platform',
    description: 'Full-stack e-commerce application',
    framework: 'React',
    status: 'active',
    environment: 'development',
    deployments: [],
    lastModified: new Date().toISOString()
  }
];

// Get all projects
router.get('/', (req, res) => {
  logger.info('GET /projects');
  res.json(projects);
});

// Create new project
router.post('/', (req, res) => {
  const { name, description, framework = 'React' } = req.body;
  
  const newProject = {
    id: uuidv4(),
    name,
    description,
    framework,
    status: 'active',
    environment: 'development',
    deployments: [],
    lastModified: new Date().toISOString()
  };
  
  projects.push(newProject);
  res.status(201).json(newProject);
});

// Get project by ID
router.get('/:id', (req, res) => {
  logger.info(`GET /projects/${req.params.id}`);
  const project = projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

// Update project
router.put('/:id', (req, res) => {
  const projectIndex = projects.findIndex(p => p.id === req.params.id);
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  projects[projectIndex] = {
    ...projects[projectIndex],
    ...req.body,
    lastModified: new Date().toISOString()
  };
  
  res.json(projects[projectIndex]);
});

// Delete project
router.delete('/:id', (req, res) => {
  logger.info(`DELETE /projects/${req.params.id}`);
  const projectIndex = projects.findIndex(p => p.id === req.params.id);
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  projects.splice(projectIndex, 1);
  res.status(204).send();
});

// Get project files
router.get('/:id/files', (req, res) => {
  logger.info(`GET /projects/${req.params.id}/files`);
  // In a real implementation, this would fetch files from a database or file system
  const mockFiles = {
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
  
  res.json(mockFiles);
});

// Save project file
router.put('/:id/files', (req, res) => {
  logger.info(`PUT /projects/${req.params.id}/files`);
  // In a real implementation, this would save file content to a database or file system
  const { filePath, content } = req.body;
  
  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }
  
  res.json({ success: true, path: filePath });
});

// Get project workspaces
router.get('/:id/workspaces', (req, res) => {
  logger.info(`GET /projects/${req.params.id}/workspaces`);
  // In a real implementation, this would fetch workspaces from a database
  const mockWorkspaces = [
    {
      id: uuidv4(),
      name: 'Default Workspace',
      layout: 'split',
      panels: ['code', 'preview'],
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];
  
  res.json(mockWorkspaces);
});

// Create project workspace
router.post('/:id/workspaces', (req, res) => {
  logger.info(`POST /projects/${req.params.id}/workspaces`);
  const { name, layout, panels } = req.body;
  
  const newWorkspace = {
    id: uuidv4(),
    name: name || 'New Workspace',
    layout: layout || 'split',
    panels: panels || ['code', 'preview'],
    isActive: true,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json(newWorkspace);
});

// Get project terminals
router.get('/:id/terminals', (req, res) => {
  logger.info(`GET /projects/${req.params.id}/terminals`);
  // In a real implementation, this would fetch terminal sessions from a database
  res.json([]);
});

// Create terminal session
router.post('/:id/terminals', (req, res) => {
  logger.info(`POST /projects/${req.params.id}/terminals`);
  // In a real implementation, this would create a new terminal session
  const terminalSession = {
    id: uuidv4(),
    projectId: req.params.id,
    cwd: '/home/project',
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json(terminalSession);
});

export default router;
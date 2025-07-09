import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';

// Initialize Hono app
const app = new Hono();

// ⚠️ In production, use D1, KV, or Durable Objects for persistence
let projects = [
  {
    id: crypto.randomUUID(),
    name: 'E-commerce Platform',
    description: 'Full-stack e-commerce application',
    framework: 'React',
    status: 'active',
    owner_id: 'user-id', // This would be dynamic in production
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Get all projects
app.get('/', (c) => {
  // Get authenticated user from request
  const userId = getUserIdFromRequest(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Filter projects by owner_id (in a real app, query your database instead)
  const userProjects = projects.filter(p => p.owner_id === userId);
  return c.json(userProjects);
});

// Get a specific project by ID
app.get('/:id', (c) => {
  const userId = getUserIdFromRequest(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const id = c.req.param('id');
  const project = projects.find(p => p.id === id && p.owner_id === userId);
  
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }
  
  return c.json(project);
});

// Create a new project
app.post('/', async (c) => {
  const userId = getUserIdFromRequest(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const body = await c.req.json();
    const { name, description, framework = 'React' } = body;
    
    // Validate required fields
    if (!name) {
      return c.json({ error: 'Project name is required' }, 400);
    }
    
    // Create new project
    const newProject = {
      id: crypto.randomUUID(),
      name,
      description: description || '',
      framework,
      status: 'active',
      owner_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add to our in-memory collection
    projects.push(newProject);
    
    // In production, you would save to D1 or KV storage here
    return c.json(newProject, 201);
  } catch (error) {
    console.error('Error creating project:', error);
    return c.json({ error: 'Invalid request body' }, 400);
  }
});

// Update an existing project
app.put('/:id', async (c) => {
  const userId = getUserIdFromRequest(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Find the project to update
    const projectIndex = projects.findIndex(p => p.id === id && p.owner_id === userId);
    if (projectIndex === -1) {
      return c.json({ error: 'Project not found' }, 404);
    }
    
    // Update the project (preserving id, owner_id, created_at)
    const updatedProject = {
      ...projects[projectIndex],
      ...body,
      id: projects[projectIndex].id,
      owner_id: projects[projectIndex].owner_id,
      created_at: projects[projectIndex].created_at,
      updated_at: new Date().toISOString()
    };
    
    projects[projectIndex] = updatedProject;
    
    return c.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return c.json({ error: 'Invalid request body' }, 400);
  }
});

// Delete a project
app.delete('/:id', (c) => {
  const userId = getUserIdFromRequest(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const id = c.req.param('id');
  const initialLength = projects.length;
  
  // Remove the project
  projects = projects.filter(p => !(p.id === id && p.owner_id === userId));
  
  if (projects.length === initialLength) {
    return c.json({ error: 'Project not found' }, 404);
  }
  
  return c.json({ success: true }, 204);
});

// Helper function to get userId from the request
function getUserIdFromRequest(c) {
  // In production with Supabase:
  // 1. Get JWT from Authorization header
  // 2. Verify JWT
  // 3. Extract userId from JWT claims
  
  // For this demo, we'll use a simplified approach
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // In production: verify this token with Supabase JWT verification
    // For demo, we'll extract a mock userId from the token
    return token.substring(0, 8) || 'user-id';
  }
  
  // Fallback to checking for cookie (in a real app, verify this properly)
  const authCookie = getCookie(c, 'sb-auth-token');
  if (authCookie) {
    return 'user-id'; // Mock user ID
  }
  
  return null;
}

// Export the app as a Cloudflare Pages Function
export const onRequest = app.fetch;
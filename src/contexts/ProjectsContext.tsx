import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/errorHandling';

// Define types
export interface Project {
  id: string;
  name: string;
  description: string;
  framework: string;
  status: 'active' | 'inactive';
  lastModified: string;
  createdAt: string;
  files?: string[];
}

interface ProjectsContextType {
  projects: Project[];
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (name: string, description: string, framework: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  getProjectById: (id: string) => Project | undefined;
}

const ProjectsContext = createContext<ProjectsContextType | null>(null);

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};

export const ProjectsProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would fetch from an API or database
      // For now, we'll use localStorage or create demo projects if none exist
      const savedProjects = localStorage.getItem('chyper-projects');
      
      if (savedProjects) {
        setProjects(JSON.parse(savedProjects));
      } else {
        // Create demo projects if none exist
        const demoProjects: Project[] = [
          {
            id: uuidv4(),
            name: 'E-commerce Frontend',
            description: 'Modern e-commerce frontend with product listings, cart, and checkout',
            framework: 'React',
            status: 'active',
            lastModified: new Date().toLocaleDateString(),
            createdAt: new Date().toISOString()
          },
          {
            id: uuidv4(),
            name: 'API Backend',
            description: 'RESTful API backend with authentication and database integration',
            framework: 'Node.js',
            status: 'active',
            lastModified: new Date().toLocaleDateString(),
            createdAt: new Date().toISOString()
          },
          {
            id: uuidv4(),
            name: 'Marketing Website',
            description: 'Company marketing website with blog and contact forms',
            framework: 'Next.js',
            status: 'inactive',
            lastModified: new Date().toLocaleDateString(),
            createdAt: new Date().toISOString()
          }
        ];
        
        setProjects(demoProjects);
        localStorage.setItem('chyper-projects', JSON.stringify(demoProjects));
      }
    } catch (err) {
      logger.error('Error fetching projects', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (name: string, description: string, framework: string): Promise<Project> => {
    try {
      const newProject: Project = {
        id: uuidv4(),
        name,
        description,
        framework,
        status: 'active',
        lastModified: new Date().toLocaleDateString(),
        createdAt: new Date().toISOString(),
        files: []
      };
      
      const updatedProjects = [...projects, newProject];
      setProjects(updatedProjects);
      
      // Persist to localStorage
      localStorage.setItem('chyper-projects', JSON.stringify(updatedProjects));
      
      logger.info('Created new project', { id: newProject.id, name });
      return newProject;
    } catch (err) {
      logger.error('Error creating project', err);
      throw err;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>): Promise<Project> => {
    try {
      const projectIndex = projects.findIndex(p => p.id === id);
      
      if (projectIndex === -1) {
        throw new Error(`Project with ID ${id} not found`);
      }
      
      const updatedProject = {
        ...projects[projectIndex],
        ...updates,
        lastModified: new Date().toLocaleDateString()
      };
      
      const updatedProjects = [...projects];
      updatedProjects[projectIndex] = updatedProject;
      
      setProjects(updatedProjects);
      
      // Persist to localStorage
      localStorage.setItem('chyper-projects', JSON.stringify(updatedProjects));
      
      logger.info('Updated project', { id, updates });
      return updatedProject;
    } catch (err) {
      logger.error('Error updating project', err);
      throw err;
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    try {
      const updatedProjects = projects.filter(p => p.id !== id);
      
      if (updatedProjects.length === projects.length) {
        throw new Error(`Project with ID ${id} not found`);
      }
      
      setProjects(updatedProjects);
      
      // Persist to localStorage
      localStorage.setItem('chyper-projects', JSON.stringify(updatedProjects));
      
      logger.info('Deleted project', { id });
    } catch (err) {
      logger.error('Error deleting project', err);
      throw err;
    }
  };

  const getProjectById = (id: string): Project | undefined => {
    return projects.find(p => p.id === id);
  };

  const value: ProjectsContextType = {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    getProjectById
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
};
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code, Database, Cloud, GitBranch, Workflow, Settings, Loader } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useProjects } from '../contexts/ProjectsContext';
import { toastManager } from '../utils/toastManager';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { projects, createProject } = useProjects();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Define actions with their handlers
  const actions = [
    { 
      id: 'new-project', 
      icon: Code, 
      label: 'New Project', 
      color: 'bg-blue-600 hover:bg-blue-700',
      handler: async () => {
        setIsLoading('new-project');
        try {
          const newProject = await createProject(
            'New Project', 
            'A new project created from Quick Actions', 
            'React'
          );
          
          toastManager.success('Project created successfully');
          navigate(`/workbench?projectId=${newProject.id}`);
        } catch (error) {
          toastManager.error('Failed to create project');
        } finally {
          setIsLoading(null);
        }
      }
    },
    { 
      id: 'database', 
      icon: Database, 
      label: 'Database', 
      color: 'bg-green-600 hover:bg-green-700',
      handler: () => {
        if (projects.length > 0) {
          navigate(`/workbench?projectId=${projects[0].id}&panel=database`);
        } else {
          toastManager.info('Create a project first to access database features');
        }
      }
    },
    { 
      id: 'deploy', 
      icon: Cloud, 
      label: 'Deploy', 
      color: 'bg-purple-600 hover:bg-purple-700',
      handler: () => {
        if (projects.length > 0) {
          navigate(`/workbench?projectId=${projects[0].id}&panel=deploy`);
        } else {
          toastManager.info('Create a project first to access deployment features');
        }
      }
    },
    { 
      id: 'git', 
      icon: GitBranch, 
      label: 'Git Sync', 
      color: 'bg-orange-600 hover:bg-orange-700',
      handler: () => {
        if (projects.length > 0) {
          navigate(`/workbench?projectId=${projects[0].id}&panel=git`);
        } else {
          toastManager.info('Create a project first to access Git features');
        }
      }
    },
    { 
      id: 'workflows', 
      icon: Workflow, 
      label: 'Workflows', 
      color: 'bg-pink-600 hover:bg-pink-700',
      handler: () => {
        if (projects.length > 0) {
          navigate(`/workbench?projectId=${projects[0].id}&panel=workflows`);
        } else {
          toastManager.info('Create a project first to access Workflow features');
        }
      }
    },
    { 
      id: 'settings', 
      icon: Settings, 
      label: 'Settings', 
      color: 'bg-gray-600 hover:bg-gray-700',
      handler: () => {
        navigate('/account');
      }
    },
  ];

  return (
    <div className={`rounded-lg p-4 border ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-base font-semibold mb-3 ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.handler}
            disabled={isLoading === action.id}
            className={`flex items-center gap-2 p-2.5 rounded-md transition-colors ${action.color} text-white`}
          >
            {isLoading === action.id ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <action.icon size={14} />
            )}
            <span className="text-xs font-medium">
              {isLoading === action.id ? 'Processing...' : action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
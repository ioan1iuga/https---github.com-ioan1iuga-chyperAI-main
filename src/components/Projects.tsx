import React from 'react';
import { useState } from 'react';
import { useProjects } from '../contexts/ProjectsContext';
import { Plus, FolderOpen, Clock, Activity, Settings, ExternalLink, AlertCircle, Loader } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ProjectsProps {
  onProjectSelect: (projectId: string, projectName: string, projectFramework: string) => void;
}

export const Projects: React.FC<ProjectsProps> = ({ onProjectSelect }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { projects, loading, error, createProject, fetchProjects } = useProjects();
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', framework: 'React' });
  const [createError, setCreateError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!newProject.name.trim()) {
      setCreateError('Project name is required');
      return;
    }
    
    if (!newProject.description.trim()) {
      setCreateError('Project description is required');
      return;
    }
    
    setIsCreating(true);
    setCreateError(null);
    
    try {
      const createdProject = await createProject(
        newProject.name, 
        newProject.description, 
        newProject.framework
      );
      
      setNewProject({ name: '', description: '', framework: 'React' });
      setShowCreateForm(false);
      onProjectSelect(createdProject.id, createdProject.name, createdProject.framework);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Projects</h1>
            <p className="text-gray-400">
              Manage and organize all your development projects
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
          >
            <Plus size={20} />
            Create Project
          </button>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
          <span>{projects.length} total projects</span>
          <span>•</span>
          <span>{projects.filter(p => p.status === 'active').length} active</span>
          <span>•</span>
          <span>{projects.filter(p => p.status === 'inactive').length} inactive</span>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className={`p-4 mb-6 rounded-lg border ${
          isDark ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <p>{error}</p>
              <button 
                onClick={fetchProjects} 
                className="mt-2 text-sm underline hover:no-underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {loading && !isCreating && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <Loader size={40} className="animate-spin text-blue-500 mb-4" />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading projects...
            </p>
          </div>
        </div>
      )}

      {/* Create Project Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Create New Project</h3>
            
            {createError && (
              <div className={`p-3 mb-4 rounded-md ${
                isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'
              }`}>
                {createError}
              </div>
            )}
            
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="My Project"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Project description"
                  rows={3}
                  required
                ></textarea>
              </div>
              
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Framework
                </label>
                <select
                  value={newProject.framework}
                  onChange={(e) => setNewProject({...newProject, framework: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="React">React</option>
                  <option value="Vue">Vue</option>
                  <option value="Angular">Angular</option>
                  <option value="Next.js">Next.js</option>
                  <option value="Svelte">Svelte</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateError(null);
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader size={16} className="inline-block animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Projects Grid */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                  <FolderOpen size={24} className="text-white" />
                </div>
                <div className="flex items-center gap-1">
                  <span className={`w-3 h-3 rounded-full ${
                    project.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                  <Activity size={14} className="text-gray-400" />
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                  <Settings size={16} className="text-gray-400" />
                </button>
                <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                  <ExternalLink size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
            
            <div onClick={() => onProjectSelect(project.id, project.name, project.framework)} className="cursor-pointer">
              <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-blue-400 transition-colors">
                {project.name}
              </h3>
              
              <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                {project.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                  {project.framework}
                </span>
                
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={12} />
                  <span>{project.lastModified}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onProjectSelect(project.id, project.name, project.framework)}
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Open Project
                  <ExternalLink size={12} />
                </button>
                
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live" />
                  <span className="text-xs text-gray-500">Running</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Add Project Card */}
        <div
          onClick={() => setShowCreateForm(true)}
          className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-6 hover:border-gray-500 cursor-pointer transition-all duration-200 hover:bg-gray-750 flex flex-col items-center justify-center min-h-[280px] group"
        >
          <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-600 transition-colors">
            <Plus size={32} className="text-gray-400 group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-medium text-white mb-2">Create New Project</h3>
          <p className="text-sm text-gray-400 text-center">
            Start a new development project with your preferred framework
          </p>
        </div>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && projects.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className={`w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mb-4`}>
            <FolderOpen size={36} className="text-gray-400" />
          </div>
          <h3 className={`text-xl font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Projects Yet</h3>
          <p className={`text-sm text-center max-w-md mb-6 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            You don't have any projects yet. Create your first project to get started.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
          >
            <Plus size={18} />
            Create First Project
          </button>
        </div>
      )}
    </div>
  );
};
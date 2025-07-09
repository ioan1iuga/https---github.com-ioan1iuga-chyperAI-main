import React, { useState } from 'react';
import { useProjects } from '../contexts/ProjectsContext';
import { Plus, FolderOpen, Clock, Activity, AlertCircle, Loader } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ProjectsGridProps {
  onProjectSelect: (projectId: string, projectName: string, projectFramework: string) => void;
}

export const ProjectsGrid: React.FC<ProjectsGridProps> = ({ onProjectSelect }) => {
  const { projects, loading, error, createProject, fetchProjects } = useProjects();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showProjectForm, setShowProjectForm] = useState(false);
  
  const handleCreateClick = () => {
    setShowProjectForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-lg font-semibold ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>Projects</h2>
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors text-sm text-white"
        >
          <Plus size={14} />
          New Project
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className={`p-4 mb-4 rounded-lg border ${
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
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <Loader size={20} className="animate-spin text-blue-500" />
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Loading projects...
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <FolderOpen size={24} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
          </div>
          <h3 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            No projects yet
          </h3>
          <p className={`text-sm text-center mb-4 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Create your first project to get started
          </p>
          <button
            onClick={handleCreateClick}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            <Plus size={14} className="inline-block mr-1.5" />
            New Project
          </button>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onProjectSelect(project.id, project.name, project.framework)}
              className={`rounded-lg p-4 border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen size={18} className="text-blue-500" />
                  <h3 className={`font-medium text-sm ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>{project.name}</h3>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Activity size={10} />
                  <span className={`w-2 h-2 rounded-full ${
                    project.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                </div>
              </div>
            
              <p className={`text-xs mb-3 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>{project.description}</p>
            
              <div className={`flex items-center justify-between text-xs ${
                isDark ? 'text-gray-500' : 'text-gray-500'
              }`}>
                <div className="flex items-center gap-1">
                  <Clock size={10} />
                  <span>Updated {project.lastModified}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  {project.framework}
                </span>
              </div>
            </div>
          ))}

          {/* Create Project Button */}
          <div
            onClick={handleCreateClick}
            className={`rounded-lg p-4 border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px] text-center ${
              isDark 
                ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600' 
                : 'bg-white/50 border-gray-200 hover:bg-white hover:border-gray-300'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Plus size={24} className={isDark ? 'text-gray-300' : 'text-gray-500'} />
            </div>
            <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Create Project
            </h3>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Add a new development project
            </p>
          </div>
        </div>
      )}
      
      {/* Pass the createProject function up to the parent to handle the modal display */}
      {showProjectForm && (
        <div className="hidden">
          {/* This is just a placeholder. The actual form is implemented in the Projects.tsx component */}
          {setShowProjectForm(false)}
        </div>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { Search, Pin, X, FolderOpen, Clock } from 'lucide-react';
import { useProjects } from '../contexts/ProjectsContext';

interface ProjectSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedProjectIds: string[];
  onSelectProject: (projectId: string, projectName: string, projectFramework: string) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  isOpen,
  onClose,
  pinnedProjectIds,
  onSelectProject
}) => {
  const { projects } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.framework.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unpinnedProjects = filteredProjects.filter(project => 
    !pinnedProjectIds.includes(project.id)
  );

  const handleSelectProject = (project: any) => {
    onSelectProject(project.id, project.name, project.framework);
    onClose();
  };

  const getFrameworkColor = (framework: string) => {
    switch (framework.toLowerCase()) {
      case 'react': return 'text-blue-400 bg-blue-600/20';
      case 'vue': return 'text-green-400 bg-green-600/20';
      case 'angular': return 'text-red-400 bg-red-600/20';
      case 'next.js': return 'text-gray-300 bg-gray-600/20';
      case 'svelte': return 'text-orange-400 bg-orange-600/20';
      default: return 'text-gray-400 bg-gray-600/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Pin Project</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-auto p-4">
          {unpinnedProjects.length === 0 ? (
            <div className="text-center py-8">
              {searchTerm ? (
                <div>
                  <Search size={48} className="mx-auto text-gray-500 mb-4" />
                  <p className="text-gray-400">No projects found matching "{searchTerm}"</p>
                </div>
              ) : (
                <div>
                  <Pin size={48} className="mx-auto text-gray-500 mb-4" />
                  <p className="text-gray-400">All projects are already pinned</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {unpinnedProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 cursor-pointer transition-all duration-200 hover:bg-gray-800 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FolderOpen size={20} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                          {project.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded font-medium ${getFrameworkColor(project.framework)}`}>
                            {project.framework}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock size={12} />
                            <span>{project.lastModified}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors">
                        <Pin size={12} />
                        Pin
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{unpinnedProjects.length} available projects</span>
            <span>{pinnedProjectIds.length} projects pinned</span>
          </div>
        </div>
      </div>
    </div>
  );
};
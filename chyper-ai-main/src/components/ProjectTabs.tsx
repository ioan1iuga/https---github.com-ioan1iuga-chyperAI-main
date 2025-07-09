import React from 'react';
import { X, Pin, Plus } from 'lucide-react';
import { ProjectSelector } from './ProjectSelector';
import { useTheme } from '../contexts/ThemeContext';

interface PinnedProject {
  id: string;
  name: string;
  framework: string;
}

interface ProjectTabsProps {
  pinnedProjects: PinnedProject[];
  activeProjectId: string | null;
  onProjectChange: (projectId: string) => void;
  onCloseProject: (projectId: string) => void;
  onSelectProject: (projectId: string, projectName: string, projectFramework: string) => void;
}

export const ProjectTabs: React.FC<ProjectTabsProps> = ({
  pinnedProjects,
  activeProjectId,
  onProjectChange,
  onCloseProject,
  onSelectProject
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [showProjectSelector, setShowProjectSelector] = React.useState(false);

  const getFrameworkColor = (framework: string) => {
    switch (framework.toLowerCase()) {
      case 'react': return 'text-blue-400';
      case 'vue': return 'text-green-400';
      case 'angular': return 'text-red-400';
      case 'next.js': return 'text-gray-300';
      case 'svelte': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <>
      <div className={`border-b flex items-center overflow-x-auto ${
        isDark 
          ? 'bg-gray-900 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        {/* Add Project Button */}
        <div className={`border-r ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={() => setShowProjectSelector(true)}
            className={`flex items-center gap-2 px-3 py-2 transition-all duration-200 text-xs ${
              isDark 
                ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Pin another project"
          >
            <Plus size={12} />
            <span className="font-medium">Add Project</span>
          </button>
        </div>

        {/* Project Tabs */}
        {pinnedProjects.length > 0 && (
          <div className="flex items-center min-w-0">
            {pinnedProjects.map((project) => (
              <div
                key={project.id}
                className={`flex items-center gap-2 px-3 py-2 border-r cursor-pointer transition-all duration-200 min-w-0 group text-xs ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                } ${
                  activeProjectId === project.id
                    ? isDark 
                      ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                      : 'bg-white text-gray-900 border-b-2 border-blue-500 shadow-sm'
                    : isDark 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => onProjectChange(project.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Pin size={10} className={`${getFrameworkColor(project.framework)} flex-shrink-0`} />
                  <span className="font-medium truncate max-w-[100px]" title={project.name}>
                    {project.name}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    isDark ? 'bg-gray-700' : 'bg-gray-200'
                  } ${getFrameworkColor(project.framework)} flex-shrink-0`}>
                    {project.framework}
                  </span>
                </div>
                
                {pinnedProjects.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseProject(project.id);
                    }}
                    className={`p-1 rounded transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 ${
                      isDark 
                        ? 'hover:bg-gray-600' 
                        : 'hover:bg-gray-300'
                    }`}
                    title="Close project"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Status Info */}
        <div className={`flex-1 px-3 py-2 text-xs ${
          isDark ? 'text-gray-500' : 'text-gray-500'
        }`}>
          {pinnedProjects.length > 0 && (
            <span>{pinnedProjects.length} project{pinnedProjects.length !== 1 ? 's' : ''} pinned</span>
          )}
        </div>
      </div>
      
      {/* Project Selector Modal */}
      <ProjectSelector
        isOpen={showProjectSelector}
        onClose={() => setShowProjectSelector(false)}
        pinnedProjectIds={pinnedProjects.map(p => p.id)}
        onSelectProject={onSelectProject}
      />
    </>
  );
};
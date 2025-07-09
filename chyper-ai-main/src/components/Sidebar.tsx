import React, { useState } from 'react';
import { 
  Home, 
  Code, 
  MessageSquare,
  Monitor,
  GitBranch, 
  Database, 
  Settings, 
  Workflow,
  Cloud,
  Network,
  Activity,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sun,
  Moon,
  FolderOpen,
  Bot
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { SidebarUserAccount } from './SidebarUserAccount';

interface PinnedProject {
  id: string;
  name: string;
  framework: string;
}

interface SidebarProps {
  currentView: 'dashboard' | 'workbench' | 'projects';
  onViewChange: (view: 'dashboard' | 'workbench' | 'projects') => void;
  pinnedProjects: PinnedProject[];
  activeProjectId: string | null;
  activePanel?: string;
  onPanelChange?: (panelId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  pinnedProjects,
  activeProjectId,
  activePanel,
  onPanelChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';

  const navigationItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', action: () => onViewChange('dashboard') },
    { id: 'masterchat', icon: MessageSquare, label: 'Master Chat', action: () => window.location.href = '/master-chat' },
    { id: 'projects', icon: Layers, label: 'Projects', action: () => onViewChange('projects') },
    { id: 'workbench', icon: Code, label: 'Workbench', action: () => onViewChange('workbench') },
  ];

  const workbenchItems = [
    { id: 'code', icon: Code, label: 'Code Editor' },
    { id: 'ai-assistant', icon: Bot, label: 'AI Assistant' },
    { id: 'database', icon: Database, label: 'Database' },
    { id: 'git', icon: GitBranch, label: 'Git Operations' },
    { id: 'environment', icon: Settings, label: 'Environment' },
    { id: 'workflows', icon: Workflow, label: 'Workflows' },
    { id: 'integrations', icon: Cloud, label: 'Integrations' },
    { id: 'network', icon: Network, label: 'Network Monitor' },
    { id: 'terminal', icon: Code, label: 'Terminal' },
    { id: 'performance', icon: Activity, label: 'Performance' },
    { id: 'preview', icon: Monitor, label: 'Visual Preview' },
    { id: 'visual-flow', icon: Layers, label: 'Visual Flow' },
  ];

  return (
    <div className={`transition-all duration-300 border-r ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    } ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className={`p-3 border-b flex items-center justify-between ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {!isCollapsed && (
          <h1 className="text-lg font-semibold text-blue-500">ChyperAI</h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1 rounded transition-colors ${
            isDark 
              ? 'hover:bg-gray-700' 
              : 'hover:bg-gray-100'
          }`}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="p-2 flex-1">
        <div className="space-y-0.5">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors text-sm ${
                currentView === item.id
                  ? 'bg-blue-600 text-white'
                  : isDark 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <item.icon size={18} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </div>

        {currentView === 'workbench' && pinnedProjects.length > 0 && (
          <div className="mt-6">
            {!isCollapsed && (
              <h3 className={`text-xs font-medium mb-1.5 px-3 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Project Tools
              </h3>
            )}
            <div className="space-y-0.5">
              {workbenchItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onPanelChange?.(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors text-sm ${
                    activePanel === item.id
                      ? 'bg-blue-600 text-white'
                      : isDark 
                        ? 'hover:bg-gray-700 text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <item.icon size={18} />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className={`p-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors text-sm ${
            isDark 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {!isCollapsed && (
            <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
          )}
        </button>
      </div>
      
      {/* User Account Widget */}
      <SidebarUserAccount />
    </div>
  );
};

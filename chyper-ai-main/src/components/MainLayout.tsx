import React from 'react';
import { Sidebar } from './Sidebar';
import { DevToolsBar } from './DevToolsBar';
import { MasterChatAgent } from './MasterChatAgent';
import { AuthDebug } from './auth/AuthDebug';
import { useTheme } from '../contexts/ThemeContext';

interface PinnedProject {
  id: string;
  name: string;
  framework: string;
}

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: 'dashboard' | 'workbench' | 'projects';
  onViewChange: (view: 'dashboard' | 'workbench' | 'projects') => void;
  pinnedProjects: PinnedProject[];
  activeProjectId: string | null;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentView,
  onViewChange,
  pinnedProjects,
  activeProjectId,
  ...props
}) => {
  const { theme } = useTheme();

  return (
    <div className={`h-screen transition-colors duration-200 flex flex-col ${
      theme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          currentView={currentView} 
          onViewChange={onViewChange}
          pinnedProjects={pinnedProjects}
          activeProjectId={activeProjectId}
          {...props}
        />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
          <DevToolsBar />
        </div>
        <MasterChatAgent />
      </div>
      {import.meta.env.DEV && <AuthDebug />}
    </div>
  );
};
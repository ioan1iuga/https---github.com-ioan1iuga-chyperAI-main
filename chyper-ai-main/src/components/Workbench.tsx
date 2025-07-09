import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { CodeEditor } from './CodeEditor';
import { FileExplorer } from './FileExplorer';
import { VisualPreview } from './VisualPreview';
import { WorkbenchHeader } from './WorkbenchHeader';
import { ProjectTabs } from './ProjectTabs';
import { PanelTabs } from './PanelTabs';
import { IntegrationsPanel } from './panels/IntegrationsPanel';
import { WorkflowsPanel } from './panels/WorkflowsPanel';
import { DatabasePanel } from './panels/DatabasePanel';
import { EnvironmentPanel } from './panels/EnvironmentPanel';
import { GitPanel } from './panels/GitPanel';
import { NetworkPanel } from './panels/NetworkPanel';
import { TerminalPanel } from './panels/TerminalPanel';
import { PerformancePanel } from './panels/PerformancePanel';
import { AIAssistantPanel } from './panels/AIAssistantPanel';
import { DirectCodeAssistPanel } from './panels/DirectCodeAssistPanel';
import { VisualFlowPanel } from './panels/VisualFlowPanel';
import { useTheme } from '../contexts/ThemeContext';
import { Menu, X, Sidebar, Monitor, ChevronLeft, ChevronRight, MoreHorizontal, FolderOpen, Code, Database, GitBranch, Settings, Workflow, Cloud, Network, Terminal, Activity, Bot, Layers } from 'lucide-react';

interface PanelDefinition {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

interface PinnedProject {
  id: string;
  name: string;
  framework: string;
}

interface WorkbenchProps {
  pinnedProjects: PinnedProject[];
  activeProjectId: string | null;
  onProjectChange: (projectId: string) => void;
  onCloseProject: (projectId: string) => void;
  onSelectProject: (projectId: string, projectName: string, projectFramework: string) => void;
  activePanel: string;
  onPanelChange: (panelId: string) => void;
  onBackToDashboard: () => void;
}

export const Workbench: React.FC<WorkbenchProps> = ({
  pinnedProjects,
  activeProjectId,
  onProjectChange,
  onCloseProject,
  onSelectProject,
  activePanel,
  onPanelChange,
  onBackToDashboard
}) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Initialize pinned panels from localStorage or use defaults
  const [pinnedPanels, setPinnedPanels] = useState<string[]>(() => {
    const saved = localStorage.getItem('workbench-pinned-panels');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 ? parsed : ['code', 'ai-assistant', 'preview', 'visual-flow'];
      } catch {
        return ['code', 'ai-assistant', 'preview', 'visual-flow'];
      }
    }
    return ['code', 'ai-assistant', 'preview', 'visual-flow'];
  });

  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [mobileActiveView, setMobileActiveView] = useState<'files' | 'panel'>('panel');
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      if (mobile) {
        setShowFileExplorer(false);
      } else if (tablet) {
        setShowFileExplorer(true);
      } else {
        setShowFileExplorer(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist pinned panels to localStorage
  useEffect(() => {
    localStorage.setItem('workbench-pinned-panels', JSON.stringify(pinnedPanels));
  }, [pinnedPanels]);

  // Ensure active panel is always pinned
  useEffect(() => {
    if (activePanel && !pinnedPanels.includes(activePanel)) {
      setPinnedPanels(prev => [...prev, activePanel]);
    }
  }, [activePanel, pinnedPanels]);

  // Update current panel index when active panel changes
  useEffect(() => {
    const index = pinnedPanels.findIndex(panelId => panelId === activePanel);
    if (index !== -1) {
      setCurrentPanelIndex(index);
    }
  }, [activePanel, pinnedPanels]);

  const availablePanels: PanelDefinition[] = [
    { id: 'code', label: 'Code Editor', icon: Code, description: 'Edit and view source code files' },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, description: 'AI-powered development assistance and code generation' },
    { id: 'database', label: 'Database', icon: Database, description: 'Manage database connections and queries' },
    { id: 'git', label: 'Git', icon: GitBranch, description: 'Version control and repository management' },
    { id: 'environment', label: 'Environment', icon: Settings, description: 'Environment variables and configuration' },
    { id: 'workflows', label: 'Workflows', icon: Workflow, description: 'CI/CD pipelines and automation' },
    { id: 'integrations', label: 'Integrations', icon: Cloud, description: 'Third-party service integrations' },
    { id: 'network', label: 'Network', icon: Network, description: 'Network monitoring and requests' },
    { id: 'terminal', label: 'Terminal', icon: Terminal, description: 'Command line interface' },
    { id: 'performance', label: 'Performance', icon: Activity, description: 'Application performance metrics' },
    { id: 'preview', label: 'Visual Preview', icon: Monitor, description: 'Live preview of your application' },
    { id: 'visual-flow', label: 'Visual Flow', icon: Layers, description: 'Code architecture and component relationships' }, 
    { id: 'direct-code-assist', label: 'Code Management', icon: Code, description: 'Direct code repository management and deployment' },
  ];

  const handlePinPanel = (panelId: string) => {
    // Add panel to pinned panels if not already there
    setPinnedPanels(prev => {
      if (!prev.includes(panelId)) {
        return [...prev, panelId];
      }
      return prev;
    });
    onPanelChange(panelId);
  };

  const handleUnpinPanel = (panelId: string) => {
    // Don't allow removing if it would leave less than 1 panel
    if (pinnedPanels.length <= 1) {
      return;
    }
    
    setPinnedPanels(prev => prev.filter(id => id !== panelId));
    
    // If we're removing the active panel, switch to another one
    if (activePanel === panelId) {
      const remainingPanels = pinnedPanels.filter(id => id !== panelId);
      if (remainingPanels.length > 0) {
        onPanelChange(remainingPanels[0]);
      }
    }
  };

  const handleReorderPanels = (fromIndex: number, toIndex: number) => {
    setPinnedPanels(prev => {
      const newPanels = [...prev];
      const [movedPanel] = newPanels.splice(fromIndex, 1);
      newPanels.splice(toIndex, 0, movedPanel);
      return newPanels;
    });
  };

  const pinnedPanelTabs = availablePanels.filter(panel => pinnedPanels.includes(panel.id));

  const renderPanel = (panelId: string) => {
    switch (panelId) {
      case 'code': return <CodeEditor projectId={activeProjectId!} />;
      case 'database': return <DatabasePanel />;
      case 'git': return <GitPanel />;
      case 'environment': return <EnvironmentPanel />;
      case 'workflows': return <WorkflowsPanel />;
      case 'integrations': return <IntegrationsPanel />;
      case 'network': return <NetworkPanel />;
      case 'terminal': return <TerminalPanel />;
      case 'performance': return <PerformancePanel />;
      case 'preview': return <VisualPreview projectId={activeProjectId!} />;
      case 'ai-assistant': return <AIAssistantPanel />;
      case 'visual-flow': return <VisualFlowPanel projectId={activeProjectId!} />;
      case 'direct-code-assist': return <DirectCodeAssistPanel projectId={activeProjectId!} />;
      default: return <CodeEditor projectId={activeProjectId!} />;
    }
  };

  const navigatePanel = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' 
      ? (currentPanelIndex + 1) % pinnedPanels.length
      : (currentPanelIndex - 1 + pinnedPanels.length) % pinnedPanels.length;
    
    const newPanelId = pinnedPanels[newIndex];
    if (newPanelId) {
      onPanelChange(newPanelId);
      setCurrentPanelIndex(newIndex);
    }
  };

  const getPanelIcon = (panelId: string) => {
    const panel = availablePanels.find(p => p.id === panelId);
    return panel?.icon || Code;
  };

  if (!activeProjectId || pinnedProjects.length === 0) {
    return (
      <div className={`h-full flex flex-col items-center justify-center p-8 ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
            <Monitor size={32} className="text-white" />
          </div>
          <h2 className={`text-xl font-semibold mb-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>No Project Open</h2>
          <p className={`text-sm mb-6 leading-relaxed ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>Select a project from the dashboard or projects page to start working</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white text-sm font-medium shadow-lg hover:shadow-xl"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    // Mobile layout - optimized for touch
    return (
      <div className={`h-full flex flex-col ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        {/* Mobile Header */}
        <div className={`border-b px-4 py-3 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <div className="flex-1 mx-4 min-w-0">
              <h1 className={`text-lg font-semibold truncate ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {pinnedProjects.find(p => p.id === activeProjectId)?.name || 'Project'}
              </h1>
            </div>
            
            <button
              onClick={onBackToDashboard}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white text-sm font-medium"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Panel Navigation Bar for Mobile */}
        {mobileActiveView === 'panel' && pinnedPanels.length > 1 && (
          <div className={`border-b px-4 py-2 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigatePanel('prev')}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                disabled={pinnedPanels.length <= 1}
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-2">
                {React.createElement(getPanelIcon(activePanel), { size: 16 })}
                <span className={`text-sm font-medium ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {pinnedPanelTabs.find(p => p.id === activePanel)?.label || 'Panel'}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  {currentPanelIndex + 1} of {pinnedPanels.length}
                </span>
              </div>
              
              <button
                onClick={() => navigatePanel('next')}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                disabled={pinnedPanels.length <= 1}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 flex">
            <div className={`w-80 h-full p-4 shadow-xl ${
              isDark ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Projects & Panels</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Project Switcher */}
              <div className="mb-6">
                <h3 className={`text-sm font-medium mb-3 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Active Projects</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {pinnedProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        onProjectChange(project.id);
                        setShowMobileMenu(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        activeProjectId === project.id
                          ? 'bg-blue-600 text-white'
                          : isDark 
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="font-medium text-sm">{project.name}</div>
                      <div className="text-xs opacity-75">{project.framework}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Panel Switcher */}
              <div>
                <h3 className={`text-sm font-medium mb-3 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Available Panels</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {pinnedPanelTabs.map((panel) => (
                    <button
                      key={panel.id}
                      onClick={() => {
                        onPanelChange(panel.id);
                        setMobileActiveView('panel');
                        setShowMobileMenu(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        activePanel === panel.id
                          ? 'bg-blue-600 text-white'
                          : isDark 
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {React.createElement(panel.icon, { size: 16 })}
                        <div className="font-medium text-sm">{panel.label}</div>
                      </div>
                      <div className="text-xs opacity-75">{panel.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div 
              className="flex-1 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowMobileMenu(false)}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {mobileActiveView === 'files' && <FileExplorer projectId={activeProjectId} />}
          {mobileActiveView === 'panel' && renderPanel(activePanel)}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className={`border-t ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex">
            <button
              onClick={() => setMobileActiveView('files')}
              className={`flex-1 py-4 px-4 text-center transition-colors ${
                mobileActiveView === 'files'
                  ? 'bg-blue-600 text-white'
                  : isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FolderOpen size={20} className="mx-auto mb-1" />
              <div className="text-xs font-medium">Files</div>
            </button>
            
            <button
              onClick={() => setMobileActiveView('panel')}
              className={`flex-1 py-4 px-4 text-center transition-colors ${
                mobileActiveView === 'panel'
                  ? 'bg-blue-600 text-white'
                  : isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {React.createElement(getPanelIcon(activePanel), { 
                size: 20,
                className: "mx-auto mb-1"
              })}
              <div className="text-xs font-medium">
                {pinnedPanelTabs.find(p => p.id === activePanel)?.label || 'Panel'}
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop and Tablet layout
  return (
    <div className={`h-full flex flex-col ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <ProjectTabs
        pinnedProjects={pinnedProjects}
        activeProjectId={activeProjectId}
        onProjectChange={onProjectChange}
        onCloseProject={onCloseProject}
        onSelectProject={onSelectProject}
      />
      
      <WorkbenchHeader 
        projectId={activeProjectId}
        onBackToDashboard={onBackToDashboard}
      />
      
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* File Explorer */}
          {showFileExplorer && (
            <>
              <Panel defaultSize={isTablet ? 30 : 20} minSize={15} maxSize={40}>
                <FileExplorer projectId={activeProjectId} />
              </Panel>
              
              <PanelResizeHandle className={`w-1 transition-colors ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`} />
            </>
          )}
          
          {/* Main Panel Area */}
          <Panel defaultSize={showFileExplorer ? (isTablet ? 70 : 80) : 100} minSize={30}>
            <div className="h-full flex flex-col">
              <PanelTabs 
                activeTab={activePanel} 
                onTabChange={onPanelChange}
                tabs={pinnedPanelTabs}
                availablePanels={availablePanels.filter(panel => !pinnedPanels.includes(panel.id))}
                onPinPanel={handlePinPanel}
                onUnpinPanel={handleUnpinPanel}
                onReorderTabs={handleReorderPanels}
                canRemove={pinnedPanels.length > 1}
                pinnedCount={pinnedPanels.length}
              />
              <div className="flex-1 overflow-hidden">
                {renderPanel(activePanel)}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};
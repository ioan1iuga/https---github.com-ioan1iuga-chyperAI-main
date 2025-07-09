import React from 'react';
import { 
  X, 
  Plus, 
  GripVertical, 
  Settings, 
  MoreHorizontal,
  Code,
  Database,
  GitBranch,
  Settings as SettingsIcon,
  Workflow,
  Cloud,
  Network,
  Terminal,
  Activity,
  Monitor,
  Bot,
  Layers
} from 'lucide-react';
import { PanelSelector } from './PanelSelector';
import { useTheme } from '../contexts/ThemeContext';

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
}

interface PanelDefinition {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

interface PanelTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: Tab[];
  availablePanels: PanelDefinition[];
  onPinPanel: (panelId: string) => void;
  onUnpinPanel: (panelId: string) => void;
  onReorderTabs?: (fromIndex: number, toIndex: number) => void;
  canRemove: boolean;
  pinnedCount: number;
}

export const PanelTabs: React.FC<PanelTabsProps> = ({
  activeTab,
  onTabChange,
  tabs,
  availablePanels,
  onPinPanel,
  onUnpinPanel,
  onReorderTabs,
  canRemove,
  pinnedCount
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [showPanelSelector, setShowPanelSelector] = React.useState(false);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const [showTabMenu, setShowTabMenu] = React.useState<string | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      onReorderTabs?.(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getPanelIcon = (panelId: string) => {
    switch (panelId) {
      case 'code': return Code;
      case 'ai-assistant': return Bot;
      case 'database': return Database;
      case 'git': return GitBranch;
      case 'environment': return SettingsIcon;
      case 'workflows': return Workflow;
      case 'integrations': return Cloud;
      case 'network': return Network;
      case 'terminal': return Terminal;
      case 'performance': return Activity;
      case 'preview': return Monitor;
      case 'visual-flow': return Layers;
      default: return Code;
    }
  };

  return (
    <>
      <div className={`flex border-b overflow-x-auto scrollbar-thin ${
        isDark 
          ? 'border-gray-700 bg-gray-800' 
          : 'border-gray-200 bg-white'
      }`}>
        {/* Panel Tabs */}
        <div className="flex items-center min-w-0 flex-1">
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              draggable={tabs.length > 1 && !isMobile}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center group relative transition-all duration-200 text-xs ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              } ${
                activeTab === tab.id
                  ? isDark 
                    ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                    : 'bg-gray-100 text-gray-900 border-b-2 border-blue-500'
                  : isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              } ${
                dragOverIndex === index ? 'bg-blue-600/20' : ''
              } ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
              style={{ minWidth: isMobile ? '52px' : '60px', maxWidth: isMobile ? '52px' : '140px' }}
              title={tab.label}
            >
              {/* Drag Handle */}
              {tabs.length > 1 && !isMobile && (
                <div className="px-1 opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 top-1/2 transform -translate-y-1/2">
                  <GripVertical 
                    size={10} 
                    className={`cursor-grab active:cursor-grabbing ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  />
                </div>
              )}
              
              {/* Tab Content */}
              <div 
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center justify-center w-full cursor-pointer ${
                  isMobile ? 'py-4' : 'py-3'
                }`}
              >
                {React.createElement(getPanelIcon(tab.id), { 
                  size: isMobile ? 18 : 16,
                  className: "flex-shrink-0"
                })}
              </div>
              
              {/* Tab Actions */}
              <div className={`absolute right-1 top-1 transition-opacity ${
                isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                {canRemove && tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnpinPanel(tab.id);
                    }}
                    className={`p-1 rounded-full transition-colors ${
                      isDark 
                        ? 'hover:bg-red-600/20 hover:text-red-400 bg-gray-800/80' 
                        : 'hover:bg-red-500/20 hover:text-red-500 bg-white/80'
                    }`}
                    title="Remove panel"
                  >
                    <X size={isMobile ? 10 : 8} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Add Panel & Status */}
        <div className={`flex items-center gap-2 px-3 py-2 border-l ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {/* Add Panel Button */}
          {availablePanels.length > 0 && (
            <button
              onClick={() => setShowPanelSelector(true)}
              className={`flex items-center justify-center rounded transition-colors ${
                isMobile ? 'w-10 h-10' : 'w-8 h-8'
              } ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
              title="Add panel"
            >
              <Plus size={isMobile ? 16 : 12} />
            </button>
          )}
          
          {/* Panel Count */}
          <span className={`${isMobile ? 'text-sm' : 'text-xs'} ${
            isDark ? 'text-gray-500' : 'text-gray-500'
          }`}>
            {pinnedCount}
          </span>
        </div>
      </div>
      
      {/* Panel Selector Modal */}
      <PanelSelector
        isOpen={showPanelSelector}
        onClose={() => setShowPanelSelector(false)}
        availablePanels={availablePanels}
        onSelectPanel={onPinPanel}
      />
    </>
  );
};
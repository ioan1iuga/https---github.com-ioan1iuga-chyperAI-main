import React, { useState } from 'react';
import { Search, Plus, X, Code, Database, GitBranch, Settings, Workflow, Cloud, Network, Terminal, Activity, Monitor } from 'lucide-react';

interface PanelDefinition {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

interface PanelSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  availablePanels: PanelDefinition[];
  onSelectPanel: (panelId: string) => void;
}

export const PanelSelector: React.FC<PanelSelectorProps> = ({
  isOpen,
  onClose,
  availablePanels,
  onSelectPanel
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredPanels = availablePanels.filter(panel => 
    panel.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    panel.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectPanel = (panelId: string) => {
    onSelectPanel(panelId);
    setSearchTerm(''); // Clear search when panel is selected
    onClose();
  };

  const getPanelColor = (panelId: string) => {
    switch (panelId) {
      case 'code': return 'text-blue-400 bg-blue-600/20';
      case 'database': return 'text-green-400 bg-green-600/20';
      case 'git': return 'text-orange-400 bg-orange-600/20';
      case 'environment': return 'text-purple-400 bg-purple-600/20';
      case 'workflows': return 'text-pink-400 bg-pink-600/20';
      case 'integrations': return 'text-cyan-400 bg-cyan-600/20';
      case 'network': return 'text-yellow-400 bg-yellow-600/20';
      case 'terminal': return 'text-gray-300 bg-gray-600/20';
      case 'performance': return 'text-red-400 bg-red-600/20';
      case 'preview': return 'text-purple-400 bg-purple-600/20';
      default: return 'text-gray-400 bg-gray-600/20';
    }
  };

  const getPanelIcon = (panelId: string) => {
    switch (panelId) {
      case 'code': return Code;
      case 'database': return Database;
      case 'git': return GitBranch;
      case 'environment': return Settings;
      case 'workflows': return Workflow;
      case 'integrations': return Cloud;
      case 'network': return Network;
      case 'terminal': return Terminal;
      case 'performance': return Activity;
      case 'preview': return Monitor;
      default: return Plus;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Add Panel</h2>
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
              placeholder="Search panels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Panel List */}
        <div className="flex-1 overflow-auto p-4">
          {filteredPanels.length === 0 ? (
            <div className="text-center py-8">
              {searchTerm ? (
                <div>
                  <Search size={48} className="mx-auto text-gray-500 mb-4" />
                  <p className="text-gray-400">No panels found matching "{searchTerm}"</p>
                </div>
              ) : (
                <div>
                  <Plus size={48} className="mx-auto text-gray-500 mb-4" />
                  <p className="text-gray-400">All panels are already active</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPanels.map((panel) => (
                <div
                  key={panel.id}
                  onClick={() => handleSelectPanel(panel.id)}
                  className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 cursor-pointer transition-all duration-200 hover:bg-gray-800 group text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getPanelColor(panel.id)}`}>
                        {React.createElement(getPanelIcon(panel.id), { size: 20 })}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                          {panel.label}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {panel.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${getPanelColor(panel.id)}`}>
                            {panel.id}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPanel(panel.id);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors font-medium"
                      >
                        <Plus size={12} />
                        Pin Panel
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
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{filteredPanels.length} available panels</span>
            <span>Click to add to workspace</span>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { Terminal, Network, Bug, FileText, ChevronUp, ChevronDown, BarChart3, X } from 'lucide-react';
import { TerminalPanel } from './panels/TerminalPanel';
import { NetworkPanel } from './panels/NetworkPanel';
import { useTheme } from '../contexts/ThemeContext';

export const DevToolsBar: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('console');

  const tabs = [
    { id: 'console', label: 'Console', icon: Terminal },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'debug', label: 'Debug', icon: Bug },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'logs', label: 'Logs', icon: FileText },
  ];

  const consoleEntries = [
    { type: 'log', message: 'Application started successfully', timestamp: '10:30:45' },
    { type: 'warn', message: 'Deprecated API usage detected', timestamp: '10:31:12' },
    { type: 'error', message: 'Failed to fetch data from API', timestamp: '10:31:30' },
    { type: 'log', message: 'WebSocket connection established', timestamp: '10:32:01' },
    { type: 'log', message: 'Hot Module Replacement enabled', timestamp: '10:32:05' },
    { type: 'warn', message: 'Large bundle size detected', timestamp: '10:32:15' },
    { type: 'log', message: 'Development server ready', timestamp: '10:32:20' },
    { type: 'error', message: 'Network request timeout', timestamp: '10:32:45' },
    { type: 'log', message: 'Component rendered successfully', timestamp: '10:33:01' },
    { type: 'warn', message: 'Performance bottleneck detected', timestamp: '10:33:12' },
  ];

  const getEntryColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'log': return isDark ? 'text-gray-300' : 'text-gray-700';
      default: return isDark ? 'text-gray-300' : 'text-gray-700';
    }
  };

  return (
    <div className={`transition-all duration-300 border-t flex flex-col ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    } ${
      isExpanded ? 'h-80' : 'h-10'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2 border-b flex-shrink-0 ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              isDark 
                ? 'text-white hover:text-blue-400' 
                : 'text-gray-900 hover:text-blue-600'
            }`}
          >
            Dev Tools
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          
          {isExpanded && (
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : isDark 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 text-xs ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Running
            </span>
            <span>•</span>
            <span>Port 5173</span>
          </div>
          
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className={`p-1 rounded transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden">
          {activeTab === 'console' && (
            <div className="h-full overflow-auto p-4">
              <div className="space-y-1 font-mono text-sm">
                {consoleEntries.map((entry, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className={`text-xs flex-shrink-0 ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {entry.timestamp}
                    </span>
                    <span className={`uppercase text-xs font-semibold flex-shrink-0 ${getEntryColor(entry.type)}`}>
                      {entry.type}
                    </span>
                    <span className={`${getEntryColor(entry.type)} break-words`}>{entry.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'network' && (
            <div className="h-full">
              <NetworkPanel />
            </div>
          )}
          
          {activeTab === 'terminal' && (
            <div className="h-full">
              <TerminalPanel />
            </div>
          )}
          
          {activeTab === 'debug' && (
            <div className="h-full overflow-auto p-4">
              <div className="space-y-4">
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                  <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Debug Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>React Version:</span>
                      <span className="font-mono">18.3.1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Node Version:</span>
                      <span className="font-mono">18.17.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vite Version:</span>
                      <span className="font-mono">5.4.2</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Environment:</span>
                      <span className="font-mono">development</span>
                    </div>
                  </div>
                  
                  <h4 className={`font-semibold mt-4 mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Breakpoints</h4>
                  <p>No active breakpoints set</p>
                  
                  <h4 className={`font-semibold mt-4 mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Watch Variables</h4>
                  <p>No variables being watched</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'performance' && (
            <div className="h-full overflow-auto p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className={`rounded p-3 ${
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <div className={`text-xs mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Memory Usage</div>
                    <div className={`text-lg font-bold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>67.2 MB</div>
                  </div>
                  <div className={`rounded p-3 ${
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <div className={`text-xs mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>CPU Usage</div>
                    <div className={`text-lg font-bold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>23%</div>
                  </div>
                  <div className={`rounded p-3 ${
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <div className={`text-xs mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Bundle Size</div>
                    <div className={`text-lg font-bold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>2.1 MB</div>
                  </div>
                </div>
                
                <div className={`rounded p-3 ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <div className={`text-sm mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>Performance Timeline</div>
                  <div className={`h-16 rounded flex items-center justify-center ${
                    isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <span className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>Performance chart placeholder</span>
                  </div>
                </div>
                
                <div className={`rounded p-3 ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <div className={`text-sm mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>Recent Performance Metrics</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>First Contentful Paint:</span>
                      <span className="font-mono text-green-500">1.2s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Largest Contentful Paint:</span>
                      <span className="font-mono text-yellow-500">2.1s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cumulative Layout Shift:</span>
                      <span className="font-mono text-green-500">0.02</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time to Interactive:</span>
                      <span className="font-mono text-yellow-500">3.4s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'logs' && (
            <div className="h-full overflow-auto p-4">
              <div className="space-y-2">
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                  <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Application Logs</h3>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500">2024-01-20 10:30:45</span>
                      <span className="text-blue-400">[INFO]</span>
                      <span>Application initialized successfully</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500">2024-01-20 10:30:46</span>
                      <span className="text-green-400">[SUCCESS]</span>
                      <span>Database connection established</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500">2024-01-20 10:30:47</span>
                      <span className="text-yellow-400">[WARN]</span>
                      <span>Slow query detected: getUserPreferences</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500">2024-01-20 10:30:48</span>
                      <span className="text-blue-400">[INFO]</span>
                      <span>WebSocket server listening on port 3001</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500">2024-01-20 10:30:49</span>
                      <span className="text-red-400">[ERROR]</span>
                      <span>Failed to load external API configuration</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500">2024-01-20 10:30:50</span>
                      <span className="text-blue-400">[INFO]</span>
                      <span>Hot reload enabled for development</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500">2024-01-20 10:30:51</span>
                      <span className="text-green-400">[SUCCESS]</span>
                      <span>All services started successfully</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
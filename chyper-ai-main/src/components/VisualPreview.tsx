import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection
} from '@reactflow/core';
import { Controls } from '@reactflow/controls';
import { Background } from '@reactflow/background';
import '@reactflow/core/dist/style.css';
import { Monitor, Smartphone, Tablet, RefreshCw, ExternalLink, Eye, Code, Maximize2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface VisualPreviewProps {
  projectId: string;
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'App Component' },
    position: { x: 250, y: 25 },
  },
  {
    id: '2',
    data: { label: 'Header' },
    position: { x: 100, y: 125 },
  },
  {
    id: '3',
    data: { label: 'Main Content' },
    position: { x: 250, y: 125 },
  },
  {
    id: '4',
    data: { label: 'Footer' },
    position: { x: 400, y: 125 },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' },
  { id: 'e1-4', source: '1', target: '4' },
];

export const VisualPreview: React.FC<VisualPreviewProps> = ({ projectId }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [viewMode, setViewMode] = useState<'preview' | 'flow'>('preview');
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const deviceSizes = {
    desktop: { width: '100%', height: '100%', maxWidth: 'none' },
    tablet: { width: '768px', height: '80%', maxWidth: '100%' },
    mobile: { width: '375px', height: '70%', maxWidth: '100%' }
  };

  const deviceSize = deviceSizes[deviceType];

  return (
    <div className={`h-full border-l flex flex-col ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-3 border-b flex items-center justify-between ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-semibold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Visual Preview</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode(viewMode === 'preview' ? 'flow' : 'preview')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                viewMode === 'preview' 
                  ? 'bg-blue-600 text-white' 
                  : isDark 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {viewMode === 'preview' ? (
                <><Eye size={12} className="inline mr-1" />Preview</>
              ) : (
                <><Code size={12} className="inline mr-1" />Flow</>
              )}
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 rounded transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
            title="Toggle fullscreen"
          >
            <Maximize2 size={14} />
          </button>
          <button
            className={`p-1.5 rounded transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
            title="Refresh preview"
          >
            <RefreshCw size={14} />
          </button>
          <button
            className={`p-1.5 rounded transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
            title="Open in new window"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* Device Controls */}
      {viewMode === 'preview' && (
        <div className={`p-2 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDeviceType('desktop')}
              className={`p-2 rounded transition-colors ${
                deviceType === 'desktop' 
                  ? 'bg-blue-600 text-white' 
                  : isDark 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Desktop view"
            >
              <Monitor size={14} />
            </button>
            <button
              onClick={() => setDeviceType('tablet')}
              className={`p-2 rounded transition-colors ${
                deviceType === 'tablet' 
                  ? 'bg-blue-600 text-white' 
                  : isDark 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Tablet view"
            >
              <Tablet size={14} />
            </button>
            <button
              onClick={() => setDeviceType('mobile')}
              className={`p-2 rounded transition-colors ${
                deviceType === 'mobile' 
                  ? 'bg-blue-600 text-white' 
                  : isDark 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Mobile view"
            >
              <Smartphone size={14} />
            </button>
            
            <div className="ml-auto text-xs text-gray-500">
              {deviceType} • {deviceSize.width} × {deviceSize.height}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'preview' ? (
          <div className={`h-full flex items-center justify-center p-4 ${
            isDark ? 'bg-gray-900' : 'bg-gray-100'
          }`}>
            <div 
              className={`bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 ${
                isFullscreen ? 'w-full h-full' : ''
              }`}
              style={!isFullscreen ? deviceSize : { width: '100%', height: '100%' }}
            >
              {/* Mock Browser Frame */}
              <div className="bg-gray-200 px-4 py-2 flex items-center gap-2 border-b">
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded px-3 py-1 text-xs text-gray-600">
                    localhost:5173
                  </div>
                </div>
              </div>
              
              {/* Mock App Content */}
              <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
                <div className="max-w-4xl mx-auto">
                  <header className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                      Welcome to Your App
                    </h1>
                    <p className="text-lg text-gray-600">
                      This is a live preview of your application
                    </p>
                  </header>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white rounded-lg p-6 shadow-md">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg mb-4"></div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Feature {i}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Description of feature {i} and its benefits for users.
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
                      Get Started
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`h-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              className={isDark ? 'bg-gray-900' : 'bg-gray-50'}
            >
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className={`px-3 py-2 border-t text-xs ${
        isDark 
          ? 'border-gray-700 bg-gray-900 text-gray-500' 
          : 'border-gray-200 bg-gray-50 text-gray-600'
      }`}>
        {viewMode === 'preview' ? (
          <div className="flex items-center justify-between">
            <span>Preview Mode • {deviceType}</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          </div>
        ) : (
          <span>Component Flow • {nodes.length} components</span>
        )}
      </div>
    </div>
  );
};
import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  NodeTypes
} from '@reactflow/core';
import { Background } from '@reactflow/background';
import { Controls } from '@reactflow/controls';
import { MiniMap } from '@reactflow/minimap';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Code, 
  Database, 
  FileText, 
  Settings, 
  Layers, 
  GitBranch,
  Zap,
  RefreshCw,
  Download,
  Upload,
  Search,
  Filter
} from 'lucide-react';

interface VisualFlowPanelProps {
  projectId: string;
}

// Custom Node Components
const ComponentNode = ({ data }: { data: any }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className={`px-4 py-3 rounded-lg border-2 min-w-[150px] ${
      isDark 
        ? 'bg-gray-800 border-blue-500 text-white' 
        : 'bg-white border-blue-500 text-gray-900'
    } shadow-lg`}>
      <div className="flex items-center gap-2 mb-2">
        <Code size={16} className="text-blue-500" />
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {data.type} Component
      </div>
      {data.props && (
        <div className="mt-2 space-y-1">
          {data.props.slice(0, 3).map((prop: string, i: number) => (
            <div key={i} className={`text-xs px-2 py-1 rounded ${
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {prop}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ServiceNode = ({ data }: { data: any }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className={`px-4 py-3 rounded-lg border-2 min-w-[140px] ${
      isDark 
        ? 'bg-gray-800 border-green-500 text-white' 
        : 'bg-white border-green-500 text-gray-900'
    } shadow-lg`}>
      <div className="flex items-center gap-2 mb-2">
        <Database size={16} className="text-green-500" />
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {data.type} Service
      </div>
      {data.methods && (
        <div className="mt-2 space-y-1">
          {data.methods.slice(0, 2).map((method: string, i: number) => (
            <div key={i} className={`text-xs px-2 py-1 rounded ${
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {method}()
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UtilNode = ({ data }: { data: any }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className={`px-3 py-2 rounded-lg border-2 min-w-[120px] ${
      isDark 
        ? 'bg-gray-800 border-purple-500 text-white' 
        : 'bg-white border-purple-500 text-gray-900'
    } shadow-lg`}>
      <div className="flex items-center gap-2 mb-1">
        <Zap size={14} className="text-purple-500" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {data.type}
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  component: ComponentNode,
  service: ServiceNode,
  util: UtilNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'component',
    position: { x: 250, y: 50 },
    data: { 
      label: 'App', 
      type: 'Root',
      props: ['children', 'theme', 'user']
    },
  },
  {
    id: '2',
    type: 'component',
    position: { x: 100, y: 200 },
    data: { 
      label: 'Header',
      type: 'Layout',
      props: ['title', 'user', 'onLogout']
    },
  },
  {
    id: '3',
    type: 'component',
    position: { x: 400, y: 200 },
    data: { 
      label: 'Dashboard',
      type: 'Page',
      props: ['projects', 'onProjectSelect']
    },
  },
  {
    id: '4',
    type: 'component',
    position: { x: 250, y: 350 },
    data: { 
      label: 'ProjectCard',
      type: 'UI',
      props: ['project', 'onClick', 'isActive']
    },
  },
  {
    id: '5',
    type: 'service',
    position: { x: 600, y: 200 },
    data: { 
      label: 'ProjectService',
      type: 'API',
      methods: ['getProjects', 'createProject', 'updateProject']
    },
  },
  {
    id: '6',
    type: 'service',
    position: { x: 600, y: 350 },
    data: { 
      label: 'AuthService',
      type: 'API',
      methods: ['login', 'logout', 'getUser']
    },
  },
  {
    id: '7',
    type: 'util',
    position: { x: 50, y: 350 },
    data: { 
      label: 'useTheme',
      type: 'Hook'
    },
  },
  {
    id: '8',
    type: 'util',
    position: { x: 750, y: 100 },
    data: { 
      label: 'apiClient',
      type: 'Utility'
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
  { id: 'e3-5', source: '3', target: '5', type: 'smoothstep' },
  { id: 'e2-6', source: '2', target: '6', type: 'smoothstep' },
  { id: 'e5-8', source: '5', target: '8', type: 'smoothstep' },
  { id: 'e6-8', source: '6', target: '8', type: 'smoothstep' },
  { id: 'e2-7', source: '2', target: '7', type: 'smoothstep' },
];

export const VisualFlowPanel: React.FC<VisualFlowPanelProps> = ({ projectId }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [viewMode, setViewMode] = useState<'architecture' | 'dataflow' | 'dependencies'>('architecture');
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleExport = () => {
    const flowData = { nodes, edges };
    const dataStr = JSON.stringify(flowData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'project-flow.json';
    link.click();
  };

  const filteredNodes = searchTerm 
    ? nodes.filter(node => 
        node.data.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.data.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : nodes;

  return (
    <div className={`h-full flex flex-col ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`p-3 border-b flex-shrink-0 ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-blue-500" />
            <h2 className={`text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Visual Flow</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMiniMap(!showMiniMap)}
              className={`p-2 rounded-md transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title={showMiniMap ? 'Hide minimap' : 'Show minimap'}
            >
              <Layers size={16} />
            </button>
            
            <button
              onClick={handleExport}
              className={`p-2 rounded-md transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Export flow"
            >
              <Download size={16} />
            </button>
            
            <button
              className={`p-2 rounded-md transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Refresh flow"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Selector */}
          <div className={`flex items-center gap-1 rounded-md p-1 ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            {[
              { id: 'architecture', label: 'Architecture' },
              { id: 'dataflow', label: 'Data Flow' },
              { id: 'dependencies', label: 'Dependencies' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === mode.id
                    ? 'bg-blue-600 text-white'
                    : isDark 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-64">
            <Search size={14} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 rounded-md text-sm transition-colors ${
                isDark 
                  ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none`}
            />
          </div>

          {/* Node Count */}
          <span className={`text-xs px-2 py-1 rounded ${
            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            {filteredNodes.length} nodes
          </span>
        </div>
      </div>

      {/* Flow Diagram */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={filteredNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          className={isDark ? 'bg-gray-900' : 'bg-gray-50'}
        >
          <Background 
            color={isDark ? '#374151' : '#e5e7eb'} 
            gap={20}
            size={1}
          />
          <Controls 
            className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
          />
          {showMiniMap && (
            <MiniMap 
              className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg`}
              nodeColor={isDark ? '#4B5563' : '#D1D5DB'}
              maskColor={isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
              position="bottom-right"
            />
          )}
        </ReactFlow>

        {/* Node Details Panel */}
        {selectedNode && (
          <div className={`absolute top-4 right-4 w-64 rounded-lg border shadow-lg ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className={`p-3 border-b ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>{selectedNode.data.label}</h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className={`p-1 rounded transition-colors ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  ×
                </button>
              </div>
              <span className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {selectedNode.data.type} {selectedNode.type}
              </span>
            </div>
            
            <div className="p-3">
              {selectedNode.data.props && (
                <div className="mb-3">
                  <h4 className={`text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>Props</h4>
                  <div className="space-y-1">
                    {selectedNode.data.props.map((prop: string, i: number) => (
                      <div key={i} className={`text-xs px-2 py-1 rounded font-mono ${
                        isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {prop}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedNode.data.methods && (
                <div className="mb-3">
                  <h4 className={`text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>Methods</h4>
                  <div className="space-y-1">
                    {selectedNode.data.methods.map((method: string, i: number) => (
                      <div key={i} className={`text-xs px-2 py-1 rounded font-mono ${
                        isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {method}()
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 mt-3">
                <button className={`flex-1 px-3 py-1.5 rounded text-xs transition-colors ${
                  isDark 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}>
                  View Code
                </button>
                <button className={`flex-1 px-3 py-1.5 rounded text-xs transition-colors ${
                  isDark 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
                } ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className={`p-3 border-t flex items-center justify-between text-xs ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-500 rounded"></div>
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Components</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-green-500 rounded"></div>
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Services</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-purple-500 rounded"></div>
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Utilities</span>
          </div>
        </div>
        
        <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
          Project: {projectId} • {viewMode} view
        </span>
      </div>
    </div>
  );
};
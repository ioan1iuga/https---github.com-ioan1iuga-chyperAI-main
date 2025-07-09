import React, { useState } from 'react';
import { Activity, Wifi, Globe, Server, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface NetworkRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  status: number;
  duration: number;
  size: string;
  timestamp: string;
}

interface Connection {
  id: string;
  name: string;
  type: 'websocket' | 'sse' | 'http';
  status: 'connected' | 'disconnected' | 'error';
  endpoint: string;
}

export const NetworkPanel: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [activeTab, setActiveTab] = useState('requests');
  const [requests] = useState<NetworkRequest[]>([
    {
      id: '1',
      method: 'GET',
      url: '/api/projects',
      status: 200,
      duration: 45,
      size: '2.3 KB',
      timestamp: '10:30:45'
    },
    {
      id: '2',
      method: 'POST',
      url: '/api/deployments',
      status: 201,
      duration: 120,
      size: '1.1 KB',
      timestamp: '10:30:42'
    },
    {
      id: '3',
      method: 'GET',
      url: '/api/integrations/cloudflare',
      status: 500,
      duration: 2500,
      size: '0.5 KB',
      timestamp: '10:30:38'
    },
    {
      id: '4',
      method: 'PUT',
      url: '/api/projects/123',
      status: 200,
      duration: 89,
      size: '1.8 KB',
      timestamp: '10:30:35'
    },
    {
      id: '5',
      method: 'DELETE',
      url: '/api/sessions/456',
      status: 204,
      duration: 23,
      size: '0 B',
      timestamp: '10:30:30'
    }
  ]);

  const [connections] = useState<Connection[]>([
    {
      id: '1',
      name: 'Development Server',
      type: 'websocket',
      status: 'connected',
      endpoint: 'ws://localhost:3001'
    },
    {
      id: '2',
      name: 'Build Process',
      type: 'sse',
      status: 'connected',
      endpoint: '/api/build/stream'
    },
    {
      id: '3',
      name: 'Database Connection',
      type: 'http',
      status: 'error',
      endpoint: 'postgresql://localhost:5432'
    }
  ]);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 300 && status < 400) return 'text-yellow-400';
    if (status >= 400) return 'text-red-400';
    return 'text-gray-400';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-blue-400';
      case 'POST': return 'text-green-400';
      case 'PUT': return 'text-yellow-400';
      case 'DELETE': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle size={16} className="text-green-400" />;
      case 'disconnected': return <Clock size={16} className="text-gray-400" />;
      case 'error': return <AlertCircle size={16} className="text-red-400" />;
      default: return <Activity size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`p-3 border-b flex-shrink-0 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-sm font-semibold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Network Monitor</h2>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>Recording</span>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div className={`flex items-center gap-1 rounded-lg p-1 ${
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          {['requests', 'connections', 'performance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'requests' && (
          <div className="h-full flex flex-col">
            <div className={`border-b p-2 flex-shrink-0 ${
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`grid grid-cols-6 gap-2 text-xs font-medium ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <span>Method</span>
                <span className="col-span-2">URL</span>
                <span>Status</span>
                <span>Time</span>
                <span>Size</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              <div className={`divide-y ${
                isDark ? 'divide-gray-700' : 'divide-gray-200'
              }`}>
                {requests.map((request) => (
                  <div key={request.id} className={`p-2 transition-colors ${
                    isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                  }`}>
                    <div className="grid grid-cols-6 gap-2 text-xs">
                      <span className={`font-medium ${getMethodColor(request.method)}`}>
                        {request.method}
                      </span>
                      <span className={`col-span-2 font-mono truncate ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {request.url}
                      </span>
                      <span className={`font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        {request.duration}ms
                      </span>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        {request.size}
                      </span>
                    </div>
                    <div className={`text-xs mt-1 ${
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      {request.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="h-full overflow-auto p-3">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className={`rounded-lg p-3 ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Wifi size={14} className="text-blue-400" />
                    <span className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>WebSocket</span>
                  </div>
                  <span className={`text-lg font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {connections.filter(c => c.type === 'websocket').length}
                  </span>
                </div>
                
                <div className={`rounded-lg p-3 ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe size={14} className="text-green-400" />
                    <span className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>SSE</span>
                  </div>
                  <span className={`text-lg font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {connections.filter(c => c.type === 'sse').length}
                  </span>
                </div>
                
                <div className={`rounded-lg p-3 ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Server size={14} className="text-purple-400" />
                    <span className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>HTTP</span>
                  </div>
                  <span className={`text-lg font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {connections.filter(c => c.type === 'http').length}
                  </span>
                </div>
              </div>

              {connections.map((connection) => (
                <div key={connection.id} className={`rounded-lg p-3 border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getConnectionStatusIcon(connection.status)}
                      <div>
                        <h3 className={`text-sm font-medium ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>{connection.name}</h3>
                        <p className={`text-xs capitalize ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>{connection.type} connection</p>
                      </div>
                    </div>
                    
                    <span className={`text-xs px-2 py-1 rounded capitalize ${
                      connection.status === 'connected' ? 'bg-green-600 text-green-100' :
                      connection.status === 'error' ? 'bg-red-600 text-red-100' :
                      'bg-gray-600 text-gray-100'
                    }`}>
                      {connection.status}
                    </span>
                  </div>
                  
                  <div className={`text-xs font-mono ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {connection.endpoint}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="h-full overflow-auto p-3">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-lg p-3 ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={14} className="text-blue-400" />
                    <span className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Avg Response Time</span>
                  </div>
                  <span className={`text-lg font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>245ms</span>
                </div>
                
                <div className={`rounded-lg p-3 ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Server size={14} className="text-green-400" />
                    <span className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Throughput</span>
                  </div>
                  <span className={`text-lg font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>24/min</span>
                </div>
              </div>

              <div className={`rounded-lg p-3 ${
                isDark ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <h3 className={`text-sm font-medium mb-3 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Response Time Trends</h3>
                <div className={`h-24 rounded flex items-center justify-center ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <span className={`text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Chart placeholder
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
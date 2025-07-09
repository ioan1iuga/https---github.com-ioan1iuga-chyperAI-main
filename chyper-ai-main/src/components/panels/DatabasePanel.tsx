import React, { useState } from 'react';
import { Database, Plus, Search, RefreshCw, Settings, Table, BarChart3 } from 'lucide-react';

interface DatabaseConnection {
  id: string;
  name: string;
  type: 'postgresql' | 'mongodb' | 'redis' | 'mysql';
  status: 'connected' | 'disconnected';
  host: string;
  database: string;
}

interface Table {
  name: string;
  rows: number;
  size: string;
  lastModified: string;
}

export const DatabasePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('connections');
  const [connections] = useState<DatabaseConnection[]>([
    {
      id: '1',
      name: 'Main Database',
      type: 'postgresql',
      status: 'connected',
      host: 'localhost:5432',
      database: 'codecraft_dev'
    },
    {
      id: '2',
      name: 'Cache Store',
      type: 'redis',
      status: 'connected',
      host: 'localhost:6379',
      database: '0'
    },
    {
      id: '3',
      name: 'Analytics DB',
      type: 'mongodb',
      status: 'disconnected',
      host: 'mongodb://localhost:27017',
      database: 'chyper_ai_analytics'
    }
  ]);

  const [tables] = useState<Table[]>([
    {
      name: 'users',
      rows: 1250,
      size: '2.3 MB',
      lastModified: '2 hours ago'
    },
    {
      name: 'projects',
      rows: 45,
      size: '156 KB',
      lastModified: '5 minutes ago'
    },
    {
      name: 'deployments',
      rows: 234,
      size: '890 KB',
      lastModified: '1 hour ago'
    }
  ]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'postgresql': return 'text-blue-400';
      case 'mongodb': return 'text-green-400';
      case 'redis': return 'text-red-400';
      case 'mysql': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'connected' ? 'text-green-400' : 'text-gray-400';
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Database</h2>
          <button className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm">
            <Plus size={16} />
            Add Connection
          </button>
        </div>
        
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          {['connections', 'tables', 'query', 'monitor'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'connections' && (
          <div className="space-y-4">
            {connections.map((connection) => (
              <div key={connection.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                      <Database size={20} className={getTypeColor(connection.type)} />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{connection.name}</h3>
                      <p className="text-sm text-gray-400 capitalize">{connection.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        connection.status === 'connected' ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      <span className={`text-xs ${getStatusColor(connection.status)} capitalize`}>
                        {connection.status}
                      </span>
                    </div>
                    
                    <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                      <RefreshCw size={16} className="text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                      <Settings size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-400">
                  <div>Host: {connection.host}</div>
                  <div>Database: {connection.database}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tables..."
                  className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                <RefreshCw size={16} className="text-gray-400" />
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-3 border-b border-gray-700">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-400">
                  <span>Table Name</span>
                  <span>Rows</span>
                  <span>Size</span>
                  <span>Last Modified</span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-700">
                {tables.map((table) => (
                  <div key={table.name} className="p-3 hover:bg-gray-750 transition-colors">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Table size={16} className="text-blue-400" />
                        <span className="text-white font-medium">{table.name}</span>
                      </div>
                      <span className="text-gray-300">{table.rows.toLocaleString()}</span>
                      <span className="text-gray-300">{table.size}</span>
                      <span className="text-gray-400">{table.lastModified}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'query' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-3 border-b border-gray-700">
                <h3 className="font-medium text-white">SQL Query</h3>
              </div>
              <div className="p-3">
                <textarea
                  className="w-full h-32 bg-gray-900 border border-gray-700 rounded text-sm text-white font-mono p-3 focus:outline-none focus:border-blue-500"
                  placeholder="SELECT * FROM users WHERE..."
                />
              </div>
              <div className="p-3 border-t border-gray-700 flex justify-between">
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors">
                    Execute
                  </button>
                  <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
                    Clear
                  </button>
                </div>
                <div className="text-xs text-gray-400">
                  Ctrl+Enter to execute
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={16} className="text-blue-400" />
                  <span className="text-sm text-gray-400">Active Connections</span>
                </div>
                <span className="text-2xl font-bold text-white">24</span>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={16} className="text-green-400" />
                  <span className="text-sm text-gray-400">Queries/sec</span>
                </div>
                <span className="text-2xl font-bold text-white">156</span>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-white mb-3">Recent Queries</h3>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
                  <span className="text-gray-300">SELECT * FROM users LIMIT 10</span>
                  <span className="text-xs text-gray-400">15ms</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
                  <span className="text-gray-300">UPDATE projects SET status = 'active'</span>
                  <span className="text-xs text-gray-400">8ms</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
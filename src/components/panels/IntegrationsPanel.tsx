import React, { useState, useEffect } from 'react';
import { Cloud, Github, Database, Zap, Settings, ExternalLink, Plus, Activity } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  type: 'cloudflare' | 'github' | 'docker' | 'vercel' | 'netlify';
  status: 'connected' | 'disconnected' | 'error';
  icon: React.ComponentType<any>;
  description: string;
  lastSync?: string;
}

export const IntegrationsPanel: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: '1',
      name: 'Cloudflare',
      type: 'cloudflare',
      status: 'connected',
      icon: Cloud,
      description: 'Workers, DNS, and Edge deployment',
      lastSync: '2 minutes ago'
    },
    {
      id: '2',
      name: 'GitHub',
      type: 'github',
      status: 'connected',
      icon: Github,
      description: 'Repository management and CI/CD',
      lastSync: '5 minutes ago'
    },
    {
      id: '3',
      name: 'Docker',
      type: 'docker',
      status: 'disconnected',
      icon: Database,
      description: 'Container orchestration',
    },
    {
      id: '4',
      name: 'Vercel',
      type: 'vercel',
      status: 'error',
      icon: Zap,
      description: 'Serverless deployment platform',
      lastSync: '1 hour ago'
    }
  ]);

  const [activeTab, setActiveTab] = useState('overview');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-gray-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Integrations</h2>
          <button className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm">
            <Plus size={16} />
            Add Integration
          </button>
        </div>
        
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          {['overview', 'cloudflare', 'github', 'docker'].map((tab) => (
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
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Connected</span>
                  <Activity size={16} className="text-green-400" />
                </div>
                <span className="text-2xl font-bold text-white">
                  {integrations.filter(i => i.status === 'connected').length}
                </span>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Total</span>
                  <Settings size={16} className="text-gray-400" />
                </div>
                <span className="text-2xl font-bold text-white">{integrations.length}</span>
              </div>
            </div>

            {integrations.map((integration) => (
              <div key={integration.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                      <integration.icon size={20} className="text-gray-300" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{integration.name}</h3>
                      <p className="text-sm text-gray-400">{integration.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusBg(integration.status)}`} />
                      <span className={`text-xs ${getStatusColor(integration.status)} capitalize`}>
                        {integration.status}
                      </span>
                    </div>
                    
                    <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                      <ExternalLink size={16} className="text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                      <Settings size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>
                
                {integration.lastSync && (
                  <div className="mt-3 text-xs text-gray-500">
                    Last sync: {integration.lastSync}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'cloudflare' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">Cloudflare Workers</h3>
                <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors">
                  Deploy Worker
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
                  <span className="text-sm text-gray-300">api-handler</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-400">Active</span>
                    <button className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
                  <span className="text-sm text-gray-300">auth-middleware</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-400">Active</span>
                    <button className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">DNS Records</h3>
                <button className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors">
                  Add Record
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
                  <span className="text-sm text-gray-300">codecraft.dev</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-400">A Record</span>
                    <button className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
                  <span className="text-sm text-gray-300">api.codecraft.dev</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-purple-400">CNAME</span>
                    <button className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-white mb-3">Pages Deployment</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Auto Deploy</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="text-sm text-gray-400">
                  Automatically deploy when code is pushed to main branch
                </div>
                <button className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm transition-colors">
                  Deploy Now
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'github' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">Repositories</h3>
                <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors">
                  Connect Repo
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
                  <span className="text-sm text-gray-300">cyper-ai-frontend</span>
                  <span className="text-sm text-gray-300">chyper-ai-frontend</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-400">Connected</span>
                    <button className="text-xs text-blue-400 hover:text-blue-300">Configure</button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
                  <span className="text-sm text-gray-300">cyper-ai-backend</span>
                  <span className="text-sm text-gray-300">chyper-ai-backend</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-400">Connected</span>
                    <button className="text-xs text-blue-400 hover:text-blue-300">Configure</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-white mb-3">GitHub Actions</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
                  <span className="text-sm text-gray-300">Deploy to Production</span>
                  <span className="text-xs text-green-400">✓ Success</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
                  <span className="text-sm text-gray-300">Run Tests</span>
                  <span className="text-xs text-yellow-400">⏳ Running</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'docker' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">Containers</h3>
                <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors">
                  Create Container
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
                  <div>
                    <span className="text-sm text-gray-300">chyper-ai-db</span>
                    <div className="text-xs text-gray-400">PostgreSQL 14</div>
                  </div>
                  <span className="text-xs text-green-400">Running</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
                  <div>
                    <span className="text-sm text-gray-300">chyper-ai-redis</span>
                    <div className="text-xs text-gray-400">Redis 7</div>
                  </div>
                  <span className="text-xs text-green-400">Running</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-white mb-3">Images</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
                  <span className="text-sm text-gray-300">node:18-alpine</span>
                  <span className="text-xs text-gray-400">156MB</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
                  <span className="text-sm text-gray-300">postgres:14</span>
                  <span className="text-xs text-gray-400">374MB</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
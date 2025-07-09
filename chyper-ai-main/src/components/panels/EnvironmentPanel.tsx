import React, { useState } from 'react';
import { Key, Plus, Eye, EyeOff, Copy, Trash2, Edit3, Save, X } from 'lucide-react';

interface EnvVariable {
  id: string;
  key: string;
  value: string;
  environment: 'development' | 'staging' | 'production';
  isSecret: boolean;
  lastModified: string;
}

export const EnvironmentPanel: React.FC = () => {
  const [variables, setVariables] = useState<EnvVariable[]>([
    {
      id: '1',
      key: 'DATABASE_URL',
      value: 'postgresql://localhost:5432/codecraft',
      environment: 'development',
      isSecret: true,
      lastModified: '2 hours ago'
    },
    {
      id: '2',
      key: 'API_BASE_URL',
      value: 'http://localhost:3001',
      environment: 'development',
      isSecret: false,
      lastModified: '1 day ago'
    },
    {
      id: '3',
      key: 'CLOUDFLARE_API_TOKEN',
      value: 'sk_test_...',
      environment: 'production',
      isSecret: true,
      lastModified: '3 days ago'
    }
  ]);

  const [activeEnvironment, setActiveEnvironment] = useState<'development' | 'staging' | 'production'>('development');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newVariable, setNewVariable] = useState({ key: '', value: '', isSecret: false });

  const filteredVariables = variables.filter(v => v.environment === activeEnvironment);

  const toggleSecret = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  const deleteVariable = (id: string) => {
    setVariables(prev => prev.filter(v => v.id !== id));
  };

  const addVariable = () => {
    if (newVariable.key && newVariable.value) {
      const variable: EnvVariable = {
        id: Date.now().toString(),
        key: newVariable.key,
        value: newVariable.value,
        environment: activeEnvironment,
        isSecret: newVariable.isSecret,
        lastModified: 'just now'
      };
      setVariables(prev => [...prev, variable]);
      setNewVariable({ key: '', value: '', isSecret: false });
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'development': return 'text-blue-400';
      case 'staging': return 'text-yellow-400';
      case 'production': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Environment Variables</h2>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
              Import .env
            </button>
            <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors">
              Export
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          {(['development', 'staging', 'production'] as const).map((env) => (
            <button
              key={env}
              onClick={() => setActiveEnvironment(env)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors capitalize ${
                activeEnvironment === env
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {env}
              <span className={`ml-2 text-xs ${getEnvironmentColor(env)}`}>
                {variables.filter(v => v.environment === env).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* Add new variable */}
          <div className="bg-gray-800 rounded-lg p-4 border-2 border-dashed border-gray-600">
            <h3 className="font-medium text-white mb-3">Add New Variable</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Variable name"
                value={newVariable.key}
                onChange={(e) => setNewVariable(prev => ({ ...prev, key: e.target.value }))}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Variable value"
                value={newVariable.value}
                onChange={(e) => setNewVariable(prev => ({ ...prev, value: e.target.value }))}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={newVariable.isSecret}
                  onChange={(e) => setNewVariable(prev => ({ ...prev, isSecret: e.target.checked }))}
                  className="rounded"
                />
                Mark as secret
              </label>
              <button
                onClick={addVariable}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
              >
                <Plus size={16} />
                Add Variable
              </button>
            </div>
          </div>

          {/* Existing variables */}
          {filteredVariables.map((variable) => (
            <div key={variable.id} className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Key size={16} className="text-blue-400" />
                    <span className="font-medium text-white">{variable.key}</span>
                    {variable.isSecret && (
                      <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-1 rounded">
                        SECRET
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyToClipboard(variable.value)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                      title="Copy value"
                    >
                      <Copy size={16} className="text-gray-400" />
                    </button>
                    
                    {variable.isSecret && (
                      <button
                        onClick={() => toggleSecret(variable.id)}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                        title={showSecrets[variable.id] ? "Hide value" : "Show value"}
                      >
                        {showSecrets[variable.id] ? 
                          <EyeOff size={16} className="text-gray-400" /> : 
                          <Eye size={16} className="text-gray-400" />
                        }
                      </button>
                    )}
                    
                    <button
                      onClick={() => setEditingId(variable.id)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                      title="Edit variable"
                    >
                      <Edit3 size={16} className="text-gray-400" />
                    </button>
                    
                    <button
                      onClick={() => deleteVariable(variable.id)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                      title="Delete variable"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
                
                <div className="font-mono text-sm bg-gray-900 rounded p-3 border border-gray-600">
                  {variable.isSecret && !showSecrets[variable.id] ? 
                    '••••••••••••••••' : 
                    variable.value
                  }
                </div>
                
                <div className="mt-2 text-xs text-gray-400">
                  Last modified: {variable.lastModified}
                </div>
              </div>
            </div>
          ))}

          {filteredVariables.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No environment variables defined for {activeEnvironment}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
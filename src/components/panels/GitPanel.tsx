import React, { useState } from 'react';
import { GitBranch, GitCommit, GitMerge, RefreshCw, Plus, Download, Upload, Settings } from 'lucide-react';

interface Commit {
  id: string;
  message: string;
  author: string;
  date: string;
  hash: string;
}

interface Branch {
  name: string;
  current: boolean;
  lastCommit: string;
}

export const GitPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('status');
  const [branches] = useState<Branch[]>([
    { name: 'main', current: true, lastCommit: '2 hours ago' },
    { name: 'feature/auth', current: false, lastCommit: '1 day ago' },
    { name: 'feature/dashboard', current: false, lastCommit: '3 days ago' },
  ]);

  const [commits] = useState<Commit[]>([
    {
      id: '1',
      message: 'Add environment variables panel',
      author: 'Developer',
      date: '2 hours ago',
      hash: 'a1b2c3d'
    },
    {
      id: '2',
      message: 'Implement database panel functionality',
      author: 'Developer',
      date: '4 hours ago',
      hash: 'e4f5g6h'
    },
    {
      id: '3',
      message: 'Fix integration panel styling',
      author: 'Developer',
      date: '1 day ago',
      hash: 'i7j8k9l'
    }
  ]);

  const [changedFiles] = useState([
    { name: 'src/components/panels/DatabasePanel.tsx', status: 'modified' },
    { name: 'src/components/panels/EnvironmentPanel.tsx', status: 'added' },
    { name: 'src/styles/globals.css', status: 'modified' },
  ]);

  const getFileStatusColor = (status: string) => {
    switch (status) {
      case 'modified': return 'text-yellow-400';
      case 'added': return 'text-green-400';
      case 'deleted': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getFileStatusSymbol = (status: string) => {
    switch (status) {
      case 'modified': return 'M';
      case 'added': return 'A';
      case 'deleted': return 'D';
      default: return '?';
    }
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Git Operations</h2>
          <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-gray-700 rounded transition-colors">
              <RefreshCw size={16} className="text-gray-400" />
            </button>
            <button className="p-1 hover:bg-gray-700 rounded transition-colors">
              <Settings size={16} className="text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          {['status', 'branches', 'history', 'remote'].map((tab) => (
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
        {activeTab === 'status' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-white mb-3">Repository Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Current Branch</span>
                  <span className="text-blue-400 font-medium">main</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Commits Ahead</span>
                  <span className="text-green-400">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Commits Behind</span>
                  <span className="text-gray-400">0</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">Changed Files</h3>
                <span className="text-sm text-gray-400">{changedFiles.length} files</span>
              </div>
              
              <div className="space-y-2">
                {changedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 py-2 px-3 bg-gray-700 rounded">
                    <span className={`font-mono text-sm ${getFileStatusColor(file.status)}`}>
                      {getFileStatusSymbol(file.status)}
                    </span>
                    <span className="text-sm text-gray-300 flex-1">{file.name}</span>
                    <button className="text-xs text-blue-400 hover:text-blue-300">
                      View
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 space-y-2">
                <input
                  type="text"
                  placeholder="Commit message..."
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors">
                    Commit Changes
                  </button>
                  <button className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors">
                    Discard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-white">Branches</h3>
              <button className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors">
                <Plus size={16} />
                New Branch
              </button>
            </div>
            
            <div className="space-y-2">
              {branches.map((branch, index) => (
                <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <GitBranch size={16} className={branch.current ? 'text-green-400' : 'text-gray-400'} />
                    <div>
                      <span className={`font-medium ${branch.current ? 'text-green-400' : 'text-white'}`}>
                        {branch.name}
                      </span>
                      {branch.current && (
                        <span className="ml-2 text-xs bg-green-600 text-green-100 px-2 py-1 rounded">
                          CURRENT
                        </span>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Last commit: {branch.lastCommit}
                      </div>
                    </div>
                  </div>
                  
                  {!branch.current && (
                    <div className="flex gap-1">
                      <button className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors">
                        Checkout
                      </button>
                      <button className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors">
                        Merge
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="font-medium text-white">Commit History</h3>
            
            <div className="space-y-3">
              {commits.map((commit) => (
                <div key={commit.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GitCommit size={16} className="text-blue-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-white">{commit.message}</div>
                        <div className="text-sm text-gray-400">
                          {commit.author} • {commit.date}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-gray-400 bg-gray-700 px-2 py-1 rounded">
                      {commit.hash}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'remote' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-white mb-3">Remote Repository</h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="text-gray-400">Origin: </span>
                  <span className="text-blue-400 font-mono">https://github.com/user/chyper-ai.git</span>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors">
                    <Upload size={16} />
                    Push
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors">
                    <Download size={16} />
                    Pull
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
                    <RefreshCw size={16} />
                    Fetch
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
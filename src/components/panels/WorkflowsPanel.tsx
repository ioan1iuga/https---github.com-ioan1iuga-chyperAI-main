import React, { useState } from 'react';
import { Play, Square, Settings, GitBranch, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  status: 'running' | 'success' | 'failed' | 'pending';
  trigger: 'push' | 'manual' | 'schedule';
  lastRun: string;
  duration?: string;
  steps: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  name: string;
  status: 'completed' | 'running' | 'failed' | 'pending';
  duration?: string;
}

export const WorkflowsPanel: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Deploy to Production',
      status: 'success',
      trigger: 'push',
      lastRun: '2 minutes ago',
      duration: '2m 15s',
      steps: [
        { id: '1', name: 'Install Dependencies', status: 'completed', duration: '45s' },
        { id: '2', name: 'Run Tests', status: 'completed', duration: '1m 20s' },
        { id: '3', name: 'Build Application', status: 'completed', duration: '10s' },
        { id: '4', name: 'Deploy to Cloudflare', status: 'completed', duration: '8s' }
      ]
    },
    {
      id: '2',
      name: 'Code Quality Check',
      status: 'running',
      trigger: 'push',
      lastRun: 'Running now',
      steps: [
        { id: '1', name: 'Lint Code', status: 'completed', duration: '12s' },
        { id: '2', name: 'Type Check', status: 'running' },
        { id: '3', name: 'Security Scan', status: 'pending' }
      ]
    },
    {
      id: '3',
      name: 'Nightly Backup',
      status: 'pending',
      trigger: 'schedule',
      lastRun: '22 hours ago',
      steps: []
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle size={16} className="text-green-400" />;
      case 'failed': return <XCircle size={16} className="text-red-400" />;
      case 'running': return <Play size={16} className="text-blue-400" />;
      case 'pending': return <Clock size={16} className="text-yellow-400" />;
      default: return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'running': return 'text-blue-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Workflows</h2>
          <button className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm">
            <Play size={16} />
            New Workflow
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-sm text-gray-400">Successful</span>
            </div>
            <span className="text-lg font-semibold text-white">
              {workflows.filter(w => w.status === 'success').length}
            </span>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Play size={16} className="text-blue-400" />
              <span className="text-sm text-gray-400">Running</span>
            </div>
            <span className="text-lg font-semibold text-white">
              {workflows.filter(w => w.status === 'running').length}
            </span>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <XCircle size={16} className="text-red-400" />
              <span className="text-sm text-gray-400">Failed</span>
            </div>
            <span className="text-lg font-semibold text-white">
              {workflows.filter(w => w.status === 'failed').length}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getStatusIcon(workflow.status)}
                  <h3 className="font-medium text-white">{workflow.name}</h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                    <Play size={16} className="text-gray-400" />
                  </button>
                  <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                    <Settings size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <GitBranch size={14} />
                  <span className="capitalize">{workflow.trigger}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{workflow.lastRun}</span>
                </div>
                {workflow.duration && (
                  <span>Duration: {workflow.duration}</span>
                )}
              </div>
            </div>
            
            {workflow.steps.length > 0 && (
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Steps</h4>
                <div className="space-y-2">
                  {workflow.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-3 py-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-700">
                        <span className="text-xs text-gray-400">{index + 1}</span>
                      </div>
                      {getStatusIcon(step.status)}
                      <span className="flex-1 text-sm text-gray-300">{step.name}</span>
                      {step.duration && (
                        <span className="text-xs text-gray-500">{step.duration}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { Activity, Clock, Cpu, HardDrive, Wifi, Zap, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';

interface MetricCard {
  id: string;
  title: string;
  value: string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface PerformanceData {
  timestamp: string;
  cpu: number;
  memory: number;
  network: number;
  responseTime: number;
}

export const PerformancePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMonitoring, setIsMonitoring] = useState(true);

  const metrics: MetricCard[] = [
    {
      id: 'cpu',
      title: 'CPU Usage',
      value: '23.4',
      unit: '%',
      trend: 'up',
      change: '+2.1%',
      icon: Cpu,
      color: 'text-blue-400'
    },
    {
      id: 'memory',
      title: 'Memory Usage',
      value: '67.2',
      unit: 'MB',
      trend: 'stable',
      change: '0%',
      icon: HardDrive,
      color: 'text-green-400'
    },
    {
      id: 'network',
      title: 'Network I/O',
      value: '1.2',
      unit: 'MB/s',
      trend: 'down',
      change: '-0.3%',
      icon: Wifi,
      color: 'text-purple-400'
    },
    {
      id: 'response',
      title: 'Response Time',
      value: '245',
      unit: 'ms',
      trend: 'up',
      change: '+15ms',
      icon: Clock,
      color: 'text-yellow-400'
    }
  ];

  const performanceData: PerformanceData[] = [
    { timestamp: '10:30', cpu: 20, memory: 65, network: 1.1, responseTime: 230 },
    { timestamp: '10:31', cpu: 25, memory: 67, network: 1.3, responseTime: 245 },
    { timestamp: '10:32', cpu: 22, memory: 66, network: 1.0, responseTime: 220 },
    { timestamp: '10:33', cpu: 28, memory: 69, network: 1.5, responseTime: 260 },
    { timestamp: '10:34', cpu: 23, memory: 67, network: 1.2, responseTime: 245 },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={12} className="text-red-400" />;
      case 'down': return <TrendingUp size={12} className="text-green-400 rotate-180" />;
      default: return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-red-400';
      case 'down': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Performance Monitor</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-gray-400">{isMonitoring ? 'Live' : 'Paused'}</span>
            </div>
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <RefreshCw size={16} className={`text-gray-400 ${isMonitoring ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          {['overview', 'realtime', 'history', 'alerts'].map((tab) => (
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
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((metric) => (
                <div key={metric.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <metric.icon size={16} className={metric.color} />
                      <span className="text-sm text-gray-400">{metric.title}</span>
                    </div>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">{metric.value}</span>
                    <span className="text-sm text-gray-400">{metric.unit}</span>
                  </div>
                  <div className={`text-xs ${getTrendColor(metric.trend)} mt-1`}>
                    {metric.change} from last hour
                  </div>
                </div>
              ))}
            </div>

            {/* Performance Chart */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="font-medium text-white mb-3">Performance Trends</h3>
              <div className="h-40 bg-gray-700 rounded flex items-center justify-center">
                <span className="text-gray-400">Performance chart visualization</span>
              </div>
            </div>

            {/* Resource Usage */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="font-medium text-white mb-3">Resource Usage</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">CPU</span>
                    <span className="text-sm text-blue-400">23.4%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '23.4%' }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">Memory</span>
                    <span className="text-sm text-green-400">67.2 MB</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '67%' }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">Network</span>
                    <span className="text-sm text-purple-400">1.2 MB/s</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'realtime' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="font-medium text-white mb-3">Real-time Metrics</h3>
              <div className="h-64 bg-gray-700 rounded flex items-center justify-center">
                <span className="text-gray-400">Live performance graph</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={16} className="text-blue-400" />
                  <span className="text-sm text-gray-400">Live CPU</span>
                </div>
                <span className="text-xl font-bold text-white">23.4%</span>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} className="text-yellow-400" />
                  <span className="text-sm text-gray-400">Requests/min</span>
                </div>
                <span className="text-xl font-bold text-white">156</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-3 border-b border-gray-700">
                <h3 className="font-medium text-white">Performance History</h3>
              </div>
              
              <div className="divide-y divide-gray-700">
                {performanceData.map((data, index) => (
                  <div key={index} className="p-3">
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <span className="text-gray-300 font-mono">{data.timestamp}</span>
                      <span className="text-blue-400">{data.cpu}%</span>
                      <span className="text-green-400">{data.memory}MB</span>
                      <span className="text-purple-400">{data.network}MB/s</span>
                      <span className="text-yellow-400">{data.responseTime}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-yellow-400" />
                <span className="font-medium text-yellow-400">Performance Alert</span>
              </div>
              <p className="text-sm text-yellow-300">CPU usage above 80% for 5 minutes</p>
              <span className="text-xs text-yellow-400">2 minutes ago</span>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="font-medium text-white mb-3">Alert Configuration</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">CPU Threshold</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="80"
                    className="w-24"
                  />
                  <span className="text-sm text-gray-400">80%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Memory Threshold</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="90"
                    className="w-24"
                  />
                  <span className="text-sm text-gray-400">90%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Response Time</span>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    defaultValue="500"
                    className="w-24"
                  />
                  <span className="text-sm text-gray-400">500ms</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
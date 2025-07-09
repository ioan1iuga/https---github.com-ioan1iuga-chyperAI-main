import React from 'react';
import { ProjectsGrid } from './ProjectsGrid';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import { Link } from 'react-router-dom';
import { MessageSquare, AlertCircle, Loader } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useProjects } from '../contexts/ProjectsContext';
import { useState, useEffect } from 'react';

interface DashboardProps {
  onProjectSelect: (projectId: string, projectName: string, projectFramework: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onProjectSelect }) => {
  const [systemStatus, setSystemStatus] = useState<{
    loading: boolean;
    error: string | null;
    services: { name: string; status: 'online' | 'warning' | 'offline' }[];
  }>({
    loading: true,
    error: null,
    services: []
  });

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { loading: projectsLoading, error: projectsError } = useProjects();

  // Fetch system status when component mounts
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        // In a real implementation, this would be an API call
        // For now, simulate a network request
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setSystemStatus({
          loading: false,
          error: null,
          services: [
            { name: 'WebContainer', status: 'online' }, 
            { name: 'Local Frontend', status: 'online' },
            { name: 'Local API Proxy', status: 'online' },
            { name: import.meta.env.VITE_SUPABASE_URL ? 'Supabase API' : 'Backend Server', 
              status: import.meta.env.VITE_SUPABASE_URL ? 'online' : 'offline' }
          ]
        });
      } catch {
        setSystemStatus({
          loading: false,
          error: 'Failed to fetch system status',
          services: []
        });
      }
    };

    fetchSystemStatus();
  }, []);

  return (
    <div className="p-6 h-full overflow-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-2xl font-semibold mb-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>ChyperAI Platform</h1>
        <p className={"text-sm " + (isDark ? 'text-gray-400' : 'text-gray-600')}>
          AI-powered development environment with intelligent code assistance
        </p>
        
        {/* Master Chat Button */}
        <Link 
          to="/master-chat"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium mt-3 hover:opacity-90 transition-opacity"
        >
          <MessageSquare size={18} />
          Launch Master Chat
        </Link>
      </div>

      {/* Loading State */}
      {(projectsLoading || systemStatus.loading) && (
        <div className="flex justify-center mb-8">
          <div className="flex items-center justify-center gap-3 px-4 py-2 rounded-lg bg-blue-600/10 border border-blue-500/20">
            <Loader size={18} className="animate-spin text-blue-500" />
            <span className="text-blue-500">Loading dashboard data...</span>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {(projectsError || systemStatus.error) && (
        <div className={`p-4 mb-8 rounded-lg border ${
          isDark ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              {projectsError && <p className="mb-2">{projectsError}</p>}
              {systemStatus.error && <p>{systemStatus.error}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ProjectsGrid onProjectSelect={onProjectSelect} />
        </div>
        <div className="space-y-6">
          <QuickActions />
          
          {/* System Status */}
          <div className={`rounded-lg p-4 border ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-base font-semibold mb-3 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>System Status</h3>
            
            {systemStatus.loading ? (
              <div className="flex justify-center py-4">
                <Loader size={20} className="animate-spin text-blue-500" />
              </div>
            ) : systemStatus.error ? (
              <div className="text-sm text-center py-4">
                <AlertCircle size={20} className="mx-auto mb-2 text-yellow-500" />
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Failed to load system status
                </p>
                <button 
                  className="text-blue-500 underline mt-2 hover:no-underline"
                  onClick={() => setSystemStatus({
                    ...systemStatus,
                    loading: true,
                    error: null
                  })}
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {systemStatus.services.map((service) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <span className={`text-xs ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>{service.name}</span>
                    <div className={`flex items-center gap-1 ${
                      service.status === 'online' ? 'text-green-400' : 
                      service.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      <div className="w-2 h-2 rounded-full bg-current"></div>
                      <span className="text-xs capitalize">{service.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <RecentActivity />
    </div>
  );
};
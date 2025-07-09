import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Play,
  Square, 
  Pause, 
  RefreshCw, 
  Settings, 
  Share, 
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectsContext';
import { useTheme } from '../contexts/ThemeContext';

type ProjectStatus = 'stopped' | 'starting' | 'running' | 'paused' | 'stopping' | 'error';
type DeploymentStatus = 'idle' | 'building' | 'deploying' | 'deployed' | 'failed';

interface WorkbenchHeaderProps {
  projectId: string;
  onBackToDashboard: () => void;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export const WorkbenchHeader: React.FC<WorkbenchHeaderProps> = ({
  projectId,
  onBackToDashboard
}) => {
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const project = projects.find(p => p.id === projectId);
  
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>('stopped');
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [buildProgress, setBuildProgress] = useState(0);
  const [lastDeployment, setLastDeployment] = useState<Date | null>(null);

  // Simulated dev server management
  useEffect(() => {
    // Initialize with a running status if this is a fresh project
    if (project?.status === 'active') {
      setProjectStatus('running');
      addLog('info', 'Development server is ready');
    }
  }, [project]);

  const addLog = (level: LogEntry['level'], message: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      level,
      message
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  const handleRun = async () => {
    if (projectStatus === 'running') return;
    
    setProjectStatus('starting');
    addLog('info', 'Starting development server...');
    
    try {
      // Simulate server startup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProjectStatus('running');
      addLog('success', 'Development server started on http://localhost:5173');
      addLog('info', 'Hot Module Replacement (HMR) enabled');
      addLog('info', 'Watching for file changes...');
    } catch (error) {
      setProjectStatus('error');
      addLog('error', 'Failed to start development server');
    }
  };

  const handleStop = async () => {
    if (projectStatus === 'stopped') return;
    
    setProjectStatus('stopping');
    addLog('info', 'Stopping development server...');
    
    try {
      // Simulate server shutdown
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProjectStatus('stopped');
      addLog('info', 'Development server stopped');
    } catch (error) {
      setProjectStatus('error');
      addLog('error', 'Error stopping development server');
    }
  };

  const handlePause = async () => {
    if (projectStatus !== 'running') return;
    
    setProjectStatus('paused');
    addLog('warn', 'Development server paused');
  };

  const handleResume = async () => {
    if (projectStatus !== 'paused') return;
    
    setProjectStatus('running');
    addLog('info', 'Development server resumed');
  };

  const handleDeploy = async () => {
    if (deploymentStatus === 'building' || deploymentStatus === 'deploying') return;
    
    setDeploymentStatus('building');
    setBuildProgress(0);
    addLog('info', 'Starting deployment process...');
    
    try {
      // Simulate build process
      addLog('info', 'Installing dependencies...');
      setBuildProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addLog('info', 'Running build command...');
      setBuildProgress(50);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      addLog('info', 'Optimizing assets...');
      setBuildProgress(75);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDeploymentStatus('deploying');
      setBuildProgress(90);
      addLog('info', 'Deploying to production...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate deployment URL
      const deployUrl = `https://${project?.name?.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 6)}.vercel.app`;
      setDeploymentUrl(deployUrl);
      setDeploymentStatus('deployed');
      setBuildProgress(100);
      setLastDeployment(new Date());
      
      addLog('success', `Deployment successful! Available at ${deployUrl}`);
    } catch (error) {
      setDeploymentStatus('failed');
      setBuildProgress(0);
      addLog('error', 'Deployment failed. Check logs for details.');
    }
  };

  const handleRestart = async () => {
    await handleStop();
    await new Promise(resolve => setTimeout(resolve, 500));
    await handleRun();
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'running': return 'text-green-400';
      case 'stopped': return 'text-gray-400';
      case 'paused': return 'text-yellow-400';
      case 'starting': case 'stopping': return 'text-blue-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case 'running': return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />;
      case 'stopped': return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
      case 'paused': return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'starting': case 'stopping': return <RefreshCw size={8} className="animate-spin text-blue-400" />;
      case 'error': return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default: return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  const getDeploymentStatusColor = (status: DeploymentStatus) => {
    switch (status) {
      case 'deployed': return 'text-green-400';
      case 'building': case 'deploying': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`border-b px-4 py-3 ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <ArrowLeft size={16} />
            <span className="text-sm">Back</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div>
              <h1 className={`text-base font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {project?.name || 'Unknown Project'}
              </h1>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  {project?.framework || 'React'}
                </span>
                <div className="flex items-center gap-1 text-xs">
                  {getStatusIcon(projectStatus)}
                  <span className={getStatusColor(projectStatus)}>
                    {projectStatus.charAt(0).toUpperCase() + projectStatus.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Project Control Buttons */}
          <div className="flex items-center gap-1">
            {projectStatus === 'stopped' || projectStatus === 'error' ? (
              <button
                onClick={handleRun}
                disabled={projectStatus === 'starting'}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors text-sm text-white"
              >
                {projectStatus === 'starting' ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Play size={16} />
                )}
                <span className="text-sm">
                  {projectStatus === 'starting' ? 'Starting...' : 'Run'}
                </span>
              </button>
            ) : projectStatus === 'paused' ? (
              <button
                onClick={handleResume}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors text-sm text-white"
              >
                <Play size={16} />
                <span className="text-sm">Resume</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                disabled={projectStatus !== 'running'}
                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors text-sm text-white"
              >
                <Pause size={16} />
                <span className="text-sm">Pause</span>
              </button>
            )}
            
            <button
              onClick={handleStop}
              disabled={projectStatus === 'stopped' || projectStatus === 'stopping'}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors text-sm text-white"
            >
              {projectStatus === 'stopping' ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Square size={16} />
              )}
              <span className="text-sm">
                {projectStatus === 'stopping' ? 'Stopping...' : 'Stop'}
              </span>
            </button>

            <button
              onClick={handleRestart}
              disabled={projectStatus === 'starting' || projectStatus === 'stopping'}
              className={`p-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Restart"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Deployment Button */}
          <div className="border-l pl-2 ml-2 border-gray-300 dark:border-gray-600">
            <button
              onClick={handleDeploy}
              disabled={deploymentStatus === 'building' || deploymentStatus === 'deploying'}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors text-sm text-white"
            >
              {deploymentStatus === 'building' || deploymentStatus === 'deploying' ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              <span className="text-sm">
                {deploymentStatus === 'building' ? 'Building...' :
                 deploymentStatus === 'deploying' ? 'Deploying...' :
                 'Deploy'}
              </span>
            </button>
          </div>

          {/* Deployment Status */}
          {(deploymentStatus !== 'idle' || deploymentUrl) && (
            <div className="flex items-center gap-2 text-sm">
              {deploymentStatus === 'building' || deploymentStatus === 'deploying' ? (
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300 ease-out"
                      style={{ width: `${buildProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{buildProgress}%</span>
                </div>
              ) : deploymentStatus === 'deployed' && deploymentUrl ? (
                <button
                  onClick={() => window.open(deploymentUrl, '_blank')}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors text-xs ${
                    isDark ? 'hover:bg-gray-700 text-green-400' : 'hover:bg-gray-100 text-green-600'
                  }`}
                  title="Open live site"
                >
                  <CheckCircle size={12} />
                  <span>Live</span>
                  <ExternalLink size={10} />
                </button>
              ) : deploymentStatus === 'failed' ? (
                <div className="flex items-center gap-1 text-red-400 text-xs">
                  <AlertCircle size={12} />
                  <span>Failed</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Additional Controls */}
          <div className="border-l pl-2 ml-2 border-gray-300 dark:border-gray-600 flex items-center gap-1">
            <button 
              onClick={() => setShowLogs(!showLogs)}
              className={`p-1.5 rounded-md transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              } ${showLogs ? 'bg-blue-600 text-white' : ''}`}
              title="Toggle logs"
            >
              <Download size={16} className={showLogs ? 'rotate-180' : ''} />
            </button>
            
            <button 
              className={`p-1.5 rounded-md transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Share project"
            >
              <Share size={16} />
            </button>
            
            <button 
              className={`p-1.5 rounded-md transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Project settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Deployment Info Bar */}
      {lastDeployment && deploymentStatus === 'deployed' && (
        <div className={`mt-2 p-2 rounded-md text-xs ${
          isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700'
        }`}>
          <div className="flex items-center justify-between">
            <span>
              Last deployed {lastDeployment.toLocaleTimeString()} ago to production
            </span>
            {deploymentUrl && (
              <button
                onClick={() => window.open(deploymentUrl, '_blank')}
                className="flex items-center gap-1 hover:underline"
              >
                View live site <ExternalLink size={10} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Logs Panel */}
      {showLogs && (
        <div className={`mt-3 rounded-md border max-h-48 overflow-auto ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className={`sticky top-0 px-3 py-2 border-b text-sm font-medium ${
            isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-100 border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between">
              <span>Console Output</span>
              <button
                onClick={() => setLogs([])}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                }`}
              >
                Clear
              </button>
            </div>
          </div>
          <div className="p-3 space-y-1 font-mono text-xs">
            {logs.length === 0 ? (
              <div className={`text-center py-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                No logs yet
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className={`text-xs ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span className={`font-medium text-xs ${
                    log.level === 'success' ? 'text-green-400' :
                    log.level === 'warn' ? 'text-yellow-400' :
                    log.level === 'error' ? 'text-red-400' :
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className={`flex-1 text-xs ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
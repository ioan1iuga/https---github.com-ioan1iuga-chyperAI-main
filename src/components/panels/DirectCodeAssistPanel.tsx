import React, { useState, useEffect } from 'react';
import {
  Code,
  GitBranch,
  Upload,
  BarChart3,
  FileText,
  Zap,
  Shield,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Copy,
  XCircle,
  Terminal
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import RepositoryService from '../../services/repository/RepositoryService';
import DeploymentService from '../../services/deployment/DeploymentService';
import CodeAnalysisService from '../../services/codeAnalysis/CodeAnalysisService';
import ErrorMonitoringService from '../../services/errorHandling/ErrorMonitoringService';

interface DirectCodeAssistPanelProps {
  projectId: string;
}

export const DirectCodeAssistPanel: React.FC<DirectCodeAssistPanelProps> = ({ projectId }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { activeSession } = useAI();
  
  const [activeTab, setActiveTab] = useState<'assist' | 'deploy' | 'analyze' | 'test'>('assist');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [optimization, setOptimization] = useState<{
    focus: 'performance' | 'readability' | 'security' | 'all';
    level: 'conservative' | 'balanced' | 'aggressive';
  }>({ focus: 'all', level: 'balanced' });
  
  const [deploymentOptions, setDeploymentOptions] = useState<{
    provider: 'netlify' | 'vercel' | 'cloudflare';
    environment: 'production' | 'staging' | 'preview';
    buildCommand: string;
    outputDir: string;
  }>({
    provider: 'netlify',
    environment: 'production',
    buildCommand: 'npm run build',
    outputDir: 'dist'
  });
  
  const [deploymentStatus, setDeploymentStatus] = useState<{
    status: 'idle' | 'deploying' | 'success' | 'failed';
    deploymentUrl: string | null;
    logs: string[];
  }>({
    status: 'idle',
    deploymentUrl: null,
    logs: []
  });
  
  const [analysisResults, setAnalysisResults] = useState<any | null>(null);
  
  // Initialize repository and deployment services
  useEffect(() => {
    if (projectId) {
      RepositoryService.setActiveProject(projectId);
      DeploymentService.setActiveProject(projectId);
      
      // Set default metadata for error monitoring
      ErrorMonitoringService.setDefaultMetadata({
        projectId,
        sessionId: activeSession?.id,
        userId: 'current-user'
      });
      
      // Load project files
      loadProjectFiles();
    }
  }, [projectId]);
  
  const loadProjectFiles = async () => {
    try {
      setLoading(true);
      await RepositoryService.loadProjectFiles();
      setLoading(false);
    } catch (error) {
      setError('Failed to load project files');
      setLoading(false);
      
      // Log the error
      ErrorMonitoringService.captureException(
        error instanceof Error ? error : new Error('Unknown error loading project files')
      );
    }
  };
  
  const handleOptimizeCode = async () => {
    if (!selectedFile) {
      setError('Please select a file to optimize');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Get file content if not already loaded
      if (!fileContent) {
        const content = await RepositoryService.readFile(selectedFile);
        setFileContent(content);
      }
      
      // Optimize the code
      const optimizedCode = await RepositoryService.optimizeCode(selectedFile, {
        focus: optimization.focus,
        level: optimization.level
      });
      
      // Update the file content
      setFileContent(optimizedCode);
      
      setSuccess('Code optimized successfully');
      setLoading(false);
    } catch (error) {
      setError('Failed to optimize code');
      setLoading(false);
      
      // Log the error
      ErrorMonitoringService.captureException(
        error instanceof Error ? error : new Error('Unknown error optimizing code'),
        { file: selectedFile, optimization }
      );
    }
  };
  
  const handleAddErrorHandling = async () => {
    if (!selectedFile) {
      setError('Please select a file to add error handling');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Get file content if not already loaded
      if (!fileContent) {
        const content = await RepositoryService.readFile(selectedFile);
        setFileContent(content);
      }
      
      // Add error handling
      const codeWithErrorHandling = await RepositoryService.addErrorHandling(selectedFile);
      
      // Update the file content
      setFileContent(codeWithErrorHandling);
      
      setSuccess('Error handling added successfully');
      setLoading(false);
    } catch (error) {
      setError('Failed to add error handling');
      setLoading(false);
      
      // Log the error
      ErrorMonitoringService.captureException(
        error instanceof Error ? error : new Error('Unknown error adding error handling'),
        { file: selectedFile }
      );
    }
  };
  
  const handleGenerateTests = async () => {
    if (!selectedFile) {
      setError('Please select a file to generate tests');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Get file content if not already loaded
      if (!fileContent) {
        const content = await RepositoryService.readFile(selectedFile);
        setFileContent(content);
      }
      
      // Generate tests
      const tests = await RepositoryService.generateTests(selectedFile, {
        framework: 'auto',
        coverage: 'full'
      });
      
      setSuccess('Tests generated successfully');
      setLoading(false);
    } catch (error) {
      setError('Failed to generate tests');
      setLoading(false);
      
      // Log the error
      ErrorMonitoringService.captureException(
        error instanceof Error ? error : new Error('Unknown error generating tests'),
        { file: selectedFile }
      );
    }
  };
  
  const handleDeployProject = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setDeploymentStatus({
        status: 'deploying',
        deploymentUrl: null,
        logs: ['Starting deployment process...']
      });
      
      // Deploy the project
      const deployment = await DeploymentService.deployProject(
        deploymentOptions.provider,
        deploymentOptions.environment,
        {
          buildCommand: deploymentOptions.buildCommand,
          outputDir: deploymentOptions.outputDir,
          environmentVariables: {}
        }
      );
      
      // Subscribe to deployment updates
      const unsubscribe = DeploymentService.subscribeToDeployments((updatedDeployment) => {
        if (updatedDeployment.id === deployment.id) {
          setDeploymentStatus({
            status: updatedDeployment.status as any,
            deploymentUrl: updatedDeployment.url || null,
            logs: updatedDeployment.logs
          });
          
          if (updatedDeployment.status === 'success') {
            setSuccess('Project deployed successfully');
            setLoading(false);
          } else if (updatedDeployment.status === 'failed') {
            setError(updatedDeployment.error || 'Deployment failed');
            setLoading(false);
          }
        }
      });
      
    } catch (error) {
      setError('Failed to deploy project');
      setLoading(false);
      setDeploymentStatus({
        status: 'failed',
        deploymentUrl: null,
        logs: ['Deployment failed']
      });
      
      // Log the error
      ErrorMonitoringService.captureException(
        error instanceof Error ? error : new Error('Unknown error deploying project'),
        { deploymentOptions }
      );
    }
  };
  
  const handleAnalyzeCode = async () => {
    if (!selectedFile) {
      setError('Please select a file to analyze');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Get file content if not already loaded
      if (!fileContent) {
        const content = await RepositoryService.readFile(selectedFile);
        setFileContent(content);
      }
      
      // Analyze the code
      const analysis = await RepositoryService.analyzeCodeQuality(selectedFile);
      
      setAnalysisResults(analysis);
      setSuccess('Code analysis completed');
      setLoading(false);
    } catch (error) {
      setError('Failed to analyze code');
      setLoading(false);
      
      // Log the error
      ErrorMonitoringService.captureException(
        error instanceof Error ? error : new Error('Unknown error analyzing code'),
        { file: selectedFile }
      );
    }
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'assist':
        return (
          <div className="space-y-6">
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-sm font-medium mb-4">Code Optimization</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2">
                    Select Optimization Focus
                  </label>
                  <select
                    value={optimization.focus}
                    onChange={(e) => setOptimization({ ...optimization, focus: e.target.value as any })}
                    className={`w-full px-3 py-2 rounded text-sm ${
                      isDark
                        ? 'bg-gray-700 border border-gray-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Aspects</option>
                    <option value="performance">Performance</option>
                    <option value="readability">Readability</option>
                    <option value="security">Security</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium mb-2">
                    Optimization Level
                  </label>
                  <select
                    value={optimization.level}
                    onChange={(e) => setOptimization({ ...optimization, level: e.target.value as any })}
                    className={`w-full px-3 py-2 rounded text-sm ${
                      isDark
                        ? 'bg-gray-700 border border-gray-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="conservative">Conservative (Minimal Changes)</option>
                    <option value="balanced">Balanced</option>
                    <option value="aggressive">Aggressive (Maximum Optimization)</option>
                  </select>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleOptimizeCode}
                    disabled={loading || !selectedFile}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-2"
                  >
                    {loading ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
                    Optimize Selected File
                  </button>
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-sm font-medium mb-4">Error Handling</h3>
              
              <p className="text-xs mb-4">
                Add comprehensive error handling to the selected file. This will add try-catch blocks,
                proper error logging, and error recovery mechanisms where appropriate.
              </p>
              
              <div className="flex justify-end">
                <button
                  onClick={handleAddErrorHandling}
                  disabled={loading || !selectedFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-2"
                >
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : <Shield size={16} />}
                  Add Error Handling
                </button>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-sm font-medium mb-4">Test Generation</h3>
              
              <p className="text-xs mb-4">
                Automatically generate comprehensive test cases for the selected file.
                Tests will cover all functions, edge cases, and error conditions.
              </p>
              
              <div className="flex justify-end">
                <button
                  onClick={handleGenerateTests}
                  disabled={loading || !selectedFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-2"
                >
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : <FileText size={16} />}
                  Generate Tests
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'deploy':
        return (
          <div className="space-y-6">
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-sm font-medium mb-4">Deployment Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2">
                    Deployment Provider
                  </label>
                  <select
                    value={deploymentOptions.provider}
                    onChange={(e) => setDeploymentOptions({ 
                      ...deploymentOptions, 
                      provider: e.target.value as any 
                    })}
                    className={`w-full px-3 py-2 rounded text-sm ${
                      isDark
                        ? 'bg-gray-700 border border-gray-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="netlify">Netlify</option>
                    <option value="vercel">Vercel</option>
                    <option value="cloudflare">Cloudflare</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium mb-2">
                    Environment
                  </label>
                  <select
                    value={deploymentOptions.environment}
                    onChange={(e) => setDeploymentOptions({ 
                      ...deploymentOptions, 
                      environment: e.target.value as any 
                    })}
                    className={`w-full px-3 py-2 rounded text-sm ${
                      isDark
                        ? 'bg-gray-700 border border-gray-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="preview">Preview</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium mb-2">
                    Build Command
                  </label>
                  <input
                    type="text"
                    value={deploymentOptions.buildCommand}
                    onChange={(e) => setDeploymentOptions({ 
                      ...deploymentOptions, 
                      buildCommand: e.target.value 
                    })}
                    className={`w-full px-3 py-2 rounded text-sm ${
                      isDark
                        ? 'bg-gray-700 border border-gray-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium mb-2">
                    Output Directory
                  </label>
                  <input
                    type="text"
                    value={deploymentOptions.outputDir}
                    onChange={(e) => setDeploymentOptions({ 
                      ...deploymentOptions, 
                      outputDir: e.target.value 
                    })}
                    className={`w-full px-3 py-2 rounded text-sm ${
                      isDark
                        ? 'bg-gray-700 border border-gray-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleDeployProject}
                disabled={loading || deploymentStatus.status === 'deploying'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-2"
              >
                {deploymentStatus.status === 'deploying' ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                {deploymentStatus.status === 'deploying' ? 'Deploying...' : 'Deploy Project'}
              </button>
            </div>
            
            {/* Deployment Status */}
            {deploymentStatus.status !== 'idle' && (
              <div className={`p-4 rounded-lg border ${
                deploymentStatus.status === 'success' 
                  ? isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
                  : deploymentStatus.status === 'failed'
                    ? isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
                    : isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  {deploymentStatus.status === 'success' ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : deploymentStatus.status === 'failed' ? (
                    <XCircle size={16} className="text-red-500" />
                  ) : (
                    <Clock size={16} className="text-blue-500" />
                  )}
                  <h4 className="text-sm font-medium">
                    {deploymentStatus.status === 'success' 
                      ? 'Deployment Successful' 
                      : deploymentStatus.status === 'failed'
                        ? 'Deployment Failed'
                        : 'Deployment in Progress'}
                  </h4>
                </div>
                
                {deploymentStatus.deploymentUrl && (
                  <div className="mb-3 flex items-center gap-2">
                    <a 
                      href={deploymentStatus.deploymentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 flex items-center gap-1 text-xs"
                    >
                      View Deployment
                      <Play size={12} />
                    </a>
                  </div>
                )}
                
                <div className="max-h-60 overflow-auto rounded bg-gray-900 p-3 text-xs font-mono text-gray-300">
                  {deploymentStatus.logs.map((log, index) => (
                    <div key={index} className="whitespace-pre-wrap mb-1">
                      <span className="text-gray-500">{index + 1}:</span> {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'analyze':
        return (
          <div className="space-y-6">
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-sm font-medium mb-4">Code Analysis</h3>
              
              <p className="text-xs mb-4">
                Run comprehensive code analysis on the selected file or the entire project.
                This will identify issues, optimization opportunities, and security vulnerabilities.
              </p>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleAnalyzeCode}
                  disabled={loading || !selectedFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-2"
                >
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : <BarChart3 size={16} />}
                  Analyze Selected File
                </button>
              </div>
            </div>
            
            {/* Analysis Results */}
            {analysisResults && (
              <div className={`p-4 rounded-lg border ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">Analysis Results</h3>
                  
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full ${
                      analysisResults.score >= 90 
                        ? isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-700'
                        : analysisResults.score >= 70
                          ? isDark ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                          : isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-700'
                    }`}>
                      <span className="text-xs font-medium">Score: {analysisResults.score}</span>
                    </div>
                  </div>
                </div>
                
                {/* Issues */}
                <div className="space-y-3 mb-4">
                  <h4 className="text-xs font-medium">Issues ({analysisResults.issues.length})</h4>
                  
                  {analysisResults.issues.length === 0 ? (
                    <p className="text-xs text-gray-500">No issues found</p>
                  ) : (
                    <div className={`max-h-60 overflow-auto rounded ${
                      isDark ? 'bg-gray-900' : 'bg-gray-50'
                    }`}>
                      {analysisResults.issues.map((issue, index) => (
                        <div 
                          key={index} 
                          className={`p-3 ${
                            index !== analysisResults.issues.length - 1 
                              ? isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'
                              : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`p-1 rounded ${
                              issue.severity === 'critical' 
                                ? 'bg-red-600/20 text-red-400'
                                : issue.severity === 'high'
                                  ? 'bg-orange-600/20 text-orange-400'
                                  : issue.severity === 'medium'
                                    ? 'bg-yellow-600/20 text-yellow-400'
                                    : 'bg-blue-600/20 text-blue-400'
                            }`}>
                              <AlertCircle size={14} />
                            </div>
                            
                            <div>
                              <div className="text-xs font-medium">{issue.message}</div>
                              
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                {issue.line && (
                                  <span>Line {issue.line}</span>
                                )}
                                
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  issue.type === 'security'
                                    ? isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-700'
                                    : issue.type === 'performance'
                                      ? isDark ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                                      : isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {issue.type}
                                </span>
                              </div>
                              
                              {issue.suggestion && (
                                <div className="mt-2">
                                  <div className="text-xs text-gray-400">Suggestion:</div>
                                  <div className="text-xs mt-1">{issue.suggestion}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Metrics */}
                <div>
                  <h4 className="text-xs font-medium mb-3">Metrics</h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={`p-2 rounded ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div className="text-xs text-gray-400">Complexity</div>
                      <div className="text-sm font-medium mt-1">{analysisResults.metrics.complexity}/100</div>
                    </div>
                    
                    <div className={`p-2 rounded ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div className="text-xs text-gray-400">Maintainability</div>
                      <div className="text-sm font-medium mt-1">{analysisResults.metrics.maintainability}/100</div>
                    </div>
                    
                    <div className={`p-2 rounded ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div className="text-xs text-gray-400">Security</div>
                      <div className="text-sm font-medium mt-1">{analysisResults.metrics.security}/100</div>
                    </div>
                    
                    <div className={`p-2 rounded ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div className="text-xs text-gray-400">Performance</div>
                      <div className="text-sm font-medium mt-1">{analysisResults.metrics.performance}/100</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'test':
        return (
          <div className="space-y-6">
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-sm font-medium mb-4">Test Management</h3>
              
              <p className="text-xs mb-4">
                Generate and run tests for your code. Tests will be automatically generated
                based on your code's functionality.
              </p>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleGenerateTests}
                  disabled={loading || !selectedFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-2"
                >
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : <FileText size={16} />}
                  Generate Tests
                </button>
                
                <button
                  disabled={true} // Mock: would be enabled when tests exist
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-2"
                >
                  <Play size={16} />
                  Run Tests
                </button>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Test Results</h3>
                
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                    isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-700'
                  }`}>
                    <CheckCircle size={12} />
                    <span className="text-xs">All Tests Passing</span>
                  </div>
                </div>
              </div>
              
              <div className={`max-h-60 overflow-auto rounded ${
                isDark ? 'bg-gray-900' : 'bg-gray-50'
              }`}>
                <div className="p-3 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="text-xs font-medium">Component renders correctly</span>
                    </div>
                    <span className="text-xs text-gray-500">12ms</span>
                  </div>
                </div>
                
                <div className="p-3 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="text-xs font-medium">Handles user input correctly</span>
                    </div>
                    <span className="text-xs text-gray-500">8ms</span>
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="text-xs font-medium">Error states display properly</span>
                    </div>
                    <span className="text-xs text-gray-500">15ms</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div>Coverage: 92%</div>
                  <div>3 tests, 5 assertions</div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };
  
  // Show status messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <div className={`h-full flex flex-col overflow-hidden ${
      isDark ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Code size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Direct Code Management</h2>
              <p className={`text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Automatically optimize, analyze, and deploy your code
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex items-center gap-1 rounded-lg p-1 ${
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <button
            onClick={() => setActiveTab('assist')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'assist'
                ? 'bg-blue-600 text-white'
                : isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <Zap size={16} />
            <span>Code Assist</span>
          </button>
          
          <button
            onClick={() => setActiveTab('deploy')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'deploy'
                ? 'bg-blue-600 text-white'
                : isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <Upload size={16} />
            <span>Deploy</span>
          </button>
          
          <button
            onClick={() => setActiveTab('analyze')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analyze'
                ? 'bg-blue-600 text-white'
                : isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <BarChart3 size={16} />
            <span>Analyze</span>
          </button>
          
          <button
            onClick={() => setActiveTab('test')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'test'
                ? 'bg-blue-600 text-white'
                : isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <FileText size={16} />
            <span>Test</span>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {(success || error) && (
        <div className={`mx-4 mt-4 p-3 rounded ${
          success 
            ? isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-800'
            : isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {success ? (
              <CheckCircle size={14} className="flex-shrink-0" />
            ) : (
              <AlertCircle size={14} className="flex-shrink-0" />
            )}
            <span className="text-xs">{success || error}</span>
          </div>
        </div>
      )}

      {/* File Selector */}
      <div className="mx-4 mt-4">
        <label className="block text-xs font-medium mb-2">
          Selected File
        </label>
        <select
          value={selectedFile || ''}
          onChange={(e) => setSelectedFile(e.target.value || null)}
          className={`w-full px-3 py-2 rounded text-sm ${
            isDark
              ? 'bg-gray-700 border border-gray-600 text-white'
              : 'bg-white border border-gray-300 text-gray-900'
          }`}
        >
          <option value="">Select a file...</option>
          <option value="src/App.tsx">src/App.tsx</option>
          <option value="src/index.ts">src/index.ts</option>
          <option value="package.json">package.json</option>
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {renderTabContent()}
      </div>

      {/* Terminal Output */}
      <div className={`mt-auto border-t ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
      } p-4`}>
        <div className="flex items-center gap-2 mb-2">
          <Terminal size={14} className="text-gray-400" />
          <h4 className="text-xs font-medium">Command Output</h4>
        </div>
        
        <div className={`h-24 overflow-auto rounded p-2 font-mono text-xs ${
          isDark ? 'bg-gray-900 text-gray-300' : 'bg-gray-800 text-gray-300'
        }`}>
          {loading ? (
            <div className="flex items-center gap-2 animate-pulse">
              <span>$</span>
              <span className="text-blue-400">Running command...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span>$</span>
                <span className="text-green-400">Command completed successfully</span>
              </div>
              <div className="text-gray-500 mt-1">Ready for the next operation</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
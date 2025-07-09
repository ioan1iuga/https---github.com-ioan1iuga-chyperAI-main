import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Settings, 
  MessageSquare, 
  Code, 
  Search, 
  Zap, 
  Shield, 
  TrendingUp, 
  FileText,
  Plus,
  ChevronDown,
  Brain,
  Lightbulb,
  Target
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { ChatInterface } from '../ai/ChatInterface';
import { ModelSelector } from '../ai/ModelSelector';
import { ModelComparison } from '../ai/ModelComparison';
import { CodeSuggestion } from '../../types/ai';
import { AISettingsPanel } from '../ai/AISettingsPanel';

export const AIAssistantPanel: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const {
    sessions,
    activeSession,
    providers,
    activeProvider,
    currentModel,
    suggestions,
    isLoading,
    createSession,
    setActiveSession,
    setActiveProvider,
    setCurrentModel,
    analyzeProject,
    generateCode,
    analyzeCode
  } = useAI();

  const [activeTab, setActiveTab] = useState('chat');
  const [showSettings, setShowSettings] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showModelComparison, setShowModelComparison] = useState(false);

  // Initialize session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createSession('current-project', 'Development Session');
    }
  }, [sessions.length, createSession]);

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, description: 'Interactive AI assistance' },
    { id: 'suggestions', label: 'Suggestions', icon: Lightbulb, description: 'Code recommendations' },
    { id: 'analysis', label: 'Analysis', icon: Search, description: 'Code analysis & review' },
    { id: 'generation', label: 'Generate', icon: Code, description: 'Code generation' },
  ];

  const commands = [
    { id: 'review', label: 'Review Code', icon: Shield, prompt: 'Please review this code for issues and improvements' },
    { id: 'optimize', label: 'Optimize', icon: TrendingUp, prompt: 'How can I optimize this code for better performance?' },
    { id: 'test', label: 'Generate Tests', icon: FileText, prompt: 'Generate comprehensive unit tests for this code' },
    { id: 'explain', label: 'Explain', icon: Brain, prompt: 'Explain how this code works and what it does' },
    { id: 'refactor', label: 'Refactor', icon: Target, prompt: 'Suggest refactoring improvements for this code' },
    { id: 'debug', label: 'Debug', icon: Search, prompt: 'Help me debug this code and find potential issues' }
  ];

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'security': return Shield;
      case 'performance': return TrendingUp;
      case 'optimization': return Zap;
      case 'bug-fix': return Search;
      case 'refactor': return Code;
      default: return Lightbulb;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'security': return 'text-red-400 bg-red-900/20';
      case 'performance': return 'text-yellow-400 bg-yellow-900/20';
      case 'optimization': return 'text-green-400 bg-green-900/20';
      case 'bug-fix': return 'text-blue-400 bg-blue-900/20';
      case 'refactor': return 'text-purple-400 bg-purple-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const currentModelInfo = activeProvider?.models.find(m => m.id === currentModel);

  return (
    <div className={`h-full flex flex-col ${
      isDark ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b flex-shrink-0 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>AI Assistant</h2>
              <div className="flex items-center gap-2 text-xs">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {activeProvider?.name || 'No provider'}
                </span>
                {currentModelInfo && (
                  <>
                    <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>•</span>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                      {currentModelInfo.displayName}
                    </span>
                  </>
                )}
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-500">Ready</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <ModelSelector compact />
            
            <button
              onClick={() => setShowModelComparison(true)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title="Compare models"
            >
              Compare
            </button>

            <button
              onClick={() => setShowSettingsPanel(true)}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex items-center gap-1 rounded-lg p-1 ${
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              title={tab.description}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <ChatInterface />
        )}

        {activeTab === 'suggestions' && (
          <div className="h-full overflow-auto p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Code Suggestions</h3>
                <span className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {suggestions.length} suggestions
                </span>
              </div>

              {suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Lightbulb size={48} className={`mb-4 ${
                    isDark ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <p className={`text-center ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    No suggestions yet. Chat with the AI or analyze your code to get recommendations.
                  </p>
                </div>
              ) : (
                suggestions.map((suggestion) => {
                  const IconComponent = getSuggestionIcon(suggestion.type);
                  const colorClass = getSuggestionColor(suggestion.type);
                  
                  return (
                    <div
                      key={suggestion.id}
                      className={`rounded-lg border p-4 ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <IconComponent size={16} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-medium mb-1 ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {suggestion.title}
                          </h4>
                          <p className={`text-sm mb-2 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {suggestion.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`px-2 py-1 rounded ${colorClass}`}>
                              {suggestion.type}
                            </span>
                            <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                              Confidence: {Math.round(suggestion.confidence * 100)}%
                            </span>
                            {suggestion.filePath && (
                              <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                                {suggestion.filePath}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {suggestion.code && (
                        <div className={`rounded border overflow-hidden ${
                          isDark ? 'border-gray-600' : 'border-gray-300'
                        }`}>
                          <div className={`px-3 py-2 text-xs ${
                            isDark ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {suggestion.language}
                          </div>
                          <pre className={`p-3 text-sm font-mono overflow-x-auto ${
                            isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
                          }`}>
                            <code>{suggestion.code}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="h-full overflow-auto p-4">
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Code Analysis</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => analyzeProject('current')}
                  disabled={isLoading}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Search size={20} className="text-blue-500" />
                    <span className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Analyze Project</span>
                  </div>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Comprehensive analysis of your entire project structure and code quality.
                  </p>
                </button>

                <button
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={20} className="text-red-500" />
                    <span className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Security Scan</span>
                  </div>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Scan for security vulnerabilities and potential risks in your code.
                  </p>
                </button>

                <button
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={20} className="text-green-500" />
                    <span className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Performance Audit</span>
                  </div>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Identify performance bottlenecks and optimization opportunities.
                  </p>
                </button>

                <button
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={20} className="text-purple-500" />
                    <span className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Documentation</span>
                  </div>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Generate documentation and improve code comments.
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'generation' && (
          <div className="h-full overflow-auto p-4">
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Code Generation</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {commands.map((command) => (
                  <button
                    key={command.id}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <command.icon size={16} className="text-blue-500" />
                      <span className={`font-medium text-sm ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {command.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className={`rounded-lg border p-4 ${
                isDark 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Custom Generation</h4>
                <textarea
                  placeholder="Describe what you want to generate (e.g., 'Create a React component for user authentication')"
                  className={`w-full h-20 p-3 rounded border resize-none ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:border-blue-500`}
                />
                <div className="flex justify-between items-center mt-3">
                  <select className={`px-3 py-1 rounded border text-sm ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}>
                    <option>TypeScript</option>
                    <option>JavaScript</option>
                    <option>Python</option>
                    <option>CSS</option>
                    <option>HTML</option>
                  </select>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    Generate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <AISettingsPanel
        isOpen={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
      />
      
      {/* Model Comparison Modal */}
      <ModelComparison
        isOpen={showModelComparison}
        onClose={() => setShowModelComparison(false)}
      />
    </div>
  );
};
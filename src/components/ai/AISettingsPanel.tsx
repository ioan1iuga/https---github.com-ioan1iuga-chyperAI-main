import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  Brain, 
  Shield, 
  DollarSign, 
  Clock, 
  Download, 
  Upload, 
  BarChart3,
  AlertTriangle,
  Check,
  X,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { LLMProvider } from '../../types/ai';

interface AISettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AISettingsPanel: React.FC<AISettingsPanelProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const {
    providers,
    activeProvider,
    currentModel,
    configureProvider,
    setActiveProvider,
    setCurrentModel,
    sessions,
    exportSession,
    importSession
  } = useAI();

  const [activeTab, setActiveTab] = useState('providers');
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);

  if (!isOpen) return null;

  const tabs = [
    { id: 'providers', label: 'Providers', icon: Brain },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'usage', label: 'Usage & Billing', icon: DollarSign },
    { id: 'export', label: 'Import/Export', icon: Download },
  ];

  const handleProviderUpdate = (providerId: string, updates: Partial<LLMProvider>) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      const updatedProvider = { ...provider, ...updates };
      configureProvider(updatedProvider);
      setHasChanges(true);
    }
  };

  const handleApiKeyChange = (providerId: string, apiKey: string) => {
    handleProviderUpdate(providerId, { apiKey, status: apiKey ? 'connected' : 'disconnected' });
  };

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleSave = () => {
    // Save settings logic would go here
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    // Reset to defaults logic would go here
    setHasChanges(false);
  };

  const getTotalTokenUsage = () => {
    return sessions.reduce((total, session) => total + session.tokenUsage.total, 0);
  };

  const getTotalCost = () => {
    // Calculate estimated cost based on token usage and model pricing
    return sessions.reduce((total, session) => {
      const provider = providers.find(p => p.id === session.provider);
      const model = provider?.models.find(m => m.id === session.model);
      if (model) {
        const inputCost = (session.tokenUsage.input / 1000) * model.inputCost;
        const outputCost = (session.tokenUsage.output / 1000) * model.outputCost;
        return total + inputCost + outputCost;
      }
      return total;
    }, 0);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-full max-w-4xl h-[80vh] rounded-lg shadow-2xl flex flex-col ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Settings size={20} className="text-white" />
            </div>
            <div>
              <h2 className={`text-base font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>AI Assistant Settings</h2>
              <p className={`text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>Configure providers, models, and preferences</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className={`w-64 border-r ${
            isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
          }`}>
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : isDark 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'providers' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>LLM Providers</h3>
                  <p className={`text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Configure API keys and settings for AI providers</p>
                </div>

                <div className="space-y-4">
                  {providers.map((provider) => (
                    <div key={provider.id} className={`border rounded-lg p-4 ${
                      isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            provider.status === 'connected' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Brain size={20} />
                          </div>
                          <div>
                            <h4 className={`font-medium ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>{provider.name}</h4>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                provider.status === 'connected' ? 'bg-green-500' :
                                provider.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                              }`} />
                              <span className={`text-xs capitalize ${
                                provider.status === 'connected' ? 'text-green-600' :
                                provider.status === 'error' ? 'text-red-600' : 
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {provider.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {provider.status === 'connected' && (
                            <Check size={16} className="text-green-500" />
                          )}
                          <button
                            onClick={() => setActiveProvider(provider.id)}
                            disabled={provider.status !== 'connected'}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              activeProvider?.id === provider.id
                                ? 'bg-blue-600 text-white'
                                : provider.status === 'connected'
                                  ? isDark 
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  : 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-400'
                            }`}
                          >
                            {activeProvider?.id === provider.id ? 'Active' : 'Set Active'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* API Key */}
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            API Key
                          </label>
                          <div className="relative">
                            <input
                              type={showApiKeys[provider.id] ? 'text' : 'password'}
                              value={provider.apiKey || ''}
                              onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                              placeholder="Enter your API key"
                              className={`w-full px-3 py-2 pr-10 rounded-lg border transition-colors ${
                                isDark 
                                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                              } focus:outline-none`}
                            />
                            <button
                              type="button"
                              onClick={() => toggleApiKeyVisibility(provider.id)}
                              className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                                isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              {showApiKeys[provider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        {/* Custom Endpoint */}
                        {provider.type === 'custom' && (
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Custom Endpoint
                            </label>
                            <input
                              type="url"
                              value={provider.endpoint || ''}
                              onChange={(e) => handleProviderUpdate(provider.id, { endpoint: e.target.value })}
                              placeholder="https://api.example.com/v1"
                              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                                isDark 
                                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                              } focus:outline-none`}
                            />
                          </div>
                        )}

                        {/* Available Models */}
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Available Models ({provider.models.length})
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {provider.models.slice(0, 3).map((model) => (
                              <span
                                key={model.id}
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  currentModel === model.id && activeProvider?.id === provider.id
                                    ? 'bg-blue-600 text-white'
                                    : isDark 
                                      ? 'bg-gray-700 text-gray-300' 
                                      : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {model.displayName}
                              </span>
                            ))}
                            {provider.models.length > 3 && (
                              <span className={`px-2 py-1 rounded text-xs ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                +{provider.models.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`p-4 rounded-lg ${
                  isDark ? 'bg-blue-900/20 border border-blue-600/20' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className="text-blue-500 mt-0.5" />
                    <div>
                      <h4 className={`font-medium text-sm ${
                        isDark ? 'text-blue-400' : 'text-blue-800'
                      }`}>Secure API Key Storage</h4>
                      <p className={`text-xs mt-1 ${
                        isDark ? 'text-blue-300' : 'text-blue-700'
                      }`}>
                        API keys are stored securely and never transmitted to external servers except to the respective AI providers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>AI Behavior Preferences</h3>
                  <p className={`text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Customize how the AI assistant responds and behaves</p>
                </div>

                <div className="space-y-6">
                  {/* Response Settings */}
                  <div className={`border rounded-lg p-4 ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <h4 className={`font-medium mb-3 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Response Settings</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Response Length
                        </label>
                        <select className={`w-full px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}>
                          <option value="short">Short (1-2 paragraphs)</option>
                          <option value="medium">Medium (3-5 paragraphs)</option>
                          <option value="long">Long (Detailed explanations)</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Code Style Preference
                        </label>
                        <select className={`w-full px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}>
                          <option value="verbose">Verbose (with comments)</option>
                          <option value="clean">Clean (minimal comments)</option>
                          <option value="production">Production-ready</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Creativity Level
                        </label>
                        <div className="space-y-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            defaultValue="50"
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Conservative</span>
                            <span>Balanced</span>
                            <span>Creative</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Auto-suggestions */}
                  <div className={`border rounded-lg p-4 ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <h4 className={`font-medium mb-3 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Auto-suggestions</h4>
                    
                    <div className="space-y-3">
                      {[
                        { label: 'Code completion suggestions', enabled: true },
                        { label: 'Security issue detection', enabled: true },
                        { label: 'Performance optimization tips', enabled: false },
                        { label: 'Best practice recommendations', enabled: true },
                      ].map((setting, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className={`text-sm ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>{setting.label}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              defaultChecked={setting.enabled}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Security & Privacy</h3>
                  <p className={`text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Configure security settings and data handling preferences</p>
                </div>

                <div className="space-y-6">
                  <div className={`border rounded-lg p-4 ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <h4 className={`font-medium mb-3 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Data Handling</h4>
                    
                    <div className="space-y-3">
                      {[
                        { label: 'Allow code analysis for improvements', enabled: true },
                        { label: 'Share anonymous usage data', enabled: false },
                        { label: 'Store conversation history locally', enabled: true },
                        { label: 'Auto-delete conversations after 30 days', enabled: false },
                      ].map((setting, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className={`text-sm ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>{setting.label}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              defaultChecked={setting.enabled}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`border rounded-lg p-4 ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <h4 className={`font-medium mb-3 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>API Security</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Request Timeout (seconds)
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="60"
                          defaultValue="30"
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Max Tokens per Request
                        </label>
                        <input
                          type="number"
                          min="100"
                          max="4000"
                          defaultValue="2000"
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Usage & Billing</h3>
                  <p className={`text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Monitor your AI usage and manage billing preferences</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`border rounded-lg p-4 ${
                    isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 size={16} className="text-blue-500" />
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>Total Tokens</span>
                    </div>
                    <span className={`text-2xl font-bold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {getTotalTokenUsage().toLocaleString()}
                    </span>
                  </div>

                  <div className={`border rounded-lg p-4 ${
                    isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={16} className="text-green-500" />
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>Estimated Cost</span>
                    </div>
                    <span className={`text-2xl font-bold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      ${getTotalCost().toFixed(2)}
                    </span>
                  </div>

                  <div className={`border rounded-lg p-4 ${
                    isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-purple-500" />
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>Sessions</span>
                    </div>
                    <span className={`text-2xl font-bold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {sessions.length}
                    </span>
                  </div>
                </div>

                <div className={`border rounded-lg p-4 ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <h4 className={`font-medium mb-3 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Usage Limits</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Daily Token Limit
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1000"
                          max="100000"
                          defaultValue="10000"
                          className={`flex-1 px-3 py-2 rounded-lg border ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                        <span className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>tokens</span>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Monthly Budget Alert
                      </label>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">$</span>
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          step="0.01"
                          defaultValue="50.00"
                          className={`flex-1 px-3 py-2 rounded-lg border ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`border rounded-lg p-4 ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <h4 className={`font-medium mb-3 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Recent Usage by Provider</h4>
                  
                  <div className="space-y-3">
                    {providers.filter(p => p.status === 'connected').map((provider) => {
                      const providerSessions = sessions.filter(s => s.provider === provider.id);
                      const tokenUsage = providerSessions.reduce((total, session) => total + session.tokenUsage.total, 0);
                      
                      return (
                        <div key={provider.id} className="flex items-center justify-between">
                          <span className={`text-sm ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>{provider.name}</span>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {tokenUsage.toLocaleString()} tokens
                            </span>
                            <a
                              href="#"
                              className="text-blue-500 hover:text-blue-400 text-xs flex items-center gap-1"
                            >
                              View details
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Import & Export</h3>
                  <p className={`text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Backup your conversations and settings</p>
                </div>

                <div className="space-y-4">
                  <div className={`border rounded-lg p-4 ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <h4 className={`font-medium mb-3 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Export Data</h4>
                    
                    <div className="space-y-3">
                      <button className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isDark 
                          ? 'border-gray-600 hover:bg-gray-700' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          <Download size={16} className="text-blue-500" />
                          <div className="text-left">
                            <div className={`font-medium ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>Export All Conversations</div>
                            <div className={`text-xs ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>Download all your AI conversations as JSON</div>
                          </div>
                        </div>
                      </button>

                      <button className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isDark 
                          ? 'border-gray-600 hover:bg-gray-700' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          <Settings size={16} className="text-green-500" />
                          <div className="text-left">
                            <div className={`font-medium ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>Export Settings</div>
                            <div className={`text-xs ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>Download your AI assistant configuration</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className={`border rounded-lg p-4 ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <h4 className={`font-medium mb-3 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Import Data</h4>
                    
                    <div className="space-y-3">
                      <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                        isDark ? 'border-gray-600' : 'border-gray-300'
                      }`}>
                        <Upload size={24} className={`mx-auto mb-2 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <p className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Drop your backup files here or click to browse
                        </p>
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${
                    isDark ? 'bg-yellow-900/20 border border-yellow-600/20' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={16} className="text-yellow-500 mt-0.5" />
                      <div>
                        <h4 className={`font-medium text-sm ${
                          isDark ? 'text-yellow-400' : 'text-yellow-800'
                        }`}>Data Privacy Notice</h4>
                        <p className={`text-xs mt-1 ${
                          isDark ? 'text-yellow-300' : 'text-yellow-700'
                        }`}>
                          Exported data includes conversation history and may contain sensitive information. Store backup files securely.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span className={`text-sm ${
                  isDark ? 'text-orange-400' : 'text-orange-600'
                }`}>Unsaved changes</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <RotateCcw size={16} className="inline mr-2" />
              Reset
            </button>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Save size={16} className="inline mr-2" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
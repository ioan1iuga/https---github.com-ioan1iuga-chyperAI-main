import React, { useState } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  Clock, 
  Zap, 
  Shield, 
  Brain,
  X,
  Plus,
  Star,
  Check,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { LLMModel, LLMProvider } from '../../types/ai';

interface ModelComparisonProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelComparison: React.FC<ModelComparisonProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const { providers, currentModel, activeProvider, setActiveProvider, setCurrentModel } = useAI();
  const [selectedModels, setSelectedModels] = useState<Array<{ provider: LLMProvider; model: LLMModel }>>([]);

  if (!isOpen) return null;

  const connectedProviders = providers.filter(p => p.status === 'connected');
  const allModels = connectedProviders.flatMap(provider => 
    provider.models.map(model => ({ provider, model }))
  );

  const addModelToComparison = (providerModel: { provider: LLMProvider; model: LLMModel }) => {
    if (selectedModels.length < 4 && !selectedModels.find(m => m.model.id === providerModel.model.id)) {
      setSelectedModels(prev => [...prev, providerModel]);
    }
  };

  const removeModelFromComparison = (modelId: string) => {
    setSelectedModels(prev => prev.filter(m => m.model.id !== modelId));
  };

  const handleSelectModel = (provider: LLMProvider, model: LLMModel) => {
    setActiveProvider(provider.id);
    setCurrentModel(model.id);
    onClose();
  };

  const getPerformanceScore = (model: LLMModel) => {
    const tokenScore = Math.min(model.maxTokens / 20000, 5);
    const costScore = 5 - Math.min(model.inputCost * 2000, 5);
    return Math.round((tokenScore + costScore) / 2 * 20);
  };

  const getCapabilityCount = (model: LLMModel) => {
    return model.capabilities.filter(cap => cap.supported).length;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-full max-w-6xl h-[90vh] rounded-lg shadow-2xl flex flex-col ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <BarChart3 size={24} className="text-blue-500" />
            <div>
              <h2 className={`text-base font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Model Comparison</h2>
              <p className={`text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>Compare AI models to find the best fit for your needs</p>
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
          {/* Model Selection Sidebar */}
          <div className={`w-80 border-r ${
            isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
          } overflow-auto`}>
            <div className="p-4">
              <h3 className={`font-semibold mb-3 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Available Models</h3>
              
              <div className="space-y-2">
                {allModels.map(({ provider, model }) => (
                  <div
                    key={`${provider.id}-${model.id}`}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedModels.find(m => m.model.id === model.id)
                        ? 'border-blue-500 bg-blue-50'
                        : isDark
                          ? 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className={`font-medium text-sm ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {model.displayName}
                        </h4>
                        <p className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {provider.name}
                        </p>
                      </div>
                      
                      {selectedModels.find(m => m.model.id === model.id) ? (
                        <button
                          onClick={() => removeModelFromComparison(model.id)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded"
                        >
                          <X size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => addModelToComparison({ provider, model })}
                          disabled={selectedModels.length >= 4}
                          className="p-1 text-blue-500 hover:bg-blue-100 rounded disabled:opacity-50"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            className={`${
                              i < Math.round(getPerformanceScore(model) / 20) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-400'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        {getCapabilityCount(model)} capabilities
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="flex-1 overflow-auto">
            {selectedModels.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BarChart3 size={48} className={`mx-auto mb-4 ${
                    isDark ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Select Models to Compare</h3>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Choose up to 4 models from the sidebar to compare their features
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <th className={`text-left p-3 font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>Feature</th>
                        {selectedModels.map(({ provider, model }) => (
                          <th key={model.id} className="p-2 min-w-[180px]">
                            <div className="text-center">
                              <div className={`text-sm font-semibold ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}>
                                {model.displayName}
                              </div>
                              <div className={`text-xs ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {provider.name}
                              </div>
                              {currentModel === model.id && activeProvider?.id === provider.id && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                    <Check size={10} />
                                    Current
                                  </span>
                                </div>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${
                      isDark ? 'divide-gray-700' : 'divide-gray-200'
                    }`}>
                      {/* Performance Score */}
                      <tr>
                        <td className={`p-3 font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-blue-500" />
                            Performance Score
                          </div>
                        </td>
                        {selectedModels.map(({ model }) => (
                          <td key={model.id} className="p-3 text-center">
                            <div className={`text-lg font-bold ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {getPerformanceScore(model)}/100
                            </div>
                            <div className={`w-full bg-gray-200 rounded-full h-2 mt-1 ${
                              isDark ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${getPerformanceScore(model)}%` }}
                              />
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Max Tokens */}
                      <tr>
                        <td className={`p-3 font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-green-500" />
                            Max Tokens
                          </div>
                        </td>
                        {selectedModels.map(({ model }) => (
                          <td key={model.id} className="p-3 text-center">
                            <div className={`font-semibold ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {model.maxTokens.toLocaleString()}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Input Cost */}
                      <tr>
                        <td className={`p-3 font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <div className="flex items-center gap-2">
                            <DollarSign size={16} className="text-yellow-500" />
                            Input Cost (per 1K tokens)
                          </div>
                        </td>
                        {selectedModels.map(({ model }) => (
                          <td key={model.id} className="p-3 text-center">
                            <div className={`font-semibold ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              ${model.inputCost}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Output Cost */}
                      <tr>
                        <td className={`p-3 font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <div className="flex items-center gap-2">
                            <DollarSign size={16} className="text-yellow-500" />
                            Output Cost (per 1K tokens)
                          </div>
                        </td>
                        {selectedModels.map(({ model }) => (
                          <td key={model.id} className="p-3 text-center">
                            <div className={`font-semibold ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              ${model.outputCost}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Capabilities */}
                      <tr>
                        <td className={`p-3 font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <div className="flex items-center gap-2">
                            <Zap size={16} className="text-purple-500" />
                            Capabilities
                          </div>
                        </td>
                        {selectedModels.map(({ model }) => (
                          <td key={model.id} className="p-3">
                            <div className="space-y-1">
                              {model.capabilities.map((cap, i) => (
                                <div 
                                  key={i}
                                  className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-xs ${
                                    cap.supported
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {cap.supported ? <Check size={10} /> : <X size={10} />}
                                  <span className="capitalize">
                                    {cap.type.replace('-', ' ')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Action Row */}
                      <tr>
                        <td className={`p-3 font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Actions
                        </td>
                        {selectedModels.map(({ provider, model }) => (
                          <td key={model.id} className="p-3 text-center">
                            <button
                              onClick={() => handleSelectModel(provider, model)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                currentModel === model.id && activeProvider?.id === provider.id
                                  ? 'bg-green-600 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              {currentModel === model.id && activeProvider?.id === provider.id
                                ? 'Selected'
                                : 'Select Model'
                              }
                            </button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Recommendation */}
                <div className={`mt-6 p-4 rounded-lg ${
                  isDark ? 'bg-blue-900/20 border border-blue-600/20' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <Brain size={16} className="text-blue-500 mt-0.5" />
                    <div>
                      <h4 className={`font-medium text-xs ${
                        isDark ? 'text-blue-400' : 'text-blue-800'
                      }`}>AI Recommendation</h4>
                      <p className={`text-xs mt-0.5 ${
                        isDark ? 'text-blue-300' : 'text-blue-700'
                      }`}>
                        Based on your selection, we recommend models with higher performance scores for complex tasks, 
                        or cost-effective options for simple queries. Consider token limits for long documents.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
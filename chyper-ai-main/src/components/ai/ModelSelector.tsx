import React, { useState } from 'react';
import { 
  Brain, 
  ChevronDown, 
  Check, 
  Zap, 
  DollarSign, 
  Clock, 
  Shield, 
  Eye, 
  Code, 
  MessageSquare,
  X,
  Star,
  TrendingUp,
  Info
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { LLMProvider, LLMModel } from '../../types/ai';

interface ModelSelectorProps {
  compact?: boolean;
  showDetails?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  compact = false, 
  showDetails = true 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const {
    providers,
    activeProvider,
    currentModel,
    setActiveProvider,
    setCurrentModel
  } = useAI();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(activeProvider?.id || '');
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);

  const currentModelInfo = activeProvider?.models.find(m => m.id === currentModel);
  const connectedProviders = providers.filter(p => p.status === 'connected');

  const handleModelSelect = (providerId: string, modelId: string) => {
    setActiveProvider(providerId);
    setCurrentModel(modelId);
    setIsOpen(false);
  };

  const getCapabilityIcon = (capability: string) => {
    switch (capability) {
      case 'code-generation': return Code;
      case 'code-analysis': return Shield;
      case 'chat': return MessageSquare;
      case 'function-calling': return Zap;
      case 'vision': return Eye;
      default: return Brain;
    }
  };

  const getPerformanceRating = (model: LLMModel) => {
    // Simple rating based on max tokens and cost
    const tokenScore = Math.min(model.maxTokens / 10000, 5);
    const costScore = 5 - Math.min(model.inputCost * 1000, 5);
    return Math.round((tokenScore + costScore) / 2);
  };

  const getModelRecommendation = (model: LLMModel) => {
    if (model.maxTokens > 100000) return 'Best for large documents';
    if (model.inputCost < 0.001) return 'Most cost-effective';
    if (model.capabilities.length > 3) return 'Most versatile';
    return 'Balanced performance';
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            isDark 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <Brain size={14} />
          <span>{currentModelInfo?.displayName || 'Select Model'}</span>
          <ChevronDown size={12} />
        </button>
        
        {isOpen && (
          <div className={`absolute top-full right-0 mt-1 w-80 rounded-lg border shadow-lg z-50 ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <ModelSelectorContent 
              isDark={isDark}
              connectedProviders={connectedProviders}
              currentModel={currentModel}
              activeProvider={activeProvider}
              selectedProvider={selectedProvider}
              setSelectedProvider={setSelectedProvider}
              hoveredModel={hoveredModel}
              setHoveredModel={setHoveredModel}
              handleModelSelect={handleModelSelect}
              getCapabilityIcon={getCapabilityIcon}
              getPerformanceRating={getPerformanceRating}
              getModelRecommendation={getModelRecommendation}
              onClose={() => setIsOpen(false)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-blue-500" />
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              AI Model Selection
            </h3>
          </div>
          {currentModelInfo && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={`${
                      i < getPerformanceRating(currentModelInfo) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-400'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">
                {getModelRecommendation(currentModelInfo)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Current Selection */}
      {currentModelInfo && (
        <div className="p-3 border-b border-gray-700 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {currentModelInfo.displayName}
              </h4>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {activeProvider?.name}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                isDark 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              Change Model
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className={`block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Max Tokens
              </span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {currentModelInfo.maxTokens.toLocaleString()}
              </span>
            </div>
            <div>
              <span className={`block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Input Cost
              </span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ${currentModelInfo.inputCost}/1K
              </span>
            </div>
            <div>
              <span className={`block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Capabilities
              </span>
              <div className="flex gap-1 mt-1">
                {currentModelInfo.capabilities.slice(0, 3).map((cap, i) => {
                  const IconComponent = getCapabilityIcon(cap.type);
                  return (
                    <IconComponent 
                      key={i} 
                      size={12} 
                      className={cap.supported ? 'text-green-400' : 'text-gray-400'} 
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Selection */}
      {isOpen && (
        <ModelSelectorContent 
          isDark={isDark}
          connectedProviders={connectedProviders}
          currentModel={currentModel}
          activeProvider={activeProvider}
          selectedProvider={selectedProvider}
          setSelectedProvider={setSelectedProvider}
          hoveredModel={hoveredModel}
          setHoveredModel={setHoveredModel}
          handleModelSelect={handleModelSelect}
          getCapabilityIcon={getCapabilityIcon}
          getPerformanceRating={getPerformanceRating}
          getModelRecommendation={getModelRecommendation}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

interface ModelSelectorContentProps {
  isDark: boolean;
  connectedProviders: LLMProvider[];
  currentModel: string;
  activeProvider: LLMProvider | null;
  selectedProvider: string;
  setSelectedProvider: (id: string) => void;
  hoveredModel: string | null;
  setHoveredModel: (id: string | null) => void;
  handleModelSelect: (providerId: string, modelId: string) => void;
  getCapabilityIcon: (capability: string) => React.ComponentType<any>;
  getPerformanceRating: (model: LLMModel) => number;
  getModelRecommendation: (model: LLMModel) => string;
  onClose: () => void;
}

const ModelSelectorContent: React.FC<ModelSelectorContentProps> = ({
  isDark,
  connectedProviders,
  currentModel,
  activeProvider,
  selectedProvider,
  setSelectedProvider,
  hoveredModel,
  setHoveredModel,
  handleModelSelect,
  getCapabilityIcon,
  getPerformanceRating,
  getModelRecommendation,
  onClose
}) => {
  return (
    <div className="max-h-96 overflow-auto">
      {/* Provider Tabs */}
      <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        {connectedProviders.map((provider) => (
          <button
            key={provider.id}
            onClick={() => setSelectedProvider(provider.id)}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              selectedProvider === provider.id
                ? 'bg-blue-600 text-white'
                : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {provider.name}
            <span className="ml-1 text-xs opacity-75">
              ({provider.models.length})
            </span>
          </button>
        ))}
      </div>

      {/* Models List */}
      <div className="divide-y divide-gray-700">
        {connectedProviders
          .filter(p => !selectedProvider || p.id === selectedProvider)
          .map((provider) => (
            <div key={provider.id}>
              {provider.models.map((model) => (
                <div
                  key={model.id}
                  className={`p-3 transition-colors cursor-pointer ${
                    currentModel === model.id && activeProvider?.id === provider.id
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleModelSelect(provider.id, model.id)}
                  onMouseEnter={() => setHoveredModel(model.id)}
                  onMouseLeave={() => setHoveredModel(null)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {model.displayName}
                        </h4>
                        {currentModel === model.id && activeProvider?.id === provider.id && (
                          <Check size={14} className="text-green-400 flex-shrink-0" />
                        )}
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={10}
                              className={`${
                                i < getPerformanceRating(model) 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-400'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-xs opacity-75 mb-2">
                        {getModelRecommendation(model)}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs opacity-75">
                        <div className="flex items-center gap-1">
                          <Clock size={10} />
                          <span>{model.maxTokens.toLocaleString()} tokens</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign size={10} />
                          <span>${model.inputCost}/1K</span>
                        </div>
                      </div>
                      
                      {hoveredModel === model.id && (
                        <div className="mt-2 flex gap-1">
                          {model.capabilities.map((cap, i) => {
                            const IconComponent = getCapabilityIcon(cap.type);
                            return (
                              <div
                                key={i}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                  cap.supported
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                                title={cap.type}
                              >
                                <IconComponent size={10} />
                                <span className="capitalize">
                                  {cap.type.replace('-', ' ')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>

      {connectedProviders.length === 0 && (
        <div className="p-6 text-center">
          <Brain size={32} className={`mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No AI providers connected. Configure your API keys in settings.
          </p>
        </div>
      )}
    </div>
  );
};
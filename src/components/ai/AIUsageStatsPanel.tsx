import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  DollarSign,
  Clock,
  Download,
  Calendar,
  Zap,
  Users,
  PieChart,
  TrendingUp,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface UsageData {
  tokens: {
    daily: number;
    monthly: number;
    limit: { daily: number; monthly: number };
  };
  requests: {
    daily: number;
    monthly: number;
    limit: { daily: number; monthly: number };
  };
  cost: {
    daily: number;
    monthly: number;
    limit: { daily: number; monthly: number };
  };
  providers: Record<string, number>;
  models: Record<string, number>;
  history: {
    date: string;
    tokens: number;
    requests: number;
  }[];
}

const mockUsageData: UsageData = {
  tokens: {
    daily: 5243,
    monthly: 124532,
    limit: { daily: 10000, monthly: 300000 }
  },
  requests: {
    daily: 48,
    monthly: 1245,
    limit: { daily: 100, monthly: 3000 }
  },
  cost: {
    daily: 0.42,
    monthly: 10.56,
    limit: { daily: 50, monthly: 1500 }
  },
  providers: {
    'OpenAI': 68,
    'Anthropic': 28,
    'Google': 4
  },
  models: {
    'gpt-4': 42,
    'gpt-3.5-turbo': 26,
    'claude-3-opus': 18,
    'claude-3-sonnet': 10,
    'gemini-pro': 4
  },
  history: [
    { date: '07/01', tokens: 12400, requests: 124 },
    { date: '07/02', tokens: 8300, requests: 83 },
    { date: '07/03', tokens: 15600, requests: 156 },
    { date: '07/04', tokens: 18200, requests: 182 },
    { date: '07/05', tokens: 9800, requests: 98 },
    { date: '07/06', tokens: 22400, requests: 224 },
    { date: '07/07', tokens: 18700, requests: 187 },
    { date: '07/08', tokens: 19100, requests: 191 }
  ]
};

interface AIUsageStatsPanelProps {
  userId?: string;
}

export const AIUsageStatsPanel: React.FC<AIUsageStatsPanelProps> = ({ userId }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [usageData, setUsageData] = useState<UsageData>(mockUsageData);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Here you would fetch real data from your API
    const fetchUsageData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        // In a real app, you'd make an API call like:
        // const response = await fetch(`/api/usage?userId=${userId}&timeframe=${timeframe}`);
        // const data = await response.json();
        // setUsageData(data);

        // For now, we'll just use the mock data
        setUsageData(mockUsageData);
      } catch (error) {
        console.error("Failed to fetch usage data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsageData();
  }, [timeframe, userId]);

  const getPercentage = (used: number, limit: number) => {
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-400';
    if (percentage < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`h-full flex flex-col overflow-hidden ${
      isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-blue-900' : 'bg-blue-100'
            }`}>
              <BarChart3 size={20} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Usage Statistics</h2>
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Track your AI consumption and costs
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 rounded p-1 ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              {['7d', '30d', '90d'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t as any)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    timeframe === t 
                      ? 'bg-blue-600 text-white' 
                      : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            
            <button
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Download report"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className={`w-10 h-10 border-4 border-t-blue-600 rounded-full animate-spin ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Usage Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tokens */}
              <div className={`rounded-lg border p-4 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={18} className="text-blue-500" />
                      <span className="font-medium">Token Usage</span>
                    </div>
                    <div className="text-xl font-bold">
                      {usageData.tokens.daily.toLocaleString()} <span className="text-xs opacity-70">today</span>
                    </div>
                    <div className={`text-sm mt-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {usageData.tokens.monthly.toLocaleString()} this month
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      getStatusColor(getPercentage(usageData.tokens.daily, usageData.tokens.limit.daily))
                    }`}>
                      {getPercentage(usageData.tokens.daily, usageData.tokens.limit.daily)}%
                    </div>
                    <div className={`text-xs ${
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      of daily limit
                    </div>
                  </div>
                </div>
                <div className={`h-2 w-full rounded-full mt-3 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className={`h-2 rounded-full ${
                      getProgressBarColor(getPercentage(usageData.tokens.daily, usageData.tokens.limit.daily))
                    }`}
                    style={{ width: `${getPercentage(usageData.tokens.daily, usageData.tokens.limit.daily)}%` }}
                  ></div>
                </div>
              </div>

              {/* Requests */}
              <div className={`rounded-lg border p-4 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={18} className="text-purple-500" />
                      <span className="font-medium">AI Requests</span>
                    </div>
                    <div className="text-xl font-bold">
                      {usageData.requests.daily} <span className="text-xs opacity-70">today</span>
                    </div>
                    <div className={`text-sm mt-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {usageData.requests.monthly} this month
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      getStatusColor(getPercentage(usageData.requests.daily, usageData.requests.limit.daily))
                    }`}>
                      {getPercentage(usageData.requests.daily, usageData.requests.limit.daily)}%
                    </div>
                    <div className={`text-xs ${
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      of daily limit
                    </div>
                  </div>
                </div>
                <div className={`h-2 w-full rounded-full mt-3 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className={`h-2 rounded-full ${
                      getProgressBarColor(getPercentage(usageData.requests.daily, usageData.requests.limit.daily))
                    }`}
                    style={{ width: `${getPercentage(usageData.requests.daily, usageData.requests.limit.daily)}%` }}
                  ></div>
                </div>
              </div>

              {/* Cost */}
              <div className={`rounded-lg border p-4 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={18} className="text-green-500" />
                      <span className="font-medium">Estimated Cost</span>
                    </div>
                    <div className="text-xl font-bold">
                      ${usageData.cost.daily.toFixed(2)} <span className="text-xs opacity-70">today</span>
                    </div>
                    <div className={`text-sm mt-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      ${usageData.cost.monthly.toFixed(2)} this month
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      getStatusColor(getPercentage(usageData.cost.daily, usageData.cost.limit.daily))
                    }`}>
                      {getPercentage(usageData.cost.daily, usageData.cost.limit.daily)}%
                    </div>
                    <div className={`text-xs ${
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      of daily budget
                    </div>
                  </div>
                </div>
                <div className={`h-2 w-full rounded-full mt-3 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className={`h-2 rounded-full ${
                      getProgressBarColor(getPercentage(usageData.cost.daily, usageData.cost.limit.daily))
                    }`}
                    style={{ width: `${getPercentage(usageData.cost.daily, usageData.cost.limit.daily)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Usage History Chart */}
            <div className={`rounded-lg border p-4 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-sm font-medium mb-4">Usage History</h3>
              <div className="h-64">
                {/* Here you would normally render a chart library like Chart.js or Recharts */}
                {/* This is a simple visual representation for the mockup */}
                <div className="h-full flex items-end gap-2">
                  {usageData.history.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-600 rounded-t"
                        style={{ height: `${(day.tokens / 25000) * 100}%` }}
                      ></div>
                      <div className={`text-xs mt-2 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {day.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Provider & Model Usage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Provider Usage */}
              <div className={`rounded-lg border p-4 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className="text-sm font-medium mb-4">Provider Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(usageData.providers).map(([provider, percentage]) => (
                    <div key={provider}>
                      <div className="flex items-center justify-between mb-1">
                        <span>{provider}</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className={`h-2 w-full rounded-full ${
                        isDark ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div 
                          className={`h-2 rounded-full ${
                            provider === 'OpenAI' ? 'bg-green-500' :
                            provider === 'Anthropic' ? 'bg-purple-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Usage */}
              <div className={`rounded-lg border p-4 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className="text-sm font-medium mb-4">Model Usage</h3>
                <div className="space-y-3">
                  {Object.entries(usageData.models).map(([model, percentage]) => (
                    <div key={model}>
                      <div className="flex items-center justify-between mb-1">
                        <span>{model}</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className={`h-2 w-full rounded-full ${
                        isDark ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div 
                          className={`h-2 rounded-full ${
                            model.includes('gpt-4') ? 'bg-green-500' :
                            model.includes('gpt-3.5') ? 'bg-blue-500' :
                            model.includes('claude-3-opus') ? 'bg-purple-500' :
                            model.includes('claude-3-sonnet') ? 'bg-pink-500' :
                            model.includes('gemini') ? 'bg-yellow-500' : 'bg-gray-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Subscription Tier */}
            <div className={`rounded-lg border p-4 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Your Subscription</h3>
                <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
                  Upgrade Plan
                </button>
              </div>
              
              <div className="flex items-center">
                <div className={`rounded-lg p-4 mr-6 ${
                  isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-100'
                }`}>
                  <div className="text-lg font-bold text-blue-500 mb-1">
                    <span className="text-base">Free Tier</span>
                  </div>
                  <div className={`text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Current Plan
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap size={14} className="text-blue-500" />
                    <span><span className="font-medium">10,000</span> daily tokens</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={14} className="text-blue-500" />
                    <span><span className="font-medium">100</span> daily requests</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-blue-500" />
                    <span><span className="font-medium">30-day</span> history</span>
                  </div>
                </div>
              </div>
              
              <div className={`mt-4 rounded p-3 ${
                isDark ? 'bg-gray-750 border border-gray-700' : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-start gap-3">
                  <TrendingUp size={16} className="text-green-500 mt-0.5" />
                  <div>
                    <div className={`text-sm font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Pro Tier Recommended
                    </div>
                    <div className={`text-xs mt-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Based on your usage, upgrading to Pro would give you 5x more tokens and access to advanced models.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className={`rounded-lg border p-4 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-sm font-medium mb-3">Cost Breakdown</h3>
              <div className={`rounded-lg p-3 mb-4 ${
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">This Month to Date</span>
                  <span className="text-base font-bold">${usageData.cost.monthly.toFixed(2)}</span>
                </div>
                <div className={`text-xs ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Current billing period: July 1 - July 31, 2025
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                  <span className="font-medium">Item</span>
                  <span className="font-medium">Cost</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span>OpenAI GPT-4</span>
                    </div>
                    <div className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      45,230 tokens @ $0.06/1K output, $0.03/1K input
                    </div>
                  </div>
                  <span>$6.12</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span>OpenAI GPT-3.5 Turbo</span>
                    </div>
                    <div className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      32,450 tokens @ $0.002/1K output, $0.0015/1K input
                    </div>
                  </div>
                  <span>$0.24</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span>Anthropic Claude 3 Opus</span>
                    </div>
                    <div className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      28,400 tokens @ $0.075/1K output, $0.015/1K input
                    </div>
                  </div>
                  <span>$3.64</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span>Anthropic Claude 3 Sonnet</span>
                    </div>
                    <div className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      15,200 tokens @ $0.015/1K output, $0.003/1K input
                    </div>
                  </div>
                  <span>$0.48</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span>Google Gemini Pro</span>
                    </div>
                    <div className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      3,250 tokens @ $0.0005/1K output, $0.00025/1K input
                    </div>
                  </div>
                  <span>$0.08</span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className={`rounded-lg border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="p-3 border-b border-gray-700">
                <h3 className="text-sm font-medium">Cost Optimization Recommendations</h3>
              </div>
              <div className="p-3 space-y-3">
                <div className={`rounded-lg p-3 flex items-start gap-3 ${
                  isDark ? 'bg-blue-900/20' : 'bg-blue-50'
                }`}>
                  <Shield size={16} className="text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-xs">Use GPT-3.5 Turbo for simpler tasks</h4>
                    <p className={`text-xs mt-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      You could save approximately $4.30 per month by using GPT-3.5 Turbo instead of GPT-4 for simpler code generation tasks.
                    </p>
                  </div>
                </div>
                
                <div className={`rounded-lg p-3 flex items-start gap-3 ${
                  isDark ? 'bg-green-900/20' : 'bg-green-50'
                }`}>
                  <TrendingUp size={16} className="text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-xs">Implement token caching</h4>
                    <p className={`text-xs mt-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Caching similar AI requests could reduce your token usage by approximately 15-20%.
                    </p>
                  </div>
                </div>
                
                <div className={`rounded-lg p-3 flex items-start gap-3 ${
                  isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'
                }`}>
                  <AlertTriangle size={16} className="text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-xs">Approaching daily token limit</h4>
                    <p className={`text-xs mt-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      At your current usage rate, you will reach your daily token limit within the next 4 hours. Consider upgrading to the Pro tier.
                    </p>
                    <button className="mt-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                      Upgrade Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
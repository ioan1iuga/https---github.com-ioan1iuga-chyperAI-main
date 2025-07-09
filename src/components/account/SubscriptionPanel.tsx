import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle,
  Clock,
  Zap,
  Users,
  Database,
  Shield,
  Calendar,
  ArrowRight,
  DollarSign,
  Download,
  Globe,
  Upload,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface SubscriptionTier {
  id: string;
  name: string;
  displayName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: {
    projects: number;
    collaborators: number;
    deployments: number;
    tokens: { daily: number; monthly: number };
    requests: { daily: number; monthly: number };
  };
  recommended?: boolean;
}

const subscriptionTiers: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'free',
    displayName: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '3 projects',
      '1 collaborator',
      '5 deployments/month',
      'Community support',
      'Basic AI models',
      '30-day history'
    ],
    limits: {
      projects: 3,
      collaborators: 1,
      deployments: 5,
      tokens: { daily: 10000, monthly: 100000 },
      requests: { daily: 100, monthly: 1000 }
    }
  },
  {
    id: 'pro',
    name: 'pro',
    displayName: 'Professional',
    monthlyPrice: 29.99,
    yearlyPrice: 299.90,
    features: [
      '10 projects',
      '5 collaborators',
      '20 deployments/month',
      'Priority support',
      'All AI models',
      '6-month history',
      'Custom domains',
      'Private repositories'
    ],
    limits: {
      projects: 10,
      collaborators: 5,
      deployments: 20,
      tokens: { daily: 50000, monthly: 1000000 },
      requests: { daily: 500, monthly: 10000 }
    },
    recommended: true
  },
  {
    id: 'team',
    name: 'team',
    displayName: 'Team',
    monthlyPrice: 99.99,
    yearlyPrice: 999.90,
    features: [
      '50 projects',
      '20 collaborators',
      '100 deployments/month',
      'Priority support',
      'All AI models',
      '1-year history',
      'Custom domains',
      'Private repositories',
      'Team management',
      'Advanced analytics',
      'Audit logs'
    ],
    limits: {
      projects: 50,
      collaborators: 20,
      deployments: 100,
      tokens: { daily: 200000, monthly: 5000000 },
      requests: { daily: 2000, monthly: 50000 }
    }
  },
  {
    id: 'enterprise',
    name: 'enterprise',
    displayName: 'Enterprise',
    monthlyPrice: 499.99,
    yearlyPrice: 4999.90,
    features: [
      'Unlimited projects',
      'Unlimited collaborators',
      'Unlimited deployments',
      'Dedicated support',
      'All AI models',
      'Unlimited history',
      'Custom domains',
      'Private repositories',
      'Advanced team management',
      'Custom analytics',
      'Detailed audit logs',
      'SLA guarantee',
      'SSO integration',
      'Custom AI model integration'
    ],
    limits: {
      projects: -1, // Unlimited
      collaborators: -1, // Unlimited
      deployments: -1, // Unlimited
      tokens: { daily: 1000000, monthly: 20000000 },
      requests: { daily: 10000, monthly: 300000 }
    }
  }
];

interface SubscriptionPanelProps {
  currentTier?: string;
}

export const SubscriptionPanel: React.FC<SubscriptionPanelProps> = ({ 
  currentTier = 'free'
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [expandedTier, setExpandedTier] = useState<string | null>('pro');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const toggleExpand = (tierId: string) => {
    setExpandedTier(expandedTier === tierId ? null : tierId);
  };

  const handleUpgrade = (tierId: string) => {
    setSelectedTier(tierId);
    setIsUpgrading(true);
  };

  const currentTierObj = subscriptionTiers.find(tier => tier.id === currentTier);

  const savingsPercentage = (tier: SubscriptionTier) => {
    return Math.round(100 - (tier.yearlyPrice / (tier.monthlyPrice * 12)) * 100);
  };

  const formatLimitValue = (value: number) => {
    if (value === -1) return 'Unlimited';
    return value.toLocaleString();
  };

  return (
    <div className={`h-full flex flex-col ${
      isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
    }`}>
      {/* Header */}
      <div className={`p-6 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold mb-2">Subscription & Billing</h2>
            <p className={`text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Manage your subscription and view billing history
            </p>
          </div>
          
          <div className="flex flex-col items-end">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              <div className="flex items-center gap-1">
                <span className="font-bold">{currentTierObj?.displayName}</span>
                <span>Plan</span>
              </div>
            </div>
            <a href="#billing-history" className="text-sm text-blue-500 hover:underline mt-2">
              View billing history
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Current Plan Overview */}
          <div className={`rounded-lg border p-5 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold mb-1">{currentTierObj?.displayName} Plan</h3>
                <p className={`text-xs ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Your subscription renews on August 1, 2025
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  currentTier === 'free' ? 'hidden' : (
                    isDark 
                      ? 'border-gray-600 hover:bg-gray-700' 
                      : 'border-gray-300 hover:bg-gray-100'
                  )
                }`}>
                  Cancel Plan
                </button>
                {currentTier !== 'enterprise' && (
                  <button 
                    onClick={() => setIsUpgrading(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Upgrade Plan
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className={`rounded-lg p-4 ${
                isDark ? 'bg-gray-750' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={18} className="text-blue-500" />
                  <span className="font-medium">Usage Limits</span>
                </div>
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Daily Tokens</span>
                    <span className="text-sm font-medium">{currentTierObj?.limits.tokens.daily.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Monthly Tokens</span>
                    <span className="text-sm font-medium">{currentTierObj?.limits.tokens.monthly.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Daily Requests</span>
                    <span className="text-sm font-medium">{currentTierObj?.limits.requests.daily}</span>
                  </div>
                </div>
              </div>
              
              <div className={`rounded-lg p-4 ${
                isDark ? 'bg-gray-750' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Database size={18} className="text-purple-500" />
                  <span className="font-medium">Resource Limits</span>
                </div>
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Projects</span>
                    <span className="text-sm font-medium">{formatLimitValue(currentTierObj?.limits.projects || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Collaborators</span>
                    <span className="text-sm font-medium">{formatLimitValue(currentTierObj?.limits.collaborators || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Deployments/month</span>
                    <span className="text-sm font-medium">{formatLimitValue(currentTierObj?.limits.deployments || 0)}</span>
                  </div>
                </div>
              </div>
              
              <div className={`rounded-lg p-4 ${
                isDark ? 'bg-gray-750' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={18} className="text-green-500" />
                  <span className="font-medium">Billing Info</span>
                </div>
                <div className="space-y-1 mt-2">
                  {currentTier === 'free' ? (
                    <div className="text-sm">
                      You're currently on the Free plan with no billing information on file.
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm">Current Period</span>
                        <span className="text-sm">Jul 1 - Aug 1, 2025</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Payment Method</span>
                        <span className="text-sm">•••• 4242</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Next Invoice</span>
                        <span className="text-sm">${billingCycle === 'monthly' ? 
                          currentTierObj?.monthlyPrice.toFixed(2) : 
                          (currentTierObj?.yearlyPrice / 12).toFixed(2)
                        }</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Compare Plans */}
          <div className={`rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-base font-semibold">Compare Plans</h3>
              
              <div className="flex items-center justify-between mt-4">
                <p className={`${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Select the plan that's right for you
                </p>
                
                <div className={`flex items-center p-1 rounded-lg ${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <button 
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      billingCycle === 'monthly' 
                        ? 'bg-blue-600 text-white' 
                        : isDark 
                          ? 'text-gray-300 hover:text-white' 
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button 
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      billingCycle === 'yearly' 
                        ? 'bg-blue-600 text-white' 
                        : isDark 
                          ? 'text-gray-300 hover:text-white' 
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              {subscriptionTiers.map((tier) => (
                <div 
                  key={tier.id} 
                  className={`rounded-lg border transition-all ${
                    tier.recommended 
                      ? isDark 
                        ? 'border-blue-600' 
                        : 'border-blue-500'
                      : isDark 
                        ? 'border-gray-700' 
                        : 'border-gray-200'
                  } ${
                    currentTier === tier.id 
                      ? isDark 
                        ? 'bg-blue-900/10' 
                        : 'bg-blue-50'
                      : isDark 
                        ? 'bg-gray-750' 
                        : 'bg-white'
                  }`}
                >
                  {tier.recommended && (
                    <div className={`py-1.5 px-4 text-center text-sm font-medium ${
                      isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    } rounded-t-lg`}>
                      Recommended
                    </div>
                  )}
                  
                  <div className={`p-5 ${tier.recommended ? 'pt-4' : ''}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-semibold">{tier.displayName}</h4>
                          {currentTier === tier.id && (
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                              isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-700'
                            }`}>
                              <CheckCircle size={12} className="mr-1" />
                              Current Plan
                            </span>
                          )}
                        </div>
                        <p className={`mt-1 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {tier.limits.projects === -1 ? 'Unlimited' : tier.limits.projects} projects, {tier.limits.collaborators === -1 ? 'Unlimited' : tier.limits.collaborators} collaborators
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            ${billingCycle === 'monthly' ? tier.monthlyPrice.toFixed(2) : (tier.yearlyPrice / 12).toFixed(2)}
                          </div>
                          <div className="text-xs">
                            per month{billingCycle === 'yearly' && ', billed annually'}
                          </div>
                          {billingCycle === 'yearly' && (
                            <div className={`text-xs mt-1 ${
                              isDark ? 'text-green-400' : 'text-green-600'
                            }`}>
                              Save {savingsPercentage(tier)}%
                            </div>
                          )}
                        </div>
                        
                        <div>
                          {currentTier === tier.id ? (
                            <span className={`inline-block px-4 py-2 rounded-lg text-sm ${
                              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}>
                              Current Plan
                            </span>
                          ) : (
                            <button
                              onClick={() => handleUpgrade(tier.id)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                tier.id === 'free' 
                                  ? isDark 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              {tier.id === 'free' && currentTier !== 'free' ? 'Downgrade' : 'Select Plan'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className="flex items-center gap-2 mt-4 cursor-pointer"
                      onClick={() => toggleExpand(tier.id)}
                    >
                      <span className="text-sm font-medium">
                        {expandedTier === tier.id ? 'Hide details' : 'Show details'}
                      </span>
                      {expandedTier === tier.id ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </div>
                    
                    {expandedTier === tier.id && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h5 className="font-medium mb-2">Usage Limits</h5>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-sm">
                              <Zap size={14} className="text-blue-500" />
                              <span>{tier.limits.tokens.daily.toLocaleString()} daily tokens</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                              <Zap size={14} className="text-blue-500" />
                              <span>{tier.limits.tokens.monthly.toLocaleString()} monthly tokens</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                              <Users size={14} className="text-blue-500" />
                              <span>{tier.limits.requests.daily} daily requests</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                              <Users size={14} className="text-blue-500" />
                              <span>{tier.limits.requests.monthly} monthly requests</span>
                            </li>
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-medium mb-2">Resource Limits</h5>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-sm">
                              <Database size={14} className="text-purple-500" />
                              <span>{formatLimitValue(tier.limits.projects)} projects</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                              <Users size={14} className="text-purple-500" />
                              <span>{formatLimitValue(tier.limits.collaborators)} collaborators</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                              <Upload size={14} className="text-purple-500" />
                              <span>{formatLimitValue(tier.limits.deployments)} deployments/month</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                              <Globe size={14} className="text-purple-500" />
                              <span>{tier.id === 'free' ? 'No' : 'Custom'} domains</span>
                            </li>
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-medium mb-2">Features</h5>
                          <ul className="space-y-2">
                            {tier.features.slice(4, 12).map((feature, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircle size={14} className="text-green-500" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Billing History */}
          <div id="billing-history" className={`rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-sm font-semibold">Billing History</h3>
            </div>
            
            <div className="p-5">
              {currentTier === 'free' ? (
                <div className={`text-center py-8 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <Clock size={48} className="mx-auto mb-3 opacity-70" />
                  <p className="text-lg font-medium mb-1">No billing history</p>
                  <p>You're currently on the Free plan with no billing history.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`${
                        isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'
                      }`}>
                        <th className="pb-3 text-left">Date</th>
                        <th className="pb-3 text-left">Description</th>
                        <th className="pb-3 text-right">Amount</th>
                        <th className="pb-3 text-right">Status</th>
                        <th className="pb-3 text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      <tr>
                        <td className="py-4">Jul 1, 2025</td>
                        <td className="py-4">{currentTierObj?.displayName} Plan - Monthly</td>
                        <td className="py-4 text-right">${currentTierObj?.monthlyPrice.toFixed(2)}</td>
                        <td className="py-4 text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                            isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-700'
                          }`}>
                            <CheckCircle size={12} className="mr-1" />
                            Paid
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-400">
                            <Download size={14} />
                            PDF
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4">Jun 1, 2025</td>
                        <td className="py-4">{currentTierObj?.displayName} Plan - Monthly</td>
                        <td className="py-4 text-right">${currentTierObj?.monthlyPrice.toFixed(2)}</td>
                        <td className="py-4 text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                            isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-700'
                          }`}>
                            <CheckCircle size={12} className="mr-1" />
                            Paid
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-400">
                            <Download size={14} />
                            PDF
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4">May 1, 2025</td>
                        <td className="py-4">{currentTierObj?.displayName} Plan - Monthly</td>
                        <td className="py-4 text-right">${currentTierObj?.monthlyPrice.toFixed(2)}</td>
                        <td className="py-4 text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                            isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-700'
                          }`}>
                            <CheckCircle size={12} className="mr-1" />
                            Paid
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-400">
                            <Download size={14} />
                            PDF
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Plan Modal */}
      {isUpgrading && selectedTier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-full max-w-2xl p-6 rounded-lg shadow-xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-lg font-bold mb-4">
              Upgrade to {subscriptionTiers.find(t => t.id === selectedTier)?.displayName}
            </h2>
            
            <div className={`p-4 rounded-lg mb-5 ${
              isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-100'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${
                  isDark ? 'bg-blue-600' : 'bg-blue-100'
                }`}>
                  <CreditCard size={20} className="text-blue-500" />
                </div>
                <div>
                  <div className="text-sm font-medium">Payment Information</div>
                  <div className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Secure payment processing via Stripe
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-750 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Card Number</label>
                  <input 
                    type="text" 
                    className={`w-full px-4 py-2 rounded-lg ${
                      isDark 
                        ? 'bg-gray-700 border border-gray-600 text-white' 
                        : 'bg-white border border-gray-300 text-gray-900'
                    } focus:outline-none focus:border-blue-500`}
                    placeholder="4242 4242 4242 4242"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Expiry Date</label>
                    <input 
                      type="text" 
                      className={`w-full px-4 py-2 rounded-lg ${
                        isDark 
                          ? 'bg-gray-700 border border-gray-600 text-white' 
                          : 'bg-white border border-gray-300 text-gray-900'
                      } focus:outline-none focus:border-blue-500`}
                      placeholder="MM / YY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CVC</label>
                    <input 
                      type="text" 
                      className={`w-full px-4 py-2 rounded-lg ${
                        isDark 
                          ? 'bg-gray-700 border border-gray-600 text-white' 
                          : 'bg-white border border-gray-300 text-gray-900'
                      } focus:outline-none focus:border-blue-500`}
                      placeholder="123"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Cardholder Name</label>
                  <input 
                    type="text" 
                    className={`w-full px-4 py-2 rounded-lg ${
                      isDark 
                        ? 'bg-gray-700 border border-gray-600 text-white' 
                        : 'bg-white border border-gray-300 text-gray-900'
                    } focus:outline-none focus:border-blue-500`}
                    placeholder="John Smith"
                  />
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg mb-5 ${
              isDark ? 'bg-gray-750 border border-gray-700' : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex justify-between mb-2">
                <span>{subscriptionTiers.find(t => t.id === selectedTier)?.displayName} Plan ({billingCycle})</span>
                <span>${
                  billingCycle === 'monthly'
                    ? subscriptionTiers.find(t => t.id === selectedTier)?.monthlyPrice.toFixed(2)
                    : subscriptionTiers.find(t => t.id === selectedTier)?.yearlyPrice.toFixed(2)
                }</span>
              </div>
              {billingCycle === 'yearly' && (
                <div className="flex justify-between mb-2 text-sm">
                  <span>Yearly discount ({savingsPercentage(subscriptionTiers.find(t => t.id === selectedTier)!)}%)</span>
                  <span className="text-green-500">-${(
                    subscriptionTiers.find(t => t.id === selectedTier)!.monthlyPrice * 12 - 
                    subscriptionTiers.find(t => t.id === selectedTier)!.yearlyPrice
                  ).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-700 mt-3 pt-3 flex justify-between font-bold">
                <span>Total {billingCycle === 'yearly' ? 'per year' : 'per month'}</span>
                <span>${
                  billingCycle === 'monthly'
                    ? subscriptionTiers.find(t => t.id === selectedTier)?.monthlyPrice.toFixed(2)
                    : subscriptionTiers.find(t => t.id === selectedTier)?.yearlyPrice.toFixed(2)
                }</span>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg mb-5 ${
              isDark ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-100'
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-yellow-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Subscription Terms</div>
                  <div className={`text-xs ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    By upgrading, you agree to our terms of service and will be charged ${
                      billingCycle === 'monthly'
                        ? subscriptionTiers.find(t => t.id === selectedTier)?.monthlyPrice.toFixed(2)
                        : subscriptionTiers.find(t => t.id === selectedTier)?.yearlyPrice.toFixed(2)
                    } {billingCycle === 'yearly' ? 'per year' : 'per month'}.
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setIsUpgrading(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
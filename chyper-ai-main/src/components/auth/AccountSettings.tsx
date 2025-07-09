import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { ProfileManagement } from './ProfileManagement';
import { useTheme } from '../../contexts/ThemeContext';
import { User, Bell, Shield, CreditCard } from 'lucide-react';

export const AccountSettings: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <h1 className={`text-lg font-bold mb-6 ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>
        Account Settings
      </h1>
      
      <div className={`rounded-lg border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="sm:flex">
          <div className={`sm:w-64 border-b sm:border-b-0 sm:border-r ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="p-4">
              <nav className="flex sm:flex-col gap-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <User size={16} />
                  <span>Profile</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                    activeTab === 'security'
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Shield size={16} />
                  <span>Security</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                    activeTab === 'notifications'
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Bell size={16} />
                  <span>Notifications</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('billing')}
                  className={`px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                    activeTab === 'billing'
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <CreditCard size={16} />
                  <span>Billing</span>
                </button>
              </nav>
            </div>
          </div>
          
          <div className="flex-1 p-6">
            {activeTab === 'profile' && <ProfileManagement />}
            
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className={`text-lg font-semibold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Security Settings</h2>
                
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <h3 className="text-base font-medium mb-4">Two-Factor Authentication</h3>
                  <p className={`text-sm mb-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">
                    Enable 2FA
                  </button>
                </div>
                
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <h3 className="text-base font-medium mb-4">Active Sessions</h3>
                  <div className={`rounded-lg border overflow-hidden ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Device
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Last Active
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${
                        isDark ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'
                      }`}>
                        <tr>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="font-medium">Chrome on Windows</span>
                              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-600/20 text-green-400">
                                Current
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            New York, USA
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            Now
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <button className="text-red-500 hover:text-red-600">
                              Sign Out
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="font-medium">Safari on macOS</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            London, UK
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            2 days ago
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <button className="text-red-500 hover:text-red-600">
                              Sign Out
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <button className="mt-4 px-4 py-2 text-red-500 hover:text-red-600 text-sm font-medium">
                    Sign out from all devices
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div>
                <h2 className={`text-lg font-semibold mb-6 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Notification Preferences</h2>
                
                <div className={`rounded-lg border overflow-hidden ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <div className={`divide-y ${
                    isDark ? 'divide-gray-700' : 'divide-gray-200'
                  }`}>
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`text-sm font-medium ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>Email Notifications</h3>
                          <p className={`text-xs mt-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Receive email updates about your account activity
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`text-sm font-medium ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>Push Notifications</h3>
                          <p className={`text-xs mt-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Receive push notifications on your device
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`text-sm font-medium ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>Desktop Notifications</h3>
                          <p className={`text-xs mt-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Receive notifications on your desktop
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'billing' && (
              <div>
                <h2 className={`text-lg font-semibold mb-6 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Billing & Subscription</h2>
                
                <div className={`p-6 rounded-lg border mb-6 ${
                  isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-base font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Current Plan
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'
                    }`}>
                      Free Tier
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    You're currently on the free plan. Upgrade to unlock more features and increase your usage limits.
                  </p>
                  
                  <div className="flex">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm">
                      Upgrade Plan
                    </button>
                  </div>
                </div>
                
                <div className={`p-6 rounded-lg border ${
                  isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <h3 className={`text-base font-medium mb-4 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Payment Methods
                  </h3>
                  
                  <div className={`p-6 rounded-lg border border-dashed flex items-center justify-center ${
                    isDark ? 'border-gray-600' : 'border-gray-300'
                  }`}>
                    <div className="text-center">
                      <CreditCard size={24} className={`mx-auto mb-2 ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <p className={`text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        No payment methods
                      </p>
                      <p className={`text-xs mt-1 ${
                        isDark ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        Add a payment method when you upgrade
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
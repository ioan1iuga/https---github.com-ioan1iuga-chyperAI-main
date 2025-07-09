import React from 'react';
import { Server, Database, Cloud, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const SystemStatus: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const services = [
    { name: 'WebContainer', status: 'online', icon: Server },
    { name: 'Database', status: 'online', icon: Database },
    { name: 'Deployment', status: 'online', icon: Cloud },
    { name: 'AI Services', status: 'warning', icon: Activity },
  ];

  return (
    <div className={`rounded-lg p-4 border ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-base font-semibold mb-3 ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>System Status</h3>
      <div className="space-y-3">
        {services.map((service) => (
          <div key={service.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <service.icon size={14} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
              <span className={`text-xs ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>{service.name}</span>
            </div>
            <div className="flex items-center gap-1">
              {service.status === 'online' ? (
                <CheckCircle size={14} className="text-green-500" />
              ) : (
                <AlertCircle size={14} className="text-yellow-500" />
              )}
              <span className={`text-xs ${
                service.status === 'online' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {service.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
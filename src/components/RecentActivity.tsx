import React from 'react';
import { Clock, GitCommit, Reply as Deploy, Database, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const RecentActivity: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const activities = [
    {
      id: 1,
      type: 'commit',
      message: 'Added new authentication flow',
      project: 'E-commerce App',
      time: '2 minutes ago',
      icon: GitCommit,
      color: 'text-green-400'
    },
    {
      id: 2,
      type: 'deploy',
      message: 'Deployed to production',
      project: 'Portfolio Site',
      time: '15 minutes ago',
      icon: Deploy,
      color: 'text-blue-400'
    },
    {
      id: 3,
      type: 'database',
      message: 'Updated user schema',
      project: 'Task Manager',
      time: '1 hour ago',
      icon: Database,
      color: 'text-purple-400'
    },
    {
      id: 4,
      type: 'user',
      message: 'New team member joined',
      project: 'Organization',
      time: '2 hours ago',
      icon: User,
      color: 'text-orange-400'
    },
  ];

  return (
    <div className={`rounded-lg p-4 border ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-base font-semibold mb-3 ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <activity.icon size={14} className={`mt-0.5 ${activity.color}`} />
            <div className="flex-1">
              <p className={`text-xs ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>{activity.message}</p>
              <div className={`flex items-center gap-2 text-xs mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <span>{activity.project}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock size={10} />
                  <span>{activity.time}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  LogOut, 
  Settings, 
  Bell, 
  Shield, 
  HelpCircle, 
  ChevronUp,
  UserCircle
} from 'lucide-react';
import { useEnhancedAuth } from '../contexts/EnhancedAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';

export const SidebarUserAccount: React.FC = () => {
  const { user, profile, signOut, isAuthenticated } = useEnhancedAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className={`p-3 relative ${isDark ? 'border-gray-700' : 'border-gray-200'} border-t`}>
      <div
        ref={dropdownRef}
        className={`w-full rounded-lg transition-all cursor-pointer ${
          isOpen
            ? isDark 
              ? 'bg-gray-700' 
              : 'bg-gray-100'
            : isDark 
              ? 'hover:bg-gray-700' 
              : 'hover:bg-gray-100'
        }`}
      >
        <div 
          className="flex items-center gap-3 p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isAuthenticated && profile ? (
            <>
              <div className="flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-gray-600' : 'bg-gray-300'
                  }`}>
                    <span className={`font-medium text-sm ${
                      isDark ? 'text-white' : 'text-gray-700'
                    }`}>
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm truncate ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {profile.name}
                </div>
                <div className={`text-xs truncate ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {profile.email}
                </div>
              </div>
              <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                <ChevronUp size={16} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center w-full gap-2 py-1">
              <User size={16} />
              <span className="font-medium text-sm">Sign In</span>
            </div>
          )}
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="pt-2 pb-1 px-1">
            {isAuthenticated ? (
              <div className="space-y-1">
                <Link
                  to="/account"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isDark 
                      ? 'hover:bg-gray-600' 
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <UserCircle size={16} />
                  <span>Profile</span>
                </Link>
                
                <Link
                  to="/account"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isDark 
                      ? 'hover:bg-gray-600' 
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <Settings size={16} />
                  <span>Account Settings</span>
                </Link>
                
                <Link
                  to="/account"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isDark 
                      ? 'hover:bg-gray-600' 
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <Bell size={16} />
                  <span>Notifications</span>
                </Link>
                
                <Link
                  to="/account"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isDark 
                      ? 'hover:bg-gray-600' 
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <Shield size={16} />
                  <span>Security</span>
                </Link>
                
                <Link
                  to="/help"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isDark
                      ? 'hover:bg-gray-600'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <HelpCircle size={16} />
                  <span>Help & Support</span>
                </Link>

                <Link
                  to="/auth/debug"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isDark
                      ? 'hover:bg-gray-600 text-yellow-400 hover:text-yellow-300'
                      : 'hover:bg-gray-200 text-yellow-600 hover:text-yellow-700'
                  }`}
                >
                  <Shield size={16} />
                  <span>Auth Debug</span>
                </Link>
                
                <div className={`my-1 border-t ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                }`}></div>
                
                <button
                  onClick={handleSignOut}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm w-full text-left transition-colors ${
                    isDark 
                      ? 'hover:bg-gray-600 text-red-400 hover:text-red-300' 
                      : 'hover:bg-gray-200 text-red-600 hover:text-red-700'
                  }`}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isDark 
                      ? 'hover:bg-gray-600' 
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <UserCircle size={16} />
                  <span>Sign In</span>
                </Link>
                
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isDark 
                      ? 'hover:bg-gray-600' 
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <UserCircle size={16} />
                  <span>Create Account</span>
                </Link>
                
                <Link
                  to="/help"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isDark 
                      ? 'hover:bg-gray-600' 
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <HelpCircle size={16} />
                  <span>Help & Support</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
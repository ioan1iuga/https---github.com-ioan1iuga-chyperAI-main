import React from 'react';
import AuthDebug from '../../components/auth/AuthDebug';

/**
 * AuthDebugPage component
 * This page is protected and only accessible to authenticated users
 * It renders the AuthDebug component for debugging authentication issues
 */
const AuthDebugPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        Authentication Debugging
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
        Use this page to debug authentication issues and test session management functionality.
      </p>
      
      <AuthDebug />
    </div>
  );
};

export default AuthDebugPage;
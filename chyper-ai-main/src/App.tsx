import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { Dashboard } from './components/Dashboard';
import { Workbench } from './components/Workbench';
import MasterChatAgentFull from './components/MasterChatAgentFull';
import { Projects } from './components/Projects';
import { ProjectsProvider } from './contexts/ProjectsContext';
import { AgentProvider } from './contexts/AgentContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AIProvider from './contexts/AIContext';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { ForgotPasswordPage } from './pages/Auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/Auth/ResetPasswordPage';
import { SupabaseErrorPage } from './pages/Auth/SupabaseErrorPage';
import { AuthCallbackHandler } from './components/auth/AuthCallbackHandler';
import { DatabaseErrorPage } from './pages/DatabaseErrorPage';
import { AccountSettings } from './components/auth/AccountSettings';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

interface PinnedProject {
  id: string;
  name: string;
  framework: string;
}

function App() {
  const [, setCurrentView] = useState<'dashboard' | 'workbench' | 'projects'>('dashboard');
  const [pinnedProjects, setPinnedProjects] = useState<PinnedProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<string>('code');

  const handleProjectSelect = (projectId: string, projectName: string, projectFramework: string) => {
    // Check if project is already pinned
    const isAlreadyPinned = pinnedProjects.some(p => p.id === projectId);
    
    if (!isAlreadyPinned) {
      // Add to pinned projects
      const newPinnedProject: PinnedProject = {
        id: projectId,
        name: projectName,
        framework: projectFramework
      };
      setPinnedProjects(prev => [...prev, newPinnedProject]);
    }
    
    // Set as active project
    setActiveProjectId(projectId);
    setCurrentView('workbench');
  };

  const handleCloseProject = (projectId: string) => {
    setPinnedProjects(prev => prev.filter(p => p.id !== projectId));
    
    // If closing the active project, switch to another or go to dashboard
    if (activeProjectId === projectId) {
      const remainingProjects = pinnedProjects.filter(p => p.id !== projectId);
      if (remainingProjects.length > 0) {
        setActiveProjectId(remainingProjects[0].id);
      } else {
        setActiveProjectId(null);
        setCurrentView('dashboard');
      }
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <ProjectsProvider>
          <AgentProvider>
            <AIProvider>
              <Routes>
                {/* Error Routes */}
                <Route path="/error/supabase" element={<SupabaseErrorPage />} />
                <Route path="/error/database" element={<DatabaseErrorPage />} />
                <Route path="/auth/callback" element={<AuthCallbackHandler />} />
                
                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                
                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <MainLayout
                        currentView="dashboard"
                        onViewChange={setCurrentView}
                        pinnedProjects={pinnedProjects}
                        activeProjectId={activeProjectId}
                      >
                        <Dashboard onProjectSelect={handleProjectSelect} />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/projects"
                  element={
                    <ProtectedRoute>
                      <MainLayout
                        currentView="projects"
                        onViewChange={setCurrentView}
                        pinnedProjects={pinnedProjects}
                        activeProjectId={activeProjectId}
                      >
                        <Projects onProjectSelect={handleProjectSelect} />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/workbench"
                  element={
                    <ProtectedRoute>
                      <MainLayout
                        currentView="workbench"
                        onViewChange={setCurrentView}
                        pinnedProjects={pinnedProjects}
                        activeProjectId={activeProjectId}
                      >
                        <Workbench
                          pinnedProjects={pinnedProjects}
                          activeProjectId={activeProjectId}
                          onProjectChange={setActiveProjectId}
                          onCloseProject={handleCloseProject}
                          onSelectProject={handleProjectSelect}
                          activePanel={activePanel}
                          onPanelChange={setActivePanel}
                          onBackToDashboard={() => setCurrentView('dashboard')}
                        />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <MainLayout
                        currentView="dashboard"
                        onViewChange={setCurrentView}
                        pinnedProjects={pinnedProjects}
                        activeProjectId={activeProjectId}
                      >
                        <AccountSettings />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                
                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                
                {/* Full Screen Master Chat Agent route */}
                <Route
                  path="/master-chat"
                  element={
                    <ProtectedRoute>
                      <MasterChatAgentFull />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </AIProvider>
          </AgentProvider>
        </ProjectsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
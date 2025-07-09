import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface AgentSession {
  id: string;
  projectId: string;
  name: string;
  type: 'code' | 'debug' | 'deploy' | 'general';
  status: 'active' | 'inactive';
  lastActivity: Date;
}

interface AgentContextType {
  sessions: AgentSession[];
  createSession: (projectId: string, type: AgentSession['type']) => AgentSession;
  updateSession: (id: string, updates: Partial<AgentSession>) => void;
  deleteSession: (id: string) => void;
  getSessionsByProject: (projectId: string) => AgentSession[];
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};

export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<AgentSession[]>([]);

  const createSession = (projectId: string, type: AgentSession['type']): AgentSession => {
    const newSession: AgentSession = {
      id: uuidv4(),
      projectId,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Agent`,
      type,
      status: 'active',
      lastActivity: new Date()
    };
    
    setSessions(prev => [...prev, newSession]);
    return newSession;
  };

  const updateSession = (id: string, updates: Partial<AgentSession>) => {
    setSessions(prev => prev.map(session => 
      session.id === id ? { ...session, ...updates } : session
    ));
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(session => session.id !== id));
  };

  const getSessionsByProject = (projectId: string) => {
    return sessions.filter(session => session.projectId === projectId);
  };

  return (
    <AgentContext.Provider value={{
      sessions,
      createSession,
      updateSession,
      deleteSession,
      getSessionsByProject
    }}>
      {children}
    </AgentContext.Provider>
  );
};
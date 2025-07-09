import React, { createContext, useContext, useState, ReactNode } from 'react';

const AIContext = createContext<any>(null);

export const useAI = () => useContext(AIContext);

export const AIProvider = ({ children }: { children: ReactNode }) => {
  const [aiState, setAIState] = useState({});

  const value = { aiState, setAIState };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};

export default AIProvider;
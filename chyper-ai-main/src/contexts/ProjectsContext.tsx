import React, { createContext, useContext, useState, ReactNode } from 'react';

const ProjectsContext = createContext<any>(null);

export const useProjects = () => useContext(ProjectsContext);

export const ProjectsProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState([]);

  const value = { projects, setProjects };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
};
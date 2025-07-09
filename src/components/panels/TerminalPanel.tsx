import React, { useState, useRef, useEffect } from 'react';
import { Terminal, X, Plus, Settings, Copy } from 'lucide-react';

import { useTheme } from '../../contexts/ThemeContext';

interface TerminalSession {
  id: string;
  name: string;
  history: TerminalLine[];
  currentPath: string;
}

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

export const TerminalPanel: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [sessions, setSessions] = useState<TerminalSession[]>([
    {
      id: '1',
      name: 'Terminal 1',
      history: [
        {
          id: '1',
          type: 'output',
          content: 'Welcome to ChyperAI Terminal',
          timestamp: new Date()
        },
        {
          id: '2',
          type: 'input',
          content: '$ npm run dev',
          timestamp: new Date()
        },
        {
          id: '3',
          type: 'output',
          content: '> dev\n> vite\n\n  Local:   http://localhost:5173/\n  Network: use --host to expose',
          timestamp: new Date()
        }
      ],
      currentPath: '/home/project'
    }
  ]);

  const [activeSessionId, setActiveSessionId] = useState('1');
  const [currentInput, setCurrentInput] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [activeSession?.history]);

  const handleCommand = (command: string) => {
    if (!activeSession) return;

    // Add input to history
    const inputLine: TerminalLine = {
      id: Date.now().toString(),
      type: 'input',
      content: `$ ${command}`,
      timestamp: new Date()
    };

    let outputLine: TerminalLine;

    // Simulate command execution
    switch (command.trim()) {
      case 'ls':
        outputLine = {
          id: (Date.now() + 1).toString(),
          type: 'output',
          content: 'backend/  frontend/  package.json  README.md  src/',
          timestamp: new Date()
        };
        break;
      case 'pwd':
        outputLine = {
          id: (Date.now() + 1).toString(),
          type: 'output',
          content: activeSession.currentPath,
          timestamp: new Date()
        };
        break;
      case 'clear':
        setSessions(prev => prev.map(session => 
          session.id === activeSessionId 
            ? { ...session, history: [] }
            : session
        ));
        setCurrentInput('');
        return;
      case '':
        outputLine = {
          id: (Date.now() + 1).toString(),
          type: 'output',
          content: '',
          timestamp: new Date()
        };
        break;
      default:
        if (command.startsWith('cd ')) {
          const newPath = command.substring(3).trim();
          outputLine = {
            id: (Date.now() + 1).toString(),
            type: 'output',
            content: '',
            timestamp: new Date()
          };
          // Update current path
          setSessions(prev => prev.map(session => 
            session.id === activeSessionId 
              ? { ...session, currentPath: newPath }
              : session
          ));
        } else {
          outputLine = {
            id: (Date.now() + 1).toString(),
            type: 'error',
            content: `Command not found: ${command}`,
            timestamp: new Date()
          };
        }
    }

    setSessions(prev => prev.map(session => 
      session.id === activeSessionId 
        ? { 
            ...session, 
            history: [...session.history, inputLine, outputLine] 
          }
        : session
    ));

    setCurrentInput('');
  };

  const createNewSession = () => {
    const newSession: TerminalSession = {
      id: Date.now().toString(),
      name: `Terminal ${sessions.length + 1}`,
      history: [
        {
          id: '1',
          type: 'output',
          content: 'New terminal session started',
          timestamp: new Date()
        }
      ],
      currentPath: '/home/project'
    };
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
  };

  const closeSession = (sessionId: string) => {
    if (sessions.length === 1) return; // Don't close the last session
    
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(sessions.find(s => s.id !== sessionId)?.id || '');
    }
  };

  const getLineColor = (type: string) => {
    switch (type) {
      case 'input': return 'text-blue-400';
      case 'error': return 'text-red-400';
      case 'output': return 'text-gray-300';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className={`h-full flex flex-col ${
      isDark ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className={`flex items-center border-b ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-gray-100 border-gray-200'
      }`}>
        <div className="flex-1 flex items-center overflow-x-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`flex items-center gap-2 px-3 py-2 border-r border-gray-700 cursor-pointer transition-colors ${
                activeSessionId === session.id
                  ? isDark 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-white text-gray-900'
                  : isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-750'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setActiveSessionId(session.id)}
            >
              <Terminal size={14} />
              <span className={`text-sm ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>{session.name}</span>
              {sessions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSession(session.id);
                  }}
                  className={`p-0.5 rounded transition-colors ${
                    isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-300'
                  }`}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-1 px-3">
          <button
            onClick={createNewSession}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="New Terminal"
          >
            <Plus size={16} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
          </button>
          <button className={`p-1 rounded transition-colors ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}>
            <Copy size={16} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
          </button>
          <button className={`p-1 rounded transition-colors ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}>
            <Settings size={16} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div ref={terminalRef} className="flex-1 overflow-auto p-4 font-mono text-sm">
          {activeSession?.history.map((line) => (
            <div key={line.id} className={`${getLineColor(line.type)} whitespace-pre-wrap mb-1`}>
              {line.content}
            </div>
          ))}
        </div>
        
        <div className={`p-4 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-mono text-sm">
              {activeSession?.currentPath} $
            </span>
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCommand(currentInput);
                }
              }}
              className={`flex-1 bg-transparent font-mono text-sm focus:outline-none ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
              placeholder="Type command..."
              autoFocus
            />
          </div>
        </div>
      </div>
    </div>
  );
};
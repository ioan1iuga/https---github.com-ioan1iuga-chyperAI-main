import express from 'express';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { spawn } from 'child_process';

const router = express.Router();

// Store terminal sessions
const terminalSessions = new Map();
// Store WebSocket connections
const wsConnections = new Map();

// Create a new terminal session
router.post('/', (req, res) => {
  try {
    const { projectId, cwd = '/home/project' } = req.body;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }
    
    const sessionId = uuidv4();
    
    const session = {
      id: sessionId,
      projectId,
      cwd,
      history: [],
      createdAt: new Date().toISOString(),
      userId: req.user?.id || 'anonymous'
    };
    
    terminalSessions.set(sessionId, session);
    
    logger.info(`Terminal session created: ${sessionId}`, { projectId });
    
    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Error creating terminal session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create terminal session'
    });
  }
});

// Get a terminal session
router.get('/:id', (req, res) => {
  const sessionId = req.params.id;
  const session = terminalSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Terminal session not found'
    });
  }
  
  res.json({
    success: true,
    data: session
  });
});

// Execute a command in a terminal session
router.post('/:id/exec', (req, res) => {
  const sessionId = req.params.id;
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({
      success: false,
      error: 'Command is required'
    });
  }
  
  const session = terminalSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Terminal session not found'
    });
  }
  
  // Handle built-in commands
  if (command === 'clear') {
    session.history = [];
    return res.json({ output: '', exitCode: 0 });
  }
  
  if (command.startsWith('cd ')) {
    const newDir = command.substring(3).trim();
    try {
      // Simulate directory change
      if (newDir === '..') {
        const parts = session.cwd.split('/').filter(Boolean);
        parts.pop();
        session.cwd = '/' + parts.join('/');
      } else if (newDir.startsWith('/')) {
        session.cwd = newDir;
      } else {
        session.cwd = `${session.cwd}/${newDir}`.replace(/\/+/g, '/');
      }
      return res.json({ output: '', exitCode: 0 });
    } catch (error) {
      return res.json({ output: `cd: ${error.message}`, exitCode: 1 });
    }
  }
  
  // Execute command
  try {
    const child = spawn('sh', ['-c', command], {
      cwd: session.cwd,
      env: process.env
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      const result = {
        output: output + errorOutput,
        exitCode: code
      };
      
      // Add to history
      session.history.push({
        command,
        ...result,
        timestamp: new Date().toISOString()
      });
      
      // Send to any active WebSocket connections
      const wsConnection = wsConnections.get(sessionId);
      if (wsConnection && wsConnection.readyState === 1) {
        wsConnection.send(JSON.stringify({
          type: 'command_result',
          command,
          ...result
        }));
      }
      
      res.json(result);
    });
    
    // Handle timeout
    const timeoutMs = parseInt(process.env.TERMINAL_COMMAND_TIMEOUT || '30000');
    setTimeout(() => {
      if (!child.killed) {
        child.kill();
        res.json({
          output: 'Command timed out',
          exitCode: 124
        });
      }
    }, timeoutMs);
  } catch (error) {
    logger.error('Error executing command:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute command'
    });
  }
});

// Get terminal session history
router.get('/:id/history', (req, res) => {
  const sessionId = req.params.id;
  const session = terminalSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Terminal session not found'
    });
  }
  
  res.json({
    success: true,
    data: session.history
  });
});

// Delete a terminal session
router.delete('/:id', (req, res) => {
  const sessionId = req.params.id;
  
  if (terminalSessions.has(sessionId)) {
    terminalSessions.delete(sessionId);
    
    // Close any associated WebSocket
    const wsConnection = wsConnections.get(sessionId);
    if (wsConnection) {
      wsConnection.close();
      wsConnections.delete(sessionId);
    }
    
    res.status(204).send();
  } else {
    res.status(404).json({
      success: false,
      error: 'Terminal session not found'
    });
  }
});

// WebSocket handler
export function setupWebSockets(server) {
  const wss = new WebSocketServer({ 
    noServer: true,
    path: '/api/terminals'
  });
  
  // Handle WebSocket upgrade
  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    
    if (pathname.startsWith('/api/terminals')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });
  
  // Handle WebSocket connection
  wss.on('connection', (ws, request) => {
    logger.info('WebSocket connection established for terminal');
    
    // Get terminal session ID from the URL
    const url = new URL(request.url, `http://${request.headers.host}`);
    const sessionId = url.searchParams.get('session');
    
    if (!sessionId || !terminalSessions.has(sessionId)) {
      ws.close(4000, 'Invalid terminal session');
      return;
    }
    
    // Store the WebSocket connection
    wsConnections.set(sessionId, ws);
    
    // Send the current working directory
    const session = terminalSessions.get(sessionId);
    ws.send(JSON.stringify({
      type: 'init',
      cwd: session.cwd
    }));
    
    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'command') {
          // Execute command and send response through WebSocket
          const { command } = data;
          
          // Handle built-in commands
          if (command === 'clear') {
            session.history = [];
            ws.send(JSON.stringify({
              type: 'command_result',
              command,
              output: '',
              exitCode: 0
            }));
            return;
          }
          
          if (command.startsWith('cd ')) {
            const newDir = command.substring(3).trim();
            try {
              if (newDir === '..') {
                const parts = session.cwd.split('/').filter(Boolean);
                parts.pop();
                session.cwd = '/' + parts.join('/');
              } else if (newDir.startsWith('/')) {
                session.cwd = newDir;
              } else {
                session.cwd = `${session.cwd}/${newDir}`.replace(/\/+/g, '/');
              }
              
              ws.send(JSON.stringify({
                type: 'command_result',
                command,
                output: '',
                exitCode: 0,
                cwd: session.cwd
              }));
              return;
            } catch (error) {
              ws.send(JSON.stringify({
                type: 'command_result',
                command,
                output: `cd: ${error.message}`,
                exitCode: 1
              }));
              return;
            }
          }
          
          // Execute command
          const child = spawn('sh', ['-c', command], {
            cwd: session.cwd,
            env: process.env
          });
          
          let output = '';
          let errorOutput = '';
          
          child.stdout.on('data', (data) => {
            const chunk = data.toString();
            output += chunk;
            
            // Stream output to client
            ws.send(JSON.stringify({
              type: 'output',
              data: chunk
            }));
          });
          
          child.stderr.on('data', (data) => {
            const chunk = data.toString();
            errorOutput += chunk;
            
            // Stream error output to client
            ws.send(JSON.stringify({
              type: 'error',
              data: chunk
            }));
          });
          
          child.on('close', (code) => {
            // Send completion message
            ws.send(JSON.stringify({
              type: 'command_result',
              command,
              output: output + errorOutput,
              exitCode: code
            }));
            
            // Update history
            session.history.push({
              command,
              output: output + errorOutput,
              exitCode: code,
              timestamp: new Date().toISOString()
            });
          });
        }
      } catch (error) {
        logger.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message'
        }));
      }
    });
    
    // Handle WebSocket close
    ws.on('close', () => {
      logger.info(`WebSocket connection closed for terminal session: ${sessionId}`);
      wsConnections.delete(sessionId);
    });
  });
  
  return wss;
}

export { router };
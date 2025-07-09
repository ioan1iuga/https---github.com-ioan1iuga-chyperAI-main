// Terminal Session Durable Object
import { DurableObjectState } from '../../types/worker-configuration';

export class TerminalSession {
  private state: DurableObjectState;
  private socket: WebSocket | null;
  private sessionData: any;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.socket = null;
    this.sessionData = {
      cwd: '/home/project',
      history: [],
      environment: {}
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/websocket') {
      return this.handleWebSocket(request);
    }
    
    if (url.pathname === '/api/execute') {
      return this.handleExecute(request);
    }
    
    return new Response('Not found', { status: 404 });
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();
    this.socket = server;

    server.addEventListener('message', (event) => {
      this.handleTerminalMessage(event.data as string);
    });

    server.addEventListener('close', () => {
      this.socket = null;
    });

    // Send session info
    server.send(JSON.stringify({
      type: 'session_info',
      cwd: this.sessionData.cwd,
      history: this.sessionData.history.slice(-50) // Last 50 commands
    }));

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private async handleExecute(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { command } = await request.json();
    const result = await this.executeCommand(command);

    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleTerminalMessage(data: string): Promise<void> {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'command':
          const result = await this.executeCommand(message.command);
          this.sendToSocket({
            type: 'command_result',
            result
          });
          break;
          
        case 'resize':
          // Handle terminal resize
          this.sessionData.terminalSize = message.size;
          break;
      }
      
    } catch (error) {
      this.sendToSocket({
        type: 'error',
        message: 'Failed to process command'
      });
    }
  }

  private async executeCommand(command: string): Promise<any> {
    const timestamp = new Date().toISOString();
    
    // Add to history
    this.sessionData.history.push({
      command,
      timestamp,
      cwd: this.sessionData.cwd
    });

    // Handle built-in commands
    if (command === 'pwd') {
      return {
        output: this.sessionData.cwd,
        exitCode: 0,
        timestamp
      };
    }

    if (command === 'clear') {
      return {
        output: '',
        exitCode: 0,
        timestamp,
        clearScreen: true
      };
    }

    if (command.startsWith('cd ')) {
      const newDir = command.substring(3).trim();
      // Simulate directory change
      if (newDir === '..') {
        const parts = this.sessionData.cwd.split('/');
        parts.pop();
        this.sessionData.cwd = parts.join('/') || '/';
      } else if (newDir.startsWith('/')) {
        this.sessionData.cwd = newDir;
      } else {
        this.sessionData.cwd = `${this.sessionData.cwd}/${newDir}`.replace(/\/+/g, '/');
      }
      
      return {
        output: '',
        exitCode: 0,
        timestamp
      };
    }

    if (command === 'ls') {
      const mockFiles = ['src', 'package.json', 'README.md', 'node_modules'];
      return {
        output: mockFiles.join('  '),
        exitCode: 0,
        timestamp
      };
    }

    if (command.startsWith('npm ')) {
      // Simulate npm commands
      const npmCommand = command.substring(4);
      if (npmCommand === 'install' || npmCommand === 'i') {
        return {
          output: 'npm WARN deprecated package@1.0.0\nnpm WARN package requires peer dependency\n+ package@2.1.0\nadded 150 packages in 5.2s',
          exitCode: 0,
          timestamp
        };
      }
      
      if (npmCommand === 'run dev') {
        return {
          output: '> dev\n> vite\n\n  VITE v4.5.0  ready in 532 ms\n\n  ➜  Local:   http://localhost:5173/\n  ➜  Network: use --host to expose',
          exitCode: 0,
          timestamp
        };
      }
    }

    // Default response for unknown commands
    return {
      output: `Command '${command}' not found`,
      exitCode: 127,
      timestamp
    };
  }

  private sendToSocket(message: any): void {
    if (this.socket) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send to socket:', error);
        this.socket = null;
      }
    }
  }

  async alarm(): Promise<void> {
    // Cleanup inactive sessions
    console.log('Terminal session alarm triggered');
  }
}
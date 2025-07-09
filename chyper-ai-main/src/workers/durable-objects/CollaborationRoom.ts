// Collaboration Room Durable Object
import { DurableObjectState } from '../../types/worker-configuration';

export class CollaborationRoom {
  private state: DurableObjectState;
  private sessions: Map<string, WebSocket>;
  private roomData: any;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Map();
    this.roomData = {};
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/websocket') {
      return this.handleWebSocket(request);
    }
    
    if (url.pathname === '/api/room') {
      return this.handleRoomAPI(request);
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

    const sessionId = this.generateSessionId();
    this.sessions.set(sessionId, server);

    server.addEventListener('message', (event) => {
      this.handleMessage(sessionId, event.data as string);
    });

    server.addEventListener('close', () => {
      this.sessions.delete(sessionId);
      this.broadcastToOthers(sessionId, {
        type: 'user_left',
        sessionId
      });
    });

    // Send current room state to new user
    server.send(JSON.stringify({
      type: 'room_state',
      data: this.roomData
    }));

    // Notify others of new user
    this.broadcastToOthers(sessionId, {
      type: 'user_joined',
      sessionId
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private async handleRoomAPI(request: Request): Promise<Response> {
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        data: {
          activeUsers: this.sessions.size,
          roomData: this.roomData
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });
  }

  private handleMessage(sessionId: string, data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'cursor_move':
          this.broadcastToOthers(sessionId, {
            type: 'cursor_update',
            sessionId,
            position: message.position
          });
          break;
          
        case 'text_change':
          this.roomData.document = message.document;
          this.broadcastToOthers(sessionId, {
            type: 'document_update',
            sessionId,
            changes: message.changes
          });
          break;
          
        case 'selection_change':
          this.broadcastToOthers(sessionId, {
            type: 'selection_update',
            sessionId,
            selection: message.selection
          });
          break;
      }
      
    } catch (error) {
      console.error('Error handling collaboration message:', error);
    }
  }

  private broadcastToOthers(excludeSessionId: string, message: any): void {
    const messageStr = JSON.stringify(message);
    
    for (const [sessionId, socket] of this.sessions.entries()) {
      if (sessionId !== excludeSessionId) {
        try {
          socket.send(messageStr);
        } catch (error) {
          // Remove dead connections
          this.sessions.delete(sessionId);
        }
      }
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Called when the Durable Object is evicted from memory
  async alarm(): Promise<void> {
    // Cleanup logic here
    console.log('Collaboration room alarm triggered');
  }
}
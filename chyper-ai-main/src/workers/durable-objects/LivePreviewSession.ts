// Live Preview Session Durable Object
import { DurableObjectState } from '../../types/worker-configuration';

export class LivePreviewSession {
  private state: DurableObjectState;
  private viewers: Map<string, WebSocket>;
  private previewData: any;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.viewers = new Map();
    this.previewData = {
      html: '',
      css: '',
      js: '',
      lastUpdate: Date.now()
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/websocket') {
      return this.handleWebSocket(request);
    }
    
    if (url.pathname === '/api/preview') {
      return this.handlePreviewAPI(request);
    }
    
    if (url.pathname === '/preview') {
      return this.handlePreviewPage(request);
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

    const viewerId = this.generateViewerId();
    this.viewers.set(viewerId, server);

    server.addEventListener('message', (event) => {
      this.handleMessage(viewerId, event.data as string);
    });

    server.addEventListener('close', () => {
      this.viewers.delete(viewerId);
    });

    // Send current preview state
    server.send(JSON.stringify({
      type: 'preview_state',
      data: this.previewData
    }));

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private async handlePreviewAPI(request: Request): Promise<Response> {
    if (request.method === 'POST') {
      const updateData = await request.json();
      
      // Update preview data
      this.previewData = {
        ...this.previewData,
        ...updateData,
        lastUpdate: Date.now()
      };
      
      // Broadcast to all viewers
      this.broadcastToAll({
        type: 'preview_update',
        data: this.previewData
      });
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Preview updated'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        data: this.previewData
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });
  }

  private async handlePreviewPage(request: Request): Promise<Response> {
    // Generate live preview HTML
    const html = this.generatePreviewHTML();
    
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  private handleMessage(viewerId: string, data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'code_update':
          this.previewData = {
            ...this.previewData,
            ...message.data,
            lastUpdate: Date.now()
          };
          
          // Broadcast to other viewers
          this.broadcastToOthers(viewerId, {
            type: 'preview_update',
            data: this.previewData
          });
          break;
          
        case 'reload_request':
          this.broadcastToAll({
            type: 'reload'
          });
          break;
      }
      
    } catch (error) {
      console.error('Error handling preview message:', error);
    }
  }

  private generatePreviewHTML(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Live Preview</title>
        <style>
          ${this.previewData.css || ''}
          
          /* Default styles */
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
        </style>
      </head>
      <body>
        ${this.previewData.html || '<h1>Welcome to Live Preview</h1><p>Start coding to see changes here!</p>'}
        
        <script>
          ${this.previewData.js || ''}
          
          // WebSocket connection for live updates
          const ws = new WebSocket('wss://' + location.host + '/websocket');
          
          ws.onmessage = function(event) {
            const message = JSON.parse(event.data);
            
            if (message.type === 'preview_update') {
              location.reload();
            } else if (message.type === 'reload') {
              location.reload();
            }
          };
          
          ws.onerror = function(error) {
            console.warn('Preview WebSocket error:', error);
          };
        </script>
      </body>
      </html>
    `;
  }

  private broadcastToAll(message: any): void {
    const messageStr = JSON.stringify(message);
    
    for (const [viewerId, socket] of this.viewers.entries()) {
      try {
        socket.send(messageStr);
      } catch (error) {
        // Remove dead connections
        this.viewers.delete(viewerId);
      }
    }
  }

  private broadcastToOthers(excludeViewerId: string, message: any): void {
    const messageStr = JSON.stringify(message);
    
    for (const [viewerId, socket] of this.viewers.entries()) {
      if (viewerId !== excludeViewerId) {
        try {
          socket.send(messageStr);
        } catch (error) {
          // Remove dead connections
          this.viewers.delete(viewerId);
        }
      }
    }
  }

  private generateViewerId(): string {
    return `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async alarm(): Promise<void> {
    // Cleanup old preview data
    console.log('Live preview session alarm triggered');
  }
}
// WebSocket Handler for Cloudflare Workers
import { WorkerRequest, WorkerEnvironment, ExecutionContext } from '../../types/worker-configuration';

export async function handleWebSocket(
  request: WorkerRequest,
  env: WorkerEnvironment,
  ctx: ExecutionContext
): Promise<Response> {
  const upgradeHeader = request.headers.get('Upgrade');
  
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  // Accept the WebSocket connection
  server.accept();

  // Handle WebSocket events
  server.addEventListener('message', async (event) => {
    try {
      const data = JSON.parse(event.data as string);
      await handleWebSocketMessage(data, server, env, ctx);
    } catch (error) {
      console.error('WebSocket message error:', error);
      server.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  server.addEventListener('close', () => {
    console.log('WebSocket connection closed');
  });

  server.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
  });

  return new Response(null, {
    status: parseInt(Deno.env.get('WEBSOCKET_UPGRADE_STATUS') || '101'),
    webSocket: client,
  });
}

async function handleWebSocketMessage(
  data: any,
  socket: WebSocket,
  env: WorkerEnvironment,
  ctx: ExecutionContext
): Promise<void> {
  switch (data.type) {
    case 'ping':
      socket.send(JSON.stringify({ type: 'pong' }));
      break;
      
    case 'terminal':
      await handleTerminalMessage(data, socket, env);
      break;
      
    case 'collaboration':
      await handleCollaborationMessage(data, socket, env);
      break;
      
    case 'logs':
      await handleLogsMessage(data, socket, env);
      break;
      
    default:
      socket.send(JSON.stringify({
        type: 'error',
        message: `Unknown message type: ${data.type}`
      }));
  }
}

async function handleTerminalMessage(
  data: any,
  socket: WebSocket,
  env: WorkerEnvironment,
  ctx: ExecutionContext
): Promise<void> {
  // Handle terminal commands
  const { command, sessionId } = data;
  
  // Simulate command execution
  let output = "";
  
  try {
    // Timeout for terminal commands (default 30s)
    const timeout = parseInt(Deno.env.get('TERMINAL_COMMAND_TIMEOUT') || '30000');
    const commandTimeoutPromise = new Promise(resolve => 
      setTimeout(() => resolve('Command timed out'), timeout)
    );
    
    // In a real implementation, we would execute the command here
    // For now, just use a mock response
    output = `Executed: ${command}\nOutput: Success`;
    
    // Use Promise.race to implement timeout
    ctx.waitUntil(Promise.race([
      Promise.resolve(), // Replace with actual command execution
      commandTimeoutPromise
    ]));
  } catch (error) {
    console.error('Terminal command error:', error);
    output = `Error executing command: ${error.message || 'Unknown error'}`;
  }
  
  socket.send(JSON.stringify({
    type: 'terminal',
    sessionId,
    output
  }));
}

async function handleCollaborationMessage(
  data: any,
  socket: WebSocket,
  env: WorkerEnvironment
): Promise<void> {
  // Handle collaboration events
  const { event, projectId, userId } = data;
  
  socket.send(JSON.stringify({
    type: 'collaboration',
    event,
    projectId,
    userId,
    timestamp: Date.now()
  }));
}

async function handleLogsMessage(
  data: any,
  socket: WebSocket,
  env: WorkerEnvironment
): Promise<void> {
  // Handle log streaming
  const { level, message, projectId } = data;
  
  socket.send(JSON.stringify({
    type: 'logs',
    level,
    message,
    projectId,
    timestamp: Date.now()
  }));
}
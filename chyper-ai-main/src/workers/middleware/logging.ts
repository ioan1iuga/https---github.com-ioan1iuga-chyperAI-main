// Logging Middleware for Cloudflare Workers
import { WorkerRequest, WorkerEnvironment, ExecutionContext, LogEntry } from '../../types/worker-configuration';

export async function loggingMiddleware(
  request: WorkerRequest,
  env: WorkerEnvironment,
  ctx: ExecutionContext
): Promise<void> {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  // Add request ID to request for tracking
  (request as any).requestId = requestId;
  
  // Log request start
  await logRequest({
    level: 'info',
    message: `${request.method} ${request.url}`,
    timestamp: startTime,
    requestId,
    metadata: {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('User-Agent'),
      ip: request.headers.get('CF-Connecting-IP'),
      country: request.headers.get('CF-IPCountry'),
      ray: request.headers.get('CF-Ray')
    }
  }, env, ctx);
}

export async function logRequest(
  entry: LogEntry,
  env: WorkerEnvironment,
  ctx: ExecutionContext
): Promise<void> {
  try {
    // Log to console for immediate visibility
    console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.metadata);
    
    // Store in D1 database for persistence
    ctx.waitUntil(storeLogEntry(entry, env));
    
    // Send to analytics if it's an error or warning
    if (entry.level === 'error' || entry.level === 'warn') {
      ctx.waitUntil(sendToAnalytics(entry, env));
    }
    
  } catch (error) {
    console.error('Logging error:', error);
  }
}

async function storeLogEntry(entry: LogEntry, env: WorkerEnvironment): Promise<void> {
  try {
    await env.DB.prepare(`
      INSERT INTO logs (id, level, message, timestamp, request_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      generateLogId(),
      entry.level,
      entry.message,
      entry.timestamp,
      entry.requestId || null,
      JSON.stringify(entry.metadata || {})
    ).run();
  } catch (error) {
    console.error('Failed to store log entry:', error);
  }
}

async function sendToAnalytics(entry: LogEntry, env: WorkerEnvironment): Promise<void> {
  try {
    await env.ANALYTICS.writeDataPoint({
      timestamp: entry.timestamp,
      event: `log_${entry.level}`,
      userId: entry.userId,
      metadata: {
        message: entry.message,
        requestId: entry.requestId,
        ...entry.metadata
      }
    });
  } catch (error) {
    console.error('Failed to send to analytics:', error);
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createLogger(requestId: string, env: WorkerEnvironment, ctx: ExecutionContext) {
  return {
    debug: (message: string, metadata?: any) => logRequest({
      level: 'debug',
      message,
      timestamp: Date.now(),
      requestId,
      metadata
    }, env, ctx),
    
    info: (message: string, metadata?: any) => logRequest({
      level: 'info',
      message,
      timestamp: Date.now(),
      requestId,
      metadata
    }, env, ctx),
    
    warn: (message: string, metadata?: any) => logRequest({
      level: 'warn',
      message,
      timestamp: Date.now(),
      requestId,
      metadata
    }, env, ctx),
    
    error: (message: string, metadata?: any) => logRequest({
      level: 'error',
      message,
      timestamp: Date.now(),
      requestId,
      metadata
    }, env, ctx)
  };
}
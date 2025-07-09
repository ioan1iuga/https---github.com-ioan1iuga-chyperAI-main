// CORS Middleware for Cloudflare Workers
import type { WorkerRequest, WorkerEnvironment, CORSConfig } from '../../types/worker-configuration';

const defaultCorsConfig: CORSConfig = {
  origin: Deno.env.get('CORS_ALLOW_ORIGIN') || true, // Allow all origins by default
  methods: (Deno.env.get('CORS_ALLOW_METHODS') || 'GET,POST,PUT,DELETE,OPTIONS,PATCH').split(','),
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key',
    'X-Client-Version'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Request-ID',
    ...(Deno.env.get('CORS_EXPOSE_HEADERS') || '').split(',').filter(Boolean)
  ],
  credentials: Deno.env.get('CORS_CREDENTIALS') !== 'false',
  maxAge: parseInt(Deno.env.get('CORS_MAX_AGE') || '86400') // 24 hours by default
};

export async function corsMiddleware(
  request: WorkerRequest,
  env: WorkerEnvironment, 
  config: CORSConfig = defaultCorsConfig
): Promise<Response | null> {
  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return handlePreflightRequest(request, config);
  }

  // For other requests, we'll add CORS headers in the response
  return null;
}

function handlePreflightRequest(request: WorkerRequest, config: CORSConfig): Response {
  const origin = request.headers.get('Origin');
  const requestMethod = request.headers.get('Access-Control-Request-Method');
  const requestHeaders = request.headers.get('Access-Control-Request-Headers');

  const headers = new Headers();

  // Set origin
  if (isOriginAllowed(origin, config.origin)) {
    headers.set('Access-Control-Allow-Origin', origin || '*');
  } else {
    headers.set('Access-Control-Allow-Origin', 'null');
  }

  // Set credentials
  if (config.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Set methods
  if (requestMethod && config.methods.includes(requestMethod)) {
    headers.set('Access-Control-Allow-Methods', config.methods.join(', '));
  }

  // Set headers
  if (requestHeaders) {
    const requestedHeaders = requestHeaders.split(',').map(h => h.trim());
    const allowedHeaders = requestedHeaders.filter(h => 
      config.allowedHeaders.includes(h) || h.toLowerCase().startsWith('x-')
    );
    headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
  } else {
    headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
  }

  // Set exposed headers
  if (config.exposedHeaders && config.exposedHeaders.length > 0) {
    headers.set('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
  }

  // Set max age
  if (config.maxAge) {
    headers.set('Access-Control-Max-Age', config.maxAge.toString());
  }

  return new Response(null, {
    status: 204,
    headers
  });
}

export function addCorsHeaders(response: Response, request: WorkerRequest, config: CORSConfig = defaultCorsConfig): Response {
  const origin = request.headers.get('Origin');
  const newHeaders = new Headers(response.headers);

  // Set origin
  if (isOriginAllowed(origin, config.origin)) {
    newHeaders.set('Access-Control-Allow-Origin', origin || '*');
  }

  // Set credentials
  if (config.credentials) {
    newHeaders.set('Access-Control-Allow-Credentials', 'true');
  }

  // Set exposed headers
  if (config.exposedHeaders && config.exposedHeaders.length > 0) {
    newHeaders.set('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

function isOriginAllowed(origin: string | null, allowedOrigin: string | string[] | boolean): boolean {
  if (!origin) return false;
  
  if (allowedOrigin === true) return true;
  if (allowedOrigin === false) return false;
  
  if (typeof allowedOrigin === 'string') {
    return origin === allowedOrigin;
  }
  
  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.includes(origin);
  }
  
  return false;
}
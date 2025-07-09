// Authentication Middleware for Cloudflare Workers
import type { WorkerRequest, WorkerEnvironment, SessionData, UserData } from '../../types/worker-configuration';

export interface AuthResult {
  success: boolean;
  user?: UserData;
  session?: SessionData;
  error?: string;
}

export async function authMiddleware(
  request: WorkerRequest,
  env: WorkerEnvironment
): Promise<AuthResult> {
  try {
    // Extract token from Authorization header or cookie
    const token = extractToken(request);
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided'
      };
    }

    // Verify JWT token
    const payload = await verifyJWT(token, env.JWT_SECRET);
    if (!payload) {
      return {
        success: false,
        error: 'Invalid or expired token'
      };
    }

    // Get session data from KV
    const sessionKey = `session:${payload.sessionId}`;
    const session = await env.SESSIONS.get(sessionKey, 'json') as SessionData;
    
    if (!session) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      await env.SESSIONS.delete(sessionKey);
      return {
        success: false,
        error: 'Session expired'
      };
    }

    // Get user data
    const userKey = `user:${session.userId}`;
    const user = await env.USER_DATA.get(userKey, 'json') as UserData;
    
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Update last activity
    session.metadata = {
      ...session.metadata,
      lastActivity: Date.now(),
      userAgent: request.headers.get('User-Agent'),
      ip: request.headers.get('CF-Connecting-IP')
    };
    
    await env.SESSIONS.put(sessionKey, JSON.stringify(session), {
      expirationTtl: Math.floor((session.expiresAt - Date.now()) / 1000)
    });

    return {
      success: true,
      user,
      session
    };

  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

function extractToken(request: WorkerRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookie as fallback
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    return cookies.authToken || null;
  }

  return null;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });

  return cookies;
}

async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    // WARNING: This is a simplified JWT verification for demonstration purposes only!
    // SECURITY RISK: In a real production application, always use a proper JWT library 
    // like jose, jsonwebtoken, or Cloudflare's built-in JWT verification.
    const [header, payload, signature] = token.split('.');
    
    if (!header || !payload || !signature) {
      return null;
    }

    // Decode payload
    const decodedPayload = JSON.parse(atob(payload));
    
    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    // SECURITY RISK: This implementation does not verify the signature
    // TODO: Replace with proper JWT verification before using in production
    // Example with jose: 
    // import * as jose from 'jose';
    // const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(secret));
    // return payload;
    return decodedPayload;

  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export async function createSession(
  userId: string,
  projectId: string,
  env: WorkerEnvironment,
  expirationHours: number = 24
): Promise<{ token: string; session: SessionData }> {
  const sessionId = generateSessionId();
  const now = Date.now();
  const expiresAt = now + (expirationHours * 60 * 60 * 1000);

  const session: SessionData = {
    userId,
    projectId,
    permissions: ['read', 'write'], // Default permissions
    createdAt: now,
    expiresAt,
    metadata: {
      createdAt: now
    }
  };

  // Store session in KV
  const sessionKey = `session:${sessionId}`;
  await env.SESSIONS.put(sessionKey, JSON.stringify(session), {
    expirationTtl: Math.floor((expiresAt - now) / 1000)
  });

  // Create JWT token
  const token = await createJWT({
    sessionId,
    userId,
    projectId,
    iat: Math.floor(now / 1000),
    exp: Math.floor(expiresAt / 1000)
  }, env.JWT_SECRET);

  return { token, session };
}

async function createJWT(payload: any, secret: string): Promise<string> {
  // Simplified JWT creation - in production, use a proper JWT library
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  // In a real implementation, you would create a proper signature here
  const signature = btoa(`${header}.${encodedPayload}.${secret}`);
  
  return `${header}.${encodedPayload}.${signature}`;
}

function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
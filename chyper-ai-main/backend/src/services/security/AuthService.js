// Authentication Service - Secure backend authentication logic
import jwt from 'jsonwebtoken';

export class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    if (!this.jwtSecret) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('JWT_SECRET is not set. Using a random temporary secret for development only.');
        // Generate a random secret instead of using a hardcoded one
        this.jwtSecret = require('crypto').randomBytes(32).toString('hex');
      } else {
        this.jwtSecret = '';
        console.error('JWT_SECRET environment variable is required in production');
      }
    }
    
    if (this.jwtSecret) {
      console.log(`JWT secret configured (${this.jwtSecret.length} characters)`);
    } else {
      console.error('No JWT secret available - authentication will not work');
    }
    this.tokenExpiry = '24h';
    this.refreshTokenExpiry = '7d';
  }

  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user'
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.tokenExpiry });
  }

  generateRefreshToken(user) {
    const payload = {
      id: user.id,
      type: 'refresh'
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.refreshTokenExpiry });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authorization header');
    }
    return authHeader.substring(7);
  }

  createSession(user) {
    const sessionId = this.generateSessionId();
    const token = this.generateToken({ ...user, sessionId });
    const refreshToken = this.generateRefreshToken(user);

    return {
      sessionId,
      token,
      refreshToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user'
      }
    };
  }

  validateAPIKey(apiKey) {
    // In production, validate against database
    const validKeys = process.env.VALID_API_KEYS?.split(',') || [];
    return validKeys.includes(apiKey);
  }

  hashPassword(password) {
    // In production, use bcrypt or similar
    return Buffer.from(password).toString('base64');
  }

  verifyPassword(password, hashedPassword) {
    // In production, use bcrypt.compare
    return this.hashPassword(password) === hashedPassword;
  }

  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Security validation methods
  validatePermissions(user, requiredPermissions) {
    if (!user || !user.role) return false;
    
    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'admin'],
      user: ['read', 'write'],
      viewer: ['read']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  sanitizeUserData(user) {
    // Remove sensitive fields before sending to client
    const { password, apiKeys, internalId, ...safeUser } = user;
    return safeUser;
  }

  generateAPIKey(userId) {
    const prefix = 'ak_';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 16);
    return `${prefix}${timestamp}_${random}`;
  }
}

export default new AuthService();
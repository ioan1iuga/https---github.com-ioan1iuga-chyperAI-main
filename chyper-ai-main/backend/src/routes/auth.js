import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Mock user database - in production, use Supabase
const users = [
  {
    id: 'user-1',
    email: 'user@example.com',
    // password: 'password123'
    passwordHash: '$2a$10$zJQ5o1IQRB6v/p1DSPr7EuXVjnYZL3frJTa0d5L0qOP5TFN9gdRsS',
    name: 'Test User',
    role: 'user',
    subscription_tier: 'free'
  }
];

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-key';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          subscription_tier: user.subscription_tier
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    if (users.some(u => u.email === email)) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
      id: uuidv4(),
      email,
      passwordHash,
      name: name || email.split('@')[0],
      role: 'user',
      subscription_tier: 'free'
    };

    users.push(newUser);

    const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-key';
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          subscription_tier: newUser.subscription_tier
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscription_tier: user.subscription_tier
    }
  });
});

// Refresh token
router.post('/refresh', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token is required'
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    
    const user = users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const newToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
});

// Logout - for token invalidation in production, you would need a token blacklist
router.post('/logout', (req, res) => {
  // In a real implementation with JWT, you would add the token to a blacklist
  // or use a Redis cache to track invalidated tokens
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Password reset request
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  // In a real implementation, send a reset email with a token
  // For now, just return success
  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent'
  });
});

// Reset password with token
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Token and new password are required'
    });
  }

  // In a real implementation, verify the token and update the user's password
  // For now, just return success
  res.json({
    success: true,
    message: 'Password has been reset successfully'
  });
});

export default router;
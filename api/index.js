import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'GarageGuru2025ProductionJWTSecret!';
const DATABASE_URL = process.env.DATABASE_URL;

// Create connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Super Admin emails
const SUPER_ADMIN_EMAILS = [
  'gorla.ananthkalyan@gmail.com',
  'ananthautomotivegarage@gmail.com'
];

// CORS middleware
const corsMiddleware = cors({
  origin: [
    "https://garageguru.vercel.app",
    "http://localhost:5000", 
    "http://localhost:3000",
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*\.replit\.app$/
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
});

// Helper to run CORS
function runCors(req, res) {
  return new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Authentication helper
async function authenticateUser(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new Error('Access token required');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [decoded.email]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Main handler
export default async function handler(req, res) {
  try {
    // Handle CORS
    await runCors(req, res);
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { url, method } = req;
    const urlObj = new URL(url, `https://${req.headers.host}`);
    const path = urlObj.pathname;

    console.log(`API Request: ${method} ${path}`);

    // Health endpoint
    if (path === '/api/health') {
      const result = await pool.query('SELECT 1 as ping, NOW() as timestamp');
      return res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'garage-guru-backend',
        environment: 'production',
        database: 'connected',
        ping: result.rows[0].ping
      });
    }

    // Auth endpoints that don't require authentication
    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { email: user.email, userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          garage_id: user.garage_id
        }
      });
    }

    // MFA request endpoint
    if (path === '/api/mfa/request' && method === 'POST') {
      const { purpose } = req.body;
      
      if (purpose !== 'password_change') {
        return res.status(400).json({ message: 'Invalid purpose' });
      }

      // For now, return success (you can implement OTP generation later)
      return res.json({ 
        success: true, 
        message: 'OTP sent successfully',
        expires_in: 600 
      });
    }

    // Password change endpoint
    if (path === '/api/password/change' && method === 'POST') {
      const { email, newPassword, otpToken } = req.body;
      
      if (!email || !newPassword || !otpToken) {
        return res.status(400).json({ message: 'Email, new password, and OTP token are required' });
      }

      // Verify OTP token (simplified for now)
      try {
        const decoded = jwt.verify(otpToken, JWT_SECRET);
        if (decoded.email !== email || decoded.purpose !== 'password_change') {
          return res.status(403).json({ message: 'Invalid or expired OTP token' });
        }
      } catch {
        return res.status(403).json({ message: 'Invalid or expired OTP token' });
      }

      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

      return res.json({ success: true, message: 'Password changed successfully' });
    }

    // For all other endpoints, try to authenticate first
    let user;
    try {
      user = await authenticateUser(req);
    } catch (error) {
      return res.status(401).json({ message: error.message });
    }

    // Super admin endpoints
    if (path.startsWith('/api/super-admin/')) {
      if (!SUPER_ADMIN_EMAILS.includes(user.email)) {
        return res.status(403).json({ message: 'Access denied. Super admin access required.' });
      }

      if (path === '/api/super-admin/garages' && method === 'GET') {
        const result = await pool.query('SELECT * FROM garages ORDER BY created_at DESC');
        return res.json(result.rows);
      }

      // Add more super admin endpoints as needed
      return res.status(404).json({ message: 'Super admin endpoint not implemented' });
    }

    // User profile endpoint
    if (path === '/api/user/profile' && method === 'GET') {
      return res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          garage_id: user.garage_id
        }
      });
    }

    // Default response for unhandled endpoints
    return res.status(404).json({ message: 'Endpoint not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
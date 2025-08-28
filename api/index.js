import pg from 'pg';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { Pool } = pg;
const JWT_SECRET = process.env.JWT_SECRET || 'GarageGuru2025ProductionJWTSecret!';

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { url, method } = req;
    const urlObj = new URL(url, `https://${req.headers.host}`);
    const path = urlObj.pathname;

    console.log(`API Request: ${method} ${path}`);

    // Health endpoint
    if (path === '/api/health') {
      try {
        const client = await pool.connect();
        await client.query('SELECT 1 as ping');
        client.release();
        
        return res.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          service: 'garage-guru-backend',
          environment: 'production',
          database: 'connected'
        });
      } catch (dbError) {
        return res.json({
          status: 'error',
          timestamp: new Date().toISOString(),
          service: 'garage-guru-backend',
          environment: 'production',
          database: 'error',
          error: dbError.message
        });
      }
    }

    // Login endpoint
    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = req.body || {};
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const client = await pool.connect();
      try {
        const userResult = await client.query(`
          SELECT u.*, g.name as garage_name, g.id as garage_id 
          FROM users u 
          LEFT JOIN garages g ON u.garage_id = g.id 
          WHERE u.email = $1
          LIMIT 1
        `, [email]);

        if (userResult.rows.length === 0) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = userResult.rows[0];
        const isValidPassword = await bcryptjs.compare(password, user.password);

        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { 
            userId: user.id, 
            id: user.id,
            email: user.email, 
            role: user.role,
            garageId: user.garage_id 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            garage_id: user.garage_id,
            garageId: user.garage_id,
            garage_name: user.garage_name,
            mustChangePassword: user.must_change_password || false,
            firstLogin: user.first_login || false,
            status: user.status || 'active'
          },
          garage: user.garage_id ? {
            id: user.garage_id,
            name: user.garage_name
          } : null,
          token
        });
      } finally {
        client.release();
      }
    }

    // Authentication for protected routes
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const client = await pool.connect();
    try {
      const userResult = await client.query(`
        SELECT u.*, g.name as garage_name
        FROM users u 
        LEFT JOIN garages g ON u.garage_id = g.id 
        WHERE u.id = $1
        LIMIT 1
      `, [decoded.userId || decoded.id]);

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      const user = userResult.rows[0];

      // User profile endpoint
      if (path === '/api/user/profile' && method === 'GET') {
        return res.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            garage_id: user.garage_id,
            garageId: user.garage_id,
            garage_name: user.garage_name,
            mustChangePassword: user.must_change_password || false,
            firstLogin: user.first_login || false,
            status: user.status || 'active'
          },
          garage: user.garage_id ? {
            id: user.garage_id,
            name: user.garage_name
          } : null
        });
      }

      return res.status(404).json({ error: 'Endpoint not found' });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
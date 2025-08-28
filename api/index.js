const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'GarageGuru2025ProductionJWTSecret!';

// Initialize database connection once
let sql = null;

function initDatabase() {
  if (!sql && process.env.DATABASE_URL) {
    try {
      sql = neon(process.env.DATABASE_URL);
      console.log('Database initialized');
    } catch (error) {
      console.error('Database init error:', error);
      throw error;
    }
  }
  return sql;
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Parse URL
    const baseUrl = `https://${req.headers.host}`;
    const fullUrl = new URL(req.url, baseUrl);
    const path = fullUrl.pathname;
    const query = Object.fromEntries(fullUrl.searchParams);
    const { method } = req;

    console.log(`API: ${method} ${path}`);

    // Basic health check without database
    if (path === '/api/health') {
      const response = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'garage-guru-backend',
        environment: 'production'
      };

      // Try database connection
      try {
        const database = initDatabase();
        if (database) {
          await database`SELECT 1 as ping`;
          response.database = 'connected';
        } else {
          response.database = 'not_configured';
        }
      } catch (dbError) {
        console.error('Database health check failed:', dbError);
        response.database = 'error';
        response.db_error = dbError.message;
      }

      return res.json(response);
    }

    // Initialize database for other endpoints
    const database = initDatabase();
    if (!database) {
      return res.status(500).json({ 
        error: 'Database not configured',
        details: 'DATABASE_URL missing'
      });
    }

    // Login endpoint
    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = req.body || {};
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      try {
        const users = await database`
          SELECT u.*, g.name as garage_name, g.id as garage_id 
          FROM users u 
          LEFT JOIN garages g ON u.garage_id = g.id 
          WHERE u.email = ${email}
        `;

        if (users.length === 0) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        
        // Use a timeout for bcrypt to prevent hanging
        const isValidPassword = await Promise.race([
          bcrypt.compare(password, user.password),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Password check timeout')), 8000)
          )
        ]);

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
      } catch (loginError) {
        console.error('Login error:', loginError);
        return res.status(500).json({ 
          error: 'Login failed', 
          details: loginError.message 
        });
      }
    }

    // Authentication for protected routes
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    let user;
    try {
      const users = await database`
        SELECT u.*, g.name as garage_name
        FROM users u 
        LEFT JOIN garages g ON u.garage_id = g.id 
        WHERE u.id = ${decoded.userId || decoded.id}
      `;

      if (users.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      user = users[0];
    } catch (userError) {
      console.error('User lookup error:', userError);
      return res.status(500).json({ 
        error: 'User lookup failed',
        details: userError.message
      });
    }

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

    // Return 404 for unhandled routes
    return res.status(404).json({ 
      error: 'NOT_FOUND', 
      path: path,
      method: method,
      message: 'API endpoint not found'
    });

  } catch (error) {
    console.error('API Error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
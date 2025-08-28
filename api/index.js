const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'GarageGuru2025ProductionJWTSecret!';

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
    const { url, method } = req;
    const urlObj = new URL(url, `https://${req.headers.host}`);
    const path = urlObj.pathname;
    const query = Object.fromEntries(urlObj.searchParams);

    console.log(`API Request: ${method} ${path}`);

    // Health endpoint (no database required)
    if (path === '/api/health') {
      const response = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'garage-guru-backend',
        environment: 'production'
      };

      try {
        if (process.env.DATABASE_URL) {
          const sql = neon(process.env.DATABASE_URL);
          await sql`SELECT 1 as ping`;
          response.database = 'connected';
        } else {
          response.database = 'no_url';
        }
      } catch (dbError) {
        response.database = 'error';
        response.db_error = dbError.message;
      }

      return res.json(response);
    }

    // Initialize database connection
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ 
        error: 'Database configuration missing',
        details: 'DATABASE_URL not set' 
      });
    }

    const sql = neon(process.env.DATABASE_URL);

    // Login endpoint
    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = req.body || {};
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      try {
        const users = await sql`
          SELECT u.*, g.name as garage_name, g.id as garage_id 
          FROM users u 
          LEFT JOIN garages g ON u.garage_id = g.id 
          WHERE u.email = ${email}
          LIMIT 1
        `;

        if (users.length === 0) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

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
      const users = await sql`
        SELECT u.*, g.name as garage_name
        FROM users u 
        LEFT JOIN garages g ON u.garage_id = g.id 
        WHERE u.id = ${decoded.userId || decoded.id}
        LIMIT 1
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

    // Garages endpoint (super admin only)
    if (path === '/api/garages' && method === 'GET') {
      if (user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Super admin access required' });
      }

      try {
        const garages = await sql`
          SELECT * FROM garages 
          ORDER BY created_at DESC
        `;
        return res.json({ data: garages, count: garages.length });
      } catch (garageError) {
        return res.status(500).json({ 
          error: 'Failed to fetch garages',
          details: garageError.message 
        });
      }
    }

    // Helper function to get garage ID
    function getGarageId() {
      if (user.role === 'super_admin') {
        const queryGarageId = query.garageId;
        if (!queryGarageId) {
          throw new Error('Super admin must specify garageId in query');
        }
        return queryGarageId;
      } else {
        if (!user.garage_id) {
          throw new Error('User has no assigned garage');
        }
        return user.garage_id;
      }
    }

    // Legacy garage routes that are commonly used
    const garageRouteMatch = path.match(/^\/api\/garages\/([^\/]+)\/(.+)$/);
    if (garageRouteMatch) {
      const [, routeGarageId, endpoint] = garageRouteMatch;
      
      // Access control
      if (user.role !== 'super_admin' && user.garage_id !== routeGarageId) {
        return res.status(403).json({ error: 'Access denied to this garage' });
      }

      try {
        // Job cards
        if (endpoint === 'job-cards' && method === 'GET') {
          const jobCards = await sql`
            SELECT jc.*, c.name as customer_name, c.phone as customer_phone
            FROM job_cards jc
            LEFT JOIN customers c ON jc.customer_id = c.id
            WHERE jc.garage_id = ${routeGarageId}
            ORDER BY jc.created_at DESC
          `;
          return res.json({ data: jobCards });
        }

        // Sales stats
        if (endpoint === 'sales/stats' && method === 'GET') {
          const stats = await sql`
            SELECT 
              COUNT(*) as total_invoices,
              COALESCE(SUM(total_amount), 0) as total_revenue,
              COALESCE(SUM(service_charges), 0) as total_service_charges,
              COALESCE(SUM(parts_cost), 0) as total_spares_cost
            FROM invoices 
            WHERE garage_id = ${routeGarageId}
          `;

          const result = stats[0] || {};
          const totalProfit = Number(result.total_service_charges || 0) - Number(result.total_spares_cost || 0);

          return res.json({
            data: {
              totalInvoices: Number(result.total_invoices || 0),
              totalServiceCharges: Number(result.total_service_charges || 0),
              totalSparesCost: Number(result.total_spares_cost || 0),
              totalProfit: totalProfit
            }
          });
        }

        // Other common endpoints
        if (endpoint === 'sales/today' && method === 'GET') {
          const today = new Date().toISOString().split('T')[0];
          
          const todayStats = await sql`
            SELECT 
              COUNT(*) as invoices_count,
              COALESCE(SUM(total_amount), 0) as total_revenue,
              COALESCE(SUM(service_charges), 0) as service_revenue,
              COALESCE(SUM(parts_revenue), 0) as parts_revenue,
              COALESCE(SUM(parts_cost), 0) as parts_cost
            FROM invoices 
            WHERE garage_id = ${routeGarageId}
            AND DATE(created_at) = ${today}
          `;

          const result = todayStats[0] || {};
          const profit = Number(result.service_revenue || 0) + Number(result.parts_revenue || 0) - Number(result.parts_cost || 0);

          return res.json({
            data: {
              invoicesCount: Number(result.invoices_count || 0),
              totalRevenue: Number(result.total_revenue || 0),
              serviceRevenue: Number(result.service_revenue || 0),
              partsRevenue: Number(result.parts_revenue || 0),
              partsCost: Number(result.parts_cost || 0),
              profit: profit
            }
          });
        }

        if (endpoint === 'invoices' && method === 'GET') {
          const invoices = await sql`
            SELECT * FROM invoices 
            WHERE garage_id = ${routeGarageId}
            ORDER BY created_at DESC
          `;
          return res.json({ data: invoices });
        }

        if (endpoint === 'staff' && method === 'GET') {
          const staff = await sql`
            SELECT id, name, email, role, status, created_at
            FROM users 
            WHERE garage_id = ${routeGarageId}
            ORDER BY created_at DESC
          `;
          return res.json({ data: staff });
        }

        if (endpoint === 'spare-parts/low-stock' && method === 'GET') {
          const lowStockParts = await sql`
            SELECT * FROM spare_parts 
            WHERE garage_id = ${routeGarageId}
            AND quantity <= COALESCE(low_stock_threshold, 10)
            ORDER BY quantity ASC
          `;
          return res.json({ data: lowStockParts });
        }

        if (endpoint === 'notifications/unread-count' && method === 'GET') {
          return res.json({ data: { count: 0 } });
        }

      } catch (routeError) {
        console.error(`Error in ${endpoint}:`, routeError);
        return res.status(500).json({ 
          error: `Failed to process ${endpoint}`,
          details: routeError.message 
        });
      }
    }

    // Access requests endpoint (super admin only)
    if (path === '/api/access-requests' && method === 'GET') {
      if (user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Super admin access required' });
      }

      try {
        const requests = await sql`
          SELECT * FROM access_requests 
          ORDER BY created_at DESC
        `;
        return res.json({ data: requests });
      } catch (requestError) {
        return res.status(500).json({ 
          error: 'Failed to fetch access requests',
          details: requestError.message 
        });
      }
    }

    // 404 for unknown routes
    return res.status(404).json({ 
      error: 'NOT_FOUND', 
      path: path,
      method: method,
      message: 'API endpoint not found'
    });

  } catch (error) {
    console.error('API Error:', error);
    
    if (error.message && error.message.includes('token')) {
      return res.status(401).json({ error: 'Authentication failed' });
    }
    
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};
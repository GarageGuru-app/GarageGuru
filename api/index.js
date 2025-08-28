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
    const query = Object.fromEntries(urlObj.searchParams);

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
    let user;
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

      user = userResult.rows[0];
    } finally {
      client.release();
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

    // Access requests endpoint (super admin only)
    if (path === '/api/access-requests' && method === 'GET') {
      if (user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Super admin access required' });
      }

      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT * FROM access_requests 
          ORDER BY created_at DESC
        `);
        return res.json({ data: result.rows });
      } finally {
        client.release();
      }
    }

    // Garage-specific routes
    const garageRouteMatch = path.match(/^\/api\/garages\/([^\/]+)\/(.+)$/);
    if (garageRouteMatch) {
      const [, routeGarageId, endpoint] = garageRouteMatch;
      
      // Access control
      if (user.role !== 'super_admin' && user.garage_id !== routeGarageId) {
        return res.status(403).json({ error: 'Access denied to this garage' });
      }

      const client = await pool.connect();
      try {
        // Job cards
        if (endpoint === 'job-cards' && method === 'GET') {
          const result = await client.query(`
            SELECT jc.*, c.name as customer_name, c.phone as customer_phone
            FROM job_cards jc
            LEFT JOIN customers c ON jc.customer_id = c.id
            WHERE jc.garage_id = $1
            ORDER BY jc.created_at DESC
          `, [routeGarageId]);
          return res.json({ data: result.rows });
        }

        // Sales stats
        if (endpoint === 'sales/stats' && method === 'GET') {
          const result = await client.query(`
            SELECT 
              COUNT(*) as total_invoices,
              COALESCE(SUM(total_amount), 0) as total_revenue,
              COALESCE(SUM(service_charges), 0) as total_service_charges,
              COALESCE(SUM(parts_cost), 0) as total_spares_cost
            FROM invoices 
            WHERE garage_id = $1
          `, [routeGarageId]);

          const stats = result.rows[0] || {};
          const totalProfit = Number(stats.total_service_charges || 0) - Number(stats.total_spares_cost || 0);

          return res.json({
            data: {
              totalInvoices: Number(stats.total_invoices || 0),
              totalServiceCharges: Number(stats.total_service_charges || 0),
              totalSparesCost: Number(stats.total_spares_cost || 0),
              totalProfit: totalProfit
            }
          });
        }

        // Sales today
        if (endpoint === 'sales/today' && method === 'GET') {
          const today = new Date().toISOString().split('T')[0];
          
          const result = await client.query(`
            SELECT 
              COUNT(*) as invoices_count,
              COALESCE(SUM(total_amount), 0) as total_revenue,
              COALESCE(SUM(service_charges), 0) as service_revenue,
              COALESCE(SUM(parts_revenue), 0) as parts_revenue,
              COALESCE(SUM(parts_cost), 0) as parts_cost
            FROM invoices 
            WHERE garage_id = $1
            AND DATE(created_at) = $2
          `, [routeGarageId, today]);

          const stats = result.rows[0] || {};
          const profit = Number(stats.service_revenue || 0) + Number(stats.parts_revenue || 0) - Number(stats.parts_cost || 0);

          return res.json({
            data: {
              invoicesCount: Number(stats.invoices_count || 0),
              totalRevenue: Number(stats.total_revenue || 0),
              serviceRevenue: Number(stats.service_revenue || 0),
              partsRevenue: Number(stats.parts_revenue || 0),
              partsCost: Number(stats.parts_cost || 0),
              profit: profit
            }
          });
        }

        // Invoices
        if (endpoint === 'invoices' && method === 'GET') {
          const result = await client.query(`
            SELECT * FROM invoices 
            WHERE garage_id = $1
            ORDER BY created_at DESC
          `, [routeGarageId]);
          return res.json({ data: result.rows });
        }

        // Staff
        if (endpoint === 'staff' && method === 'GET') {
          const result = await client.query(`
            SELECT id, name, email, role, status, created_at
            FROM users 
            WHERE garage_id = $1
            ORDER BY created_at DESC
          `, [routeGarageId]);
          return res.json({ data: result.rows });
        }

        // Low stock parts
        if (endpoint === 'spare-parts/low-stock' && method === 'GET') {
          const result = await client.query(`
            SELECT * FROM spare_parts 
            WHERE garage_id = $1
            AND quantity <= COALESCE(low_stock_threshold, 10)
            ORDER BY quantity ASC
          `, [routeGarageId]);
          return res.json({ data: result.rows });
        }

        // Notifications unread count
        if (endpoint === 'notifications/unread-count' && method === 'GET') {
          return res.json({ data: { count: 0 } });
        }

      } finally {
        client.release();
      }
    }

    return res.status(404).json({ error: 'Endpoint not found', path, method });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
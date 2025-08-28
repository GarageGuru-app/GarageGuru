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

    // Database connection
    const sql = neon(process.env.DATABASE_URL);

    // Health endpoint
    if (path === '/api/health') {
      try {
        await sql`SELECT 1 as ping`;
        return res.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          service: 'garage-guru-backend',
          environment: 'production',
          database: 'connected'
        });
      } catch (error) {
        return res.status(500).json({
          status: 'error',
          error: error.message
        });
      }
    }

    // Login endpoint
    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = req.body || {};
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const users = await sql`
        SELECT u.*, g.name as garage_name, g.id as garage_id 
        FROM users u 
        LEFT JOIN garages g ON u.garage_id = g.id 
        WHERE u.email = ${email}
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
    }

    // All other routes require authentication
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const users = await sql`
      SELECT u.*, g.name as garage_name
      FROM users u 
      LEFT JOIN garages g ON u.garage_id = g.id 
      WHERE u.id = ${decoded.userId || decoded.id}
    `;

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = users[0];

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

      const garages = await sql`
        SELECT * FROM garages 
        ORDER BY created_at DESC
      `;

      return res.json({ data: garages, count: garages.length });
    }

    // Helper to resolve garage ID
    function getGarageId() {
      const queryGarageId = query.garageId;
      const userGarageId = user.garage_id;
      
      if (user.role === 'super_admin') {
        if (!queryGarageId) {
          throw new Error('GARAGE_ID_REQUIRED: Super admin must specify garageId in query');
        }
        return queryGarageId;
      } else {
        if (!userGarageId) {
          throw new Error('GARAGE_ID_REQUIRED: User has no assigned garage');
        }
        return userGarageId;
      }
    }

    // Customers endpoint
    if (path === '/api/customers' && method === 'GET') {
      const garageId = getGarageId();
      
      const customers = await sql`
        SELECT * FROM customers 
        WHERE garage_id = ${garageId}
        ORDER BY created_at DESC
      `;

      const mappedCustomers = customers.map((customer) => ({
        ...customer,
        bikeNumber: customer.bike_number,
        totalJobs: customer.total_jobs,
        totalSpent: customer.total_spent,
        lastVisit: customer.last_visit,
        createdAt: customer.created_at
      }));

      return res.json({ data: mappedCustomers, count: mappedCustomers.length });
    }

    // Spare parts endpoint
    if (path === '/api/spare-parts' && method === 'GET') {
      const garageId = getGarageId();
      
      const spareParts = await sql`
        SELECT * FROM spare_parts 
        WHERE garage_id = ${garageId}
        ORDER BY created_at DESC
      `;

      const mappedParts = spareParts.map((part) => ({
        ...part,
        partNumber: part.part_number,
        costPrice: part.cost_price,
        lowStockThreshold: part.low_stock_threshold,
        createdAt: part.created_at,
        updatedAt: part.updated_at
      }));

      const lowStockCount = mappedParts.filter(part => part.quantity <= (part.lowStockThreshold || 10)).length;

      return res.json({ data: mappedParts, count: mappedParts.length, lowStockCount });
    }

    // Job cards endpoint
    if (path === '/api/job-cards' && method === 'GET') {
      const garageId = getGarageId();
      
      const jobCards = await sql`
        SELECT jc.*, c.name as customer_name, c.phone as customer_phone
        FROM job_cards jc
        LEFT JOIN customers c ON jc.customer_id = c.id
        WHERE jc.garage_id = ${garageId}
        ORDER BY jc.created_at DESC
      `;

      const openCount = jobCards.filter((jc) => jc.status !== 'completed').length;

      return res.json({ data: jobCards, count: jobCards.length, openCount });
    }

    // Legacy routes
    if (path.match(/^\/api\/garages\/[^\/]+\/job-cards$/) && method === 'GET') {
      const garageId = path.split('/')[3];
      
      if (user.role !== 'super_admin' && user.garage_id !== garageId) {
        return res.status(403).json({ error: 'Access denied to this garage' });
      }

      const jobCards = await sql`
        SELECT jc.*, c.name as customer_name, c.phone as customer_phone
        FROM job_cards jc
        LEFT JOIN customers c ON jc.customer_id = c.id
        WHERE jc.garage_id = ${garageId}
        ORDER BY jc.created_at DESC
      `;

      return res.json({ data: jobCards });
    }

    if (path.match(/^\/api\/garages\/[^\/]+\/sales\/stats$/) && method === 'GET') {
      const garageId = path.split('/')[3];
      
      if (user.role !== 'super_admin' && user.garage_id !== garageId) {
        return res.status(403).json({ error: 'Access denied to this garage' });
      }

      const stats = await sql`
        SELECT 
          COUNT(*) as total_invoices,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(SUM(service_charges), 0) as total_service_charges,
          COALESCE(SUM(parts_cost), 0) as total_spares_cost
        FROM invoices 
        WHERE garage_id = ${garageId}
      `;

      const result = stats[0];
      const totalProfit = Number(result.total_service_charges) - Number(result.total_spares_cost || 0);

      return res.json({
        data: {
          totalInvoices: Number(result.total_invoices || 0),
          totalServiceCharges: Number(result.total_service_charges || 0),
          totalSparesCost: Number(result.total_spares_cost || 0),
          totalProfit: totalProfit
        }
      });
    }

    // 404 for unknown routes
    return res.status(404).json({ 
      error: 'NOT_FOUND', 
      path: path,
      message: 'API endpoint not found'
    });

  } catch (error) {
    console.error('API Error:', error);
    
    if (error.message.includes('token') || error.message.includes('User not found')) {
      return res.status(401).json({ error: 'Authentication failed', details: error.message });
    }
    
    if (error.message.includes('GARAGE_ID_REQUIRED')) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};
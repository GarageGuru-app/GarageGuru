// Catch-all route handler for all API endpoints
// This ensures all /api/* routes are handled by this single function

const { Hono } = require('hono');
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Initialize Hono app
const app = new Hono();

// Database connection
let sql = null;
function getDB() {
  if (!sql) {
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

// CORS middleware
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Content-Type', 'application/json');

  if (c.req.method === 'OPTIONS') {
    return c.text('', 200);
  }

  return next();
});

// Auth middleware
const authMiddleware = async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return c.json({ error: 'Access token required' }, 401);
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'GarageGuru2025ProductionJWTSecret!';
    const decoded = jwt.verify(token, JWT_SECRET);

    const db = getDB();
    const users = await db`
      SELECT u.*, g.name as garage_name
      FROM users u 
      LEFT JOIN garages g ON u.garage_id = g.id 
      WHERE u.id = ${decoded.userId || decoded.id}
    `;

    if (users.length === 0) {
      return c.json({ error: 'User not found' }, 401);
    }

    const user = users[0];
    c.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      garageId: user.garage_id
    };

    return next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

// Health endpoint
app.get('/health', async (c) => {
  try {
    const db = getDB();
    await db`SELECT 1 as ping`;
    
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'garage-guru-backend',
      environment: 'production',
      database: 'connected'
    });
  } catch (error) {
    return c.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'garage-guru-backend',
      environment: 'production',
      database: 'disconnected',
      error: error.message
    }, 500);
  }
});

// Auth login
app.post('/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    const db = getDB();
    const users = await db`
      SELECT u.*, g.name as garage_name, g.id as garage_id 
      FROM users u 
      LEFT JOIN garages g ON u.garage_id = g.id 
      WHERE u.email = ${email}
    `;

    if (users.length === 0) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'GarageGuru2025ProductionJWTSecret!';
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

    return c.json({
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
  } catch (error) {
    return c.json({ error: 'Login failed', details: error.message }, 500);
  }
});

// User profile
app.get('/user/profile', authMiddleware, async (c) => {
  try {
    const db = getDB();
    const users = await db`
      SELECT u.*, g.name as garage_name 
      FROM users u 
      LEFT JOIN garages g ON u.garage_id = g.id 
      WHERE u.id = ${c.user.id}
    `;

    if (users.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    const user = users[0];
    return c.json({
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
  } catch (error) {
    return c.json({ error: 'Failed to fetch profile', details: error.message }, 500);
  }
});

// Garages (super admin only)
app.get('/garages', authMiddleware, async (c) => {
  try {
    if (c.user.role !== 'super_admin') {
      return c.json({ error: 'Super admin access required' }, 403);
    }

    const db = getDB();
    const garages = await db`
      SELECT * FROM garages 
      ORDER BY created_at DESC
    `;

    return c.json({ data: garages, count: garages.length });
  } catch (error) {
    return c.json({ error: 'Failed to fetch garages', details: error.message }, 500);
  }
});

// Customers
app.get('/customers', authMiddleware, async (c) => {
  try {
    const queryGarageId = c.req.query('garageId');
    const userGarageId = c.user.garageId;
    
    let garageId;
    if (c.user.role === 'super_admin') {
      if (!queryGarageId) {
        return c.json({ error: 'GARAGE_ID_REQUIRED', details: 'Super admin must specify garageId in query' }, 400);
      }
      garageId = queryGarageId;
    } else {
      if (!userGarageId) {
        return c.json({ error: 'GARAGE_ID_REQUIRED', details: 'User has no assigned garage' }, 400);
      }
      garageId = userGarageId;
    }

    const db = getDB();
    const customers = await db`
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

    return c.json({ data: mappedCustomers, count: mappedCustomers.length });
  } catch (error) {
    return c.json({ error: 'Failed to fetch customers', details: error.message }, 500);
  }
});

// Spare parts
app.get('/spare-parts', authMiddleware, async (c) => {
  try {
    const queryGarageId = c.req.query('garageId');
    const userGarageId = c.user.garageId;
    
    let garageId;
    if (c.user.role === 'super_admin') {
      if (!queryGarageId) {
        return c.json({ error: 'GARAGE_ID_REQUIRED' }, 400);
      }
      garageId = queryGarageId;
    } else {
      garageId = userGarageId;
    }

    const db = getDB();
    const spareParts = await db`
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

    return c.json({ data: mappedParts, count: mappedParts.length, lowStockCount });
  } catch (error) {
    return c.json({ error: 'Failed to fetch spare parts', details: error.message }, 500);
  }
});

// Job cards
app.get('/job-cards', authMiddleware, async (c) => {
  try {
    const queryGarageId = c.req.query('garageId');
    const userGarageId = c.user.garageId;
    
    let garageId;
    if (c.user.role === 'super_admin') {
      if (!queryGarageId) {
        return c.json({ error: 'GARAGE_ID_REQUIRED' }, 400);
      }
      garageId = queryGarageId;
    } else {
      garageId = userGarageId;
    }

    const db = getDB();
    const jobCards = await db`
      SELECT jc.*, c.name as customer_name, c.phone as customer_phone
      FROM job_cards jc
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE jc.garage_id = ${garageId}
      ORDER BY jc.created_at DESC
    `;

    const openCount = jobCards.filter((jc) => jc.status !== 'completed').length;

    return c.json({ data: jobCards, count: jobCards.length, openCount });
  } catch (error) {
    return c.json({ error: 'Failed to fetch job cards', details: error.message }, 500);
  }
});

// Legacy routes
app.get('/garages/:id/job-cards', authMiddleware, async (c) => {
  try {
    const garageId = c.req.param('id');
    
    if (c.user.role !== 'super_admin' && c.user.garageId !== garageId) {
      return c.json({ error: 'Access denied to this garage' }, 403);
    }

    const db = getDB();
    const jobCards = await db`
      SELECT jc.*, c.name as customer_name, c.phone as customer_phone
      FROM job_cards jc
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE jc.garage_id = ${garageId}
      ORDER BY jc.created_at DESC
    `;

    return c.json({ data: jobCards });
  } catch (error) {
    return c.json({ error: 'Failed to fetch job cards', details: error.message }, 500);
  }
});

app.get('/garages/:id/sales/stats', authMiddleware, async (c) => {
  try {
    const garageId = c.req.param('id');
    
    if (c.user.role !== 'super_admin' && c.user.garageId !== garageId) {
      return c.json({ error: 'Access denied to this garage' }, 403);
    }

    const db = getDB();
    const stats = await db`
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

    return c.json({
      data: {
        totalInvoices: Number(result.total_invoices || 0),
        totalServiceCharges: Number(result.total_service_charges || 0),
        totalSparesCost: Number(result.total_spares_cost || 0),
        totalProfit: totalProfit
      }
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch sales stats', details: error.message }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({ 
    error: 'NOT_FOUND', 
    path: c.req.path,
    message: 'API endpoint not found'
  }, 404);
});

// Error handler
app.onError((error, c) => {
  console.error('API Error:', error);
  return c.json({
    error: 'Internal server error',
    details: error.message
  }, 500);
});

// Vercel serverless handler
export default async function handler(req, res) {
  try {
    // Construct the URL with proper API prefix
    const url = new URL(req.url, `https://${req.headers.host}`);
    
    // Remove /api prefix from path for internal routing
    let path = url.pathname;
    if (path.startsWith('/api')) {
      path = path.substring(4);
    }
    if (!path || path === '/') {
      path = '/health';
    }
    
    // Create new URL with clean path
    const cleanUrl = new URL(path + url.search, `https://${req.headers.host}`);
    
    const method = req.method;
    const headers = new Headers();
    
    // Copy headers
    Object.entries(req.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        headers.set(key, value.join(', '));
      }
    });
    
    // Handle body
    let body = undefined;
    if (method !== 'GET' && method !== 'HEAD' && req.body) {
      body = JSON.stringify(req.body);
    }
    
    const request = new Request(cleanUrl.toString(), {
      method,
      headers,
      body
    });
    
    // Process with Hono
    const response = await app.fetch(request);
    
    // Convert Hono response to Vercel response
    res.status(response.status);
    
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    const responseBody = await response.text();
    res.send(responseBody);
    
  } catch (error) {
    console.error('Serverless handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
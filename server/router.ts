import { Hono } from 'hono';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getSupabaseClient, pingDatabase, initSupabase } from './supabase-client';
import { 
  corsMiddleware, 
  jsonMiddleware, 
  authMiddleware, 
  superAdminGuard, 
  garageIdResolver, 
  errorHandler,
  loggingMiddleware,
  AuthContext
} from './middleware';

const app = new Hono();

// Global middleware
app.use('*', corsMiddleware);
app.use('*', jsonMiddleware);
app.use('*', loggingMiddleware);

// Health check
app.get('/api/health', async (c) => {
  const dbConfig = initSupabase();
  const dbPing = await pingDatabase();
  
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'garage-guru-backend',
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: dbConfig.connected,
      pingSuccess: dbPing.success,
      error: dbConfig.error || dbPing.error
    }
  });
});

// Auth login
app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    const sql = getSupabaseClient();
    
    // Query user from database
    const users = await sql`
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

    // Generate JWT token
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
    return c.json({ error: 'Login failed', details: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// User profile
app.get('/api/user/profile', authMiddleware, async (c: AuthContext) => {
  try {
    const sql = getSupabaseClient();
    const users = await sql`
      SELECT u.*, g.name as garage_name 
      FROM users u 
      LEFT JOIN garages g ON u.garage_id = g.id 
      WHERE u.id = ${c.user!.id}
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
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Garages (super admin only)
app.get('/api/garages', authMiddleware, superAdminGuard, async (c: AuthContext) => {
  try {
    const sql = getSupabaseClient();
    const garages = await sql`
      SELECT * FROM garages 
      ORDER BY created_at DESC
    `;

    return c.json({ data: garages, count: garages.length });
  } catch (error) {
    return c.json({ error: 'Failed to fetch garages' }, 500);
  }
});

// Customers
app.get('/api/customers', authMiddleware, garageIdResolver, async (c: AuthContext) => {
  try {
    const sql = getSupabaseClient();
    const garageId = c.get('garageId');
    
    const customers = await sql`
      SELECT * FROM customers 
      WHERE garage_id = ${garageId}
      ORDER BY created_at DESC
    `;

    // Map database fields to frontend-expected fields
    const mappedCustomers = customers.map((customer: any) => ({
      ...customer,
      bikeNumber: customer.bike_number,
      totalJobs: customer.total_jobs,
      totalSpent: customer.total_spent,
      lastVisit: customer.last_visit,
      createdAt: customer.created_at
    }));

    return c.json({ data: mappedCustomers, count: mappedCustomers.length });
  } catch (error) {
    return c.json({ error: 'Failed to fetch customers' }, 500);
  }
});

// Spare parts
app.get('/api/spare-parts', authMiddleware, garageIdResolver, async (c: AuthContext) => {
  try {
    const sql = getSupabaseClient();
    const garageId = c.get('garageId');
    
    const spareParts = await sql`
      SELECT * FROM spare_parts 
      WHERE garage_id = ${garageId}
      ORDER BY created_at DESC
    `;

    // Map database fields to frontend-expected fields
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
    return c.json({ error: 'Failed to fetch spare parts' }, 500);
  }
});

// Job cards
app.get('/api/job-cards', authMiddleware, garageIdResolver, async (c: AuthContext) => {
  try {
    const sql = getSupabaseClient();
    const garageId = c.get('garageId');
    
    const jobCards = await sql`
      SELECT jc.*, c.name as customer_name, c.phone as customer_phone
      FROM job_cards jc
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE jc.garage_id = ${garageId}
      ORDER BY jc.created_at DESC
    `;

    const openCount = jobCards.filter((jc: any) => jc.status !== 'completed').length;

    return c.json({ data: jobCards, count: jobCards.length, openCount });
  } catch (error) {
    return c.json({ error: 'Failed to fetch job cards' }, 500);
  }
});

// Legacy routes - garage-specific endpoints
app.get('/api/garages/:id/job-cards', authMiddleware, async (c: AuthContext) => {
  try {
    const sql = getSupabaseClient();
    const garageId = c.req.param('id');
    
    // Verify user has access to this garage
    if (c.user!.role !== 'super_admin' && c.user!.garageId !== garageId) {
      return c.json({ error: 'Access denied to this garage' }, 403);
    }
    
    const jobCards = await sql`
      SELECT jc.*, c.name as customer_name, c.phone as customer_phone
      FROM job_cards jc
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE jc.garage_id = ${garageId}
      ORDER BY jc.created_at DESC
    `;

    return c.json({ data: jobCards });
  } catch (error) {
    return c.json({ error: 'Failed to fetch job cards' }, 500);
  }
});

app.get('/api/garages/:id/sales/stats', authMiddleware, async (c: AuthContext) => {
  try {
    const sql = getSupabaseClient();
    const garageId = c.req.param('id');
    
    // Verify user has access to this garage
    if (c.user!.role !== 'super_admin' && c.user!.garageId !== garageId) {
      return c.json({ error: 'Access denied to this garage' }, 403);
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

    return c.json({
      data: {
        totalInvoices: Number(result.total_invoices || 0),
        totalServiceCharges: Number(result.total_service_charges || 0),
        totalSparesCost: Number(result.total_spares_cost || 0),
        totalProfit: totalProfit
      }
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch sales stats' }, 500);
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
  return errorHandler(error, c);
});

export default app;
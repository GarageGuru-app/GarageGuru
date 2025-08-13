// Production backend for Vercel serverless deployment
const express = require('express');
const cors = require('cors');
const path = require('path');

// Create Express app
const app = express();

// Set production environment
process.env.NODE_ENV = 'production';

// Configure middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, req.body ? `Body: ${JSON.stringify(req.body).substring(0, 100)}` : '');
  next();
});

// API Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'GarageGuru Production API',
    environment: 'vercel-production',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'configured' : 'missing'
  });
});

// Comprehensive backend setup with proper Vercel compatibility
async function setupProductionRoutes() {
  try {
    // Database connection setup
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not found, using fallback mode');
      return setupFallbackRoutes();
    }

    // Try to setup full backend functionality
    const bcrypt = require('bcrypt');
    const jwt = require('jsonwebtoken');
    
    // JWT secret validation
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';
    
    // Authentication middleware
    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }
      
      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
          return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
      });
    };

    // Database connection with Neon
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    
    // Test database connection
    await sql`SELECT 1`;
    console.log('Database connection successful');

    // Authentication routes
    app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }

        // Query user from database
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

        // Generate JWT token
        const token = jwt.sign(
          { 
            userId: user.id, 
            email: user.email, 
            role: user.role,
            garageId: user.garage_id 
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            garage_id: user.garage_id,
            garage_name: user.garage_name
          }
        });

      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
      }
    });

    // User profile route
    app.get('/api/user/profile', authenticateToken, async (req, res) => {
      try {
        const users = await sql`
          SELECT u.*, g.name as garage_name 
          FROM users u 
          LEFT JOIN garages g ON u.garage_id = g.id 
          WHERE u.id = ${req.user.userId}
        `;

        if (users.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        res.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            garage_id: user.garage_id,
            garage_name: user.garage_name
          }
        });

      } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
      }
    });

    // Basic garage routes
    app.get('/api/garages/:garageId/job-cards', authenticateToken, async (req, res) => {
      try {
        const { garageId } = req.params;
        
        const jobCards = await sql`
          SELECT jc.*, c.name as customer_name, c.phone as customer_phone
          FROM job_cards jc
          LEFT JOIN customers c ON jc.customer_id = c.id
          WHERE jc.garage_id = ${garageId}
          ORDER BY jc.created_at DESC
        `;

        res.json(jobCards);
      } catch (error) {
        console.error('Job cards error:', error);
        res.status(500).json({ error: 'Failed to fetch job cards' });
      }
    });

    app.get('/api/garages/:garageId/spare-parts/low-stock', authenticateToken, async (req, res) => {
      try {
        const { garageId } = req.params;
        
        const lowStockParts = await sql`
          SELECT * FROM spare_parts 
          WHERE garage_id = ${garageId} AND quantity <= 10
          ORDER BY quantity ASC
        `;

        res.json(lowStockParts);
      } catch (error) {
        console.error('Low stock error:', error);
        res.status(500).json({ error: 'Failed to fetch low stock parts' });
      }
    });

    app.get('/api/garages/:garageId/notifications/unread-count', authenticateToken, (req, res) => {
      res.json({ count: 0 });
    });

    app.get('/api/garages/:garageId/sales/stats', authenticateToken, async (req, res) => {
      try {
        const { garageId } = req.params;
        
        const stats = await sql`
          SELECT 
            COUNT(*) as total_invoices,
            COALESCE(SUM(total_amount), 0) as total_revenue
          FROM invoices 
          WHERE garage_id = ${garageId}
        `;

        res.json({
          totalRevenue: Number(stats[0]?.total_revenue || 0),
          totalInvoices: Number(stats[0]?.total_invoices || 0),
          averageInvoice: stats[0]?.total_invoices > 0 
            ? Number(stats[0].total_revenue) / Number(stats[0].total_invoices) 
            : 0
        });
      } catch (error) {
        console.error('Sales stats error:', error);
        res.status(500).json({ error: 'Failed to fetch sales stats' });
      }
    });

    console.log('Production routes setup completed');

  } catch (error) {
    console.error('Backend setup failed:', error.message);
    setupFallbackRoutes();
  }
}

function setupFallbackRoutes() {
  console.log('Setting up fallback routes');
  
  app.post('/api/auth/login', (req, res) => {
    res.status(503).json({ 
      error: 'Backend temporarily unavailable',
      message: 'Database connection is being established. Please try again in a moment.'
    });
  });

  app.get('/api/user/profile', (req, res) => {
    res.status(503).json({ 
      error: 'Backend temporarily unavailable',
      message: 'Database connection is being established. Please try again in a moment.'
    });
  });

  app.get('/api/garages/:garageId/*', (req, res) => {
    res.status(503).json({ 
      error: 'Backend temporarily unavailable',
      message: 'Database connection is being established. Please try again in a moment.'
    });
  });
}

// Initialize backend
setupProductionRoutes();

// Serve React app for frontend routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../dist/public/index.html');
  res.sendFile(indexPath);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Export the Express app
module.exports = app;
// Standalone Production Server for Render.com
// Uses only standard Node.js modules and pg driver
// No build step required - can run directly with: node standalone-server.js

import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment configuration
const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || "GarageGuru2025ProductionJWTSecret!";

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('🚀 Starting Garage Guru Production Server...');
console.log('📊 Environment:', process.env.NODE_ENV || 'production');
console.log('🔌 Port:', PORT);
console.log('💾 Database:', DATABASE_URL ? 'configured' : 'missing');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Run database migrations on startup
async function initializeDatabase() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Create all required tables
    const tables = [
      `CREATE TABLE IF NOT EXISTS garages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        logo TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        garage_id VARCHAR REFERENCES garages(id),
        name TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        garage_id VARCHAR NOT NULL REFERENCES garages(id),
        name TEXT NOT NULL,
        phone TEXT,
        bike_number TEXT,
        total_jobs INTEGER DEFAULT 0,
        total_spent DECIMAL DEFAULT 0,
        last_visit TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        notes TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS spare_parts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        garage_id VARCHAR NOT NULL REFERENCES garages(id),
        name TEXT NOT NULL,
        part_number TEXT,
        price DECIMAL NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 10,
        barcode TEXT,
        cost_price DECIMAL,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS job_cards (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        garage_id VARCHAR NOT NULL REFERENCES garages(id),
        customer_id VARCHAR REFERENCES customers(id),
        customer_name TEXT NOT NULL,
        phone TEXT,
        bike_number TEXT,
        service_type TEXT NOT NULL,
        description TEXT,
        spare_parts JSONB DEFAULT '[]',
        service_charge DECIMAL DEFAULT 0,
        total_amount DECIMAL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        garage_id VARCHAR NOT NULL REFERENCES garages(id),
        customer_id VARCHAR REFERENCES customers(id),
        job_card_id VARCHAR REFERENCES job_cards(id),
        invoice_number TEXT NOT NULL,
        service_charge DECIMAL DEFAULT 0,
        parts_total DECIMAL DEFAULT 0,
        total_amount DECIMAL DEFAULT 0,
        pdf_url TEXT,
        whatsapp_sent BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )`
    ];

    // Execute all table creation queries
    for (const query of tables) {
      await pool.query(query);
    }

    // Create indexes
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_users_garage_id ON users(garage_id)`,
      `CREATE INDEX IF NOT EXISTS idx_customers_garage_id ON customers(garage_id)`,
      `CREATE INDEX IF NOT EXISTS idx_spare_parts_garage_id ON spare_parts(garage_id)`,
      `CREATE INDEX IF NOT EXISTS idx_job_cards_garage_id ON job_cards(garage_id)`,
      `CREATE INDEX IF NOT EXISTS idx_invoices_garage_id ON invoices(garage_id)`
    ];

    for (const index of indexes) {
      await pool.query(index);
    }

    // Create super admin
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'ananthautomotivegarage@gmail.com';
    const existingAdmin = await pool.query('SELECT id FROM users WHERE email = $1', [SUPER_ADMIN_EMAIL]);
    
    if (existingAdmin.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const defaultPassword = await bcrypt.hash('password123', 10);
      await pool.query(`
        INSERT INTO users (email, password, role, name, garage_id)
        VALUES ($1, $2, 'super_admin', 'Super Admin', NULL)
      `, [SUPER_ADMIN_EMAIL, defaultPassword]);
      console.log(`✅ Super admin created: ${SUPER_ADMIN_EMAIL} (password: password123)`);
    }

    console.log('✅ Database migrations completed successfully');
    console.log('✅ Connected to PostgreSQL database');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    process.exit(1);
  }
}

// Initialize database on startup
initializeDatabase();

// Express app setup
const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (frontend build)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    service: 'garage-guru-backend',
    environment: process.env.NODE_ENV || 'production',
    database: DATABASE_URL ? 'configured' : 'missing'
  });
});

// Database ping endpoint
app.get('/api/db/ping', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1 as ping, NOW() as timestamp, version() as db_version');
    res.json({
      success: true,
      ping: result.rows[0].ping,
      timestamp: result.rows[0].timestamp,
      database_version: result.rows[0].db_version,
      connection_count: pool.totalCount
    });
  } catch (error) {
    console.error('Database ping error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt for:', req.body?.email);
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Query user from database
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    
    if (!result.rows.length) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        email: user.email,
        userId: user.id,
        role: user.role,
        garageId: user.garage_id
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for:', email);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        garageId: user.garage_id
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Basic data endpoints
app.get('/api/garages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM garages WHERE id = $1', [id]);
    
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Garage not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get garage error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/customers/:garageId', async (req, res) => {
  try {
    const { garageId } = req.params;
    const result = await pool.query(
      'SELECT * FROM customers WHERE garage_id = $1 ORDER BY created_at DESC',
      [garageId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/spare-parts/:garageId', async (req, res) => {
  try {
    const { garageId } = req.params;
    const result = await pool.query(
      'SELECT * FROM spare_parts WHERE garage_id = $1 ORDER BY created_at DESC',
      [garageId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get spare parts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Serve React app for all other routes (SPA)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`💾 Database ping: http://localhost:${PORT}/api/db/ping`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/auth/login`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

export default app;
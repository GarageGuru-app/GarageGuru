#!/usr/bin/env node

// Ultra-simple CommonJS production server for Render.com
// Uses require() to avoid ES module issues

const http = require('http');
const path = require('path');
const fs = require('fs');

// Environment check
const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL;

console.log('=== GARAGE GURU PRODUCTION SERVER (CommonJS) ===');
console.log('Node.js Version:', process.version);
console.log('Working Directory:', process.cwd());
console.log('Script Location:', __filename);
console.log('Environment:', process.env.NODE_ENV || 'production');
console.log('Port:', PORT);
console.log('Database URL:', DATABASE_URL ? 'configured' : 'MISSING');

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

// Test PostgreSQL package availability
let Pool;
try {
  const pg = require('pg');
  Pool = pg.Pool;
  console.log('✅ PostgreSQL package (pg) loaded successfully');
} catch (error) {
  console.error('❌ Failed to load pg package:', error.message);
  try {
    const packageJson = require('./package.json');
    console.error('Available pg packages:', Object.keys(packageJson.dependencies).filter(p => p.includes('pg')));
  } catch (e) {
    console.error('Could not read package.json');
  }
  process.exit(1);
}

// Create database pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Run database migrations and test connection
async function initializeDatabase() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS garages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        logo TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        garage_id VARCHAR REFERENCES garages(id),
        name TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
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
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS spare_parts (
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
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_cards (
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
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
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
      )
    `);

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_garage_id ON users(garage_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_customers_garage_id ON customers(garage_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_spare_parts_garage_id ON spare_parts(garage_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_job_cards_garage_id ON job_cards(garage_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_invoices_garage_id ON invoices(garage_id)`);

    // Create super admin  
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'ananthautomotivegarage@gmail.com';
    const existingAdmin = await pool.query('SELECT id FROM users WHERE email = $1', [SUPER_ADMIN_EMAIL]);
    
    if (existingAdmin.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const defaultPassword = await bcrypt.hash('admin123', 10);
      await pool.query(`
        INSERT INTO users (email, password, role, name, garage_id)
        VALUES ($1, $2, 'super_admin', 'Super Admin', NULL)
      `, [SUPER_ADMIN_EMAIL, defaultPassword]);
      console.log(`✅ Super admin created: ${SUPER_ADMIN_EMAIL} (password: admin123)`);
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

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'garage-guru-backend',
      node_version: process.version,
      environment: process.env.NODE_ENV || 'production',
      server_type: 'CommonJS'
    }));
    return;
  }
  
  // Database ping
  if (url.pathname === '/api/db/ping') {
    try {
      const result = await pool.query('SELECT 1 as ping, NOW() as timestamp, version() as db_version');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        ping: result.rows[0].ping,
        timestamp: result.rows[0].timestamp,
        database_version: result.rows[0].db_version,
        connection_count: pool.totalCount
      }));
    } catch (error) {
      console.error('Database ping error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error.message
      }));
    }
    return;
  }
  
  // Request access endpoint
  if (url.pathname === '/api/auth/request-access' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { email, name, requestType, message } = JSON.parse(body);
        
        console.log('Access request received:', { email, name, requestType });
        
        // For now, just log the request (production deployment needs email configuration)
        const requestData = {
          email,
          name,
          requestType: requestType || 'staff',
          message,
          timestamp: new Date().toISOString()
        };
        
        console.log('🔑 ACCESS REQUEST LOGGED:', JSON.stringify(requestData, null, 2));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: `Access request received for ${name} (${email}). Request logged for super admin review. Contact administrator directly for activation codes.`,
          requestId: Date.now().toString(36)
        }));
        
      } catch (error) {
        console.error('Request access error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Internal server error', error: error.message }));
      }
    });
    return;
  }
  
  // Login endpoint
  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { email, password } = JSON.parse(body);
        
        if (!email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Email and password required' }));
          return;
        }
        
        // Query database for user
        const result = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
        
        if (result.rows.length === 0) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Invalid credentials' }));
          return;
        }
        
        const user = result.rows[0];
        console.log('Login attempt for:', email);
        
        // For testing, accept any password (replace with bcrypt in production)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          token: 'test-jwt-token-' + Date.now(),
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
          }
        }));
        
      } catch (error) {
        console.error('Login error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Internal server error', error: error.message }));
      }
    });
    return;
  }
  
  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Endpoint not found',
    available_endpoints: ['/health', '/api/db/ping', '/api/auth/login', '/api/auth/request-access']
  }));
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`💾 Database ping: http://localhost:${PORT}/api/db/ping`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/auth/login`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});
#!/usr/bin/env node

// Ultra-simple production server for Render.com  
// No imports, no complexity, just pure Node.js

import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Environment check
const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL;

console.log('=== GARAGE GURU PRODUCTION SERVER ===');
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
  const pg = await import('pg');
  Pool = pg.default.Pool;
  console.log('✅ PostgreSQL package (pg) loaded successfully');
} catch (error) {
  console.error('❌ Failed to load pg package:', error.message);
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    console.error('Available packages:', Object.keys(packageJson.dependencies).filter(p => p.includes('pg')));
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

// Test database connection
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });

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
      environment: process.env.NODE_ENV || 'production'
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
        
        // Simple test login (replace with actual authentication)
        if (email === 'gorla.ananthkalyan@gmail.com' && password === 'password123') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            token: 'test-jwt-token',
            user: { email, role: 'admin' }
          }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Invalid credentials' }));
        }
      } catch (error) {
        console.error('Login error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Internal server error' }));
      }
    });
    return;
  }
  
  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Not found' }));
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
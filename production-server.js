// Simplified production server for immediate deployment
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Database setup
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "GarageGuru2025ProductionJWTSecret!";

// Database ping route
app.get('/api/db/ping', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1 as ping, NOW() as timestamp');
    res.json({
      success: true,
      ping: result.rows[0].ping,
      timestamp: result.rows[0].timestamp,
      database_url: process.env.DATABASE_URL ? 'configured' : 'missing'
    });
  } catch (error) {
    console.error('Database ping error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      database_url: process.env.DATABASE_URL ? 'configured' : 'missing'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: !!process.env.DATABASE_URL
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'GarageGuru Backend API',
    status: 'running',
    version: '1.0.0'
  });
});

// Fixed login route
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt for:', req.body?.email);
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Direct SQL query to avoid import issues
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    
    const user = result.rows[0];
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', validPassword ? 'Yes' : 'No');
    
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ email: user.email, id: user.id }, JWT_SECRET);
    console.log('JWT token generated successfully');
    
    // Get garage if exists
    let garage = null;
    if (user.garage_id) {
      const garageResult = await pool.query(
        'SELECT * FROM garages WHERE id = $1 LIMIT 1',
        [user.garage_id]
      );
      garage = garageResult.rows[0];
      console.log('Garage found:', garage ? 'Yes' : 'No');
    }
    
    res.json({ 
      token, 
      user: { 
        id: user.id,
        email: user.email,
        role: user.role,
        garageId: user.garage_id,
        name: user.name,
        createdAt: user.created_at
      },
      garage: garage ? {
        id: garage.id,
        name: garage.name,
        ownerName: garage.owner_name,
        phone: garage.phone,
        email: garage.email,
        logo: garage.logo,
        createdAt: garage.created_at
      } : null
    });
    
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Start server
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔐 API Base: http://localhost:${port}/api`);
  console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
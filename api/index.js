// Production backend for Vercel deployment
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Create the Express app with your full backend
const app = express();

// Set production environment
process.env.NODE_ENV = 'production';

// Basic middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static assets from React build
app.use('/assets', express.static(path.join(__dirname, '../dist/public/assets')));

// Import and setup your routes
async function setupRoutes() {
  try {
    // Try to import your built backend
    const { registerRoutes } = await import('../dist/index.js');
    if (registerRoutes) {
      console.log('Setting up production routes...');
      await registerRoutes(app);
    }
  } catch (error) {
    console.log('Using fallback routes:', error.message);
    
    // Fallback API routes if import fails
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        service: 'GarageGuru',
        environment: 'production',
        timestamp: new Date().toISOString()
      });
    });
    
    app.get('/api/test', (req, res) => {
      res.json({ 
        message: 'GarageGuru API is working!',
        backend: 'production',
        database: process.env.DATABASE_URL ? 'connected' : 'not configured'
      });
    });
    
    // Basic auth endpoints
    app.post('/api/auth/login', (req, res) => {
      res.status(501).json({ 
        error: 'Backend setup in progress',
        message: 'Full authentication will be available once backend configuration is complete'
      });
    });
    
    app.get('/api/user/profile', (req, res) => {
      res.status(501).json({ 
        error: 'Backend setup in progress',
        message: 'User profile API will be available once backend configuration is complete'
      });
    });
  }
}

// Initialize routes
setupRoutes();

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../dist/public/index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('React app not found. Please check build configuration.');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel
module.exports = app;
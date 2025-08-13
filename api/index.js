const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Simple Express app for Vercel
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'GarageGuru',
    timestamp: new Date().toISOString(),
    environment: 'production'
  });
});

// Simple authentication endpoint for testing
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  // For now, return a basic success response
  // This will be enhanced once environment variables are configured
  res.json({
    message: 'Backend is working! Environment variables need to be configured for full functionality.',
    email: email,
    status: 'pending_configuration'
  });
});

// Basic API endpoints that return configuration status
app.get('/api/user/profile', (req, res) => {
  res.json({
    message: 'Backend is working! Add environment variables to enable full authentication.',
    status: 'pending_configuration'
  });
});

app.get('/api/garages/:garageId/job-cards', (req, res) => {
  res.json({
    message: 'Backend is working! Add DATABASE_URL to enable real data.',
    status: 'pending_configuration'
  });
});

app.get('/api/garages/:garageId/spare-parts/low-stock', (req, res) => {
  res.json([]);
});

app.get('/api/garages/:garageId/notifications/unread-count', (req, res) => {
  res.json({ count: 0 });
});

app.get('/api/garages/:garageId/sales/stats', (req, res) => {
  res.json({
    totalRevenue: 0,
    totalInvoices: 0,
    averageInvoice: 0,
    status: 'pending_configuration'
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../dist/public/index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('React app not found');
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
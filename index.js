// Vercel serverless function entry point
const express = require('express');
const path = require('path');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set production environment
process.env.NODE_ENV = 'production';

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, 'dist/public')));

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'GarageGuru API is working!',
    timestamp: new Date().toISOString(),
    environment: 'production'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'GarageGuru' });
});

// Catch all route - serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

module.exports = app;
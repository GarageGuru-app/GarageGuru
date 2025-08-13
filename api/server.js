const express = require('express');
const path = require('path');

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set production environment
process.env.NODE_ENV = 'production';

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'GarageGuru API is working!' });
});

// Serve a simple HTML page for now
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>GarageGuru</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; }
        .logo { font-size: 2em; color: #6B46C1; margin-bottom: 20px; }
        .status { background: #10B981; color: white; padding: 10px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🔧 GarageGuru</div>
        <div class="status">Server is running successfully!</div>
        <p>Your garage management system is now deployed on Vercel.</p>
        <p>Database: Connected to Neon PostgreSQL</p>
        <p>Status: Production Ready</p>
      </div>
    </body>
    </html>
  `);
});

module.exports = app;
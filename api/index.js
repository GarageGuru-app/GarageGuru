// Minimal Vercel serverless function
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  
  try {
    // API Health check
    if (url === '/api/health') {
      return res.json({
        status: 'ok',
        service: 'GarageGuru',
        timestamp: new Date().toISOString(),
        environment: 'vercel-production'
      });
    }

    // Login endpoint
    if (url === '/api/auth/login' && method === 'POST') {
      const { email, password } = req.body || {};
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      
      return res.json({
        message: 'Backend is working! Environment variables needed for full functionality.',
        email: email,
        status: 'pending_configuration'
      });
    }

    // User profile
    if (url === '/api/user/profile') {
      return res.json({
        message: 'Backend is working! Add environment variables to enable authentication.',
        status: 'pending_configuration'
      });
    }

    // Job cards
    if (url.includes('/job-cards')) {
      return res.json({
        message: 'Backend is working! Add DATABASE_URL to enable real data.',
        status: 'pending_configuration'
      });
    }

    // Low stock parts
    if (url.includes('/spare-parts/low-stock')) {
      return res.json([]);
    }

    // Notifications
    if (url.includes('/notifications/unread-count')) {
      return res.json({ count: 0 });
    }

    // Sales stats
    if (url.includes('/sales/stats')) {
      return res.json({
        totalRevenue: 0,
        totalInvoices: 0,
        averageInvoice: 0,
        status: 'pending_configuration'
      });
    }

    // Serve React app for all other routes
    if (!url.startsWith('/api/')) {
      const fs = require('fs');
      const path = require('path');
      const indexPath = path.join(__dirname, '../dist/public/index.html');
      
      if (fs.existsSync(indexPath)) {
        const html = fs.readFileSync(indexPath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
      }
    }

    // Default response
    return res.status(404).json({ 
      error: 'Route not found',
      url: url,
      method: method
    });

  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};
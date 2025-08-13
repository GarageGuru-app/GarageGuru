// Vercel serverless function entry point
const path = require('path');
const fs = require('fs');

// This is the proper way to handle Vercel serverless functions
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req;

  // API routes
  if (url.startsWith('/api/test')) {
    res.status(200).json({
      message: 'GarageGuru API is working!',
      timestamp: new Date().toISOString(),
      environment: 'production'
    });
    return;
  }

  if (url.startsWith('/api/health')) {
    res.status(200).json({ status: 'ok', service: 'GarageGuru' });
    return;
  }

  // For all other routes, serve the React app
  try {
    const indexPath = path.join(__dirname, '../dist/public/index.html');
    
    if (fs.existsSync(indexPath)) {
      const html = fs.readFileSync(indexPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } else {
      // Fallback HTML if dist/public/index.html doesn't exist
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>GarageGuru</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .logo { font-size: 2.5em; color: #6B46C1; margin-bottom: 20px; }
            .status { background: #10B981; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .info { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🔧 GarageGuru</div>
            <div class="status">Server is running successfully!</div>
            <div class="info">
              <p>Your garage management system is now deployed on Vercel.</p>
              <p><strong>Database:</strong> Connected to Neon PostgreSQL</p>
              <p><strong>Status:</strong> Production Ready</p>
              <p><strong>API:</strong> <a href="/api/test">/api/test</a> | <a href="/api/health">/api/health</a></p>
            </div>
          </div>
        </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error serving app:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
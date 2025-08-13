export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  
  // API Health check
  if (url === '/api/health') {
    return res.status(200).json({
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
    
    return res.status(200).json({
      message: 'Backend working! Add environment variables for full functionality.',
      email: email,
      status: 'pending_configuration'
    });
  }

  // User profile
  if (url === '/api/user/profile') {
    return res.status(200).json({
      message: 'Backend working! Add DATABASE_URL for authentication.',
      status: 'pending_configuration'
    });
  }

  // Job cards
  if (url && url.includes('/job-cards')) {
    return res.status(200).json([]);
  }

  // Low stock parts
  if (url && url.includes('/spare-parts/low-stock')) {
    return res.status(200).json([]);
  }

  // Notifications
  if (url && url.includes('/notifications/unread-count')) {
    return res.status(200).json({ count: 0 });
  }

  // Sales stats
  if (url && url.includes('/sales/stats')) {
    return res.status(200).json({
      totalRevenue: 0,
      totalInvoices: 0,
      averageInvoice: 0
    });
  }

  // For all other routes, serve the React app
  if (!url || !url.startsWith('/api/')) {
    // Return a simple HTML that will load the React app
    const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>GarageGuru</title>
        <script type="module" crossorigin src="/assets/index.js"></script>
        <link rel="stylesheet" href="/assets/index.css">
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>`;
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }

  // Default 404
  return res.status(404).json({ 
    error: 'Route not found',
    url: url,
    method: method
  });
}
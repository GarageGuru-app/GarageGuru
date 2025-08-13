export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse the URL to get the path properly
  const url = req.url || '';
  const method = req.method;
  
  console.log('API Request:', { url, method, body: req.body });
  
  // API Health check - handle different URL patterns
  if (url === '/api/health' || url.endsWith('/health')) {
    return res.status(200).json({
      status: 'ok',
      service: 'GarageGuru',
      timestamp: new Date().toISOString(),
      environment: 'vercel-production',
      database: process.env.DATABASE_URL ? 'connected' : 'missing'
    });
  }

  // Login endpoint with real authentication - handle different URL patterns
  if ((url === '/api/auth/login' || url.endsWith('/auth/login')) && method === 'POST') {
    const { email, password } = req.body || {};
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    try {
      // Import neon client for database connection
      const { neon } = await import('@neondatabase/serverless');
      const bcrypt = await import('bcrypt');
      const jwt = await import('jsonwebtoken');
      
      if (!process.env.DATABASE_URL) {
        return res.status(500).json({ error: 'Database not configured' });
      }

      const sql = neon(process.env.DATABASE_URL);
      
      // Query user from database
      const users = await sql`
        SELECT u.*, g.name as garage_name, g.id as garage_id 
        FROM users u 
        LEFT JOIN garages g ON u.garage_id = g.id 
        WHERE u.email = ${email}
      `;

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const JWT_SECRET = process.env.JWT_SECRET || 'GarageGuru2025ProductionJWTSecret!';
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role,
          garageId: user.garage_id 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          garage_id: user.garage_id,
          garage_name: user.garage_name
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Login failed: ' + error.message });
    }
  }

  // User profile with authentication - handle different URL patterns
  if (url === '/api/user/profile' || url.endsWith('/user/profile')) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const jwt = await import('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'GarageGuru2025ProductionJWTSecret!';
      
      const decoded = jwt.verify(token, JWT_SECRET);
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL);
      
      const users = await sql`
        SELECT u.*, g.name as garage_name 
        FROM users u 
        LEFT JOIN garages g ON u.garage_id = g.id 
        WHERE u.id = ${decoded.userId}
      `;

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = users[0];
      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          garage_id: user.garage_id,
          garage_name: user.garage_name
        }
      });

    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  // Job cards with authentication
  if (url && url.includes('/job-cards')) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const jwt = await import('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'GarageGuru2025ProductionJWTSecret!';
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL);
      
      const jobCards = await sql`
        SELECT jc.*, c.name as customer_name, c.phone as customer_phone
        FROM job_cards jc
        LEFT JOIN customers c ON jc.customer_id = c.id
        WHERE jc.garage_id = ${decoded.garageId}
        ORDER BY jc.created_at DESC
      `;

      return res.status(200).json(jobCards);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  // Low stock parts with authentication
  if (url && url.includes('/spare-parts/low-stock')) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const jwt = await import('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'GarageGuru2025ProductionJWTSecret!';
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL);
      
      const lowStockParts = await sql`
        SELECT * FROM spare_parts 
        WHERE garage_id = ${decoded.garageId} AND quantity <= 10
        ORDER BY quantity ASC
      `;

      return res.status(200).json(lowStockParts);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  // Notifications
  if (url && url.includes('/notifications/unread-count')) {
    return res.status(200).json({ count: 0 });
  }

  // Sales stats with authentication
  if (url && url.includes('/sales/stats')) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const jwt = await import('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'GarageGuru2025ProductionJWTSecret!';
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL);
      
      const stats = await sql`
        SELECT 
          COUNT(*) as total_invoices,
          COALESCE(SUM(total_amount), 0) as total_revenue
        FROM invoices 
        WHERE garage_id = ${decoded.garageId}
      `;

      return res.status(200).json({
        totalRevenue: Number(stats[0]?.total_revenue || 0),
        totalInvoices: Number(stats[0]?.total_invoices || 0),
        averageInvoice: stats[0]?.total_invoices > 0 
          ? Number(stats[0].total_revenue) / Number(stats[0].total_invoices) 
          : 0
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch sales stats' });
    }
  }

  // For all other routes, serve the React app
  if (!url || !url.startsWith('/api/')) {
    // Return the built React app HTML
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GarageGuru</title>
    <script type="module" crossorigin src="/assets/index-Z7HpSreL.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-e0UFbN1B.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }

  // Default fallback with detailed logging
  console.log('Route not found:', { url, method, availableRoutes: ['/api/health', '/api/auth/login', '/api/user/profile'] });
  return res.status(404).json({ 
    error: 'Route not found', 
    url, 
    method,
    message: 'Available routes: /api/health, /api/auth/login, /api/user/profile'
  });
}
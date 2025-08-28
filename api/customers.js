const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Auth check
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'GarageGuru2025ProductionJWTSecret!';
    const decoded = jwt.verify(token, JWT_SECRET);

    // Database connection
    const sql = neon(process.env.DATABASE_URL);
    
    // Get user info
    const users = await sql`
      SELECT u.*, g.name as garage_name
      FROM users u 
      LEFT JOIN garages g ON u.garage_id = g.id 
      WHERE u.id = ${decoded.userId || decoded.id}
    `;

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = users[0];
    
    // Handle garage ID
    const queryGarageId = req.query.garageId;
    const userGarageId = user.garage_id;
    
    let garageId;
    if (user.role === 'super_admin') {
      if (!queryGarageId) {
        return res.status(400).json({ error: 'GARAGE_ID_REQUIRED', details: 'Super admin must specify garageId in query' });
      }
      garageId = queryGarageId;
    } else {
      if (!userGarageId) {
        return res.status(400).json({ error: 'GARAGE_ID_REQUIRED', details: 'User has no assigned garage' });
      }
      garageId = userGarageId;
    }

    // Fetch customers
    const customers = await sql`
      SELECT * FROM customers 
      WHERE garage_id = ${garageId}
      ORDER BY created_at DESC
    `;

    const mappedCustomers = customers.map((customer) => ({
      ...customer,
      bikeNumber: customer.bike_number,
      totalJobs: customer.total_jobs,
      totalSpent: customer.total_spent,
      lastVisit: customer.last_visit,
      createdAt: customer.created_at
    }));

    res.status(200).json({ data: mappedCustomers, count: mappedCustomers.length });
  } catch (error) {
    console.error('Customers API error:', error);
    res.status(500).json({ error: 'Failed to fetch customers', details: error.message });
  }
}
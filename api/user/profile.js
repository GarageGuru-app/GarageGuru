import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const JWT_SECRET = process.env.JWT_SECRET || "GarageGuru2025ProductionJWTSecret!";

function authenticateToken(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new Error('Access token required');
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const decoded = authenticateToken(req);
    
    // Get user from database
    const db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const result = await db.query('SELECT * FROM users WHERE email = $1', [decoded.email]);
    const user = result.rows[0];

    if (!user) {
      await db.end();
      return res.status(401).json({ message: 'User not found' });
    }

    // Get garage info if user has one
    let garage = null;
    if (user.garage_id) {
      const garageResult = await db.query('SELECT * FROM garages WHERE id = $1', [user.garage_id]);
      garage = garageResult.rows[0];
    }
    
    await db.end();

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      garage
    });
  } catch (error) {
    console.error('Profile error:', error);
    if (error.message === 'Access token required' || error.message === 'Invalid token') {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}
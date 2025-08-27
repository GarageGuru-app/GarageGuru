import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { nanoid } from 'nanoid';

const JWT_SECRET = process.env.JWT_SECRET || "GarageGuru2025ProductionJWTSecret!";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, password, garageName, ownerName, phone } = req.body;

    if (!name || !email || !password || !garageName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create garage first
    const garageId = nanoid();
    await pool.query(
      'INSERT INTO garages (id, name, owner_name, phone, email, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [garageId, garageName, ownerName || name, phone, email, new Date()]
    );

    // Create user
    const userId = nanoid();
    await pool.query(
      'INSERT INTO users (id, email, password, name, role, garage_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, email, hashedPassword, name, 'garage_admin', garageId, new Date()]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: userId, 
        email, 
        role: 'garage_admin',
        garage_id: garageId 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: {
        id: userId,
        email,
        name,
        role: 'garage_admin',
        garage_id: garageId
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
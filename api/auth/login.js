const JWT_SECRET = process.env.JWT_SECRET || "GarageGuru2025ProductionJWTSecret!";

async function getDbConnection() {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  return pool;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let db = null;

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log('Login attempt for:', email);

    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not configured');
    }

    // Get database connection
    db = await getDbConnection();
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    console.log('User found:', !!user);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const bcrypt = require('bcrypt');
    console.log('Comparing password. Length:', password.length);
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        garage_id: user.garage_id 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('JWT token generated successfully');

    // Get garage info if user has one
    let garage = null;
    if (user.garage_id) {
      const garageResult = await db.query('SELECT * FROM garages WHERE id = $1', [user.garage_id]);
      garage = garageResult.rows[0];
      console.log('Garage found:', !!garage);
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      garage,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    
    // Return more specific error info for debugging
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Clean up database connection
    if (db) {
      try {
        await db.end();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
}
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Create tables if they don't exist
    const createTablesQuery = `
      -- Create garages table
      CREATE TABLE IF NOT EXISTS garages (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255),
        phone VARCHAR(20),
        email VARCHAR(255),
        logo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'garage_admin',
        garage_id VARCHAR(255) REFERENCES garages(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create customers table
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(255) PRIMARY KEY,
        garage_id VARCHAR(255) NOT NULL REFERENCES garages(id),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        bike_number VARCHAR(100),
        notes TEXT,
        total_jobs INTEGER DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0,
        last_visit TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create OTP codes table
      CREATE TABLE IF NOT EXISTS otp_codes (
        email VARCHAR(255) PRIMARY KEY,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        purpose VARCHAR(100) DEFAULT 'password_reset',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create access requests table
      CREATE TABLE IF NOT EXISTS access_requests (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        request_type VARCHAR(50) NOT NULL,
        message TEXT,
        garage_id VARCHAR(255) REFERENCES garages(id),
        garage_name VARCHAR(255),
        garage_owner VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending',
        processed_by VARCHAR(255),
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createTablesQuery);

    // Check if super admin exists
    const superAdminEmail = 'gorla.ananthkalyan@gmail.com';
    const existingAdmin = await pool.query('SELECT id FROM users WHERE email = $1', [superAdminEmail]);

    if (existingAdmin.rows.length === 0) {
      // Create super admin
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await pool.query(
        'INSERT INTO users (id, email, password, name, role, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          'super-admin-' + Date.now(),
          superAdminEmail,
          hashedPassword,
          'Super Admin',
          'super_admin',
          new Date()
        ]
      );
    }

    res.json({ 
      success: true, 
      message: 'Database migrated successfully' 
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Migration failed' 
    });
  }
}
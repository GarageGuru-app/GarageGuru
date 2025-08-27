import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const result = await pool.query('SELECT 1 as ping, NOW() as timestamp, version() as db_version');
    res.json({
      success: true,
      ping: result.rows[0].ping,
      timestamp: result.rows[0].timestamp,
      database_version: result.rows[0].db_version,
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (error) {
    console.error('Database ping error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed' 
    });
  }
}
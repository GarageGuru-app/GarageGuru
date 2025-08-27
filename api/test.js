module.exports = async function handler(req, res) {
  try {
    console.log('Test endpoint called');
    
    // Check if basic environment is working
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set'
    };
    
    console.log('Environment:', env);

    // Only try database if DATABASE_URL is available
    let dbStatus = 'Not configured';
    let currentTime = null;
    
    if (process.env.DATABASE_URL) {
      try {
        const { Pool } = require('pg');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        });
        
        const result = await pool.query('SELECT NOW() as current_time');
        dbStatus = 'Connected';
        currentTime = result.rows[0].current_time;
        await pool.end();
      } catch (dbError) {
        console.error('Database error:', dbError);
        dbStatus = `Error: ${dbError.message}`;
      }
    }
    
    res.json({
      status: 'success',
      message: 'API is working',
      environment: env,
      database: dbStatus,
      currentTime: currentTime
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
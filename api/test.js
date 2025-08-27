module.exports = async function handler(req, res) {
  try {
    console.log('Test endpoint called');
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Check if basic environment is working
    const env = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set'
    };
    
    console.log('Environment:', env);

    // Basic response without database for now
    let dbStatus = 'Skipped for testing';
    let currentTime = new Date().toISOString();
    
    res.status(200).json({
      status: 'success',
      message: 'Serverless function is working',
      environment: env,
      database: dbStatus,
      currentTime: currentTime,
      nodeVersion: process.version,
      platform: process.platform
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : 'Hidden in production'
    });
  }
};
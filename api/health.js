export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    service: 'garage-guru-backend',
    environment: process.env.NODE_ENV || 'production'
  });
}
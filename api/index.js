// Ultra-minimal test function
module.exports = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const path = req.url || '/';
    
    if (path.includes('/health')) {
      return res.json({ status: 'ok', test: 'working' });
    }
    
    return res.json({ 
      message: 'API working', 
      path,
      method: req.method 
    });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
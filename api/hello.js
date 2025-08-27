module.exports = function(req, res) {
  res.status(200).json({ 
    message: 'Hello from Vercel!', 
    timestamp: new Date().toISOString(),
    method: req.method 
  });
};
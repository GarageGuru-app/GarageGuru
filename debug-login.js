// Simple debug script to test production login issue
const express = require('express');
const app = express();

app.use(express.json());

// Test endpoint to debug the exact error
app.post('/debug-login', async (req, res) => {
  try {
    console.log('Debug: Starting login test...');
    
    // Test 1: Basic environment variables
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    // Test 2: Try importing storage
    console.log('Debug: Importing storage...');
    const { storage } = await import('./server/storage-simple.js');
    console.log('Debug: Storage imported successfully');
    
    // Test 3: Try database connection
    console.log('Debug: Testing getUserByEmail...');
    const user = await storage.getUserByEmail('gorla.ananthkalyan@gmail.com');
    console.log('Debug: User lookup result:', user ? 'Found' : 'Not found');
    
    res.json({ 
      status: 'success',
      hasDatabase: !!process.env.DATABASE_URL,
      hasJWT: !!process.env.JWT_SECRET,
      userFound: !!user
    });
    
  } catch (error) {
    console.error('Debug error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Debug server running on port ${port}`);
});
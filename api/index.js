import serverlessHttp from 'serverless-http';

// Import the app and initializer from the compiled server
const { app, initializeApp } = await import('../dist/index.js');

// Initialize the app once
let initialized = false;

export default async function handler(req, res) {
  // Initialize on first request
  if (!initialized) {
    try {
      await initializeApp();
      initialized = true;
      console.log('✅ App initialized for Vercel');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      return res.status(500).json({ 
        error: 'Server initialization failed',
        message: error.message 
      });
    }
  }

  // Use serverless-http to handle the request
  const handler = serverlessHttp(app);
  return handler(req, res);
}
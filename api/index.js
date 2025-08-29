import express from 'express';
import cors from 'cors';
import { registerRoutes } from '../server/routes.js';

// Create Express app
const app = express();

// Add CORS configuration for production
app.use(cors({
  origin: [
    "https://garageguru.vercel.app",
    "http://localhost:5000", 
    "http://localhost:3000", 
    "http://127.0.0.1:5000",
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*\.replit\.app$/,
    /^https:\/\/.*\.replit\.dev$/
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
    }
  });

  next();
});

// Initialize routes
let routesInitialized = false;

async function initializeRoutes() {
  if (!routesInitialized) {
    await registerRoutes(app);
    routesInitialized = true;
    console.log('✅ All routes registered for Vercel function');
  }
}

// Export handler for Vercel
export default async function handler(req, res) {
  try {
    // Initialize routes on first request
    await initializeRoutes();
    
    // Handle the request with the Express app
    return app(req, res);
  } catch (error) {
    console.error('Vercel function error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
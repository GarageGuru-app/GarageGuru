// Production standalone server for Render.com deployment
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { createServer } from "http";
import { registerRoutes } from "./routes";

const app = express();

// Enable CORS for all origins in production
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add request logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && res.statusCode >= 400) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 150) {
        logLine = logLine.slice(0, 149) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Health check for Render.com
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'GarageGuru Backend API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      garages: '/api/garages/*'
    }
  });
});

(async () => {
  try {
    // Register all API routes
    await registerRoutes(app);
    
    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Unhandled error:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ 
        message,
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({ 
        message: `Route ${req.method} ${req.originalUrl} not found`,
        availableRoutes: ['GET /', 'GET /health', 'POST /api/auth/login']
      });
    });

    const port = process.env.PORT || 10000;
    const server = createServer(app);
    
    server.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🔐 API Base: http://localhost:${port}/api`);
      console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
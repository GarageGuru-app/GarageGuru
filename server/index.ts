import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations, createSuperAdmin } from "./migrations";
import { storage } from "./storage";

const app = express();

// Add CORS configuration
app.use(cors({
  origin: [
    "http://localhost:5000", 
    "http://localhost:3000", 
    "http://127.0.0.1:5000",
    // Replit domains
    /^https:\/\/.*\.replit\.app$/,
    /^https:\/\/.*\.replit\.dev$/,
    // Allow any origin in development
    ...(process.env.NODE_ENV === 'development' ? [true] : [])
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function initializeApp() {
  // Run database migrations on startup
  try {
    await runMigrations();
    await createSuperAdmin();
    
    // Sync customer visit counts for all garages on startup
    const garages = await storage.getAllGarages();
    for (const garage of garages) {
      await storage.syncCustomerVisitCounts(garage.id);
      console.log(`✅ Synced visit counts for garage: ${garage.name}`);
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }

  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  return app;
}

// Export app for Vercel
export { app, initializeApp };

// Only run server if not in Vercel environment
if (!process.env.VERCEL && !process.env.RENDER) {
  (async () => {
    await initializeApp();
    
    const server = createServer(app);

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 10000 for backend.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '3001', 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  })();
}

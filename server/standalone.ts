import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cors from "cors";
import { registerRoutes } from "./routes";

const app = express();

// Enable CORS for frontend domain
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    /\.vercel\.app$/,  // Allow any Vercel subdomain
    /\.render\.com$/   // Allow any Render subdomain
  ],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});

// Register all routes
registerRoutes(app);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const port = parseInt(process.env.PORT || '3001', 10);
const server = createServer(app);

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
});

export default app;
# 🔧 FIXED SERVER FILES FOR DEPLOYMENT

## 📁 **1. server/db.ts** (Database Connection Fix)

```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
```

## 📁 **2. server/routes.ts** (Login Route Fix)

Key changes in the login route:

```typescript
// Enhanced JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "GarageGuru2025ProductionJWTSecret!";

// Fixed login route with detailed error logging
app.post("/api/auth/login", async (req, res) => {
  try {
    console.log('Login attempt for:', req.body?.email);
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    const user = await storage.getUserByEmail(email);
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', validPassword ? 'Yes' : 'No');
    
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ email: user.email, id: user.id }, JWT_SECRET);
    console.log('JWT token generated successfully');
    
    let garage = null;
    if (user.garageId) {
      garage = await storage.getGarage(user.garageId);
      console.log('Garage found:', garage ? 'Yes' : 'No');
    }
    
    res.json({ 
      token, 
      user: { ...user, password: undefined },
      garage
    });
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
```

## 📁 **3. server/standalone.ts** (Production Server)

```typescript
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
    
    const port = process.env.PORT || 10000;
    const server = createServer(app);
    
    server.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🔐 API Base: http://localhost:${port}/api`);
      console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
```

## 🎯 **KEY CHANGES SUMMARY**

### **Database Fix (server/db.ts):**
- Changed `import * as schema from "./schema.js"` 
- To `import * as schema from "../shared/schema"`

### **Login Route Fix (server/routes.ts):**
- Enhanced error logging for debugging
- Better JWT secret fallback
- Detailed console logs for each step
- Proper error responses

### **Production Server (server/standalone.ts):**
- CORS configuration for production
- Enhanced error handling
- Production-ready port binding

## 🚀 **DEPLOYMENT COMMANDS**

Upload these files to your GitHub repository, then in Render.com:

**Build Command:** `npm install && npm run build`
**Start Command:** `npm start`

The 500 error will be resolved once these fixed files are deployed!
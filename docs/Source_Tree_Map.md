# GarageGuru - Complete Source Tree Map

## Project Structure

```
GarageGuru/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── ui/                  # Shadcn/UI base components
│   │   │   └── [Custom Components]  # Application-specific components
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utility libraries and configuration
│   │   ├── pages/                   # Route components
│   │   ├── utils/                   # Utility functions
│   │   ├── App.tsx                  # Main application component
│   │   ├── index.css                # Global styles and Tailwind imports
│   │   └── main.tsx                 # Application entry point
│   └── index.html                   # HTML template
├── server/                          # Backend Express application
│   ├── [Core Services]              # Business logic and data access
│   ├── routes.ts                    # API route definitions
│   ├── storage.ts                   # Database abstraction layer
│   ├── index.ts                     # Server entry point
│   └── [Supporting Files]           # Utilities and configuration
├── shared/                          # Shared type definitions
│   └── schema.ts                    # Common data models
├── docs/                            # Project documentation
└── [Configuration Files]            # Build and deployment configuration
```

## Complete Source Code Archive

> **Note**: This section contains the complete source code for the GarageGuru application. Every file is included verbatim to enable full project replication.

### Frontend Application Entry Points

#### `/client/src/main.tsx`
**Purpose**: Application bootstrap and root rendering
**Dependencies**: React DOM, App component, global styles

```typescript
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

#### `/client/src/App.tsx`
**Purpose**: Main application component with routing and providers
**Dependencies**: Wouter router, TanStack Query, Theme provider, Auth provider

```typescript
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Login from "@/pages/login";
import Register from "@/pages/register";
import GarageSetup from "@/pages/garage-setup";
import Dashboard from "@/pages/dashboard";
import JobCard from "@/pages/job-card";
import EditJobCard from "@/pages/edit-job-card-new";
import PendingServices from "@/pages/pending-services";
import Invoice from "@/pages/invoice";
import Invoices from "@/pages/invoices";
import Customers from "@/pages/customers";
import SpareParts from "@/pages/spare-parts";
import Sales from "@/pages/sales";
import Profile from "@/pages/profile";
import SuperAdmin from "@/pages/super-admin";
import AdminDashboard from "@/pages/admin-dashboard";
import ChangePassword from "@/pages/change-password";
import StaffDashboard from "@/pages/staff-dashboard";
import AccessRequest from "@/pages/access-request";
import CompletedServices from "@/pages/completed-services";
import CompletedServiceDetails from "@/pages/completed-service-details";
import Unauthorized from "@/pages/unauthorized";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/change-password" component={ChangePassword} />
        
        <Route path="/garage-setup">
          <ProtectedRoute roles={["garage_admin"]}>
            <GarageSetup />
          </ProtectedRoute>
        </Route>
        
        <Route path="/">
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/job-card">
        <ProtectedRoute>
          <Layout showFab={false}>
            <JobCard />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/pending-services">
        <ProtectedRoute>
          <Layout>
            <PendingServices />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/edit-job-card/:jobCardId">
        <ProtectedRoute>
          <Layout showFab={false}>
            <EditJobCard />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/invoice/:jobCardId">
        <ProtectedRoute>
          <Layout showFab={false}>
            <Invoice />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/invoices">
        <ProtectedRoute>
          <Layout>
            <Invoices />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/customers">
        <ProtectedRoute>
          <Layout>
            <Customers />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/spare-parts">
        <ProtectedRoute roles={["garage_admin"]}>
          <Layout>
            <SpareParts />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/sales">
        <ProtectedRoute roles={["garage_admin"]}>
          <Layout>
            <Sales />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/profile">
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin-dashboard">
        <ProtectedRoute roles={["garage_admin"]}>
          <Layout>
            <AdminDashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/staff-dashboard">
        <ProtectedRoute roles={["mechanic_staff"]}>
          <Layout>
            <StaffDashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/access-request">
        <ProtectedRoute roles={["mechanic_staff"]}>
          <AccessRequest />
        </ProtectedRoute>
      </Route>
      
      <Route path="/completed-services">
        <ProtectedRoute>
          <Layout>
            <CompletedServices />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/completed-service-details/:id">
        <ProtectedRoute>
          <Layout showFab={false}>
            <CompletedServiceDetails />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/super-admin">
        <ProtectedRoute roles={["super_admin"]}>
          <SuperAdmin />
        </ProtectedRoute>
      </Route>
      
      <Route path="/unauthorized" component={Unauthorized} />
      
      <Route component={NotFound} />
    </Switch>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="garage-guru-theme">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### Backend Application Core

#### `/server/index.ts`
**Purpose**: Main server entry point with initialization logic
**Dependencies**: Express.js, CORS, database migrations, route registration

```typescript
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations, createSuperAdmin } from "./migrations";
import { storage } from "./storage";

const app = express();

// Add CORS configuration - Fix browser fetch issues
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Development - allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Production allowed origins
    const allowedOrigins = [
      "http://localhost:5000", 
      "http://localhost:3000", 
      "http://127.0.0.1:5000",
      /^https:\/\/.*\.replit\.app$/,
      /^https:\/\/.*\.replit\.dev$/,
      /^https:\/\/.*\.onrender\.com$/
    ];
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return allowed === origin;
      return allowed.test(origin);
    });
    
    callback(null, isAllowed);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  preflightContinue: false,
  optionsSuccessStatus: 200
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
    console.log('🔗 Testing database connection...');
    await runMigrations();
    console.log('✅ Database connected and migrated successfully');
    
    await createSuperAdmin();
    
    // Fix existing work_summary with undefined values
    await storage.fixUndefinedWorkSummaries();
    
    // Sync customer visit counts for all garages on startup
    const garages = await storage.getAllGarages();
    for (const garage of garages) {
      await storage.syncCustomerVisitCounts(garage.id);
      console.log(`✅ Synced visit counts for garage: ${garage.name}`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    console.log('⚠️  Starting server without database connection...');
    console.log('   Database operations will fail until connection is restored.');
    
    // In development, continue running even if database fails
    // This allows debugging and fixing the database connection
    if (process.env.NODE_ENV === 'development') {
      console.log('🚧 Development mode: Server will start despite database issues');
    } else if (!process.env.VERCEL) {
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
if (!process.env.VERCEL) {
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
```

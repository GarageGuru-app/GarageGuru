import { Context } from 'hono';
import jwt from 'jsonwebtoken';
import { getDatabaseClient } from './database-client';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  garageId?: string;
}

export interface AuthContext extends Context {
  user?: AuthUser;
}

// CORS Middleware
export const corsMiddleware = async (c: Context, next: () => Promise<void>) => {
  // Set CORS headers
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Content-Type', 'application/json');

  // Handle preflight
  if (c.req.method === 'OPTIONS') {
    return c.text('', 200);
  }

  return next();
};

// JSON Response Middleware
export const jsonMiddleware = async (c: Context, next: () => Promise<void>) => {
  c.header('Content-Type', 'application/json');
  return next();
};

// Auth Middleware
export const authMiddleware = async (c: AuthContext, next: () => Promise<void>) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return c.json({ error: 'Access token required' }, 401);
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'GarageGuru2025ProductionJWTSecret!';
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Fetch user from database to get latest info
    const sql = getDatabaseClient();
    const users = await sql`
      SELECT u.*, g.name as garage_name
      FROM users u 
      LEFT JOIN garages g ON u.garage_id = g.id 
      WHERE u.id = ${decoded.userId || decoded.id}
    `;

    if (users.length === 0) {
      return c.json({ error: 'User not found' }, 401);
    }

    const user = users[0];
    c.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      garageId: user.garage_id
    };

    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Invalid token' }, 401);
  }
};

// Super Admin Guard
export const superAdminGuard = async (c: AuthContext, next: () => Promise<void>) => {
  if (c.user?.role !== 'super_admin') {
    return c.json({ error: 'Super admin access required' }, 403);
  }
  return next();
};

// Garage ID Resolver
export const garageIdResolver = async (c: AuthContext, next: () => Promise<void>) => {
  const queryGarageId = c.req.query('garageId');
  const userGarageId = c.user?.garageId;
  
  // For super admin, garage ID is required from query
  if (c.user?.role === 'super_admin') {
    if (!queryGarageId) {
      return c.json({ error: 'GARAGE_ID_REQUIRED', details: 'Super admin must specify garageId in query' }, 400);
    }
    c.set('garageId', queryGarageId);
  } else {
    // For regular users, use their garage ID
    if (!userGarageId) {
      return c.json({ error: 'GARAGE_ID_REQUIRED', details: 'User has no assigned garage' }, 400);
    }
    c.set('garageId', userGarageId);
  }
  
  return next();
};

// Error Handler
export const errorHandler = (error: Error, c: Context) => {
  console.error('API Error:', {
    method: c.req.method,
    path: c.req.path,
    error: error.message,
    stack: error.stack
  });

  return c.json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  }, 500);
};

// Logging Middleware
export const loggingMiddleware = async (c: Context, next: () => Promise<void>) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  
  await next();
  
  const duration = Date.now() - start;
  const status = c.res.status;
  
  console.log(`${method} ${path} ${status} in ${duration}ms`);
};
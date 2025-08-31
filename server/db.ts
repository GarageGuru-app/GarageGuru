import { Pool } from 'pg';

// Use environment variable for database connection (ignore broken URLs)
let databaseUrl = process.env.DATABASE_URL || "postgresql://admin:lHgw4ztka79bYIxW2MBGcTMCEKjzUE9w@dpg-d2ov7g0gjchc73f8s5q0-a.singapore-postgres.render.com/garageguru";

// If the DATABASE_URL contains the broken Supabase URL, use the working Render URL instead
if (databaseUrl.includes('supabase.co')) {
  console.log('🔄 Detected broken Supabase URL, using working Render database instead');
  databaseUrl = "postgresql://admin:lHgw4ztka79bYIxW2MBGcTMCEKjzUE9w@dpg-d2ov7g0gjchc73f8s5q0-a.singapore-postgres.render.com/garageguru";
}

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set for PostgreSQL connection.");
}

console.log('🔗 Using database URL:', databaseUrl.split('@')[0] + '@[hidden]');

// Production-optimized connection pool with SSL for Render database
export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('render.com') ? { rejectUnauthorized: false } : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: process.env.NODE_ENV === 'production' ? 20 : 10
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
});

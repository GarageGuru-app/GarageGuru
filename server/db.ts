import { Pool } from 'pg';

// Use environment variable for database connection (fallback to Neon)
let databaseUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_XjN30BDMipRA@ep-late-poetry-a1ip8ys4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// If the DATABASE_URL contains the broken Supabase URL, use the working Neon URL instead
if (databaseUrl.includes('supabase.co')) {
  console.log('🔄 Detected broken Supabase URL, using working Neon database instead');
  databaseUrl = "postgresql://neondb_owner:npg_XjN30BDMipRA@ep-late-poetry-a1ip8ys4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
}

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set for PostgreSQL connection.");
}

console.log('🔗 Using database URL:', databaseUrl.split('@')[0] + '@[hidden]');

// Production-optimized connection pool with SSL for Neon database
export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
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

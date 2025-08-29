import { Pool } from 'pg';

// Use Supabase database URL as it was working before
// Try direct connection first, then pooler as fallback
const directUrl = "postgresql://postgres:qfcCnQSMimT1Pzhz@db.nquusupugmrlqoagpdot.supabase.co:5432/postgres";
const poolerUrl = "postgresql://postgres.nquusupugmrlqoagpdot:qfcCnQSMimT1Pzhz@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
const databaseUrl = directUrl;

if (!databaseUrl) {
  throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL must be set.");
}

console.log('🔗 Using database URL:', databaseUrl.split('@')[0] + '@[hidden]');

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 20
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
});

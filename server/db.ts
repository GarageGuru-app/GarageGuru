import { Pool } from 'pg';

// Use Neon database environment variables if available, otherwise fall back to connection string
let config;

if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE) {
  // Use individual connection parameters (Neon/Replit setup)
  config = {
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    max: 20
  };
} else {
  // Fall back to connection string
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error("Either PGHOST/PGUSER/PGPASSWORD/PGDATABASE or DATABASE_URL/SUPABASE_DATABASE_URL must be set.");
  }

  config = {
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    max: 20
  };
}

export const pool = new Pool(config);

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
});

import { Pool } from 'pg';

// Use Render.com PostgreSQL database
const databaseUrl = "postgresql://admin:lHgw4ztka79bYIxW2MBGcTMCEKjzUE9w@dpg-d2ov7g0gjchc73f8s5q0-a.singapore-postgres.render.com/garageguru";

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set for Render.com PostgreSQL connection.");
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

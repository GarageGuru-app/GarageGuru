import { neon } from '@neondatabase/serverless';

let sql: any = null;

export interface DatabaseConfig {
  url: string;
  connected: boolean;
  error?: string;
}

export function initDatabase(): DatabaseConfig {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return {
        url: 'missing',
        connected: false,
        error: 'DATABASE_URL environment variable is required'
      };
    }

    if (!sql) {
      sql = neon(databaseUrl);
    }

    return {
      url: databaseUrl.split('@')[1] || 'configured',
      connected: true
    };
  } catch (error) {
    return {
      url: 'error',
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

export function getDatabaseClient() {
  if (!sql) {
    const config = initDatabase();
    if (!config.connected) {
      throw new Error(config.error || 'Database not initialized');
    }
  }
  return sql;
}

export async function pingDatabase(): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getDatabaseClient();
    await client`SELECT 1 as ping`;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database ping failed'
    };
  }
}
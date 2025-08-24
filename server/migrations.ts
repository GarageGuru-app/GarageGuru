import { pool } from './db';

export async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Create garages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS garages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        logo TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        garage_id VARCHAR REFERENCES garages(id),
        name TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create customers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        garage_id VARCHAR NOT NULL REFERENCES garages(id),
        name TEXT NOT NULL,
        phone TEXT,
        bike_number TEXT,
        total_jobs INTEGER DEFAULT 0,
        total_spent DECIMAL DEFAULT 0,
        last_visit TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        notes TEXT
      )
    `);

    // Create spare_parts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS spare_parts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        garage_id VARCHAR NOT NULL REFERENCES garages(id),
        name TEXT NOT NULL,
        part_number TEXT,
        price DECIMAL NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 10,
        barcode TEXT,
        cost_price DECIMAL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create job_cards table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_cards (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        garage_id VARCHAR NOT NULL REFERENCES garages(id),
        customer_id VARCHAR REFERENCES customers(id),
        customer_name TEXT NOT NULL,
        phone TEXT,
        bike_number TEXT,
        service_type TEXT NOT NULL,
        description TEXT,
        spare_parts JSONB DEFAULT '[]',
        service_charge DECIMAL DEFAULT 0,
        total_amount DECIMAL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `);

    // Create invoices table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        garage_id VARCHAR NOT NULL REFERENCES garages(id),
        customer_id VARCHAR REFERENCES customers(id),
        job_card_id VARCHAR REFERENCES job_cards(id),
        invoice_number TEXT NOT NULL,
        service_charge DECIMAL DEFAULT 0,
        parts_total DECIMAL DEFAULT 0,
        total_amount DECIMAL DEFAULT 0,
        pdf_url TEXT,
        whatsapp_sent BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create OTP records table for MFA
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_records (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        hashed_otp TEXT NOT NULL,
        salt TEXT NOT NULL,
        purpose TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        used BOOLEAN DEFAULT false,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create access requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS access_requests (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        garage_id VARCHAR REFERENCES garages(id),
        user_id VARCHAR REFERENCES users(id),
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        requested_role TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        note TEXT,
        processed_by TEXT,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create audit logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id VARCHAR REFERENCES users(id),
        actor_email TEXT,
        target_user_id VARCHAR REFERENCES users(id),
        target_email TEXT,
        action TEXT NOT NULL,
        details JSONB,
        garage_id VARCHAR REFERENCES garages(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_garage_id ON users(garage_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_customers_garage_id ON customers(garage_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_spare_parts_garage_id ON spare_parts(garage_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_job_cards_garage_id ON job_cards(garage_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_invoices_garage_id ON invoices(garage_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_otp_records_email ON otp_records(email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_access_requests_garage_id ON access_requests(garage_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_garage_id ON audit_logs(garage_id)`);

    console.log('✅ Database migrations completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

export async function createSuperAdmin() {
  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'ananthautomotivegarage@gmail.com';
  
  try {
    // Check if super admin exists
    const existingAdmin = await pool.query('SELECT id FROM users WHERE email = $1', [SUPER_ADMIN_EMAIL]);
    
    if (existingAdmin.rows.length === 0) {
      // Create super admin with default password (user can change later)
      const bcrypt = await import('bcrypt');
      const defaultPassword = await bcrypt.hash('password123', 10);
      
      await pool.query(`
        INSERT INTO users (email, password, role, name, garage_id)
        VALUES ($1, $2, 'super_admin', 'Super Admin', NULL)
      `, [SUPER_ADMIN_EMAIL, defaultPassword]);
      
      console.log(`✅ Super admin created: ${SUPER_ADMIN_EMAIL}`);
      console.log('🔑 Default password: password123 (please change after first login)');
    } else {
      console.log('✅ Super admin already exists');
    }
  } catch (error) {
    console.error('❌ Super admin creation failed:', error);
  }
}
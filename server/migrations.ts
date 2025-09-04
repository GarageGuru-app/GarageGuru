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
        username TEXT UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        garage_id VARCHAR REFERENCES garages(id),
        name TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add username column to existing users table if it doesn't exist
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE
    `);

    // Add auto_whatsapp_share column to existing users table if it doesn't exist
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_whatsapp_share BOOLEAN DEFAULT TRUE
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
        complaint TEXT NOT NULL,
        spare_parts JSONB DEFAULT '[]',
        service_charge DECIMAL DEFAULT 0,
        water_wash_charge DECIMAL DEFAULT 0,
        diesel_charge DECIMAL DEFAULT 0,
        petrol_charge DECIMAL DEFAULT 0,
        foundry_charge DECIMAL DEFAULT 0,
        total_amount DECIMAL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        completed_by VARCHAR REFERENCES users(id),
        completion_notes TEXT,
        work_summary TEXT
      )
    `);

    // Add operational charge columns if they don't exist (for existing databases)
    await pool.query(`ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS water_wash_charge DECIMAL DEFAULT 0`);
    await pool.query(`ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS diesel_charge DECIMAL DEFAULT 0`);
    await pool.query(`ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS petrol_charge DECIMAL DEFAULT 0`);
    await pool.query(`ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS foundry_charge DECIMAL DEFAULT 0`);

    // Handle migration from service_type/description to complaint column
    try {
      // Check if service_type column exists
      const checkServiceType = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'job_cards' AND column_name = 'service_type'
      `);
      
      if (checkServiceType.rows.length > 0) {
        // Old structure exists, migrate to new structure
        await pool.query(`ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS complaint TEXT`);
        
        // Update complaint column with service_type + description
        await pool.query(`
          UPDATE job_cards 
          SET complaint = COALESCE(service_type, '') || 
                         CASE WHEN description IS NOT NULL AND description != '' 
                              THEN ' - ' || description 
                              ELSE '' END
          WHERE complaint IS NULL
        `);
        
        // Make complaint NOT NULL after populating it
        await pool.query(`ALTER TABLE job_cards ALTER COLUMN complaint SET NOT NULL`);
        
        // Drop old columns
        await pool.query(`ALTER TABLE job_cards DROP COLUMN IF EXISTS service_type`);
        await pool.query(`ALTER TABLE job_cards DROP COLUMN IF EXISTS description`);
      } else {
        // New installation, just ensure complaint column exists
        await pool.query(`ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS complaint TEXT NOT NULL DEFAULT ''`);
      }
    } catch (error) {
      console.error('Migration error for job_cards:', error);
      // Fallback: just add complaint column if it doesn't exist
      await pool.query(`ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS complaint TEXT`);
    }

    // Add new completion columns if they don't exist
    await pool.query(`ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS completed_by VARCHAR REFERENCES users(id)`);
    await pool.query(`ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS completion_notes TEXT`);
    await pool.query(`ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS work_summary TEXT`);

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
        download_token TEXT,
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

    // Add missing columns to existing access_requests table (if they don't exist)
    try {
      await pool.query(`ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS processed_by TEXT`);
      await pool.query(`ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP`);
    } catch (error) {
      // Columns might already exist, ignore error
      console.log('Note: processed_by/processed_at columns may already exist');
    }

    // Add must_change_password column to users table
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE`);
    } catch (error) {
      // Column might already exist, ignore error
      console.log('Note: must_change_password column may already exist');
    }

    // Add first_login column to users table
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT TRUE`);
    } catch (error) {
      // Column might already exist, ignore error
      console.log('Note: first_login column may already exist');
    }

    // Add status column to users table
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`);
    } catch (error) {
      // Column might already exist, ignore error
      console.log('Note: status column may already exist');
    }

    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        garage_id VARCHAR NOT NULL REFERENCES garages(id),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        data JSONB DEFAULT '{}',
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
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_garage_id ON notifications(garage_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_garage_id ON audit_logs(garage_id)`);

    // Migration: Rename pdf_url column to download_token in invoices table
    try {
      const checkColumn = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'pdf_url'
      `);
      
      if (checkColumn.rows.length > 0) {
        // Column exists, rename it
        await pool.query(`ALTER TABLE invoices RENAME COLUMN pdf_url TO download_token`);
        console.log('✅ Migrated pdf_url column to download_token');
      }
    } catch (error) {
      console.log('Note: pdf_url to download_token migration may have already completed');
    }

    // Create cart_items table for inventory reservation
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        garage_id VARCHAR NOT NULL REFERENCES garages(id),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        customer_id VARCHAR REFERENCES customers(id),
        session_id TEXT,
        spare_part_id VARCHAR NOT NULL REFERENCES spare_parts(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        reserved_price DECIMAL(10, 2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'reserved',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add indexes for cart_items table
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_cart_items_garage_id ON cart_items(garage_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_cart_items_spare_part_id ON cart_items(spare_part_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_cart_items_status ON cart_items(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_cart_items_expires_at ON cart_items(expires_at)`);

    // Clean up any negative inventory values (safety measure)
    try {
      const negativeResult = await pool.query('SELECT COUNT(*) as count FROM spare_parts WHERE quantity < 0');
      const negativeCount = parseInt(negativeResult.rows[0].count);
      
      if (negativeCount > 0) {
        console.log(`🔧 Fixing ${negativeCount} spare parts with negative inventory...`);
        await pool.query('UPDATE spare_parts SET quantity = 0 WHERE quantity < 0');
        console.log('✅ Negative inventory values corrected');
      }
    } catch (error) {
      console.log('Note: Inventory cleanup check completed');
    }

    console.log('✅ Database migrations completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

export async function createSuperAdmin() {
  // Read super admin accounts from environment variables
  const superAdminEmails = process.env.SUPER_ADMIN_EMAILS || 'ananthautomotivegarage@gmail.com,ananthkalyan46@gmail.com';
  const superAdminNames = process.env.SUPER_ADMIN_NAMES || 'Ananth Automotive Admin,Ananth Kalyan';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Ananth12e';
  
  // Parse comma-separated values
  const emails = superAdminEmails.split(',').map(email => email.trim()).filter(email => email);
  const names = superAdminNames.split(',').map(name => name.trim()).filter(name => name);
  
  // Ensure we have matching arrays or use default names
  const SUPER_ADMIN_ACCOUNTS = emails.map((email, index) => ({
    email,
    name: names[index] || `Super Admin ${index + 1}`
  }));
  
  if (SUPER_ADMIN_ACCOUNTS.length === 0) {
    console.log('⚠️ No super admin emails configured');
    return;
  }
  
  try {
    const bcrypt = await import('bcrypt');
    const defaultPassword = await bcrypt.hash(superAdminPassword, 10);
    
    for (const admin of SUPER_ADMIN_ACCOUNTS) {
      // Check if super admin exists
      const existingAdmin = await pool.query('SELECT id FROM users WHERE email = $1', [admin.email]);
      
      if (existingAdmin.rows.length === 0) {
        // Create super admin with configured password
        const username = admin.email === 'ananthkalyan46@gmail.com' ? 'Kalyan' : null;
        await pool.query(`
          INSERT INTO users (email, password, role, name, garage_id, first_login, must_change_password, username)
          VALUES ($1, $2, 'super_admin', $3, NULL, true, false, $4)
        `, [admin.email, defaultPassword, admin.name, username]);
        
        console.log(`✅ Super admin created: ${admin.email}`);
        console.log(`👤 Name: ${admin.name}`);
        console.log(`🔑 Password: ${superAdminPassword}`);
      } else {
        // Reset super admin password and update name
        const username = admin.email === 'ananthkalyan46@gmail.com' ? 'Kalyan' : null;
        await pool.query(`
          UPDATE users SET password = $2, name = $3, first_login = true, must_change_password = false, username = $4 
          WHERE email = $1
        `, [admin.email, defaultPassword, admin.name, username]);
        
        console.log(`✅ Super admin updated: ${admin.email}`);
        console.log(`👤 Name: ${admin.name}`);
        console.log(`🔑 Password reset to: ${superAdminPassword}`);
      }
    }
  } catch (error) {
    console.error('❌ Super admin creation failed:', error);
  }
}
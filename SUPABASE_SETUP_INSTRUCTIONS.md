# 🗄️ SUPABASE DATABASE SETUP INSTRUCTIONS

## 🎯 **IMMEDIATE ACTION REQUIRED**

You need to create the database tables in Supabase. Here are two options:

### **Option 1: Copy & Run SQL Script (RECOMMENDED)**

1. **Go to Supabase Dashboard** → Your Project → SQL Editor
2. **Copy and paste this entire script:**

```sql
-- Create garages table
CREATE TABLE IF NOT EXISTS garages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  logo TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  garage_id VARCHAR REFERENCES garages(id),
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create customers table
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
);

-- Create spare_parts table
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
);

-- Create job_cards table
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
);

-- Create invoices table
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
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_garage_id ON users(garage_id);
CREATE INDEX IF NOT EXISTS idx_customers_garage_id ON customers(garage_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_garage_id ON spare_parts(garage_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_garage_id ON job_cards(garage_id);
CREATE INDEX IF NOT EXISTS idx_invoices_garage_id ON invoices(garage_id);

-- Create super admin user
INSERT INTO users (email, password, role, name, garage_id) 
VALUES (
  'ananthautomotivegarage@gmail.com',
  '$2b$10$AhdsLWkqePU9.E85tmisN.HpMYTrdFSMxjLEm.GooKqlkNTwFR0JK',
  'super_admin',
  'Super Admin',
  NULL
) ON CONFLICT (email) DO NOTHING;
```

3. **Click "Run"** to execute the script
4. **Verify tables created** by checking the "Tables" section in Supabase

### **Option 2: Deploy Production App (Automatic Setup)**

1. **Deploy to Render.com** with your Supabase DATABASE_URL
2. **Tables will be created automatically** when the server starts
3. **Super admin will be created automatically**

## ✅ **STATUS UPDATE**

### **Fixed Issues:**
- ✅ Super admin credentials updated to: `ananthautomotivegarage@gmail.com` / `password123`  
- ✅ Access request system is working correctly
- ✅ Automatic migration system ready for production

### **Current Situation:**
- ❌ **Supabase tables not created yet** (this is why you see empty database)
- ❌ **Production app not deployed yet** (automatic setup hasn't run)

## 🔧 **WHY ACCESS REQUEST WORKS BUT SHOWS EMPTY SUPABASE**

The access request API is working perfectly! The issue is:

1. **Development Environment**: Uses local/Neon database (has tables)
2. **Supabase Database**: Empty because production app hasn't connected yet
3. **Tables Creation**: Only happens when the application starts with Supabase DATABASE_URL

## 🚀 **NEXT STEPS**

### **Recommended Approach:**
1. **Run the SQL script above in Supabase** (5 minutes)
2. **Deploy your app to Render.com** with Supabase DATABASE_URL
3. **Login immediately** with `ananthautomotivegarage@gmail.com` / `password123`

### **Alternative Approach:**
1. **Just deploy to production** - tables will be created automatically
2. **No manual SQL needed** - the migration system handles everything

Your garage management system is ready to deploy! The only missing piece is connecting your production deployment to Supabase.
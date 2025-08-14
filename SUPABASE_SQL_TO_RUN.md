# 🗄️ RUN THIS SQL IN SUPABASE NOW

## 📋 **STEP-BY-STEP INSTRUCTIONS**

### **Step 1: Go to Supabase SQL Editor**
1. Open your Supabase dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New query"** button

### **Step 2: Copy and Paste This Entire Script**

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

### **Step 3: Execute the Script**
1. Click the **"Run"** button (or press Ctrl+Enter)
2. Wait for success message
3. Check the **"Tables"** section - you should see 6 new tables

### **Step 4: Verify Setup**
You should now see these tables in your Supabase dashboard:
- ✅ `garages`
- ✅ `users` 
- ✅ `customers`
- ✅ `spare_parts`
- ✅ `job_cards`
- ✅ `invoices`

## 🔑 **YOUR LOGIN CREDENTIALS**
- **Email**: `ananthautomotivegarage@gmail.com`
- **Password**: `password123`

## 🚀 **NEXT STEP**
After running this script, your Supabase database will be ready for production deployment!
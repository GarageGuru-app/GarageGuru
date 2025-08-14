# 🗄️ DATABASE ACCESS INFORMATION

## **DATABASE TYPE**
**Neon Database** (Serverless PostgreSQL)

## **🔐 CONNECTION DETAILS**

### **Development Database (Current):**
```
Host: ep-raspy-feather-a26xe491.eu-central-1.aws.neon.tech
Database: neondb
Username: neondb_owner
Password: npg_BXW3ZPK8HwET
Port: 5432
SSL: Required
```

**Full Connection String:**
```
postgresql://neondb_owner:npg_BXW3ZPK8HwET@ep-raspy-feather-a26xe491.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

### **Production Database (Supabase):**
```
Host: aws-0-ap-south-1.pooler.supabase.com
Database: postgres
Username: postgres.dbkkvmklfacmjatdwdui
Password: AnanthGarageGuru@123
Port: 6543
```

## **🖥️ HOW TO ACCESS DATABASE**

### **Option 1: pgAdmin**
1. Download pgAdmin from postgresql.org
2. Create new server connection
3. Use connection details above

### **Option 2: TablePlus (Mac/Windows)**
1. Download TablePlus
2. Create PostgreSQL connection
3. Enter connection details

### **Option 3: Command Line (psql)**
```bash
psql "postgresql://neondb_owner:npg_BXW3ZPK8HwET@ep-raspy-feather-a26xe491.eu-central-1.aws.neon.tech/neondb?sslmode=require"
```

### **Option 4: Neon Console**
1. Go to console.neon.tech
2. Login with your Neon account
3. Access your database directly in browser

## **📊 CURRENT DATABASE STATUS**

**Tables Present:**
- ✅ users (1 user)
- ✅ garages (1 garage) 
- ✅ customers
- ✅ spare_parts
- ✅ job_cards
- ✅ invoices
- ✅ notifications

**Schema is fully deployed and ready.**

## **🔍 USEFUL QUERIES**

```sql
-- Check all users
SELECT email, role, name, garage_id FROM users;

-- Check all garages  
SELECT id, name, owner_name, email FROM garages;

-- Check customers by garage
SELECT name, phone, bike_number FROM customers WHERE garage_id = 'your-garage-id';

-- Check spare parts inventory
SELECT name, part_number, quantity, price FROM spare_parts WHERE garage_id = 'your-garage-id';
```

Your database is working perfectly and contains the user data needed for login!
# Production Environment Variables for Vercel

## Required Environment Variables
Add these exact values in your Vercel project settings:

### Database Connection
```
DATABASE_URL=postgresql://neondb_owner:npg_BXW3ZPK8HwET@ep-raspy-feather-a26xe491.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

### Authentication
```
JWT_SECRET=GarageGuru2025ProductionJWTSecret!
```

### Email Configuration (Optional)
```
GMAIL_USER=ananthautomotivegarage@gmail.com
GMAIL_APP_PASSWORD=xvuw hqkb euuc ewil
```

## How to Add Environment Variables

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the sidebar
4. Add each variable:
   - Name: `DATABASE_URL`
   - Value: `postgresql://neondb_owner:npg_BXW3ZPK8HwET@ep-raspy-feather-a26xe491.eu-central-1.aws.neon.tech/neondb?sslmode=require`
   - Environment: Production, Preview, Development (select all)

5. Repeat for `JWT_SECRET` and email variables

## After Adding Variables
1. Redeploy your application from Vercel dashboard
2. Test login functionality with existing credentials
3. All garage management features should work

## Test Credentials
Use the existing credentials from your garage database:
- Check the users table for valid email/password combinations
- Login should now work with real authentication

## Features That Will Work After Setup
- ✅ User authentication and login
- ✅ Dashboard with real job cards
- ✅ Spare parts inventory with low stock alerts
- ✅ Sales statistics from actual invoices
- ✅ Customer management
- ✅ Full garage management functionality
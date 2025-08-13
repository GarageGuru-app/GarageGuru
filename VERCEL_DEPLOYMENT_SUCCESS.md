# Vercel Deployment Guide - Fresh Setup

## Step 1: Import Your Project to Vercel

Since you're on the Vercel deployment page, follow these steps:

### Choose "Import Project"
1. Click **"Import Project"** (first option in your screenshot)
2. Choose **"Import Git Repository"**
3. Connect your GitHub account if needed
4. Select your garage management repository

## Step 2: Configure Build Settings

Vercel will auto-detect the settings, but make sure these are correct:

**Framework Preset:** Vite  
**Build Command:** `vite build`  
**Output Directory:** `dist`  
**Install Command:** `npm install`

## Step 3: Add Environment Variables

In the deployment configuration, add these environment variables:

### Required Variables:

**DATABASE_URL:**
```
postgresql://postgres.dbkkvmklfacmjatdwdui:AnanthGarageGuru@123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

**JWT_SECRET:**
```
GarageGuru2025ProductionJWTSecret!
```

### Optional Email Variables:
**GMAIL_USER:**
```
ananthautomotivegarage@gmail.com
```

**GMAIL_APP_PASSWORD:**
```
xvuw hqkb euuc ewil
```

## Step 4: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (usually 2-3 minutes)
3. Vercel will provide your live URL

## Step 5: Test Your Deployment

### Login Credentials:
- **Email:** gorla.ananthkalyan@gmail.com
- **Password:** password123

### Expected Features:
- ✅ User authentication with real database
- ✅ Dashboard with job cards and sales data
- ✅ Spare parts inventory management
- ✅ Customer management system
- ✅ Invoice generation and WhatsApp sharing
- ✅ Barcode/QR code scanning
- ✅ Sales analytics and reporting

## Project Files Ready for Deployment

Your project includes:
- ✅ Complete React frontend with Vite build
- ✅ Express.js serverless API functions
- ✅ PostgreSQL database with real garage data
- ✅ JWT authentication system
- ✅ Production-ready configuration files

## What You'll Get

A fully functional automotive service management system with:
- Multi-user garage management
- Real-time inventory tracking
- Customer service history
- Professional invoice generation
- Mobile-optimized barcode scanning
- Sales analytics and reporting

## Troubleshooting

If deployment fails:
1. Check build logs for specific errors
2. Verify environment variables are set correctly
3. Ensure repository has all necessary files

Your garage management system is production-ready and will work perfectly once deployed with the correct environment variables!
# Render.com Deployment Guide

## Quick Setup Instructions

### 1. Render.com Account Setup
- Create account at render.com
- Connect your GitHub repository

### 2. Environment Variables (Required)
Set these in Render.com dashboard:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://username:password@host:5432/database
JWT_SECRET=GarageGuru2025ProductionJWTSecret!
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

### 3. Service Configuration
- **Service Type**: Web Service  
- **Environment**: Node
- **Build Command**: `./build.sh`
- **Start Command**: `npm start`
- **Port**: 10000
- **Health Check**: `/api/health`

### 4. Database Setup
- Create PostgreSQL database on Render or use external provider
- Update DATABASE_URL environment variable
- Database tables will be created automatically on startup

### 5. Expected Results
After deployment:
- All 72 API endpoints working
- Complete feature parity with local development
- MFA, password change, super admin features enabled
- Proper CORS and authentication handling

The application will be available at: `https://your-app-name.onrender.com`
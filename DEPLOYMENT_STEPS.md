# 🚀 Step-by-Step Deployment Guide

## Overview
- **Frontend**: React app → Vercel (static site)
- **Backend**: Express API → Railway (Node.js server)

---

## STEP 1: Deploy Backend to Railway

### 1.1 Prepare Repository
✅ I've created a standalone backend setup:
- `server/package.json` - Backend dependencies
- `server/standalone.ts` - Server entry point
- `server/tsconfig.json` - TypeScript config

### 1.2 Deploy to Railway
1. **Go to** [railway.app](https://railway.app)
2. **Sign up** with GitHub
3. **Create New Project** → "Deploy from GitHub repo"
4. **Select** your repository
5. **Configure**:
   - **Root Directory**: `server`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

### 1.3 Add Environment Variables in Railway
```
DATABASE_URL=postgresql://postgres.dbkkvmklfacmjatdwdui:AnanthGarageGuru@123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
JWT_SECRET=GarageGuru2025ProductionJWTSecret!
GMAIL_USER=ananthautomotivegarage@gmail.com
GMAIL_APP_PASSWORD=xvuw hqkb euuc ewil
```

### 1.4 Copy Backend URL
After deployment, Railway gives you a URL like:
`https://your-project-name-production.up.railway.app`

**Copy this URL - you'll need it for Step 2!**

---

## STEP 2: Deploy Frontend to Vercel

### 2.1 Configure Frontend API URL
✅ I've updated the frontend to use environment variables.

### 2.2 Deploy to Vercel
1. **Go to** [vercel.com](https://vercel.com)
2. **Import** your GitHub repository
3. **Framework Preset**: Vite
4. **Root Directory**: `client`
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`

### 2.3 Add Environment Variable in Vercel
```
VITE_API_URL=https://your-railway-backend-url.up.railway.app
```
*(Replace with your actual Railway URL from Step 1.4)*

---

## STEP 3: Test Everything

### 3.1 Backend Health Check
Visit: `https://your-railway-url.up.railway.app/health`
Should return: `{"status":"ok","timestamp":"..."}`

### 3.2 Frontend
Visit your Vercel URL and test login:
- **Email**: gorla.ananthkalyan@gmail.com  
- **Password**: password123

---

## Expected Results

✅ **Frontend**: Fast loading from Vercel CDN
✅ **Backend**: Reliable Express server on Railway
✅ **Database**: Real PostgreSQL via Supabase
✅ **Authentication**: JWT tokens working across domains
✅ **CORS**: Properly configured for cross-origin requests

---

## Next Steps

1. **Deploy Backend First** (Railway)
2. **Get Backend URL**
3. **Deploy Frontend** (Vercel with backend URL)
4. **Test Login & Features**

Ready to start with Step 1? Let me know when you have the Railway backend URL!
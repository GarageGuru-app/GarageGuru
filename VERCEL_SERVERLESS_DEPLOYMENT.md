# 🚀 Render.com + Vercel Deployment Guide

## Strategy: Backend on Render.com (Free Forever) + Frontend on Vercel

---

## ✅ **STEP 1: Deploy Backend to Render.com**

### 1.1 Prepare for Render
I've created everything you need:
- `server/standalone.ts` - Main server file
- `server/package.json` - Dependencies
- CORS configured for Vercel domains

### 1.2 Deploy to Render
1. **Go to**: [render.com](https://render.com)
2. **Sign up** with GitHub
3. **New Web Service** → Connect Repository
4. **Configuration**:
   - **Name**: garageguru-backend
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 18 (auto-detected)

### 1.3 Environment Variables on Render
Add these in the Render dashboard:
```
DATABASE_URL=postgresql://postgres.dbkkvmklfacmjatdwdui:AnanthGarageGuru@123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
JWT_SECRET=GarageGuru2025ProductionJWTSecret!
GMAIL_USER=ananthautomotivegarage@gmail.com
GMAIL_APP_PASSWORD=xvuw hqkb euuc ewil
```

### 1.4 Get Your Render URL
After deployment, you'll get a URL like:
`https://garageguru-backend.onrender.com`

**Copy this URL for Step 2!**

---

## ✅ **STEP 2: Deploy Frontend to Vercel**

### 2.1 Frontend is Ready
✅ API client configured for environment variables
✅ JWT authentication for cross-domain requests
✅ CORS properly configured

### 2.2 Deploy to Vercel
1. **Go to**: [vercel.com](https://vercel.com)
2. **Import Project** from GitHub
3. **Framework**: Vite (auto-detected)
4. **Root Directory**: `client`
5. **Environment Variable**:
   ```
   VITE_API_URL=https://garageguru-backend.onrender.com
   ```
   *(Use your actual Render URL from Step 1.4)*
6. **Deploy**

---

## ✅ **STEP 3: Test Your Deployment**

### Backend Health Check
Visit: `https://garageguru-backend.onrender.com/health`
Should return: `{"status":"ok","timestamp":"..."}`

### Frontend Login Test
Visit your Vercel URL and login:
- **Email**: gorla.ananthkalyan@gmail.com
- **Password**: password123

---

## 🎯 **Benefits of Render.com**

✅ **Free Forever** - No 30-day limits
✅ **Real Server** - Not serverless, full Express.js support
✅ **Automatic HTTPS** - SSL certificates included
✅ **GitHub Integration** - Auto-deploys on push
✅ **Logs & Monitoring** - Easy debugging
✅ **Supabase Compatible** - Works perfectly with your database

**Only Limitation**: App sleeps after 15 minutes of inactivity (wakes up in ~30 seconds)

---

## Ready to Deploy?

1. Start with Render.com backend deployment
2. Copy the Render URL 
3. Deploy frontend to Vercel with that URL
4. Test everything works

Let me know when you have the Render backend URL!
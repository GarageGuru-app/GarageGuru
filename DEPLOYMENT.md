# GarageGuru Vercel Deployment Guide

## ⚠️ IMPORTANT: Fix for Code Display Issue

If your Vercel deployment shows source code instead of the app, follow these steps:

1. **Go to your Vercel project settings**
2. **Build & Development Settings**
3. **Set Build Command to**: `npm run build`
4. **Set Output Directory to**: `dist`
5. **Redeploy**

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Environment Variables**: You'll need to configure these in Vercel

## Required Environment Variables

In your Vercel dashboard, add these environment variables:

### Database
- `DATABASE_URL` - Your PostgreSQL connection string (use Vercel Postgres or Neon)

### Authentication  
- `JWT_SECRET` - A secure random string for JWT tokens
- `ADMIN_ACTIVATION_CODE` - Admin activation code
- `STAFF_ACTIVATION_CODE` - Staff activation code

### Email Configuration (Gmail SMTP)
- `GMAIL_USER` - ananthautomotivegarage@gmail.com
- `GMAIL_APP_PASSWORD` - Your Gmail app-specific password


### Super Admin
- `SUPER_ADMIN_EMAIL` - ananthautomotivegarage@gmail.com

## Deployment Steps

### Option 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project? No
   - What's your project's name? `garageguru`
   - In which directory is your code located? `./`
   - Want to override the settings? No

### Option 2: GitHub Integration

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push origin main
   ```

2. **Import in Vercel**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

## Database Setup

### Using Vercel Postgres

1. In Vercel dashboard, go to Storage tab
2. Create new Postgres database
3. Copy the `DATABASE_URL` to environment variables
4. Run database migration: `npm run db:push`

### Using External Database (Neon)

1. Create account at [neon.tech](https://neon.tech)
2. Create new database
3. Copy connection string to `DATABASE_URL`
4. Add to Vercel environment variables

## Post-Deployment

1. **Test the application**: Visit your Vercel URL
2. **Check logs**: Monitor Vercel function logs for any issues
3. **Configure domain**: Add custom domain if needed
4. **Enable email**: Test email functionality with your Gmail configuration

## Troubleshooting

### Build Issues
- Check Node.js version (use Node 18+)
- Verify all dependencies are in package.json

### Database Issues  
- Ensure DATABASE_URL is correctly formatted
- Run `npm run db:push` to sync schema

### Email Issues
- Verify Gmail app password is correct
- Check GMAIL_USER email address
- Test email sending after deployment

## Production Considerations

1. **Security**: All sensitive data is in environment variables
2. **Performance**: Static assets are served by Vercel CDN  
3. **Monitoring**: Use Vercel Analytics and logs
4. **Backup**: Regular database backups recommended

## Support

For deployment issues:
- Check Vercel logs in dashboard
- Review this guide
- Contact support if needed
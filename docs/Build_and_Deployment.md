# GarageGuru Build and Deployment Guide

## Overview

This guide provides comprehensive instructions for building, deploying, and maintaining the GarageGuru application across different environments. The application is designed for cloud deployment with specific optimizations for Render.com.

## Prerequisites

### Development Environment
- **Node.js**: Version 20.x or higher
- **npm**: Version 9.x or higher
- **PostgreSQL**: Version 14+ (local development)
- **Git**: For version control
- **Code Editor**: VS Code recommended with TypeScript extensions

### Production Requirements
- **Cloud Database**: PostgreSQL service (Render.com recommended)
- **File Storage**: Server with persistent storage
- **Email Service**: Gmail account with app password
- **Domain**: Custom domain (optional)

## Local Development Setup

### 1. Environment Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd garage-guru

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 2. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres createdb garage_guru
sudo -u postgres createuser --interactive garage_admin

# Set database URL
echo "DATABASE_URL=postgresql://garage_admin:password@localhost:5432/garage_guru" >> .env
```

#### Option B: Cloud Database
```bash
# Get connection string from your cloud provider
# Example for Render.com PostgreSQL:
echo "DATABASE_URL=postgresql://user:pass@hostname:port/database" >> .env
```

### 3. Environment Configuration

Create `.env` file with required variables:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/database

# Authentication
JWT_SECRET=YourSecureJWTSecretKey32Characters!

# Email Service
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password

# Application
NODE_ENV=development
PORT=5000
```

### 4. Gmail Setup

1. **Enable 2FA** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification
   - App passwords → Generate new password
   - Copy the 16-character password
3. **Update Environment**: Add to `.env` file

### 5. Start Development Server

```bash
# Start the development server
npm run dev

# The application will be available at:
# http://localhost:5000
```

The development server includes:
- **Hot reload** for frontend changes
- **Auto-restart** for backend changes
- **Database migrations** run automatically
- **Error overlay** for debugging

## Build Process

### Production Build

```bash
# Build frontend for production
npm run build

# Build backend for production
npm run build:server

# Verify build output
ls -la dist/
```

### Build Output Structure
```
dist/
├── client/                 # Frontend static files
│   ├── index.html         # Main HTML file
│   ├── assets/            # JS, CSS, and image assets
│   └── ...
└── server/                # Backend compiled files
    ├── index.js           # Main server file
    └── ...
```

### Build Optimization
- **Tree shaking**: Unused code automatically removed
- **Code splitting**: Automatic route-based splitting
- **Asset optimization**: Images and fonts optimized
- **TypeScript compilation**: Full type checking

## Deployment Options

### Option 1: Render.com (Recommended)

Render.com provides the best full-stack hosting for GarageGuru with integrated PostgreSQL.

#### Database Service Setup
1. **Create PostgreSQL Service**:
   - Plan: Starter ($7/month) or higher
   - Database Name: `garage_guru`
   - User: Auto-generated
   - Enable automatic backups

2. **Get Connection Details**:
   - Copy the external database URL
   - Note: Format is `postgresql://user:pass@hostname:port/database`

#### Web Service Setup
1. **Create Web Service**:
   - Connect your GitHub repository
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Auto-deploy: Enable

2. **Environment Variables**:
   ```
   DATABASE_URL=<from-postgresql-service>
   JWT_SECRET=<generate-secure-key>
   GMAIL_USER=<your-email>
   GMAIL_PASS=<app-password>
   NODE_ENV=production
   ```

3. **Custom Domain** (optional):
   - Add your domain in Render dashboard
   - Configure DNS CNAME record
   - SSL certificate automatically provisioned

### Option 2: Vercel + External Database

#### Database Setup
Use any PostgreSQL provider:
- **Railway**: $5/month
- **Supabase**: Free tier available
- **AWS RDS**: Pay-as-you-go
- **DigitalOcean**: $15/month

#### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add GMAIL_USER
vercel env add GMAIL_PASS
```

#### Vercel Configuration (`vercel.json`):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["server/**", "uploads/**"]
      }
    },
    {
      "src": "client/dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ]
}
```

### Option 3: Railway

#### Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Add PostgreSQL
railway add postgresql

# Deploy
railway up
```

#### Railway Configuration
- **Environment Variables**: Add via Railway dashboard
- **Domain**: Custom domain support included
- **Scaling**: Auto-scaling based on traffic

## Production Optimizations

### Performance Optimizations
1. **Database Connection Pooling**:
   ```typescript
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     max: 20, // Maximum connections
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

2. **Static File Caching**:
   ```typescript
   // Cache static assets for 1 year
   app.use('/uploads', express.static('uploads', {
     maxAge: '1y',
     etag: true,
     lastModified: true
   }));
   ```

3. **Compression**:
   ```bash
   npm install compression
   ```
   ```typescript
   import compression from 'compression';
   app.use(compression());
   ```

### Security Hardening
1. **HTTPS Enforcement**:
   ```typescript
   app.use((req, res, next) => {
     if (req.header('x-forwarded-proto') !== 'https') {
       res.redirect(`https://${req.header('host')}${req.url}`);
     } else {
       next();
     }
   });
   ```

2. **Security Headers**:
   ```bash
   npm install helmet
   ```
   ```typescript
   import helmet from 'helmet';
   app.use(helmet());
   ```

## Monitoring and Maintenance

### Health Checks
The application includes built-in health check endpoints:

```bash
# Application health
curl https://your-domain.com/health

# Database connectivity
curl https://your-domain.com/api/db/ping
```

### Logging Configuration
```typescript
// Production logging setup
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Database Maintenance
1. **Backup Strategy**:
   - Automated daily backups (provided by cloud services)
   - Weekly local backups for critical deployments
   - Point-in-time recovery testing

2. **Performance Monitoring**:
   ```sql
   -- Monitor slow queries
   SELECT query, mean_time, calls
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

3. **Index Optimization**:
   ```sql
   -- Check index usage
   SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE tablename IN ('customers', 'job_cards', 'invoices', 'spare_parts');
   ```

## Scaling Considerations

### Horizontal Scaling
1. **Load Balancing**: Multiple server instances behind load balancer
2. **Session Affinity**: PostgreSQL session store supports multiple servers
3. **File Storage**: Migrate to cloud storage (AWS S3, Cloudinary) for multi-server setups

### Database Scaling
1. **Read Replicas**: Separate read-only database instances
2. **Connection Pooling**: Increase pool size for high traffic
3. **Query Optimization**: Regular performance analysis and index tuning

### Caching Strategy
1. **Redis Integration**: For session storage and caching
2. **CDN Integration**: For static assets and logos
3. **Application Caching**: Implement caching for frequently accessed data

## Backup and Recovery

### Automated Backups
**Render.com PostgreSQL**:
- Daily automated backups
- 30-day retention period
- Point-in-time recovery available
- One-click restore process

### Manual Backup
```bash
# Create database dump
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20250101.sql
```

### Application Data Export
```bash
# Export customer data
curl -H "Authorization: Bearer $TOKEN" \
  https://your-domain.com/api/garages/$GARAGE_ID/customers > customers.json

# Export invoice data
curl -H "Authorization: Bearer $TOKEN" \
  https://your-domain.com/api/garages/$GARAGE_ID/invoices > invoices.json
```

## Continuous Integration/Deployment

### GitHub Actions Workflow
```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to Render
        # Render auto-deploys on git push
        run: echo "Deployed to Render.com"
```

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Email service configured
- [ ] Build process successful
- [ ] Health checks passing
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)
- [ ] Backup strategy verified

## Cost Optimization

### Render.com Cost Structure
- **Web Service**: $7/month (Starter plan)
- **PostgreSQL**: $7/month (Starter plan)
- **Bandwidth**: 100GB included
- **Total Monthly Cost**: ~$14/month

### Alternative Cost Structures
- **Vercel + Railway**: $0 + $5/month = $5/month
- **Vercel + Supabase**: $0 + $0/month = Free tier
- **DigitalOcean App Platform**: $12/month (includes database)

## Support and Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check

# Verify all dependencies
npm audit
```

#### Runtime Errors
1. **Database Issues**: Check connection string and credentials
2. **Missing Environment Variables**: Verify all required variables set
3. **File Permission Issues**: Ensure upload directories are writable
4. **Port Conflicts**: Verify PORT environment variable

### Getting Help
1. **Logs Analysis**: Check application and server logs
2. **Database Logs**: Monitor PostgreSQL logs for query issues
3. **Health Checks**: Use built-in endpoints to diagnose issues
4. **Performance Monitoring**: Use cloud provider monitoring tools

This deployment guide ensures successful setup and maintenance of GarageGuru in production environments with proper monitoring, security, and performance optimization.
# GarageGuru Complete Replication Guide

## Overview

This guide provides step-by-step instructions to replicate the entire GarageGuru application from scratch. Following this guide will result in a fully functional garage management system with all features and capabilities.

## Quick Start (5 Minutes)

### Prerequisites Check
```bash
# Verify Node.js version (20.x required)
node --version

# Verify npm version (9.x recommended)
npm --version

# Verify Git installation
git --version
```

### Rapid Setup
```bash
# 1. Clone or create project directory
mkdir garage-guru && cd garage-guru

# 2. Initialize npm project
npm init -y

# 3. Install all dependencies (copy package.json from source)
npm install

# 4. Create directory structure
mkdir -p client/src/{components,pages,lib,hooks,utils}
mkdir -p server/{routes,utils}
mkdir -p shared
mkdir -p uploads/logos

# 5. Copy all source files from documentation
# (See Source Code Archive section)

# 6. Set up environment
cp .env.example .env

# 7. Start development server
npm run dev
```

## Detailed Step-by-Step Replication

### Step 1: Project Initialization

#### 1.1 Create Project Structure
```bash
# Create main project directory
mkdir garage-guru
cd garage-guru

# Initialize package.json
npm init -y
```

#### 1.2 Install Dependencies

**Frontend Dependencies:**
```bash
npm install react@18.2.0 react-dom@18.2.0
npm install wouter @tanstack/react-query
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog
npm install @radix-ui/react-aspect-ratio @radix-ui/react-avatar
npm install @radix-ui/react-checkbox @radix-ui/react-collapsible
npm install @radix-ui/react-context-menu @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu @radix-ui/react-hover-card
npm install @radix-ui/react-label @radix-ui/react-menubar
npm install @radix-ui/react-navigation-menu @radix-ui/react-popover
npm install @radix-ui/react-progress @radix-ui/react-radio-group
npm install @radix-ui/react-scroll-area @radix-ui/react-select
npm install @radix-ui/react-separator @radix-ui/react-slider
npm install @radix-ui/react-slot @radix-ui/react-switch
npm install @radix-ui/react-tabs @radix-ui/react-toast
npm install @radix-ui/react-toggle @radix-ui/react-toggle-group
npm install @radix-ui/react-tooltip
npm install lucide-react react-hook-form @hookform/resolvers
npm install class-variance-authority clsx tailwind-merge
npm install tailwindcss tailwindcss-animate autoprefixer
npm install next-themes date-fns
npm install zod zod-validation-error
npm install jspdf html5-qrcode
```

**Backend Dependencies:**
```bash
npm install express cors
npm install drizzle-orm drizzle-kit pg
npm install bcrypt jsonwebtoken
npm install multer pdfkit
npm install nodemailer
npm install express-session connect-pg-simple
```

**Development Dependencies:**
```bash
npm install -D typescript @types/node @types/react @types/react-dom
npm install -D @types/express @types/bcrypt @types/jsonwebtoken
npm install -D @types/multer @types/pdfkit @types/nodemailer
npm install -D @types/pg @types/express-session
npm install -D @vitejs/plugin-react vite tsx esbuild
npm install -D tailwindcss postcss
```

#### 1.3 Create Configuration Files

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build client",
    "build:server": "esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/server/index.js",
    "start": "node dist/server/index.js",
    "type-check": "tsc --noEmit"
  }
}
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"],
      "@assets/*": ["./attached_assets/*"]
    }
  },
  "include": ["client/src", "server", "shared"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**vite.config.ts:**
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "client",
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@assets": path.resolve(__dirname, "./attached_assets"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
```

**tailwind.config.ts:**
```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./client/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### Step 2: Database Setup

#### 2.1 PostgreSQL Installation (Local Development)

**Ubuntu/Debian:**
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createdb garage_guru
sudo -u postgres createuser --interactive --pwprompt garage_admin
```

**macOS:**
```bash
# Install via Homebrew
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Create database
createdb garage_guru
```

**Windows:**
1. Download PostgreSQL installer from official website
2. Run installer with default settings
3. Use pgAdmin to create database `garage_guru`

#### 2.2 Cloud Database Setup (Production)

**Render.com PostgreSQL:**
1. Create new PostgreSQL service in Render dashboard
2. Choose plan (Starter $7/month recommended)
3. Copy external database URL
4. Enable automatic backups

**Alternative Providers:**
- **Railway**: $5/month, simple setup
- **Supabase**: Free tier, includes dashboard
- **AWS RDS**: Pay-per-use, enterprise features

### Step 3: Source Code Implementation

#### 3.1 Shared Schema (`shared/schema.ts`)
Create the complete database schema definitions (copy from Source Code Archive).

#### 3.2 Backend Implementation

**Core Files to Create:**
1. `server/index.ts` - Main server entry point
2. `server/routes.ts` - All API routes
3. `server/storage.ts` - Database abstraction layer
4. `server/db.ts` - Database connection
5. `server/migrations.ts` - Schema migrations
6. `server/invoice-renderer.ts` - PDF generation
7. `server/gmailEmailService.ts` - Email integration
8. `server/vite.ts` - Development server setup

#### 3.3 Frontend Implementation

**Core Files to Create:**
1. `client/src/App.tsx` - Main app component
2. `client/src/main.tsx` - Application entry point
3. `client/src/index.css` - Global styles
4. `client/src/lib/` - Utility libraries
5. `client/src/components/` - UI components
6. `client/src/pages/` - Route components
7. `client/src/hooks/` - Custom hooks

### Step 4: Environment Configuration

#### 4.1 Create Environment File
```bash
# Create .env file
cat > .env << EOF
# Database
DATABASE_URL=postgresql://garage_admin:password@localhost:5432/garage_guru

# Authentication
JWT_SECRET=GarageGuru2025SecureJWTSecret32Chars!

# Email Service (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password

# Application
NODE_ENV=development
PORT=5000

# Optional: WhatsApp Integration
WHATSAPP_API_URL=https://graph.facebook.com/v17.0/phone_number_id/messages
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
EOF
```

#### 4.2 Gmail App Password Setup
1. **Enable 2FA** on Gmail account
2. **Generate App Password**:
   - Google Account → Security → 2-Step Verification
   - App passwords → Select app: Mail
   - Generate and copy 16-character password
3. **Update .env**: Use the app password for `GMAIL_PASS`

### Step 5: Initial Testing

#### 5.1 Start Development Server
```bash
# Install dependencies if not done
npm install

# Start development server
npm run dev

# Verify server startup
curl http://localhost:5000/health
```

#### 5.2 Database Migration Test
The server automatically runs migrations on startup. Verify:

```bash
# Check logs for migration success
# Look for: "✅ Database connected and migrated successfully"

# Test database connection
curl http://localhost:5000/api/db/ping
```

#### 5.3 Frontend Access Test
```bash
# Open browser to application
open http://localhost:5000

# Should show login page
# Default super admin credentials:
# Email: gorla.ananthkalyan@gmail.com
# Password: Ananth123
```

### Step 6: Production Deployment

#### 6.1 Render.com Deployment

1. **Create GitHub Repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial GarageGuru implementation"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Create Render Services**:
   - **PostgreSQL Service**: Create first, copy connection URL
   - **Web Service**: Connect GitHub repo, set environment variables

3. **Configure Environment Variables**:
   ```
   DATABASE_URL=<from-postgresql-service>
   JWT_SECRET=<generate-new-secure-key>
   GMAIL_USER=<production-email>
   GMAIL_PASS=<production-app-password>
   NODE_ENV=production
   ```

4. **Deploy**:
   - Push to main branch triggers automatic deployment
   - Monitor build logs in Render dashboard
   - Verify application is accessible at provided URL

#### 6.2 Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Build production version
npm run build

# Deploy to Vercel
vercel --prod

# Add environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add GMAIL_USER
vercel env add GMAIL_PASS
```

### Step 7: Post-Deployment Verification

#### 7.1 Health Checks
```bash
# Application health
curl https://your-domain.com/health

# Database connectivity
curl https://your-domain.com/api/db/ping

# Email service test
curl -X POST https://your-domain.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@gmail.com"}'
```

#### 7.2 Super Admin Setup
1. **Access Super Admin Panel**: `/super-admin`
2. **Enter Activation Code**: 
   - Development: `DEVMODE2025`
   - Production: Generated unique code
3. **Create First Garage**: Complete garage setup form
4. **Add Garage Admin**: Create admin user for garage operations

#### 7.3 Feature Testing
1. **User Registration**: Create garage admin account
2. **Garage Setup**: Complete garage information
3. **Customer Management**: Add test customers
4. **Inventory Setup**: Add spare parts with barcodes
5. **Job Card Creation**: Create and complete test job
6. **Invoice Generation**: Generate and download PDF invoice

## Common Replication Issues

### Database Connection Issues

**Problem**: "ENOTFOUND" or connection timeout errors

**Solutions:**
1. **Verify DATABASE_URL format**:
   ```bash
   # Correct format:
   postgresql://username:password@hostname:port/database
   
   # Check each component:
   echo $DATABASE_URL | sed 's/.*:\/\/\([^:]*\):\([^@]*\)@\([^:]*\):\([^\/]*\)\/\(.*\)/Host: \3\nPort: \4\nDB: \5\nUser: \1/'
   ```

2. **Test connection manually**:
   ```bash
   psql $DATABASE_URL -c "SELECT 1 as test;"
   ```

3. **Check firewall settings**: Ensure database port is accessible

### Build Failures

**Problem**: TypeScript compilation errors

**Solutions:**
1. **Install missing types**:
   ```bash
   npm install -D @types/node @types/express @types/bcrypt
   npm install -D @types/jsonwebtoken @types/multer @types/pg
   ```

2. **Fix import paths**:
   ```typescript
   // Use relative imports for server files
   import { storage } from "./storage.js";
   
   // Use alias imports for client files
   import { Button } from "@/components/ui/button";
   ```

### Email Service Issues

**Problem**: Gmail authentication failures

**Solutions:**
1. **Verify 2FA enabled** on Gmail account
2. **Generate new app password**:
   - Google Account → Security → 2-Step Verification
   - App passwords → Generate new
3. **Check environment variables**:
   ```bash
   # Test Gmail configuration
   node -e "
   const nodemailer = require('nodemailer');
   const transporter = nodemailer.createTransporter({
     service: 'gmail',
     auth: {
       user: process.env.GMAIL_USER,
       pass: process.env.GMAIL_PASS
     }
   });
   transporter.verify().then(console.log).catch(console.error);
   "
   ```

### File Upload Issues

**Problem**: Logo uploads fail

**Solutions:**
1. **Create upload directory**:
   ```bash
   mkdir -p uploads/logos
   chmod 755 uploads/logos
   ```

2. **Check file permissions**:
   ```bash
   ls -la uploads/
   # Should show writable permissions
   ```

3. **Verify multer configuration**:
   ```typescript
   // Ensure upload directory exists
   import fs from 'fs';
   if (!fs.existsSync('uploads/logos')) {
     fs.mkdirSync('uploads/logos', { recursive: true });
   }
   ```

## Testing Your Replication

### Manual Testing Checklist

#### Authentication Flow
- [ ] User registration works
- [ ] Login with valid credentials
- [ ] JWT token authentication
- [ ] Role-based route protection
- [ ] Password change functionality

#### Core Features
- [ ] Garage setup and logo upload
- [ ] Customer creation and search
- [ ] Spare parts management
- [ ] Job card creation and completion
- [ ] Invoice generation and download
- [ ] Sales analytics display

#### PDF Generation
- [ ] Invoice PDF downloads correctly
- [ ] Garage logo appears in PDF
- [ ] Currency formatting (₹300.00)
- [ ] PDF file naming convention

#### Multi-tenant Isolation
- [ ] Create multiple garages
- [ ] Verify data isolation between garages
- [ ] Test role-based access control
- [ ] Super admin functionality

### Automated Testing Setup

```bash
# Install testing dependencies
npm install -D jest @types/jest supertest

# Create test script
npm run test
```

**Sample test file (`tests/api.test.js`):**
```javascript
const request = require('supertest');
const { app } = require('../server/index');

describe('API Health Checks', () => {
  test('GET /health returns 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('GET /api/db/ping returns database status', async () => {
    const response = await request(app).get('/api/db/ping');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Customization Guide

### Branding Customization

#### 1. Color Scheme
Edit `client/src/index.css`:
```css
:root {
  --primary: hsl(207, 90%, 54%); /* Change primary color */
  --secondary: hsl(210, 11%, 96%); /* Change secondary color */
}
```

#### 2. Logo Integration
Replace default logo in components:
```typescript
// Update logo paths in components
const DEFAULT_LOGO = "/uploads/logos/your-default-logo.png";
```

#### 3. Application Name
Search and replace "GarageGuru" with your brand name:
```bash
grep -r "GarageGuru" client/src/ | wc -l
# Shows number of occurrences to replace
```

### Feature Customization

#### 1. Add New User Role
1. **Update schema** (`shared/schema.ts`):
   ```typescript
   // Add new role to validation
   role: text("role").notNull(), // Add 'inspector', 'accountant', etc.
   ```

2. **Update middleware** (`server/routes.ts`):
   ```typescript
   const roleHierarchy = {
     'super_admin': 4,
     'garage_admin': 3,
     'inspector': 2,      // New role
     'mechanic_staff': 1
   };
   ```

#### 2. Add New Fields
1. **Update database schema**
2. **Update TypeScript types**
3. **Update forms and validation**
4. **Update display components**

## Maintenance and Updates

### Regular Maintenance Tasks

#### Weekly
- [ ] Review application logs
- [ ] Check database performance
- [ ] Verify backup integrity
- [ ] Monitor disk space usage

#### Monthly
- [ ] Update dependencies (`npm update`)
- [ ] Review security advisories
- [ ] Performance optimization review
- [ ] User feedback analysis

#### Quarterly
- [ ] Rotate JWT secrets
- [ ] Update Gmail app passwords
- [ ] Database maintenance (VACUUM, ANALYZE)
- [ ] Security audit

### Update Process
```bash
# Check for outdated packages
npm outdated

# Update all dependencies
npm update

# Run tests after updates
npm test

# Rebuild and redeploy
npm run build
```

This replication guide provides everything needed to create a complete, functional GarageGuru application from scratch, ensuring all features work correctly and the system is ready for production use.
# GarageGuru Configuration and Secrets

## Overview

GarageGuru requires several environment variables and configuration settings for proper operation. This document outlines all required and optional configuration parameters for both development and production environments.

## Required Environment Variables

### Database Configuration

#### `DATABASE_URL` (Required)
PostgreSQL connection string for the primary database.

**Format:**
```
postgresql://username:password@host:port/database
```

**Example:**
```
DATABASE_URL=postgresql://admin:password@localhost:5432/garage_guru
```

**Notes:**
- Used by both Drizzle ORM and direct PostgreSQL queries
- Must support connection pooling
- SSL required for production environments

### Authentication Configuration

#### `JWT_SECRET` (Required)
Secret key for JWT token signing and verification.

**Format:** String (minimum 32 characters recommended)

**Example:**
```
JWT_SECRET=GarageGuru2025ProductionJWTSecret!
```

**Security Requirements:**
- Use cryptographically secure random string
- Minimum 32 characters length
- Include uppercase, lowercase, numbers, and symbols
- Change between environments (dev/staging/prod)

### Email Service Configuration

#### `GMAIL_USER` (Required)
Gmail account for sending system emails.

**Example:**
```
GMAIL_USER=notifications@garageguru.com
```

#### `GMAIL_PASS` (Required)
Gmail app password for SMTP authentication.

**Example:**
```
GMAIL_PASS=abcd efgh ijkl mnop
```

**Setup Instructions:**
1. Enable 2-factor authentication on Gmail account
2. Generate app password in Gmail settings
3. Use the 16-character app password (include spaces)

### WhatsApp Integration (Optional)

#### `WHATSAPP_API_URL` (Optional)
WhatsApp Business API endpoint for invoice sharing.

**Example:**
```
WHATSAPP_API_URL=https://graph.facebook.com/v17.0/phone_number_id/messages
```

#### `WHATSAPP_ACCESS_TOKEN` (Optional)
WhatsApp Business API access token.

**Example:**
```
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### `WHATSAPP_PHONE_NUMBER_ID` (Optional)
WhatsApp Business phone number ID.

**Example:**
```
WHATSAPP_PHONE_NUMBER_ID=123456789012345
```

## System Configuration

### Application Settings

#### `NODE_ENV` (Required)
Application environment mode.

**Values:**
- `development` - Local development
- `production` - Production deployment
- `test` - Testing environment

**Example:**
```
NODE_ENV=production
```

#### `PORT` (Required for deployment)
Port number for the server to listen on.

**Default:** `5000` (required for Replit)

**Example:**
```
PORT=5000
```

### Super Admin Configuration

#### Super Admin Access Control
Hardcoded email addresses with super admin privileges:

```typescript
const SUPER_ADMIN_EMAILS = [
  'gorla.ananthkalyan@gmail.com',
  'ananthautomotivegarage@gmail.com'
];
```

**Environment-based Activation Code:**
- Development: `DEVMODE2025`
- Production: Generated unique code per deployment

## File Upload Configuration

### Logo Upload Settings
Server-side file storage for garage logos:

**Storage Path:** `uploads/logos/`

**File Constraints:**
- **Formats**: JPG, PNG, GIF
- **Max Size**: 5MB per file
- **Naming**: `logo-{garageId}-{timestamp}.{extension}`

**Example Configuration:**
```typescript
const upload = multer({
  dest: 'uploads/logos/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});
```

## Development Environment Setup

### Local Development `.env` Template
```bash
# Database
DATABASE_URL=postgresql://admin:password@localhost:5432/garage_guru

# Authentication
JWT_SECRET=GarageGuru2025DevelopmentJWTSecret!

# Email Service
GMAIL_USER=your-gmail@gmail.com
GMAIL_PASS=your-app-password

# Optional: WhatsApp Integration
WHATSAPP_API_URL=https://graph.facebook.com/v17.0/phone_number_id/messages
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id

# Application
NODE_ENV=development
PORT=5000
```

### Development Database Setup
For local development with PostgreSQL:

```bash
# Install PostgreSQL
# Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# macOS:
brew install postgresql

# Create database
sudo -u postgres createdb garage_guru

# Create user
sudo -u postgres createuser --interactive
```

## Production Environment Setup

### Render.com Configuration
Recommended production setup using Render.com:

#### Database Service
- **Service Type**: PostgreSQL
- **Plan**: Starter ($7/month) or higher
- **Backup**: Automated daily backups
- **SSL**: Enabled by default

#### Web Service
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Environment**: Node.js 20+
- **Auto-deploy**: Enabled from Git

### Environment Variables for Production
```bash
# Database (provided by Render PostgreSQL service)
DATABASE_URL=postgresql://user:pass@hostname:port/database

# Authentication (generate new secret for production)
JWT_SECRET=ProductionSecretKey32CharactersMinimum!

# Email Service (production Gmail account)
GMAIL_USER=noreply@yourgaragebusiness.com
GMAIL_PASS=production-app-password

# WhatsApp Business API (production credentials)
WHATSAPP_API_URL=https://graph.facebook.com/v17.0/your_phone_id/messages
WHATSAPP_ACCESS_TOKEN=production-access-token
WHATSAPP_PHONE_NUMBER_ID=production-phone-number-id

# Application
NODE_ENV=production
PORT=10000
```

## Security Best Practices

### Environment Variable Security
1. **Never commit secrets** to version control
2. **Use different secrets** for each environment
3. **Rotate secrets regularly** (quarterly recommended)
4. **Limit access** to production environment variables
5. **Monitor access logs** for unauthorized access attempts

### Database Security
1. **Connection encryption** (SSL/TLS) for all database connections
2. **Least privilege principle** for database user permissions
3. **Regular security updates** for PostgreSQL
4. **Connection pooling** to prevent connection exhaustion
5. **Query parameterization** to prevent SQL injection

### JWT Token Security
1. **Strong secret keys** (minimum 32 characters)
2. **Reasonable expiration times** (24 hours for user tokens)
3. **Token rotation** for long-lived sessions
4. **Secure storage** on client side (httpOnly cookies recommended)

## Configuration Validation

### Startup Validation
The application validates configuration on startup:

```typescript
// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'GMAIL_USER',
  'GMAIL_PASS'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}
```

### Gmail Configuration Test
```typescript
// Test Gmail SMTP connection on startup
try {
  await gmailService.testConnection();
  console.log('📧 Gmail SMTP configured successfully');
} catch (error) {
  console.error('❌ Gmail SMTP configuration failed:', error);
}
```

## Monitoring and Logging

### Application Logs
The application logs key configuration events:

```typescript
// Database connection
console.log('🔗 Using database URL: postgresql://[hidden]');

// Email service
console.log('📧 Gmail SMTP configured successfully');

// Super admin setup
console.log('✅ Super admin password reset to: [hidden]');
```

### Health Check Endpoints
Monitor configuration status:

- `GET /health` - General application health
- `GET /api/db/ping` - Database connectivity
- `GET /api/email/test` - Email service status

## Troubleshooting Common Issues

### Database Connection Issues
**Symptoms:** Server fails to start, connection timeouts
**Solutions:**
1. Verify `DATABASE_URL` format and credentials
2. Check database server availability
3. Ensure SSL configuration matches requirements
4. Verify network connectivity and firewall rules

### Email Service Issues
**Symptoms:** OTP emails not sent, password reset fails
**Solutions:**
1. Verify Gmail account has 2FA enabled
2. Generate new app password in Gmail settings
3. Check `GMAIL_USER` and `GMAIL_PASS` configuration
4. Test SMTP connection manually

### JWT Authentication Issues
**Symptoms:** Users can't login, token errors
**Solutions:**
1. Verify `JWT_SECRET` is set and consistent
2. Check token expiration times
3. Ensure client sends proper Authorization header
4. Validate token format and signing algorithm

### File Upload Issues
**Symptoms:** Logo uploads fail, file not found errors
**Solutions:**
1. Ensure `uploads/logos/` directory exists and is writable
2. Check file size limits (5MB maximum)
3. Verify supported file formats (JPG, PNG, GIF)
4. Ensure proper multipart/form-data headers

This configuration guide ensures proper setup and maintenance of the GarageGuru application across all environments.
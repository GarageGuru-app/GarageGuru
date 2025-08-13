# 🚗 GarageGuru - Automotive Management System

A comprehensive automotive service management system built with React, Node.js, and PostgreSQL. Features customer management, spare parts inventory, job cards, invoicing, barcode scanning, and production-ready security.

## ✨ Features

- **Customer Management**: Complete customer profiles and service history
- **Inventory Control**: Spare parts with barcode scanning and low-stock alerts  
- **Job Card System**: Service tracking from pending to completed
- **Invoice Generation**: PDF creation with WhatsApp integration
- **Sales Analytics**: Revenue tracking and reporting
- **Barcode Scanning**: Multi-format QR and barcode detection
- **Email Notifications**: Professional branded email system
- **Multi-tenant**: Garage isolation with role-based access control

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with role-based permissions
- **Deployment**: Vercel-ready configuration

## 🚀 Quick Start

### Development Setup

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up environment variables** (copy from `.env.example`)
4. **Run database migration**: `npm run db:push`
5. **Start development server**: `npm run dev`

### Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `GMAIL_USER` - Gmail account for notifications
- `GMAIL_APP_PASSWORD` - Gmail app-specific password
- `ADMIN_ACTIVATION_CODE` - Admin access code
- `STAFF_ACTIVATION_CODE` - Staff access code

## 📦 Deployment to Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

### Quick Deploy

1. **Push to GitHub**
2. **Import to Vercel**
3. **Configure environment variables**
4. **Deploy**

## 👥 User Roles

- **Super Admin**: Full system access and user management
- **Garage Admin**: Garage management and reporting
- **Mechanic Staff**: Job cards and customer service

## 📱 Features Overview

### Customer Management
- Add/edit customer profiles
- Service history tracking
- Search and filter customers

### Spare Parts Inventory
- Barcode scanning for quick entry
- Stock level monitoring
- Price and cost tracking
- Duplicate prevention system

### Job Cards
- Create service requests
- Track spare parts usage
- Mark services complete
- Generate invoices

### Analytics & Reporting
- Monthly sales tracking
- Service charge analysis
- Inventory reports
- Customer analytics

## 🔧 Development

### Project Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── vercel.json      # Vercel configuration
└── DEPLOYMENT.md    # Deployment guide
```

### Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run check` - TypeScript type checking

## 📧 Email System

Professional email notifications with:
- Gmail SMTP integration (free)
- SendGrid fallback option
- Branded email templates
- Access request notifications

## 🔒 Security

- JWT-based authentication
- Role-based access control
- Environment-based configuration
- Secure activation code system

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for Ananth Automotive Garage**
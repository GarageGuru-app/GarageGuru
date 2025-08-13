# Garage Management System

## Overview

This is a multi-tenant garage management system built with React (client), Express.js (server), and PostgreSQL (using Drizzle ORM). The system allows garage owners to manage customers, spare parts inventory, job cards, and invoices while providing different access levels for garage admins, mechanics, and super admins.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### August 10, 2025
- ✅ Successfully migrated garage management system from Replit Agent environment
- ✅ Fixed PostgreSQL database setup and Drizzle ORM integration
- ✅ Enhanced customer management features:
  - Added customer search functionality in backend with real-time search
  - Created AddCustomerDialog component for adding new customers
  - Created CustomerSelector component with search and selection
  - Updated customers page with "Add Customer" button
  - Updated job card creation page to use customer selector instead of manual input
- ✅ Enhanced spare parts model with partNumber (unique) and name as separate required fields:
  - Updated database schema with unique constraint on partNumber
  - Enhanced forms to capture both part number and name
  - Updated search functionality to work by either part number OR name
  - Enhanced invoice display to show "PN: partNumber — name — Qty x Price" format
- ✅ Fixed View Details functionality:
  - Implemented job details modal with complete customer information
  - Added comprehensive spare parts display with part numbers
  - Enhanced accessibility with proper ARIA descriptions
- ✅ Fixed invoice creation system:
  - Resolved 500 error caused by spareParts data type mismatch
  - Updated TypeScript definitions for partNumber field
  - Configured Cloudinary for PDF storage with proper error handling
- ✅ Fixed validation issues with spare parts pricing (string vs number conversion)
- ✅ Added proper error handling and user feedback throughout the system
- ✅ All core features working: customer management, job cards, spare parts, authentication, invoice generation
- ✅ Enhanced invoice system with custom filename format:
  - Implemented "INV-{yyyyMMdd}-{HHmmss}-{garageId}-{customerNameSlug}-{bikeNo}-{invoiceId}" format
  - Enhanced PDF generator to display part numbers in "PN: partNumber — name — Qty x Price" format
  - Updated Cloudinary upload to support custom filenames
- ✅ Added comprehensive Invoices management section:
  - Created dedicated invoices page with search functionality 
  - Enhanced backend to fetch invoices with job card details
  - Implemented PDF download and WhatsApp sharing from invoices list
  - Added invoice tracking with status indicators
- ✅ Implemented garage logo customization feature:
  - Created LogoUploader component with Cloudinary integration
  - Added logo field to garage schema
  - Enhanced profile page with logo upload functionality
  - Updated PDF generator to include logos in invoices
  - Added proper error handling and validation for image uploads
- ✅ Enhanced sales analytics with accurate service charge tracking:
  - Fixed sales statistics calculations to use real invoice data
  - Added monthly service charge breakdown API and visualization
  - Created proper monthly analytics with real garage data
  - Updated sales page to focus on service charges rather than mock data
  - Fixed garage access permissions for logo uploads
  - Integrated logo display across dashboard and profile headers
- ✅ Started profit calculation enhancement project:
  - Added costPrice field to spare parts schema for accurate profit calculations
  - Updated spare parts form to include cost price input field
  - Currently shows service charges as profit (parts cost calculation being enhanced)
  - Prepared foundation for true profit calculation: Service + Parts Revenue - Parts Cost
- ✅ Implemented duplicate spare parts prevention system:
  - Added validation to check for existing part numbers when creating new parts
  - Shows warning dialog with existing part details when duplicate part number detected
  - Offers to increase quantity of existing part instead of creating duplicate
  - Prevents database inconsistencies and inventory management issues
- ✅ Replaced custom piston animation with standard loading animations:
  - Removed PistonLoader component and all piston-related CSS animations
  - Updated all loading states with clean, standard spinning animations
  - Improved consistency across login, spare parts, dashboard, pending services, and invoice pages
  - Simplified codebase by removing complex automotive-themed animations
  - Enhanced visibility and accessibility with standard loading indicators
- ✅ Implemented production-ready super admin access control system:
  - Added environment-based activation codes (no hardcoded values)
  - Created access request system with professional email notifications
  - Integrated SendGrid for reliable email delivery to super admin
  - Added smart confirmation dialogs for quantity increments on duplicate part scans
  - Enhanced security with super admin email verification and role-based access
  - Created comprehensive access request logging and notification system
  - Implemented robust email service with graceful fallbacks and detailed error logging
  - Added troubleshooting guidance for common SendGrid verification issues
  - Successfully implemented Gmail SMTP as free email solution (no credit card required)
  - Created dual email system: Gmail SMTP primary, SendGrid fallback
  - Configured professional HTML email templates for access requests
  - System now sends beautiful notifications completely free via Gmail
  - Updated super admin email to ananthautomotivegarage@gmail.com for professional branding
- ✅ Implemented HybridScanner with native and ZXing detection for reliable code scanning:
  - **Dual Detection System**: Native BarcodeDetector API with ZXing library fallback
  - **Multi-Format Support**: QR codes, Code 128, Code 39, EAN, UPC, and more barcode formats
  - **High-Resolution Camera**: 1920x1080 back camera with environment facing mode
  - **Production-Ready**: Clean interface without debug logs, professional purple-themed UI
  - **Mobile Optimized**: Torch control, proper video setup with playsInline and autoplay
  - **Automatic Part Lookup**: Existing parts open edit dialog, new codes open add dialog
  - **Smart Price Parsing**: Extracts selling price from codes using @ or _ separators
  - **Smart Quantity Parsing**: Extracts quantity from codes using - separator (e.g., PART-5@150)
  - **Automatic Field Population**: Scanned prices and quantities automatically fill respective fields
  - **Repeat Scan Detection**: Detects when same code is scanned multiple times and offers quantity increase
  - **Smart Duplicate Handling**: Special blue-themed alert for repeated scans vs. yellow for new duplicates
  - **Confirmation Dialog System**: Shows confirmation dialog for repeat scans with option to add to stock or ignore
  - **Visual Scan Counter**: Displays consecutive scan count and accumulated quantity near scanner interface
  - **Cross-Scanner Support**: Works consistently across QR, barcode, and hybrid scanner types
  - **Mobile & Desktop Ready**: Optimized for both mobile and desktop scanning workflows
  - **Comprehensive Error Handling**: Graceful camera fallbacks and detection method switching
  - **Format Detection**: Automatically identifies and reports detected code format
- ✅ Successfully deployed production architecture with separate frontend and backend:
  - **Deployment Strategy**: Frontend (React) → Vercel, Backend (Express) → Render.com (free forever hosting)
  - **Backend LIVE**: https://garageguru-backend.onrender.com - Successfully deployed with all dependencies
  - **Frontend Ready**: All TypeScript compilation errors resolved, build process working perfectly
  - **Fixed All Deployment Issues**: Resolved import paths, storage references, schema compatibility
  - **Cross-Domain Authentication**: JWT tokens with Authorization headers working in production
  - **Database Connected**: Real PostgreSQL via Neon serverless driver in production
  - **Email System**: Gmail SMTP configured for production notifications
  - **Production Build**: Separate build processes optimized for frontend static site and backend Node.js server
  - **Build Success**: Both frontend (1.26MB) and backend (56KB) building without errors
  - **Vercel Ready**: Complete configuration documented in VERCEL_DEPLOYMENT_FINAL.md

## System Architecture

### Frontend Architecture
- **Technology**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state, React Context for auth and theme
- **Build Tool**: Vite with hot reload support

### Backend Architecture
- **Technology**: Express.js with TypeScript
- **API Design**: RESTful API with role-based access control
- **Database ORM**: Drizzle ORM with type-safe schema definitions
- **Authentication**: JWT-based authentication with role-based permissions
- **Session Management**: Express sessions with PostgreSQL store

### Mobile-First Design
- Responsive design optimized for mobile devices
- Bottom navigation pattern for mobile UX
- PWA-ready with mobile-specific interactions
- Touch-friendly interface components

## Key Components

### Authentication & Authorization
- **Multi-role system**: Super admin, garage admin, mechanic staff
- **Tenant isolation**: Each garage operates independently
- **JWT tokens**: Secure authentication with refresh capabilities
- **Role-based routing**: Different access levels for different user types

### Database Schema
- **Garages**: Multi-tenant architecture with garage isolation
- **Users**: Role-based user management per garage
- **Customers**: Customer management with service history
- **Spare Parts**: Inventory management with low-stock alerts
- **Job Cards**: Service tracking from pending to completed
- **Invoices**: Billing system with PDF generation

### Core Features
- **Job Card Management**: Create, track, and complete service requests
- **Inventory Control**: Spare parts management with barcode scanning
- **Customer Database**: Comprehensive customer profiles and history
- **Invoice Generation**: PDF creation with WhatsApp integration
- **Sales Analytics**: Revenue tracking and reporting (admin only)

## Data Flow

### Authentication Flow
1. User logs in with email/password
2. Server validates credentials and returns JWT token
3. Token stored in localStorage for subsequent requests
4. Protected routes verify token and user permissions
5. Garage-specific data filtered by user's garage association

### Service Management Flow
1. Create job card with customer and service details
2. Add spare parts from inventory (with quantity tracking)
3. Mark service as completed
4. Generate invoice with labor and parts costs
5. Send invoice PDF via WhatsApp to customer
6. Update customer service history and garage analytics

### Inventory Management Flow
1. Add spare parts with barcode scanning capability
2. Track quantity changes during service jobs
3. Monitor low-stock alerts based on thresholds
4. Update pricing and availability in real-time

## External Dependencies

### Database
- **PostgreSQL**: Primary database with connection pooling
- **Neon Database**: Serverless PostgreSQL provider via @neondatabase/serverless
- **Drizzle Kit**: Database migrations and schema management

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first styling
- **Class Variance Authority**: Component variant management

### Authentication & Security
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT token management
- **connect-pg-simple**: PostgreSQL session store

### PDF & Communication
- **jsPDF**: Client-side PDF generation
- **WhatsApp Business API**: Message sending integration
- **Cloudinary**: Image and file storage (configured for future use)

### Development Tools
- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety across the stack
- **ESBuild**: Production bundling
- **Replit**: Development environment integration

## Deployment Strategy

### Development
- **Local Development**: Vite dev server with Express API
- **Hot Reload**: Real-time updates during development
- **Environment Variables**: DATABASE_URL and JWT_SECRET required

### Production Build
- **Client Build**: Vite builds React app to static files
- **Server Build**: ESBuild bundles Express server
- **Asset Serving**: Express serves built client files
- **Database**: PostgreSQL with connection pooling

### Environment Configuration
- **Database**: Requires PostgreSQL connection string
- **Authentication**: JWT secret for token signing
- **File Storage**: Cloudinary configuration for media uploads
- **Mobile Optimization**: Service worker for PWA capabilities

### Scaling Considerations
- **Multi-tenant**: Database designed for horizontal scaling
- **Stateless API**: JWT-based auth for load balancing
- **Caching**: TanStack Query provides client-side caching
- **Database Indexing**: Optimized queries with garage-based filtering
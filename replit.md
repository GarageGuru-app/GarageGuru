# Garage Management System

## Overview
This project is a multi-tenant garage management system designed to streamline operations for garage owners. It enables comprehensive management of customers, spare parts inventory, job cards, and invoices, with distinct access levels for super admins, garage admins, and mechanics. The system aims to provide a robust, all-in-one solution for automotive service businesses, enhancing efficiency and customer satisfaction through integrated tools for service tracking, billing, and inventory control.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology**: React 18 with TypeScript
- **Routing**: Wouter
- **UI Framework**: Shadcn/ui components leveraging Radix UI primitives
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query for server state, React Context for auth and theme
- **Build Tool**: Vite
- **Design Philosophy**: Mobile-first responsive design, PWA-ready, touch-friendly UI components, standard loading animations.

### Backend Architecture
- **Technology**: Express.js with TypeScript
- **API Design**: RESTful API with role-based access control
- **Database ORM**: Drizzle ORM for type-safe schema definitions
- **Authentication**: JWT-based with role-based permissions
- **Session Management**: Express sessions with PostgreSQL store
- **Multi-tenancy**: Designed for tenant isolation where each garage operates independently.

### Core Features
- **Authentication & Authorization**: Multi-role system (Super admin, garage admin, mechanic staff) with JWT tokens and role-based routing.
- **Job Card Management**: Create, track, and complete service requests.
- **Inventory Control**: Spare parts management with barcode scanning, low-stock alerts, and duplicate prevention (by part number). Includes cost price tracking for profit calculation.
- **Customer Database**: Comprehensive profiles and service history, with duplicate customer prevention by bike number.
- **Invoice Generation**: PDF creation with custom filenames and WhatsApp integration. Includes garage logo customization on invoices.
- **Sales Analytics**: Revenue and profit tracking (service charges, parts revenue, parts cost) for administrators, including daily and cumulative statistics.
- **Code Scanning**: HybridScanner with dual detection (BarcodeDetector API & ZXing), multi-format support, mobile optimization (torch, back camera), and automatic part lookup/field population. Includes smart price and quantity parsing from scanned codes.
- **Super Admin Access Control**: Environment-based activation codes, access request system with email notifications (Gmail SMTP primary, SendGrid fallback).

### Database Schema
- **Garages**: Multi-tenant architecture.
- **Users**: Role-based user management.
- **Customers**: Customer management with service history.
- **Spare Parts**: Inventory management.
- **Job Cards**: Service tracking.
- **Invoices**: Billing system.

## External Dependencies

### Database
- **PostgreSQL**: Primary database using standard `pg` driver.
- **Supabase**: PostgreSQL provider configured for production deployment.
- **Automatic Migrations**: Tables created automatically on server startup.
- **Raw SQL Queries**: Direct PostgreSQL queries for maximum compatibility.

### UI Libraries
- **Radix UI**: Accessible component primitives.
- **Lucide React**: Icon library.
- **Tailwind CSS**: Utility-first styling.
- **Class Variance Authority**: Component variant management.

### Authentication & Security
- **bcrypt**: Password hashing.
- **jsonwebtoken**: JWT token management.
- **connect-pg-simple**: PostgreSQL session store.

### PDF & Communication
- **jsPDF**: Client-side PDF generation.
- **WhatsApp Business API**: Message sending integration.
- **Cloudinary**: Image and file storage.
- **SendGrid**: Email delivery service (as fallback).

### Development Tools
- **Vite**: Fast build tool.
- **TypeScript**: Type safety.
- **ESBuild**: Production bundling.
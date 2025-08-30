# GarageGuru Technical Glossary

## Overview

This glossary defines technical terms, acronyms, and concepts used throughout the GarageGuru application and documentation. It serves as a reference for developers, administrators, and users working with the system.

## Application-Specific Terms

### **Access Request**
A formal request submitted by staff members to gain access to a specific garage's operations. The request includes the desired role (admin/staff) and must be approved by a garage administrator.

### **Activation Code**
Environment-specific security code required to access the super admin panel. Different codes are used for development (`DEVMODE2025`) and production environments.

### **Audit Log**
Security and compliance record that tracks all critical system operations including user role changes, password updates, and administrative actions. Includes actor information, timestamps, and detailed operation context.

### **Barcode Integration**
Multi-technology scanning system supporting various barcode formats through HybridScanner implementation. Uses both BarcodeDetector API and ZXing library for maximum compatibility.

### **Download Token**
Cryptographically secure token (64 hex characters) that provides time-limited access to invoice PDFs without requiring authentication. Enables secure invoice sharing via WhatsApp.

### **Garage Isolation**
Multi-tenant architecture feature ensuring complete data separation between different garages. Each garage's data is accessible only to authorized users of that specific garage.

### **Job Card**
Digital service request record containing customer information, service complaint description, spare parts used, and completion status. Central document for tracking service work.

### **Low Stock Threshold**
Configurable inventory level that triggers notifications when spare part quantities fall below the specified limit. Default threshold is 2 units per part.

### **PDF Single Source of Truth**
Architectural design pattern where all invoice PDFs are generated using the same server-side renderer, ensuring identical formatting whether downloaded directly or shared via WhatsApp.

### **Role Hierarchy**
Permission system with four levels:
- Super Admin (Level 4): System-wide access
- Garage Admin (Level 3): Full garage operations
- Inspector (Level 2): Read-only access with reporting
- Mechanic Staff (Level 1): Limited job card access

### **Work Summary**
Brief description of services performed during job completion. Used for customer records, invoice descriptions, and service history tracking.

## Technical Architecture Terms

### **API Endpoint**
RESTful web service URL that provides specific functionality. All GarageGuru endpoints follow the pattern `/api/resource/action` with proper HTTP verbs.

### **Authentication Middleware**
Express.js middleware function that validates JWT tokens and populates request context with user information. Required for all protected routes.

### **Connection Pool**
PostgreSQL database connection management system that maintains a pool of reusable database connections for improved performance and resource utilization.

### **CORS (Cross-Origin Resource Sharing)**
Security mechanism that allows the frontend application to communicate with the backend API across different origins during development and production.

### **Drizzle ORM**
Type-safe Object-Relational Mapping library that provides TypeScript-first database schema definitions and query building for PostgreSQL.

### **Express.js**
Node.js web application framework used for building the backend API. Provides routing, middleware support, and HTTP server functionality.

### **JWT (JSON Web Token)**
Industry-standard token format for securely transmitting information between parties. Used for user authentication and session management.

### **Middleware**
Express.js functions that execute during the request-response cycle. Used for authentication, logging, error handling, and request processing.

### **Protected Route**
Frontend route that requires user authentication and proper permissions. Automatically redirects unauthorized users to login or error pages.

### **React Context**
React feature for sharing state across component trees without prop drilling. Used for authentication state, theme management, and garage information.

### **TanStack Query (React Query)**
Data synchronization library for React applications. Manages server state, caching, background updates, and error handling for API requests.

### **TypeScript**
Strongly typed programming language that builds on JavaScript. Provides compile-time type checking and enhanced developer experience.

### **Wouter**
Lightweight React routing library used for client-side navigation. Provides URL-based routing without the complexity of React Router.

## Database Terms

### **ACID Compliance**
Database properties ensuring Atomicity, Consistency, Isolation, and Durability. PostgreSQL provides full ACID compliance for data integrity.

### **Foreign Key Constraint**
Database rule that maintains referential integrity between related tables. Ensures data consistency across table relationships.

### **JSONB**
PostgreSQL data type for storing JSON data with binary formatting. Used for spare parts arrays in job cards, providing flexible schema with query performance.

### **Migration**
Database schema change process that updates table structures, indexes, or constraints. GarageGuru uses automatic migrations on server startup.

### **PostgreSQL**
Advanced open-source relational database system used as the primary data store. Provides ACID compliance, JSON support, and excellent performance.

### **Primary Key**
Unique identifier for database table rows. GarageGuru uses UUID v4 format for all primary keys to ensure global uniqueness.

### **UUID (Universally Unique Identifier)**
128-bit identifier used for primary keys. Generated using cryptographically secure random number generation for uniqueness across distributed systems.

## Frontend Development Terms

### **Component**
Reusable React function or class that encapsulates UI logic and rendering. GarageGuru uses functional components with hooks throughout.

### **Hook**
React function that provides state management and lifecycle features to functional components. Includes built-in hooks (useState, useEffect) and custom hooks.

### **Props**
Properties passed to React components for customization and data flow. Ensures component reusability and maintainability.

### **State**
Dynamic data that determines component behavior and rendering. Managed through React hooks and external state management libraries.

### **Tailwind CSS**
Utility-first CSS framework used for styling. Provides pre-built classes for rapid UI development with consistent design systems.

### **Vite**
Fast build tool and development server for modern web applications. Provides hot module replacement, optimized bundling, and TypeScript support.

## Business Domain Terms

### **Automotive Service**
Professional maintenance and repair services for motorcycles and vehicles. Core business domain for GarageGuru application.

### **Bill of Materials (BOM)**
List of spare parts and quantities required for a specific service job. Automatically calculated based on job card spare parts selection.

### **Customer Lifetime Value**
Total monetary value a customer brings to the business over their entire relationship. Calculated from `total_spent` and `total_jobs` fields.

### **Garage**
Automotive service business that repairs and maintains vehicles. Primary tenant entity in the multi-tenant system architecture.

### **Inventory Turnover**
Business metric measuring how quickly spare parts are sold and replaced. Important for cash flow and storage optimization.

### **Invoice**
Formal billing document requesting payment for completed services. Generated as professional PDF with garage branding and detailed service breakdown.

### **Mechanic/Staff**
Service technician responsible for vehicle maintenance and repair work. Has limited system access focused on job completion and customer interaction.

### **Service Charge**
Labor cost for automotive service work. Separate from parts cost and included in total invoice amount for profit calculation.

### **Spare Part**
Replacement component used in vehicle maintenance and repair. Tracked with selling price, cost price, quantity, and barcode for inventory management.

## Security and Compliance Terms

### **Access Control**
Security mechanism that determines which users can access specific system resources and perform certain operations based on their role and permissions.

### **App Password**
Specialized password generated by Gmail for third-party applications. Required for SMTP email integration when 2-factor authentication is enabled.

### **bcrypt**
Cryptographic hashing function designed for password storage. Uses adaptive hashing with configurable work factor (salt rounds) for security.

### **Data Isolation**
Multi-tenant architecture principle ensuring complete separation of data between different garage tenants. Prevents cross-tenant data access.

### **Environment Variable**
Configuration value stored outside application code. Used for secrets, API keys, database URLs, and environment-specific settings.

### **Salt**
Random data added to passwords before hashing to prevent rainbow table attacks. Each password gets a unique salt for maximum security.

### **Session Management**
System for maintaining user authentication state across multiple requests. Uses PostgreSQL-backed storage for scalability and persistence.

### **Two-Factor Authentication (2FA)**
Security process requiring two forms of verification for account access. Required for Gmail accounts used in production email integration.

## Performance and Scalability Terms

### **Caching**
Temporary storage of frequently accessed data to improve application performance. Implemented at multiple levels (browser, application, database).

### **Connection Pooling**
Database optimization technique that maintains a pool of reusable connections to improve performance and resource utilization.

### **Lazy Loading**
Performance optimization that defers loading of components or data until actually needed. Reduces initial application load time.

### **Query Optimization**
Database performance improvement through efficient query design, proper indexing, and minimal data transfer.

### **Rate Limiting**
Security mechanism that restricts the number of requests a user can make within a specific time period. Prevents abuse and ensures fair resource usage.

## Development Tool Terms

### **ESBuild**
Fast JavaScript bundler used for production builds. Provides significantly faster build times compared to traditional bundlers.

### **Hot Module Replacement (HMR)**
Development feature that updates code in the browser without full page refresh. Preserves application state during development.

### **Linting**
Static code analysis tool that identifies programming errors, bugs, stylistic errors, and suspicious constructs. Ensures code quality and consistency.

### **TypeScript Compiler**
Tool that transforms TypeScript code to JavaScript while performing type checking. Catches errors at compile time rather than runtime.

### **Source Map**
File that maps compiled code back to original source code for debugging purposes. Essential for troubleshooting minified production code.

## File and Storage Terms

### **Multer**
Node.js middleware for handling multipart/form-data file uploads. Used for garage logo uploads with size and type validation.

### **Static Assets**
Files served directly by the web server without processing. Includes images, CSS files, JavaScript bundles, and uploaded logos.

### **Upload Directory**
Server filesystem location where user-uploaded files are stored. Configured with proper permissions and security restrictions.

## Integration Terms

### **Gmail SMTP**
Simple Mail Transfer Protocol service provided by Gmail for sending emails programmatically. Used for OTP delivery and notifications.

### **RESTful API**
Architectural style for web services using standard HTTP methods (GET, POST, PUT, DELETE) and resource-based URLs.

### **WebSocket**
Communication protocol for real-time bidirectional communication. Potential future enhancement for live notifications.

### **WhatsApp Business API**
Official API for sending messages through WhatsApp Business platform. Used for invoice delivery and customer communication.

## Acronyms and Abbreviations

### **API** - Application Programming Interface
Interface for software components to communicate with each other.

### **CDN** - Content Delivery Network
Distributed network of servers for delivering static content with low latency.

### **CLI** - Command Line Interface
Text-based interface for interacting with software applications.

### **CRUD** - Create, Read, Update, Delete
Basic operations for data management in software applications.

### **CSS** - Cascading Style Sheets
Style sheet language for describing HTML document presentation.

### **DOM** - Document Object Model
Programming interface for HTML and XML documents.

### **HTTP** - Hypertext Transfer Protocol
Application protocol for distributed hypermedia information systems.

### **JSON** - JavaScript Object Notation
Lightweight data interchange format readable by humans and machines.

### **ORM** - Object-Relational Mapping
Programming technique for converting data between incompatible type systems.

### **PDF** - Portable Document Format
File format for presenting documents independent of software, hardware, or operating systems.

### **PWA** - Progressive Web Application
Web applications using modern web capabilities to provide app-like experiences.

### **SaaS** - Software as a Service
Software distribution model where applications are hosted centrally and accessed via the internet.

### **SQL** - Structured Query Language
Domain-specific language for managing and querying relational databases.

### **SSL/TLS** - Secure Sockets Layer/Transport Layer Security
Cryptographic protocols for secure communication over computer networks.

### **UI/UX** - User Interface/User Experience
Design and interaction aspects of software applications from the user's perspective.

### **URL** - Uniform Resource Locator
Web address specifying the location of a resource on the internet.

This glossary provides comprehensive definitions for all terms used throughout the GarageGuru application and documentation, ensuring clear understanding for all stakeholders.
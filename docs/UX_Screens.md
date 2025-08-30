# GarageGuru UX Screens and User Interface Documentation

## Overview

GarageGuru features a comprehensive mobile-first user interface designed for touch-friendly interactions in garage environments. The application uses a role-based navigation system with tailored experiences for different user types.

## Design Philosophy

### Mobile-First Approach
- **Primary Target**: Touch-optimized mobile interface
- **Container Width**: 375px maximum (standard mobile width)
- **Touch Targets**: Minimum 44px for comfortable interaction
- **Bottom Navigation**: Fixed navigation bar for thumb-friendly access
- **Floating Action Button**: Quick access to primary actions

### Visual Design System
- **Color Scheme**: Professional blue primary (#3B82F6) with neutral grays
- **Typography**: Roboto font family for excellent mobile readability
- **Shadows**: Subtle elevation with Tailwind shadow utilities
- **Spacing**: Consistent 16px/20px spacing throughout
- **Icons**: Lucide React icons for universal recognition

## User Authentication Screens

### 1. Login Screen (`/login`)
**Purpose**: User authentication entry point
**Access**: Public (unauthenticated users)

**Layout:**
```
┌─────────────────────────┐
│      GarageGuru        │
│       Welcome!         │
│                        │
│  Email                 │
│  [________________]    │
│                        │
│  Password              │
│  [________________]    │
│                        │
│  [    Login    ]       │
│                        │
│  Don't have account?   │
│     Register           │
│                        │
│  Forgot Password?      │
└─────────────────────────┘
```

**Key Features:**
- Email/password authentication
- Remember me functionality
- Registration link for new users
- Forgot password option
- Form validation with error messages

### 2. Registration Screen (`/register`)
**Purpose**: New user account creation
**Access**: Public (unauthenticated users)

**Layout:**
```
┌─────────────────────────┐
│    Create Account      │
│                        │
│  Full Name             │
│  [________________]    │
│                        │
│  Email                 │
│  [________________]    │
│                        │
│  Password              │
│  [________________]    │
│                        │
│  Role                  │
│  [▼ Garage Admin  ]    │
│                        │
│  [   Register   ]      │
│                        │
│  Already have account? │
│        Login           │
└─────────────────────────┘
```

**Key Features:**
- Full name, email, password fields
- Role selection (garage admin/staff)
- Form validation and error handling
- Automatic redirect to garage setup

### 3. Garage Setup Screen (`/garage-setup`)
**Purpose**: Initial garage configuration
**Access**: Garage admin only (after registration)

**Layout:**
```
┌─────────────────────────┐
│    Setup Your Garage   │
│                        │
│  Garage Name           │
│  [________________]    │
│                        │
│  Owner Name            │
│  [________________]    │
│                        │
│  Phone Number          │
│  [________________]    │
│                        │
│  Email                 │
│  [________________]    │
│                        │
│  Upload Logo           │
│  [   Choose File   ]   │
│                        │
│  [  Complete Setup ]   │
└─────────────────────────┘
```

**Key Features:**
- Required garage information
- Logo upload with preview
- Automatic redirect to dashboard after setup

## Main Navigation System

### Bottom Navigation Bar
**Position**: Fixed at bottom of screen
**Role-Based Content**: Different icons based on user role

**Garage Admin Navigation:**
```
┌─────────────────────────┐
│ [🏠] [👥] [📋] [👤] [📊] │
│ Home Cust Jobs Prof Sales│
└─────────────────────────┘
```

**Staff Navigation:**
```
┌─────────────────────────┐
│ [🏠] [👥] [📋] [👤]     │
│ Home Cust Jobs Prof     │
└─────────────────────────┘
```

### Floating Action Button (FAB)
**Position**: Bottom right, above navigation
**Function**: Quick access to "New Job Card"
**Visibility**: Hidden on job card creation screens

## Dashboard Screens

### 1. Admin Dashboard (`/admin-dashboard`)
**Purpose**: Comprehensive garage overview for admins
**Access**: Garage admin only

**Layout:**
```
┌─────────────────────────┐
│  📊 Admin Dashboard     │
│                        │
│  Sales Overview        │
│  ┌─────────┬─────────┐ │
│  │Today's  │Monthly  │ │
│  │Sales    │Revenue  │ │
│  │Rs.5,500 │Rs.45,000│ │
│  └─────────┴─────────┘ │
│                        │
│  Quick Actions         │
│  ┌─────────┬─────────┐ │
│  │ Pending │Low Stock│ │
│  │ Jobs(5) │Parts(3) │ │
│  └─────────┴─────────┘ │
│                        │
│  ┌─────────┬─────────┐ │
│  │Staff    │Access   │ │
│  │Manage   │Requests │ │
│  └─────────┴─────────┘ │
│                        │
│  Recent Activity       │
│  • Customer completed  │
│  • New job created     │
│  • Part stock low      │
└─────────────────────────┘
```

**Key Features:**
- Real-time sales metrics
- Pending job count with navigation
- Low stock alerts with part details
- Staff management access
- Access request notifications
- Recent activity feed

### 2. Staff Dashboard (`/staff-dashboard`)
**Purpose**: Simplified interface for mechanic staff
**Access**: Mechanic staff only

**Layout:**
```
┌─────────────────────────┐
│  🔧 Staff Dashboard     │
│                        │
│  My Work Queue         │
│  ┌─────────────────────┐ │
│  │ Job #001 - Pending  │ │
│  │ John Customer       │ │
│  │ AP09YH1234         │ │
│  │ Engine noise       │ │
│  │ [  Start Work  ]   │ │
│  └─────────────────────┘ │
│                        │
│  Recently Completed    │
│  ┌─────────────────────┐ │
│  │ Job #045 - Done     │ │
│  │ Jane Customer       │ │
│  │ [ View Details ]   │ │
│  └─────────────────────┘ │
│                        │
│  [ Request Access ]    │
└─────────────────────────┘
```

**Key Features:**
- Personal job queue display
- Recently completed jobs with invoice access
- Access request functionality
- Simplified interface focused on job management

## Customer Management Screens

### 1. Customers List (`/customers`)
**Purpose**: Browse and search all customers
**Access**: All authenticated users

**Layout:**
```
┌─────────────────────────┐
│  👥 Customers           │
│  [🔍 Search customers] │
│                        │
│  ┌─────────────────────┐ │
│  │ 👤 John Customer    │ │
│  │ 📞 +91-9876543210  │ │
│  │ 🏍️ AP09YH1234     │ │
│  │ 💰 Rs.2,500 (5 jobs)│ │
│  │ 📅 Last: 2 days ago│ │
│  └─────────────────────┘ │
│                        │
│  ┌─────────────────────┐ │
│  │ 👤 Jane Customer    │ │
│  │ 📞 +91-9123456789  │ │
│  │ 🏍️ KA05MN6789     │ │
│  │ 💰 Rs.1,800 (3 jobs)│ │
│  │ 📅 Last: 1 week ago│ │
│  └─────────────────────┘ │
└─────────────────────────┘
```

**Key Features:**
- Search bar with real-time filtering
- Customer cards showing key information
- Visit history and spending summary
- Touch-friendly customer selection
- Automatic customer creation during job card creation

### 2. Customer Details (Accessed from customer list)
**Purpose**: Detailed customer information and service history
**Access**: All authenticated users

**Layout:**
```
┌─────────────────────────┐
│  ← Customer Details     │
│                        │
│  👤 John Customer       │
│  📞 +91-9876543210     │
│  🏍️ AP09YH1234        │
│                        │
│  📊 Service Summary     │
│  • Total Jobs: 5       │
│  • Total Spent: Rs.2,500│
│  • Last Visit: 2 days  │
│                        │
│  📝 Notes              │
│  Regular customer,     │
│  prefers evening slots │
│                        │
│  📋 Service History    │
│  ┌─────────────────────┐ │
│  │ Job #045 - Done     │ │
│  │ Rs.500 - 1 day ago  │ │
│  │ [ View Invoice ]   │ │
│  └─────────────────────┘ │
│                        │
│  [ Edit Customer ]     │
└─────────────────────────┘
```

**Key Features:**
- Complete customer profile
- Service statistics
- Customer notes for preferences
- Full service history with invoice links
- Edit customer functionality

## Job Management Screens

### 1. Job Card Creation (`/job-card`)
**Purpose**: Create new service requests
**Access**: All authenticated users

**Layout:**
```
┌─────────────────────────┐
│  ← New Job Card         │
│                        │
│  Customer Selection    │
│  [🔍 Search customer] │
│  [  + New Customer  ]  │
│                        │
│  Service Details       │
│  Customer Name         │
│  [________________]    │
│                        │
│  Phone Number          │
│  [________________]    │
│                        │
│  Bike Number           │
│  [________________]    │
│                        │
│  Complaint/Issue       │
│  [________________]    │
│  [________________]    │
│                        │
│  Service Charge        │
│  [________________]    │
│                        │
│  [ + Add Spare Parts ] │
│                        │
│  [  Create Job Card ]  │
└─────────────────────────┘
```

**Key Features:**
- Customer search and selection
- Inline customer creation
- Service complaint description
- Service charge input
- Spare parts addition with barcode scanning
- Real-time total calculation

### 2. Edit Job Card (`/edit-job-card/:id`)
**Purpose**: Modify existing job cards and mark completion
**Access**: All authenticated users

**Layout:**
```
┌─────────────────────────┐
│  ← Edit Job Card        │
│                        │
│  Job #001 - Pending    │
│                        │
│  👤 John Customer       │
│  📞 +91-9876543210     │
│  🏍️ AP09YH1234        │
│                        │
│  📝 Issue              │
│  Engine making noise   │
│                        │
│  🔧 Spare Parts Used   │
│  ┌─────────────────────┐ │
│  │ Brake Pad Set       │ │
│  │ Qty: 1 - Rs.1,200  │ │
│  │ [  Remove  ]       │ │
│  └─────────────────────┘ │
│                        │
│  [ + Add More Parts ]  │
│                        │
│  💰 Totals             │
│  Parts: Rs.1,200       │
│  Service: Rs.500       │
│  Total: Rs.1,700       │
│                        │
│  [  Complete Job  ]    │
└─────────────────────────┘
```

**Key Features:**
- Job status display
- Customer information summary
- Spare parts management (add/remove)
- Real-time total calculation
- Job completion workflow
- Work summary and notes

### 3. Pending Services (`/pending-services`)
**Purpose**: Overview of all pending job cards
**Access**: All authenticated users

**Layout:**
```
┌─────────────────────────┐
│  📋 Pending Services    │
│  [🔍 Search jobs]      │
│                        │
│  ┌─────────────────────┐ │
│  │ Job #001 - Urgent   │ │
│  │ 👤 John Customer    │ │
│  │ 🏍️ AP09YH1234     │ │
│  │ 📝 Engine noise     │ │
│  │ 📅 2 hours ago      │ │
│  │ [    Edit    ]     │ │
│  └─────────────────────┘ │
│                        │
│  ┌─────────────────────┐ │
│  │ Job #002 - Normal   │ │
│  │ 👤 Jane Customer    │ │
│  │ 🏍️ KA05MN6789     │ │
│  │ 📝 Brake check      │ │
│  │ 📅 1 day ago        │ │
│  │ [    Edit    ]     │ │
│  └─────────────────────┘ │
└─────────────────────────┘
```

**Key Features:**
- Search and filter functionality
- Priority indicators (urgent/normal)
- Customer and bike information
- Time since creation
- Direct edit access
- Status badges

### 4. Completed Services (`/completed-services`)
**Purpose**: Archive of finished job cards
**Access**: All authenticated users

**Layout:**
```
┌─────────────────────────┐
│  ✅ Completed Services  │
│  [🔍 Search completed] │
│                        │
│  ┌─────────────────────┐ │
│  │ Job #045 - Complete │ │
│  │ 👤 John Customer    │ │
│  │ 🏍️ AP09YH1234     │ │
│  │ 💰 Rs.1,700        │ │
│  │ ✅ 2 days ago       │ │
│  │ 👨‍🔧 By: Jane Staff │ │
│  │ [ View Details ]   │ │
│  └─────────────────────┘ │
│                        │
│  ┌─────────────────────┐ │
│  │ Job #044 - Complete │ │
│  │ 👤 Bob Customer     │ │
│  │ 🏍️ TN07AB9876     │ │
│  │ 💰 Rs.900          │ │
│  │ ✅ 5 days ago       │ │
│  │ 👨‍🔧 By: John Staff │ │
│  │ [ View Details ]   │ │
│  └─────────────────────┘ │
└─────────────────────────┘
```

**Key Features:**
- Search through completed jobs
- Total amount display
- Completion date and staff member
- View details with full information
- Invoice generation access

## Inventory Management Screens

### 1. Spare Parts List (`/spare-parts`)
**Purpose**: Inventory management and parts lookup
**Access**: Garage admin only

**Layout:**
```
┌─────────────────────────┐
│  🔧 Spare Parts         │
│  [🔍 Search parts]     │
│  [  + Add New Part ]   │
│                        │
│  Low Stock Alerts (2)  │
│  ┌─────────────────────┐ │
│  │ ⚠️ Brake Pad Set    │ │
│  │ Part #: BP001       │ │
│  │ Stock: 2 (Min: 5)   │ │
│  │ Price: Rs.1,200     │ │
│  │ [   Edit   ]       │ │
│  └─────────────────────┘ │
│                        │
│  All Parts             │
│  ┌─────────────────────┐ │
│  │ 🔧 Oil Filter       │ │
│  │ Part #: OF001       │ │
│  │ Stock: 15 (Min: 3)  │ │
│  │ Price: Rs.350       │ │
│  │ Cost: Rs.200        │ │
│  │ [   Edit   ]       │ │
│  └─────────────────────┘ │
└─────────────────────────┘
```

**Key Features:**
- Search and filter parts
- Low stock alerts prominently displayed
- Part number and barcode display
- Selling price and cost price
- Stock quantity with threshold warnings
- Quick edit access

### 2. Add/Edit Spare Part
**Purpose**: Inventory item management
**Access**: Garage admin only

**Layout:**
```
┌─────────────────────────┐
│  ← Add Spare Part       │
│                        │
│  Part Name             │
│  [________________]    │
│                        │
│  Part Number           │
│  [________________]    │
│                        │
│  Selling Price         │
│  [________________]    │
│                        │
│  Cost Price            │
│  [________________]    │
│                        │
│  Current Stock         │
│  [________________]    │
│                        │
│  Low Stock Threshold   │
│  [________________]    │
│                        │
│  Barcode               │
│  [________________]    │
│  [  📷 Scan  ]         │
│                        │
│  [   Save Part   ]     │
└─────────────────────────┘
```

**Key Features:**
- All part information fields
- Barcode scanning integration
- Profit calculation (selling vs cost price)
- Stock threshold management
- Form validation

## Invoice and Billing Screens

### 1. Invoice Generation (`/invoice/:jobCardId`)
**Purpose**: Create and manage invoices from completed jobs
**Access**: All authenticated users

**Layout:**
```
┌─────────────────────────┐
│  ← Generate Invoice     │
│                        │
│  Invoice Preview       │
│  ┌─────────────────────┐ │
│  │ Invoice #INV-001    │ │
│  │ Date: 01/01/2025    │ │
│  │                     │ │
│  │ Customer: John      │ │
│  │ Bike: AP09YH1234   │ │
│  │                     │ │
│  │ Services:           │ │
│  │ • Engine repair     │ │
│  │ • Brake pad set     │ │
│  │                     │ │
│  │ Parts Total: Rs.1,200│ │
│  │ Service: Rs.500     │ │
│  │ Total: Rs.1,700     │ │
│  └─────────────────────┘ │
│                        │
│  [  Download PDF  ]    │
│  [  Send WhatsApp ]    │
└─────────────────────────┘
```

**Key Features:**
- Real-time invoice preview
- Professional formatting
- PDF download functionality
- WhatsApp sharing option
- Automatic invoice numbering

### 2. Invoices List (`/invoices`)
**Purpose**: Browse all generated invoices
**Access**: All authenticated users

**Layout:**
```
┌─────────────────────────┐
│  📄 All Invoices        │
│  [🔍 Search invoices]  │
│                        │
│  ┌─────────────────────┐ │
│  │ INV-20250101-ABC123 │ │
│  │ 👤 John Customer    │ │
│  │ 💰 Rs.1,700        │ │
│  │ 📅 2 days ago       │ │
│  │ ✅ WhatsApp sent    │ │
│  │ [ Download ]       │ │
│  └─────────────────────┘ │
│                        │
│  ┌─────────────────────┐ │
│  │ INV-20250101-DEF456 │ │
│  │ 👤 Jane Customer    │ │
│  │ 💰 Rs.900          │ │
│  │ 📅 1 week ago       │ │
│  │ ⏳ Pending         │ │
│  │ [ Download ]       │ │
│  └─────────────────────┘ │
└─────────────────────────┘
```

**Key Features:**
- Invoice search functionality
- Customer and amount display
- WhatsApp delivery status
- PDF download access
- Date sorting

## Analytics and Reports Screens

### 1. Sales Analytics (`/sales`)
**Purpose**: Business intelligence and profit tracking
**Access**: Garage admin only

**Layout:**
```
┌─────────────────────────┐
│  📊 Sales Analytics     │
│                        │
│  Today's Performance   │
│  ┌─────────────────────┐ │
│  │ Total Sales         │ │
│  │ Rs.5,500           │ │
│  │                     │ │
│  │ Profit Margin       │ │
│  │ Rs.2,200 (40%)     │ │
│  │                     │ │
│  │ Jobs Completed: 8   │ │
│  └─────────────────────┘ │
│                        │
│  Monthly Trends        │
│  ┌─────────────────────┐ │
│  │     📈 Chart        │ │
│  │  ___/\__            │ │
│  │ /       \___        │ │
│  │/            \       │ │
│  │ Jan Feb Mar Apr     │ │
│  └─────────────────────┘ │
│                        │
│  Cumulative Stats      │
│  • Total Revenue: Rs.45K│
│  • Total Profit: Rs.18K │
│  • Avg per Job: Rs.340 │
└─────────────────────────┘
```

**Key Features:**
- Daily sales summary
- Profit margin calculation
- Monthly trend charts (Recharts)
- Cumulative statistics
- Average job value metrics

## Super Admin Screens

### 1. Super Admin Dashboard (`/super-admin`)
**Purpose**: System-wide administration
**Access**: Super admin only (environment-based activation)

**Layout:**
```
┌─────────────────────────┐
│  🔐 Super Admin Panel   │
│                        │
│  Activation Required   │
│  Enter Code:           │
│  [________________]    │
│  [ Activate Access ]   │
│                        │
│  --- After Activation ---│
│                        │
│  System Overview       │
│  • Total Garages: 5    │
│  • Total Users: 23     │
│  • Active Sessions: 12 │
│                        │
│  [  Manage Garages ]   │
│  [  Manage Users   ]   │
│  [  View Audit Log ]   │
│  [  Access Requests]   │
│                        │
│  Recent Activity       │
│  • New garage created  │
│  • User role changed   │
│  • Access request      │
└─────────────────────────┘
```

**Key Features:**
- Environment-based activation code
- System-wide statistics
- Garage management access
- User role management
- Audit log viewing
- Access request processing

## Profile and Settings Screens

### 1. User Profile (`/profile`)
**Purpose**: Personal account management
**Access**: All authenticated users

**Layout:**
```
┌─────────────────────────┐
│  👤 Profile             │
│                        │
│  User Information      │
│  ┌─────────────────────┐ │
│  │ 👤 John Doe         │ │
│  │ 📧 john@example.com │ │
│  │ 🏷️ Garage Admin    │ │
│  │ 🏢 AutoFix Garage  │ │
│  └─────────────────────┘ │
│                        │
│  Account Actions       │
│  [  Change Password ]  │
│  [  Update Profile  ]  │
│                        │
│  App Information       │
│  Version: 1.0.0        │
│  Last Login: Today     │
│                        │
│  [ 🚪 Logout ]         │
└─────────────────────────┘
```

**Key Features:**
- User information display
- Password change access
- Account settings
- App version information
- Secure logout

### 2. Change Password (`/change-password`)
**Purpose**: Secure password updates
**Access**: All authenticated users

**Layout:**
```
┌─────────────────────────┐
│  ← Change Password      │
│                        │
│  Current Password      │
│  [________________]    │
│                        │
│  New Password          │
│  [________________]    │
│                        │
│  Confirm New Password  │
│  [________________]    │
│                        │
│  Password Requirements │
│  • At least 6 chars    │
│  • Include numbers     │
│  • Include symbols     │
│                        │
│  [  Update Password ]  │
└─────────────────────────┘
```

**Key Features:**
- Current password verification
- New password validation
- Confirmation field
- Password strength requirements
- Security notifications

## Error and Status Screens

### 1. Unauthorized Access (`/unauthorized`)
**Purpose**: Handle insufficient permissions
**Access**: All users (when accessing restricted content)

**Layout:**
```
┌─────────────────────────┐
│       🚫 Access         │
│      Denied             │
│                        │
│  You don't have        │
│  permission to view    │
│  this page.            │
│                        │
│  Please contact your   │
│  garage administrator │
│  for access.           │
│                        │
│  [  Request Access ]   │
│  [  Go to Dashboard]   │
└─────────────────────────┘
```

### 2. Not Found (`/not-found`)
**Purpose**: Handle invalid routes
**Access**: All users

**Layout:**
```
┌─────────────────────────┐
│       🔍 Page           │
│      Not Found          │
│                        │
│  The page you're       │
│  looking for doesn't   │
│  exist or has been     │
│  moved.                │
│                        │
│  [  Go Home  ]         │
│  [  Go Back  ]         │
└─────────────────────────┘
```

## Interactive Elements

### Search Bars
All search bars follow consistent design:
```
┌─────────────────────────┐
│  🔍 [Search placeholder] │
└─────────────────────────┘
```

**Features:**
- Left-aligned search icon
- Real-time filtering
- Clear button when text present
- Proper focus states

### Form Inputs
Standard input design across all forms:
```
Label Text
[________________________]
Error text (if validation fails)
```

**Features:**
- Clear labels above inputs
- Proper validation states
- Error message display
- Touch-friendly sizing

### Buttons
Button hierarchy for different actions:

**Primary Actions:**
```
[    Primary Action    ]
```

**Secondary Actions:**
```
[    Secondary Action    ]
```

**Danger Actions:**
```
[    Delete/Remove    ]
```

### Status Badges
Visual indicators for different states:

- **Pending**: 🟡 Yellow badge
- **Completed**: 🟢 Green badge
- **Urgent**: 🔴 Red badge
- **Low Stock**: ⚠️ Warning badge

## Responsive Behavior

### Mobile Optimization
- **Touch Targets**: 44px minimum touch area
- **Keyboard**: Proper input types for mobile keyboards
- **Orientation**: Portrait-only for consistent experience
- **Scroll**: Smooth scrolling with momentum

### Progressive Web App Features
- **Offline Support**: Core functionality available offline
- **Install Prompt**: Add to home screen capability
- **Full Screen**: Standalone mode when installed
- **Safe Areas**: Proper handling of notches and safe areas

This comprehensive UX documentation ensures consistent user experience across all features and use cases in the GarageGuru application.
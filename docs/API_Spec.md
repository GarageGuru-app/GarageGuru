# GarageGuru API Specification

## Overview

The GarageGuru API is a RESTful service built with Express.js and TypeScript. It provides comprehensive endpoints for garage management operations with role-based access control and multi-tenant support.

## Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

All API endpoints (except login/register) require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "message": "Error description"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Authentication Endpoints

### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "garage_admin",
    "garage_id": "garage-uuid",
    "name": "John Doe"
  }
}
```

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "garage_admin"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "garage_admin",
    "name": "John Doe"
  }
}
```

## User Management Endpoints

### GET /api/user/profile
Get current user profile information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "garage_admin",
    "garage_id": "garage-uuid",
    "name": "John Doe",
    "must_change_password": false
  }
}
```

### POST /api/user/change-password
Change user password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

## Garage Management Endpoints

### POST /api/garages
Create a new garage (super admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "AutoFix Garage",
  "ownerName": "John Smith",
  "phone": "+1234567890",
  "email": "contact@autofix.com"
}
```

**Response (201):**
```json
{
  "id": "garage-uuid",
  "name": "AutoFix Garage",
  "owner_name": "John Smith",
  "phone": "+1234567890",
  "email": "contact@autofix.com",
  "logo": null,
  "created_at": "2025-01-01T00:00:00Z"
}
```

### GET /api/garages/:id
Get garage details.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "garage-uuid",
  "name": "AutoFix Garage",
  "owner_name": "John Smith",
  "phone": "+1234567890",
  "email": "contact@autofix.com",
  "logo": "/uploads/logos/logo-garage-uuid-timestamp.png",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### PUT /api/garages/:id
Update garage information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Garage Name",
  "ownerName": "John Smith",
  "phone": "+1234567890",
  "email": "contact@autofix.com",
  "logo": "/uploads/logos/logo-garage-uuid-timestamp.png"
}
```

**Response (200):**
```json
{
  "id": "garage-uuid",
  "name": "Updated Garage Name",
  "owner_name": "John Smith",
  "phone": "+1234567890",
  "email": "contact@autofix.com",
  "logo": "/uploads/logos/logo-garage-uuid-timestamp.png",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### POST /api/garages/:garageId/upload-logo
Upload garage logo.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body:** Form data with `logo` file field

**Response (200):**
```json
{
  "logoUrl": "/uploads/logos/logo-garage-uuid-timestamp.png"
}
```

**File Requirements:**
- Formats: JPG, PNG, GIF
- Max size: 5MB
- Stored on server filesystem

## Customer Management Endpoints

### GET /api/garages/:garageId/customers
Get all customers for a garage.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "customer-uuid",
    "garage_id": "garage-uuid",
    "name": "John Customer",
    "phone": "+1234567890",
    "bike_number": "AP09YH1234",
    "total_jobs": 5,
    "total_spent": "2500.00",
    "last_visit": "2025-01-01T10:30:00Z",
    "created_at": "2024-12-01T00:00:00Z",
    "notes": "Regular customer"
  }
]
```

### GET /api/garages/:garageId/customers/search?q=:query
Search customers by name, phone, or bike number.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `q` (string): Search query

**Response (200):**
```json
[
  {
    "id": "customer-uuid",
    "garage_id": "garage-uuid",
    "name": "John Customer",
    "phone": "+1234567890",
    "bike_number": "AP09YH1234",
    "total_jobs": 5,
    "total_spent": "2500.00",
    "last_visit": "2025-01-01T10:30:00Z",
    "created_at": "2024-12-01T00:00:00Z",
    "notes": "Regular customer"
  }
]
```

### POST /api/garages/:garageId/customers
Create a new customer.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Jane Customer",
  "phone": "+1987654321",
  "bikeNumber": "KA05MN6789",
  "notes": "New customer"
}
```

**Response (201):**
```json
{
  "id": "customer-uuid",
  "garage_id": "garage-uuid",
  "name": "Jane Customer",
  "phone": "+1987654321",
  "bike_number": "KA05MN6789",
  "total_jobs": 0,
  "total_spent": "0.00",
  "last_visit": null,
  "created_at": "2025-01-01T00:00:00Z",
  "notes": "New customer"
}
```

### PUT /api/garages/:garageId/customers/:id
Update customer information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Jane Updated Customer",
  "phone": "+1987654321",
  "bikeNumber": "KA05MN6789",
  "notes": "Updated notes"
}
```

**Response (200):**
```json
{
  "id": "customer-uuid",
  "garage_id": "garage-uuid",
  "name": "Jane Updated Customer",
  "phone": "+1987654321",
  "bike_number": "KA05MN6789",
  "total_jobs": 2,
  "total_spent": "1500.00",
  "last_visit": "2025-01-01T10:30:00Z",
  "created_at": "2024-12-01T00:00:00Z",
  "notes": "Updated notes"
}
```

## Spare Parts Management Endpoints

### GET /api/garages/:garageId/spare-parts
Get all spare parts for a garage.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "part-uuid",
    "garage_id": "garage-uuid",
    "name": "Brake Pad Set",
    "part_number": "BP001",
    "price": "1200.00",
    "quantity": 15,
    "low_stock_threshold": 5,
    "barcode": "1234567890123",
    "created_at": "2024-12-01T00:00:00Z",
    "cost_price": "800.00"
  }
]
```

### GET /api/garages/:garageId/spare-parts/search?q=:query
Search spare parts by name, part number, or barcode.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `q` (string): Search query

**Response (200):** Same format as GET spare-parts

### GET /api/garages/:garageId/spare-parts/low-stock
Get parts below low stock threshold.

**Headers:** `Authorization: Bearer <token>`

**Response (200):** Same format as GET spare-parts, filtered by low stock

### POST /api/garages/:garageId/spare-parts
Create a new spare part.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Oil Filter",
  "partNumber": "OF001",
  "price": "350.00",
  "quantity": 20,
  "lowStockThreshold": 3,
  "barcode": "9876543210987",
  "costPrice": "200.00"
}
```

**Response (201):**
```json
{
  "id": "part-uuid",
  "garage_id": "garage-uuid",
  "name": "Oil Filter",
  "part_number": "OF001",
  "price": "350.00",
  "quantity": 20,
  "low_stock_threshold": 3,
  "barcode": "9876543210987",
  "created_at": "2025-01-01T00:00:00Z",
  "cost_price": "200.00"
}
```

### PUT /api/garages/:garageId/spare-parts/:id
Update spare part information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as POST

**Response (200):** Same as POST response

### DELETE /api/garages/:garageId/spare-parts/:id
Delete a spare part.

**Headers:** `Authorization: Bearer <token>`

**Response (204):** No content

## Job Card Management Endpoints

### GET /api/garages/:garageId/job-cards
Get job cards for a garage.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): Filter by status ('pending', 'completed')
- `limit` (optional): Limit number of results

**Response (200):**
```json
[
  {
    "id": "job-uuid",
    "garage_id": "garage-uuid",
    "customer_id": "customer-uuid",
    "customer_name": "John Customer",
    "phone": "+1234567890",
    "bike_number": "AP09YH1234",
    "complaint": "Engine making noise",
    "status": "pending",
    "spare_parts": [
      {
        "id": "part-uuid",
        "partNumber": "BP001",
        "name": "Brake Pad Set",
        "quantity": 1,
        "price": 1200
      }
    ],
    "service_charge": "500.00",
    "total_amount": "1700.00",
    "created_at": "2025-01-01T00:00:00Z",
    "completed_at": null,
    "completed_by": null,
    "completion_notes": null,
    "work_summary": null
  }
]
```

### GET /api/garages/:garageId/job-cards/:id
Get specific job card details.

**Headers:** `Authorization: Bearer <token>`

**Response (200):** Same format as single job card from GET job-cards

### POST /api/garages/:garageId/job-cards
Create a new job card.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "customerName": "John Customer",
  "phone": "+1234567890",
  "bikeNumber": "AP09YH1234",
  "complaint": "Engine making noise",
  "spareParts": [
    {
      "id": "part-uuid",
      "partNumber": "BP001",
      "name": "Brake Pad Set",
      "quantity": 1,
      "price": 1200
    }
  ],
  "serviceCharge": "500.00"
}
```

**Response (201):** Same format as GET job-card response

### PUT /api/garages/:garageId/job-cards/:id
Update job card information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as POST, plus optional completion fields:
```json
{
  "status": "completed",
  "completionNotes": "Replaced brake pads, test drive completed",
  "workSummary": "Brake system repair and maintenance"
}
```

**Response (200):** Same format as GET job-card response

## Invoice Management Endpoints

### GET /api/garages/:garageId/invoices
Get all invoices for a garage.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "invoice-uuid",
    "garage_id": "garage-uuid",
    "job_card_id": "job-uuid",
    "customer_id": "customer-uuid",
    "invoice_number": "INV-20250101-ABC123",
    "download_token": "secure-token-123",
    "whatsapp_sent": false,
    "total_amount": "1700.00",
    "parts_total": "1200.00",
    "service_charge": "500.00",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### POST /api/garages/:garageId/job-cards/:jobCardId/invoice
Generate invoice for a job card.

**Headers:** `Authorization: Bearer <token>`

**Response (201):**
```json
{
  "id": "invoice-uuid",
  "garage_id": "garage-uuid",
  "job_card_id": "job-uuid",
  "customer_id": "customer-uuid",
  "invoice_number": "INV-20250101-ABC123",
  "download_token": "secure-token-123",
  "whatsapp_sent": false,
  "total_amount": "1700.00",
  "parts_total": "1200.00",
  "service_charge": "500.00",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### GET /api/invoices/download/:token
Download invoice PDF using secure token.

**Response (200):** PDF file with proper headers
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="INV-20250101-ABC123.pdf"
```

### POST /api/invoices/:id/whatsapp
Send invoice via WhatsApp.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Invoice sent via WhatsApp successfully"
}
```

## Analytics Endpoints

### GET /api/garages/:garageId/sales/stats
Get comprehensive sales statistics.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "totalInvoices": 150,
  "totalPartsTotal": "180000.00",
  "totalServiceCharges": "75000.00",
  "totalProfit": "45000.00"
}
```

### GET /api/garages/:garageId/sales/today
Get today's sales summary.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "date": "2025-01-01",
  "totalSales": "5500.00",
  "totalProfit": "2200.00",
  "invoiceCount": 8,
  "serviceCharges": "2000.00",
  "partsRevenue": "3500.00",
  "partsCost": "1300.00"
}
```

### GET /api/garages/:garageId/sales/monthly
Get monthly sales data for charts.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "month": "January",
    "year": 2025,
    "serviceCharges": "25000.00",
    "invoiceCount": 45
  },
  {
    "month": "February",
    "year": 2025,
    "serviceCharges": "28000.00",
    "invoiceCount": 52
  }
]
```

## Super Admin Endpoints

### GET /api/super-admin/garages
Get all garages in the system (super admin only).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "garage-uuid",
    "name": "AutoFix Garage",
    "owner_name": "John Smith",
    "phone": "+1234567890",
    "email": "contact@autofix.com",
    "logo": "/uploads/logos/logo-garage-uuid-timestamp.png",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### GET /api/super-admin/users
Get all users in the system (super admin only).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "garage_admin",
    "garage_id": "garage-uuid",
    "name": "John Doe",
    "must_change_password": false,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### PUT /api/super-admin/users/:id/role
Change user role (super admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "role": "mechanic_staff"
}
```

**Response (200):**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "mechanic_staff",
  "garage_id": "garage-uuid",
  "name": "John Doe",
  "must_change_password": false,
  "created_at": "2025-01-01T00:00:00Z"
}
```

## Access Request Endpoints

### GET /api/access-requests
Get access requests for a garage.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `garageId` (optional): Filter by garage

**Response (200):**
```json
[
  {
    "id": "request-uuid",
    "garage_id": "garage-uuid",
    "user_id": "user-uuid",
    "email": "staff@example.com",
    "name": "Jane Staff",
    "requested_role": "mechanic_staff",
    "status": "pending",
    "note": "Experienced mechanic seeking position",
    "processed_by": null,
    "processed_at": null,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### POST /api/access-requests
Create access request.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "garageId": "garage-uuid",
  "requestedRole": "mechanic_staff",
  "note": "Experienced mechanic seeking position"
}
```

**Response (201):** Same format as GET response

### PUT /api/access-requests/:id
Update access request status.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "approved",
  "note": "Approved based on experience"
}
```

**Response (200):** Same format as GET response

## Notification Endpoints

### GET /api/garages/:garageId/notifications/unread-count
Get count of unread notifications.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "count": 3
}
```

### GET /api/garages/:garageId/notifications
Get all notifications for a garage.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "notification-uuid",
    "garage_id": "garage-uuid",
    "customer_id": "customer-uuid",
    "type": "low_stock",
    "title": "Low Stock Alert",
    "message": "Brake Pad Set is running low (2 remaining)",
    "is_read": false,
    "data": {
      "part_id": "part-uuid",
      "current_quantity": 2,
      "threshold": 5
    },
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### PUT /api/garages/:garageId/notifications/:id/read
Mark notification as read.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Notification marked as read"
}
```

### PUT /api/garages/:garageId/notifications/mark-all-read
Mark all notifications as read.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "All notifications marked as read"
}
```

## Health Check Endpoints

### GET /health
Application health check.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00Z",
  "service": "garage-guru-backend",
  "environment": "development"
}
```

### GET /api/db/ping
Database connectivity check.

**Response (200):**
```json
{
  "success": true,
  "ping": 1,
  "timestamp": "2025-01-01T00:00:00Z",
  "database_version": "PostgreSQL 14.9",
  "storage_ping": true,
  "database_url": "configured"
}
```

## Rate Limiting and Security

### Security Headers
All API responses include security headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

### Rate Limiting
- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per minute per user
- **File upload endpoints**: 10 requests per minute per user

### Input Validation
All endpoints use Zod schemas for request validation:
- **Email validation**: RFC 5322 compliant
- **Phone validation**: International format support
- **Required fields**: Proper error messages for missing data
- **Data types**: Automatic type coercion where appropriate

## Error Handling Examples

### Validation Error (400)
```json
{
  "message": "Validation failed: Email is required"
}
```

### Authentication Error (401)
```json
{
  "message": "Access token required"
}
```

### Authorization Error (403)
```json
{
  "message": "Insufficient permissions"
}
```

### Not Found Error (404)
```json
{
  "message": "Resource not found"
}
```

### Server Error (500)
```json
{
  "message": "Internal server error"
}
```
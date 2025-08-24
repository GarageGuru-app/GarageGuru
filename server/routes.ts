import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertGarageSchema, insertCustomerSchema, insertSparePartSchema, insertJobCardSchema, insertInvoiceSchema } from "../shared/schema";
import { z } from "zod";
import { GmailEmailService } from "./gmailEmailService";
import { pool } from "./db";
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || "GarageGuru2025ProductionJWTSecret!";

// Super Admin emails that can access /super-admin
const SUPER_ADMIN_EMAILS = [
  'gorla.ananthkalyan@gmail.com',
  'ananthautomotivegarage@gmail.com'
];

// Initialize Gmail service
const gmailService = GmailEmailService.getInstance();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware for authentication
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUserByEmail(decoded.email);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Middleware for role-based access
const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

// Middleware for garage isolation
const requireGarageAccess = (req: any, res: any, next: any) => {
  if (req.user.role === 'super_admin') {
    next();
    return;
  }
  
  const garageId = req.params.garageId || req.params.id || req.body.garageId;
  if (!garageId || garageId !== req.user.garage_id) {
    return res.status(403).json({ message: 'Access denied to this garage' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<void> {
  
  // Health check endpoint for Render.com
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(), 
      service: 'garage-guru-backend',
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Database ping route
  app.get('/api/db/ping', async (req, res) => {
    try {
      const pingResult = await storage.ping();
      const result = await pool.query('SELECT 1 as ping, NOW() as timestamp, version() as db_version');
      res.json({
        success: true,
        ping: result.rows[0].ping,
        timestamp: result.rows[0].timestamp,
        database_version: result.rows[0].db_version,
        storage_ping: pingResult,
        database_url: process.env.DATABASE_URL ? 'configured' : 'missing'
      });
    } catch (error: any) {
      console.error('Database ping error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        database_url: process.env.DATABASE_URL ? 'configured' : 'missing'
      });
    }
  });

  // Database debug and schema setup endpoint
  app.get('/api/debug/database', async (req, res) => {
    try {
      // First check if we can connect to database
      const testQuery = await db.execute(sql`SELECT NOW() as current_time`);
      
      // Try to get data
      const users = await storage.getAllUsers();
      const garages = await storage.getAllGarages();
      
      res.json({
        databaseConnected: true,
        currentTime: testQuery.rows[0],
        userCount: users.length,
        garageCount: garages.length,
        sampleUser: users[0] ? { email: users[0].email, role: users[0].role } : null,
        sampleGarage: garages[0] ? { name: garages[0].name } : null
      });
    } catch (error: any) {
      console.error('Database debug error:', error);
      res.json({ 
        databaseConnected: false,
        error: error.message,
        needsSchemaPush: error.message.includes('relation') || error.message.includes('table')
      });
    }
  });

  // Seed production database with test user/garage (bypasses activation codes)
  app.post('/api/setup/seed-database', async (req, res) => {
    try {
      // Check if data already exists
      const existingUsers = await storage.getAllUsers();
      if (existingUsers.length > 0) {
        return res.json({ message: 'Database already seeded', userCount: existingUsers.length });
      }

      // Create garage first
      const garage = await storage.createGarage({
        name: "Ananth Automotive garage",
        ownerName: "Govind Naidu", 
        phone: "7288856665",
        email: "gorla.ananthkalyan@gmail.com",
        logo: "https://res.cloudinary.com/dcueubsl8/image/upload/v1754845196/garage-logos/sjrppoab6sslhvm5rl7a.jpg"
      });

      // Create user directly (bypass activation code validation for seeding)
      const user = await storage.createUser({
        email: "gorla.ananthkalyan@gmail.com",
        name: "Ananth",
        role: "garage_admin",
        garageId: garage.id,
        password: "password123"
      });

      res.json({ 
        message: 'Database seeded successfully - login ready',
        garage: { id: garage.id, name: garage.name },
        user: { id: user.id, email: user.email, role: user.role },
        loginCredentials: { 
          email: "gorla.ananthkalyan@gmail.com", 
          password: "password123" 
        }
      });
    } catch (error: any) {
      console.error('Database seeding error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Root endpoint for basic info (only in production)
  if (process.env.NODE_ENV === 'production') {
    app.get('/', (req, res) => {
      res.json({ 
        message: 'Garage Guru Backend API',
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
          health: '/health',
          auth: '/api/auth/*',
          garages: '/api/garages/*'
        }
      });
    });
  }
  
  // Super admin email for access control
  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'ananthautomotivegarage@gmail.com';

  // Get garages for staff access request (filtered)
  app.get("/api/garages", async (req, res) => {
    try {
      const { purpose } = req.query;
      const garages = await storage.getAllGarages();
      
      // If it's for staff access request, filter out garages that shouldn't be available
      if (purpose === 'staff_access') {
        // For now, return empty array to prevent staff from seeing any garages
        // until proper garage creation flow is completed by admins
        const availableGarages = garages.filter(garage => {
          // Only show garages that are actually operational
          // For now, no garages should be shown since we want admins to create their own
          return false;
        });
        res.json(availableGarages);
      } else {
        // For other purposes (like admin management), return all garages
        res.json(garages);
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch garages' });
    }
  });

  app.post("/api/garages", authenticateToken, async (req, res) => {
    try {
      const { name, ownerName, phone, email } = req.body;
      
      if (!req.user || req.user.role !== 'garage_admin') {
        return res.status(403).json({ message: 'Only garage admins can create garages' });
      }

      if (!name || !ownerName || !phone) {
        return res.status(400).json({ message: 'Name, owner name, and phone are required' });
      }

      // Create the garage
      const garage = await storage.createGarage({
        name,
        owner_name: ownerName,
        phone,
        email: email || req.user.email
      });

      // Update user's garage_id
      await storage.updateUserGarage(req.user.id, garage.id);

      res.json(garage);
    } catch (error) {
      console.error('Create garage error:', error);
      res.status(500).json({ message: 'Failed to create garage' });
    }
  });

  // Request access route - saves to database and notifies super admin
  app.post("/api/auth/request-access", async (req, res) => {
    try {
      const { email, name, requestType, message, garageId } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: 'User with this email already has access to the system. Please login instead.' 
        });
      }
      
      // Check if there's already a pending request for this email
      const existingRequests = await storage.getAccessRequests();
      const pendingRequest = existingRequests.find(req => 
        req.email === email && req.status === 'pending'
      );
      
      if (pendingRequest) {
        return res.status(400).json({ 
          message: 'You already have a pending access request. Please wait for super admin approval.' 
        });
      }

      // Create access request in database
      const accessRequest = await storage.createAccessRequest({
        garage_id: garageId || null,
        user_id: null, // Will be set when user is created after approval
        email,
        name,
        requested_role: requestType || 'staff',
        status: 'pending',
        note: message
      });

      // Get garage information if garageId is provided
      let garageName = '';
      let garageOwner = '';
      if (garageId) {
        const garage = await storage.getGarage(garageId);
        if (garage) {
          garageName = garage.name;
          garageOwner = garage.owner_name;
        }
      }

      const requestData = {
        email,
        name,
        requestType: requestType || 'staff',
        message,
        garageId,
        garageName,
        garageOwner,
        requestId: accessRequest.id,
        timestamp: new Date().toLocaleString()
      };

      // Send email notification to super admin via Gmail
      const gmailService = GmailEmailService.getInstance();
      const emailSent = await gmailService.sendAccessRequestNotification(
        SUPER_ADMIN_EMAIL,
        requestData
      );
      
      const responseMessage = emailSent 
        ? `Access request sent to super admin. You will receive an email notification once your request is reviewed.`
        : `Access request saved for super admin review. You will receive an email notification once your request is reviewed.`;
      
      res.json({ message: responseMessage });
    } catch (error) {
      console.error('Access request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get pending access requests (super admin only)
  app.get("/api/access-requests", authenticateToken, requireRole(['super_admin']), async (req, res) => {
    try {
      const requests = await storage.getAccessRequests();
      res.json(requests);
    } catch (error) {
      console.error('Get access requests error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Approve or deny access request (super admin only)
  app.post("/api/access-requests/:id/process", authenticateToken, requireRole(['super_admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { action, role } = req.body; // action: 'approve' or 'deny', role: 'garage_admin' or 'mechanic_staff'
      
      // Get the access request
      const requests = await storage.getAccessRequests();
      const request = requests.find(r => r.id === id);
      
      if (!request) {
        return res.status(404).json({ message: 'Access request not found' });
      }
      
      if (request.status !== 'pending') {
        return res.status(400).json({ message: 'Request has already been processed' });
      }
      
      if (action === 'approve') {
        // Create user account
        const defaultPassword = 'ChangeMe123!'; // User will need to change this on first login
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        const userData = {
          email: request.email,
          password: hashedPassword,
          name: request.name,
          role: role || (request.requested_role === 'admin' ? 'garage_admin' : 'mechanic_staff'),
          garage_id: request.garage_id
        };
        
        const newUser = await storage.createUser(userData);
        
        // Update access request status
        await storage.updateAccessRequest(id, {
          status: 'approved',
          user_id: newUser.id,
          processed_by: req.user.email,
          processed_at: new Date()
        });
        
        // Send approval email notification
        const gmailService = GmailEmailService.getInstance();
        await gmailService.sendAccessApprovalNotification(
          request.email,
          {
            name: request.name,
            role: userData.role,
            email: request.email,
            temporaryPassword: defaultPassword
          }
        );
        
        res.json({ message: 'Access request approved and user created successfully' });
      } else if (action === 'deny') {
        // Update access request status
        await storage.updateAccessRequest(id, {
          status: 'denied',
          processed_by: req.user.email,
          processed_at: new Date()
        });
        
        // Send denial email notification
        const gmailService = GmailEmailService.getInstance();
        await gmailService.sendAccessDenialNotification(
          request.email,
          {
            name: request.name,
            requestType: request.requested_role
          }
        );
        
        res.json({ message: 'Access request denied' });
      } else {
        res.status(400).json({ message: 'Invalid action. Use "approve" or "deny"' });
      }
    } catch (error) {
      console.error('Process access request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Super admin route to generate new activation codes
  app.post("/api/auth/generate-codes", authenticateToken, requireRole(['super_admin']), async (req, res) => {
    try {
      // Generate random codes for super admin
      const timestamp = Date.now().toString(36);
      const randomAdmin = Math.random().toString(36).substring(2, 8).toUpperCase();
      const randomStaff = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const newAdminCode = `GARAGE-ADMIN-2025-${randomAdmin}`;
      const newStaffCode = `GARAGE-STAFF-2025-${randomStaff}`;
      
      console.log('\n🔑 NEW ACTIVATION CODES GENERATED 🔑');
      console.log('===================================');
      console.log(`🔴 Admin Code: ${newAdminCode}`);
      console.log(`🔵 Staff Code: ${newStaffCode}`);
      console.log(`⏰ Generated: ${new Date().toLocaleString()}`);
      console.log('===================================\n');
      console.log('💡 To use these codes, update your environment variables:');
      console.log(`ADMIN_ACTIVATION_CODE=${newAdminCode}`);
      console.log(`STAFF_ACTIVATION_CODE=${newStaffCode}\n`);
      
      res.json({
        adminCode: newAdminCode,
        staffCode: newStaffCode,
        message: 'New activation codes generated. Update environment variables to activate.'
      });
    } catch (error) {
      console.error('Code generation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Simple registration endpoint that bypasses activation codes for initial setup
  app.post("/api/auth/register-simple", async (req, res) => {
    try {
      const { email, password, name, garageName, ownerName, phone } = req.body;
      
      // Check if any users exist (if not, allow free registration)
      const existingUsers = await storage.getAllUsers();
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'System already has users. Use activation codes.' });
      }

      // Create garage first
      const garage = await storage.createGarage({
        name: garageName || "Default Garage",
        ownerName: ownerName || name,
        phone: phone || "0000000000",
        email: email
      });

      // Create user as garage admin
      const user = await storage.createUser({
        email,
        name,
        role: 'garage_admin',
        garage_id: garage.id,
        password
      });

      const token = jwt.sign({ email: user.email, id: user.id }, JWT_SECRET);
      res.json({ 
        token, 
        user: { ...user, password: undefined },
        garage
      });
    } catch (error: any) {
      console.error('Simple registration error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, activationCode, garageName, ownerName, phone } = req.body;
      
      // Check if user is super admin
      if (email === SUPER_ADMIN_EMAIL) {
        const user = await storage.createUser({
          email,
          name,
          role: 'super_admin',
          garage_id: null,
          password
        });
        
        const token = jwt.sign({ email: user.email, id: user.id }, JWT_SECRET);
        return res.json({ 
          token, 
          user: { ...user, password: undefined },
          garage: null
        });
      }
      
      // Check for activation codes (if not set, use simple registration)
      // Validate alphanumeric activation code (8 characters: digits and letters)
      const codePattern = /^[A-Z0-9]{8}$/;
      if (!codePattern.test(activationCode)) {
        return res.status(400).json({ 
          message: 'Invalid activation code format. Use the 8-character code provided by super admin.' 
        });
      }
      
      // Determine role based on access request intent and activation code usage
      // Check if this registration is from an admin access request
      const role = req.body.requestedRole === 'admin' || req.body.isAdminRequest === true 
        ? 'garage_admin' 
        : 'mechanic_staff';
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      let garageId = null;
      
      // Create garage for admin users or use selected garage for staff
      if (role === 'garage_admin') {
        const garage = await storage.createGarage({
          name: garageName,
          owner_name: ownerName || name,
          phone,
          email
        });
        garageId = garage.id;
      } else if (role === 'mechanic_staff' && req.body.selectedGarageId) {
        // For staff, use the garage they selected during access request
        garageId = req.body.selectedGarageId;
      }
      
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role,
        garage_id: garageId
      });
      
      const token = jwt.sign({ email: user.email, id: user.id }, JWT_SECRET);
      
      res.json({ 
        token, 
        user: { ...user, password: undefined },
        garage: garageId ? await storage.getGarage(garageId) : null
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log('Login attempt for:', req.body?.email);
      const { email, password } = req.body;
      
      if (!email || !password) {
        console.log('Missing email or password:', { email: !!email, password: !!password });
        return res.status(400).json({ message: 'Email and password required' });
      }
      
      const user = await storage.getUserByEmail(email);
      console.log('User found:', user ? 'Yes' : 'No');
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Add extra logging for password comparison
      console.log('Comparing password. Length:', password.length);
      const validPassword = await bcrypt.compare(password, user.password);
      console.log('Password valid:', validPassword ? 'Yes' : 'No');
      
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const token = jwt.sign({ email: user.email, id: user.id }, JWT_SECRET);
      console.log('JWT token generated successfully');
      
      let garage = null;
      if (user.garage_id) {
        garage = await storage.getGarage(user.garage_id);
        console.log('Garage found:', garage ? 'Yes' : 'No');
      }
      
      res.json({ 
        token, 
        user: { ...user, password: undefined },
        garage
      });
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // User profile routes
  app.get("/api/user/profile", authenticateToken, async (req, res) => {
    try {
      let garage = null;
      if (req.user.garage_id) {
        garage = await storage.getGarage(req.user.garage_id);
      }
      
      res.json({ 
        user: { ...req.user, password: undefined },
        garage
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Garage routes
  app.put("/api/garages/:id", authenticateToken, requireRole(['garage_admin']), requireGarageAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertGarageSchema.partial().parse(req.body);
      
      const garage = await storage.updateGarage(id, updateData);
      res.json(garage);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update garage' });
    }
  });

  // Customer routes
  app.get("/api/garages/:garageId/customers", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const customers = await storage.getCustomers(garageId);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch customers' });
    }
  });

  app.post("/api/garages/:garageId/customers", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      
      const customerData = insertCustomerSchema.parse({ ...req.body, garageId });
      
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error: any) {
      // Check if it's a duplicate bike number error
      if (error.message && error.message.includes('already exists')) {
        res.status(409).json({ 
          message: error.message,
          type: 'duplicate_bike_number'
        });
      } else {
        console.error('Error creating customer:', error);
        res.status(500).json({ message: 'Failed to create customer' });
      }
    }
  });



  app.get("/api/garages/:garageId/customers/search", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }
      
      const customers = await storage.searchCustomers(garageId, q);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to search customers' });
    }
  });

  app.get("/api/garages/:garageId/spare-parts/search", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }
      
      const spareParts = await storage.searchSpareParts(garageId, q);
      res.json(spareParts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to search spare parts' });
    }
  });

  app.get("/api/garages/:garageId/customers/:customerId/invoices", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId, customerId } = req.params;
      const invoices = await storage.getCustomerInvoices(customerId, garageId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch customer invoices' });
    }
  });

  // Update invoice
  app.put("/api/garages/:garageId/invoices/:id", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const invoice = await storage.updateInvoice(id, updateData);
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update invoice' });
    }
  });

  // Spare parts routes
  app.get("/api/garages/:garageId/spare-parts", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const spareParts = await storage.getSpareParts(garageId);
      res.json(spareParts);
    } catch (error) {
      console.error('Error in spare parts endpoint:', error);
      res.status(500).json({ message: 'Failed to fetch spare parts' });
    }
  });

  app.get("/api/garages/:garageId/spare-parts/low-stock", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const lowStockParts = await storage.getLowStockParts(garageId);
      
      // Create/update low stock notifications (commented out - function not implemented)
      // await storage.createLowStockNotifications(garageId);
      
      res.json(lowStockParts);
    } catch (error) {
      console.error('Error in low stock endpoint:', error);
      res.status(500).json({ message: 'Failed to fetch low stock parts' });
    }
  });

  app.post("/api/garages/:garageId/spare-parts", authenticateToken, requireRole(['garage_admin']), requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const partData = insertSparePartSchema.parse({ ...req.body, garageId });
      
      const sparePart = await storage.createSparePart(partData);
      res.json(sparePart);
    } catch (error) {
      console.error('Spare part creation error:', error);
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          res.status(409).json({ message: error.message });
        } else {
          res.status(400).json({ message: error.message });
        }
      } else {
        res.status(500).json({ message: 'Failed to create spare part' });
      }
    }
  });

  app.put("/api/garages/:garageId/spare-parts/:id", authenticateToken, requireRole(['garage_admin']), requireGarageAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertSparePartSchema.partial().parse(req.body);
      
      const sparePart = await storage.updateSparePart(id, updateData);
      res.json(sparePart);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update spare part' });
    }
  });

  app.delete("/api/garages/:garageId/spare-parts/:id", authenticateToken, requireRole(['garage_admin']), requireGarageAccess, async (req, res) => {
    try {
      const { garageId, id } = req.params;
      await storage.deleteSparePart(id, garageId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete spare part' });
    }
  });

  // Job card routes
  app.get("/api/garages/:garageId/job-cards", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const { status } = req.query;
      const jobCards = await storage.getJobCards(garageId, status as string);
      res.json(jobCards);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch job cards' });
    }
  });

  app.post("/api/garages/:garageId/job-cards", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const jobCardData = insertJobCardSchema.parse({ ...req.body, garageId });
      
      // Create or find customer  
      let customer = await storage.getCustomers(garageId).then(customers => 
        customers.find(c => c.phone === jobCardData.phone && c.bike_number === jobCardData.bikeNumber)
      );
      
      if (!customer) {
        customer = await storage.createCustomer({
          garageId,
          name: jobCardData.customerName,
          phone: jobCardData.phone,
          bikeNumber: jobCardData.bikeNumber
        });
      }
      
      const jobCard = await storage.createJobCard({
        ...jobCardData,
        customerId: customer.id,
        spareParts: (jobCardData.spareParts || []) as Array<{id: string, partNumber: string, name: string, quantity: number, price: number}>
      } as any);
      
      // Update spare parts quantities
      if (jobCard.spareParts && Array.isArray(jobCard.spareParts)) {
        for (const part of jobCard.spareParts) {
          const sparePart = await storage.getSparePart(part.id, garageId);
          if (sparePart) {
            await storage.updateSparePart(part.id, {
              quantity: sparePart.quantity - part.quantity
            });
          }
        }
      }
      
      res.json(jobCard);
    } catch (error) {
      console.error('Job card creation error:', error);
      res.status(500).json({ message: 'Failed to create job card' });
    }
  });

  app.put("/api/garages/:garageId/job-cards/:id", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertJobCardSchema.partial().parse(req.body);
      
      const jobCard = await storage.updateJobCard(id, {
        ...updateData,
        spareParts: updateData.spareParts?.map((part: any) => ({
          id: part.id,
          partNumber: part.partNumber,
          name: part.name,
          quantity: part.quantity,
          price: Number(part.price || part.sellingPrice || 0)
        }))
      });
      res.json(jobCard);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update job card' });
    }
  });

  // Invoice routes
  app.get("/api/garages/:garageId/invoices", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const invoices = await storage.getInvoices(garageId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch invoices' });
    }
  });

  app.post("/api/garages/:garageId/invoices", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const invoiceData = insertInvoiceSchema.parse({ ...req.body, garageId });
      
      // Set the correct local timestamp (Indian Standard Time)
      const istTime = new Date().toLocaleString("sv-SE", {timeZone: "Asia/Kolkata"});
      const localTimestamp = new Date(istTime);
      
      const invoice = await storage.createInvoice({
        ...invoiceData
      });
      
      // Update job card status to completed
      const jobCard = await storage.updateJobCard(invoice.jobCardId, {
        status: 'completed',
        completedAt: new Date()
      });
      
      // Update customer stats and check for milestones
      const customer = await storage.getCustomer(invoice.customerId, garageId);
      if (customer) {
        const newTotalJobs = (customer.totalJobs || 0) + 1;
        await storage.updateCustomer(customer.id, {
          totalJobs: newTotalJobs,
          totalSpent: String(Number(customer.totalSpent || 0) + Number(invoice.totalAmount)),
          lastVisit: new Date()
        });

        // Create milestone notifications
        if (newTotalJobs === 50 || newTotalJobs === 100 || (newTotalJobs >= 150 && newTotalJobs % 50 === 0)) {
          await storage.createNotification({
            garageId,
            customerId: customer.id,
            type: 'milestone',
            title: `Customer Milestone - ${newTotalJobs} Visits!`,
            message: `${customer.name} has reached ${newTotalJobs} service visits. Consider offering a loyalty reward!`,
            data: { visits: newTotalJobs, customerName: customer.name }
          });
        }
      }
      
      res.json(invoice);
    } catch (error) {
      console.error('Invoice creation error:', error);
      res.status(500).json({ message: 'Failed to create invoice', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Sales analytics routes
  app.get("/api/garages/:garageId/sales/stats", authenticateToken, requireRole(['garage_admin']), requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const stats = await storage.getSalesStats(garageId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch sales stats' });
    }
  });

  app.get("/api/garages/:garageId/sales/today", authenticateToken, requireRole(['garage_admin']), requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const todayStats = await storage.getTodaySalesStats(garageId);
      res.json(todayStats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch today sales stats' });
    }
  });

  app.get("/api/garages/:garageId/sales/monthly", authenticateToken, requireRole(['garage_admin']), requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const monthlyData = await storage.getMonthlySalesData(garageId);
      res.json(monthlyData);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch monthly sales data' });
    }
  });

  // Enhanced sales analytics routes
  app.get("/api/garages/:garageId/sales/analytics", authenticateToken, requireRole(['garage_admin']), requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const { startDate, endDate, groupBy = 'month' } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      const analyticsData = await storage.getSalesDataByDateRange(
        garageId, 
        startDate as string, 
        endDate as string
      );
      res.json(analyticsData);
    } catch (error) {
      console.error('Sales analytics error:', error);
      res.status(500).json({ message: 'Failed to fetch sales analytics' });
    }
  });

  // Customer analytics endpoints
  app.get("/api/garages/:garageId/customers/analytics", authenticateToken, requireRole(['garage_admin']), requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const { startDate, endDate, groupBy = 'month' } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      const analyticsData = await storage.getCustomerAnalytics(garageId);
      res.json(analyticsData);
    } catch (error) {
      console.error('Customer analytics error:', error);
      res.status(500).json({ message: 'Failed to fetch customer analytics' });
    }
  });

  app.get("/api/garages/:garageId/customers/top-by-services", authenticateToken, requireRole(['garage_admin']), requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const { startDate, endDate, limit = '10' } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      const topCustomers = await storage.getTopCustomersByServices(garageId);
      res.json(topCustomers);
    } catch (error) {
      console.error('Top customers by services error:', error);
      res.status(500).json({ message: 'Failed to fetch top customers by services' });
    }
  });

  app.get("/api/garages/:garageId/customers/top-by-revenue", authenticateToken, requireRole(['garage_admin']), requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const { startDate, endDate, limit = '10' } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      const topCustomers = await storage.getTopCustomersByRevenue(garageId);
      res.json(topCustomers);
    } catch (error) {
      console.error('Top customers by revenue error:', error);
      res.status(500).json({ message: 'Failed to fetch top customers by revenue' });
    }
  });

  // Notification routes
  app.get("/api/garages/:garageId/notifications", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const notifications = await storage.getNotifications(garageId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.get("/api/garages/:garageId/notifications/unread-count", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const count = await storage.getUnreadNotificationCount(garageId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch unread notification count' });
    }
  });

  app.put("/api/garages/:garageId/notifications/:id/read", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id, req.params.garageId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  app.put("/api/garages/:garageId/notifications/mark-all-read", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      await storage.markAllNotificationsAsRead(garageId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark all notifications as read' });
    }
  });

  // Garage logo update route
  app.put("/api/garages/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { logo } = req.body;
      
      // Verify user has access to this garage
      const userGarageId = (req as any).user.garage_id;
      if (userGarageId !== id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const garage = await storage.updateGarage(id, { logo });
      res.json(garage);
    } catch (error) {
      console.error('Garage update error:', error);
      res.status(500).json({ message: 'Failed to update garage' });
    }
  });

  // ============================================
  // MFA Email-OTP Endpoints for Super Admin
  // ============================================

  // Helper function to generate and hash OTP
  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const hashOtp = (otp: string, salt: string) => {
    return bcrypt.hashSync(otp + salt, 10);
  };

  // Helper function to send OTP email using Gmail
  const sendOtpEmail = async (otp: string) => {
    const gmailUser = process.env.GMAIL_USER;
    
    if (!gmailUser) {
      throw new Error('Gmail service not configured');
    }

    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">GarageGuru Password Reset</h2>
        <p>Your password reset verification code is:</p>
        <div style="font-size: 24px; font-weight: bold; color: #007bff; padding: 20px; background: #f8f9fa; text-align: center; margin: 20px 0; border-radius: 8px;">
          ${otp}
        </div>
        <p><strong>⚠️ Security Notice:</strong></p>
        <ul>
          <li>This code expires in 10 minutes</li>
          <li>Only use this code if you requested a password reset</li>
          <li>Never share this code with anyone</li>
        </ul>
        <p>If you didn't request this reset, please contact support immediately.</p>
      </div>
    `;

    const emailText = `Your GarageGuru password reset code is: ${otp}. This code expires in 10 minutes. If you didn't request this reset, please contact support.`;

    // Send OTP to both super admin emails using Gmail service
    const emailPromises = SUPER_ADMIN_EMAILS.map(email => 
      gmailService.sendOtpEmail(email, otp, 'password reset')
    );

    const results = await Promise.all(emailPromises);
    const allSent = results.every(sent => sent);
    
    if (!allSent) {
      console.log('⚠️ Some OTP emails may not have been sent via Gmail');
    }
  };

  // Rate limiting storage (in production, use Redis)
  const rateLimits = new Map<string, { count: number; resetTime: number; locked?: boolean; lockTime?: number }>();

  const checkRateLimit = (email: string, maxRequests = 3, windowMs = 60 * 60 * 1000) => {
    const now = Date.now();
    const limit = rateLimits.get(email);

    if (limit?.locked && limit.lockTime && now < limit.lockTime) {
      throw new Error('Account locked. Try again in 15 minutes.');
    }

    if (!limit || now > limit.resetTime) {
      rateLimits.set(email, { count: 1, resetTime: now + windowMs });
      return;
    }

    if (limit.count >= maxRequests) {
      // Lock account for 15 minutes
      rateLimits.set(email, { 
        ...limit, 
        locked: true, 
        lockTime: now + 15 * 60 * 1000 
      });
      throw new Error('Too many requests. Account locked for 15 minutes.');
    }

    limit.count++;
  };

  // 1. Request OTP for password change
  app.post("/api/mfa/request", async (req, res) => {
    try {
      const { email, purpose } = req.body;

      if (purpose !== 'password_change') {
        return res.status(400).json({ message: 'Invalid purpose' });
      }

      if (!SUPER_ADMIN_EMAILS.includes(email)) {
        // Return generic response to avoid enumeration
        return res.json({ ok: true });
      }

      // Check rate limits
      try {
        checkRateLimit(email);
      } catch (error: any) {
        return res.status(429).json({ message: error.message });
      }

      // Generate OTP and salt
      const otp = generateOtp();
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedOtp = hashOtp(otp, salt);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Invalidate any existing OTP for this email/purpose
      const existingOtp = await storage.getOtpRecord(email, purpose);
      if (existingOtp) {
        await storage.updateOtpRecord(existingOtp.id, { used: true });
      }

      // Store new OTP record
      await storage.createOtpRecord({
        email,
        hashed_otp: hashedOtp,
        salt,
        purpose,
        expires_at: expiresAt
      });

      // Send email to both super admin addresses
      await sendOtpEmail(otp);

      res.json({ ok: true });
    } catch (error: any) {
      console.error('OTP request error:', error);
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  });

  // 2. Verify OTP and get temporary token
  app.post("/api/mfa/verify", async (req, res) => {
    try {
      const { email, code, purpose } = req.body;

      if (!SUPER_ADMIN_EMAILS.includes(email)) {
        return res.status(400).json({ message: 'Invalid request' });
      }

      // Get OTP record
      const otpRecord = await storage.getOtpRecord(email, purpose);
      if (!otpRecord) {
        return res.status(400).json({ message: 'Invalid or expired code' });
      }

      // Check attempts (max 5)
      if (otpRecord.attempts >= 5) {
        await storage.updateOtpRecord(otpRecord.id, { used: true });
        return res.status(400).json({ message: 'Too many attempts. Request a new code.' });
      }

      // Verify OTP
      const isValid = bcrypt.compareSync(code + otpRecord.salt, otpRecord.hashed_otp);
      
      if (!isValid) {
        await storage.updateOtpRecord(otpRecord.id, { 
          attempts: otpRecord.attempts + 1 
        });
        return res.status(400).json({ message: 'Invalid code' });
      }

      // Mark OTP as used
      await storage.updateOtpRecord(otpRecord.id, { used: true });

      // Generate temporary token (5 minutes)
      const tempToken = jwt.sign({ 
        email, 
        purpose, 
        type: 'otp_verified' 
      }, JWT_SECRET, { expiresIn: '5m' });

      res.json({ otp_verified_token: tempToken });
    } catch (error: any) {
      console.error('OTP verification error:', error);
      res.status(500).json({ message: 'Failed to verify OTP' });
    }
  });

  // 3. Change password with verified OTP token
  app.post("/api/password/change", async (req, res) => {
    try {
      const { email, otp_verified_token, new_password } = req.body;

      if (!SUPER_ADMIN_EMAILS.includes(email)) {
        return res.status(400).json({ message: 'Invalid request' });
      }

      // Verify temporary token
      let decoded;
      try {
        decoded = jwt.verify(otp_verified_token, JWT_SECRET) as any;
      } catch (error) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      if (decoded.email !== email || decoded.purpose !== 'password_change' || decoded.type !== 'otp_verified') {
        return res.status(400).json({ message: 'Invalid token' });
      }

      // Validate password strength
      if (!new_password || new_password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }

      // Check if new password is same as current password
      const currentUser = await pool.query('SELECT password FROM users WHERE email = $1', [email]);
      if (currentUser.rows.length > 0) {
        const isSamePassword = await bcrypt.compare(new_password, currentUser.rows[0].password);
        if (isSamePassword) {
          return res.status(400).json({ message: 'New password cannot be the same as your current password' });
        }
      }

      // Update password
      const hashedPassword = await bcrypt.hash(new_password, 12);
      await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

      // Get updated user data for new token
      const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = userResult.rows[0];

      // Generate new auth token to keep user logged in
      const newToken = jwt.sign({ 
        email: user.email, 
        id: user.id 
      }, JWT_SECRET);

      // Send security notification to both emails using Gmail service
      try {
        const emailPromises = SUPER_ADMIN_EMAILS.map(notifyEmail => 
          gmailService.sendOtpEmail(notifyEmail, 'SECURITY ALERT', 'password change notification')
        );

        await Promise.all(emailPromises);
        console.log('📧 Security notifications sent to all super admin emails');
      } catch (error) {
        console.error('Failed to send security notifications:', error);
      }

      res.json({ 
        success: true, 
        token: newToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error: any) {
      console.error('Password change error:', error);
      res.status(500).json({ message: 'Failed to change password' });
    }
  });

  // ============================================
  // Super Admin API Endpoints
  // ============================================

  // Middleware to check super admin email access
  const requireSuperAdminEmail = (req: any, res: any, next: any) => {
    if (!req.user || !SUPER_ADMIN_EMAILS.includes(req.user.email)) {
      return res.status(403).json({ message: 'Access denied. Super admin access required.' });
    }
    next();
  };

  // Get all garages with stats
  app.get("/api/super-admin/garages", authenticateToken, requireSuperAdminEmail, async (req, res) => {
    try {
      const garages = await storage.getAllGarages();
      
      // Get user counts and stats for each garage
      const garagesWithStats = await Promise.all(garages.map(async (garage) => {
        const users = await storage.getUsersByGarage(garage.id);
        const adminCount = users.filter(u => u.role === 'garage_admin').length;
        const staffCount = users.filter(u => u.role === 'mechanic_staff').length;
        
        return {
          ...garage,
          userCount: users.length,
          adminCount,
          staffCount,
          users: users.map(u => ({ ...u, password: undefined })) // Remove passwords
        };
      }));

      // Get overall stats
      const allUsers = await storage.getAllUsers();
      const totalUsers = allUsers.length;
      const totalGarages = garages.length;
      
      // Calculate new users in last 7 and 30 days
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const newUsers7Days = allUsers.filter(u => new Date(u.created_at) > sevenDaysAgo).length;
      const newUsers30Days = allUsers.filter(u => new Date(u.created_at) > thirtyDaysAgo).length;

      res.json({
        garages: garagesWithStats,
        stats: {
          totalGarages,
          totalUsers,
          newUsers7Days,
          newUsers30Days
        }
      });
    } catch (error: any) {
      console.error('Get garages error:', error);
      res.status(500).json({ message: 'Failed to fetch garages' });
    }
  });

  // Get users for a specific garage
  app.get("/api/super-admin/garages/:garageId/users", authenticateToken, requireSuperAdminEmail, async (req, res) => {
    try {
      const { garageId } = req.params;
      const users = await storage.getUsersByGarage(garageId);
      
      // Remove passwords from response
      const safeUsers = users.map(u => ({ ...u, password: undefined }));
      
      res.json(safeUsers);
    } catch (error: any) {
      console.error('Get garage users error:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Toggle user role (Admin ↔ Staff) with guardrails
  app.post("/api/super-admin/users/:userId/toggle-role", authenticateToken, requireSuperAdminEmail, async (req, res) => {
    try {
      const { userId } = req.params;

      // Get current user
      const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (!user.rows[0]) {
        return res.status(404).json({ message: 'User not found' });
      }

      const currentUser = user.rows[0];
      
      // Cannot toggle super_admin accounts
      if (currentUser.role === 'super_admin') {
        return res.status(400).json({ message: 'Cannot modify super admin accounts' });
      }

      // Determine new role
      const newRole = currentUser.role === 'garage_admin' ? 'mechanic_staff' : 'garage_admin';
      
      // Apply guardrails via storage method (which checks for last admin)
      const updatedUser = await storage.updateUserRole(userId, newRole, req.user.id);
      
      res.json({ 
        ...updatedUser, 
        password: undefined 
      });
    } catch (error: any) {
      console.error('Toggle role error:', error);
      res.status(400).json({ message: error.message || 'Failed to toggle role' });
    }
  });

  // Get access requests (optional feature)
  app.get("/api/super-admin/access-requests", authenticateToken, requireSuperAdminEmail, async (req, res) => {
    try {
      const { garageId } = req.query;
      const requests = await storage.getAccessRequests(garageId as string);
      res.json(requests);
    } catch (error: any) {
      console.error('Get access requests error:', error);
      res.status(500).json({ message: 'Failed to fetch access requests' });
    }
  });

  // Process access request (approve/deny)
  app.post("/api/super-admin/access-requests/:requestId", authenticateToken, requireSuperAdminEmail, async (req, res) => {
    try {
      const { requestId } = req.params;
      const { status, note } = req.body; // status: 'approved' | 'denied'

      if (!['approved', 'denied'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // Update access request
      const updatedRequest = await storage.updateAccessRequest(requestId, {
        status,
        note,
        processed_by: req.user.id
      });

      res.json(updatedRequest);
    } catch (error: any) {
      console.error('Process access request error:', error);
      res.status(500).json({ message: 'Failed to process request' });
    }
  });

  // Get audit logs
  app.get("/api/super-admin/audit-logs", authenticateToken, requireSuperAdminEmail, async (req, res) => {
    try {
      const { garageId } = req.query;
      const logs = await storage.getAuditLogs(garageId as string);
      res.json(logs);
    } catch (error: any) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  // No longer need to create or return HTTP server for Vercel functions
}

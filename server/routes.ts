import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertGarageSchema, insertCustomerSchema, insertSparePartSchema, insertJobCardSchema, insertInvoiceSchema } from "../shared/schema";
import { z } from "zod";
import { GmailEmailService } from "./gmailEmailService";
import { pool } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "GarageGuru2025ProductionJWTSecret!";

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
  if (!garageId || garageId !== req.user.garageId) {
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

  // Request activation code route
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

      // Generate random alphanumeric activation code
      const generateRandomCode = () => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };
      const generatedActivationCode = generateRandomCode();

      const requestData = {
        email,
        name,
        requestType: requestType || 'staff',
        message,
        garageId,
        garageName,
        garageOwner,
        generatedActivationCode,
        timestamp: new Date().toLocaleString()
      };

      // Send email notification to super admin via Gmail
      const gmailService = GmailEmailService.getInstance();
      const emailSent = await gmailService.sendAccessRequestNotification(
        SUPER_ADMIN_EMAIL,
        requestData
      );
      
      const responseMessage = emailSent 
        ? `Access request sent to super admin (${SUPER_ADMIN_EMAIL}). You will receive activation code via email if approved.`
        : `Access request logged for super admin review. Check server logs or configure email delivery.`;
      
      res.json({ message: responseMessage });
    } catch (error) {
      console.error('Access request error:', error);
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
        garageId: garage.id,
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
          garageId: null,
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
        garageId
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
        return res.status(400).json({ message: 'Email and password required' });
      }
      
      const user = await storage.getUserByEmail(email);
      console.log('User found:', user ? 'Yes' : 'No');
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      console.log('Password valid:', validPassword ? 'Yes' : 'No');
      
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const token = jwt.sign({ email: user.email, id: user.id }, JWT_SECRET);
      console.log('JWT token generated successfully');
      
      let garage = null;
      if (user.garageId) {
        garage = await storage.getGarage(user.garageId);
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
      
      // Create/update low stock notifications
      await storage.createLowStockNotifications(garageId);
      
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
        customers.find(c => c.phone === jobCardData.phone && c.bikeNumber === jobCardData.bikeNumber)
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
      const customer = await storage.getCustomer(jobCard.customerId, garageId);
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
      const userGarageId = (req as any).user.garageId;
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

  // No longer need to create or return HTTP server for Vercel functions
}

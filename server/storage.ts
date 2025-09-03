import { pool } from "./db.js";
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Type definitions (keeping the same interface types)
export interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  garage_id: string | null;
  name: string | null;
  must_change_password?: boolean;
  created_at: Date;
}

export interface Garage {
  id: string;
  name: string;
  owner_name: string;
  phone: string | null;
  email: string | null;
  logo: string | null;
  created_at: Date;
}

export interface Customer {
  id: string;
  garage_id: string;
  name: string;
  phone: string | null;
  bike_number: string | null;
  total_jobs: number;
  total_spent: number;
  last_visit: Date | null;
  created_at: Date;
  notes: string | null;
}

export interface SparePart {
  id: string;
  garage_id: string;
  name: string;
  part_number: string | null;
  price: number;
  quantity: number;
  low_stock_threshold: number;
  barcode: string | null;
  created_at: Date;
  cost_price: number | null;
}

export interface JobCard {
  id: string;
  garage_id: string;
  customer_id: string | null;
  customer_name: string;
  phone: string | null;
  bike_number: string | null;
  complaint: string;
  status: string;
  spare_parts: any;
  service_charge: number;
  total_amount: number;
  created_at: Date;
  completed_at: Date | null;
  completed_by: string | null;
  completion_notes: string | null;
  work_summary: string | null;
}

export interface Invoice {
  id: string;
  garage_id: string;
  job_card_id: string | null;
  customer_id: string | null;
  invoice_number: string;
  download_token: string | null;
  whatsapp_sent: boolean;
  total_amount: number;
  parts_total: number;
  service_charge: number;
  created_at: Date;
}

export interface OtpRecord {
  id: string;
  email: string;
  hashed_otp: string;
  salt: string;
  purpose: string;
  attempts: number;
  used: boolean;
  expires_at: Date;
  created_at: Date;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_email: string;
  target_user_id?: string;
  target_email?: string;
  action: string;
  details?: any;
  garage_id?: string;
  created_at: Date;
}

export interface AccessRequest {
  id: string;
  garage_id: string;
  user_id: string;
  email: string;
  name: string;
  requested_role: string;
  status: string;
  note?: string;
  processed_by?: string;
  processed_at?: Date;
  created_at: Date;
}

export interface IStorage {
  // Database health
  ping(): Promise<boolean>;
  
  // Auth
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  createGarage(garage: Partial<Garage>): Promise<Garage>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  changePassword(userId: string, newPassword: string): Promise<void>;
  
  // Garages
  getGarage(id: string): Promise<Garage | undefined>;
  updateGarage(id: string, garage: Partial<Garage>): Promise<Garage>;
  
  // Customers
  getCustomers(garageId: string): Promise<Customer[]>;
  getCustomer(id: string, garageId: string): Promise<Customer | undefined>;
  searchCustomers(garageId: string, query: string): Promise<Customer[]>;
  createCustomer(customer: Partial<Customer>): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer>;
  
  // Spare Parts
  getSpareParts(garageId: string): Promise<SparePart[]>;
  getLowStockParts(garageId: string): Promise<SparePart[]>;
  getSparePart(id: string, garageId: string): Promise<SparePart | undefined>;
  searchSpareParts(garageId: string, query: string): Promise<SparePart[]>;
  createSparePart(part: Partial<SparePart>): Promise<SparePart>;
  updateSparePart(id: string, part: Partial<SparePart>): Promise<SparePart>;
  deleteSparePart(id: string, garageId: string): Promise<void>;
  
  // Job Cards
  getJobCards(garageId: string, status?: string): Promise<JobCard[]>;
  getJobCard(id: string, garageId: string): Promise<JobCard | undefined>;
  createJobCard(jobCard: Partial<JobCard>): Promise<JobCard>;
  updateJobCard(id: string, jobCard: Partial<JobCard>): Promise<JobCard>;
  
  // Invoices
  getInvoices(garageId: string): Promise<Invoice[]>;
  getCustomerInvoices(customerId: string, garageId: string): Promise<Invoice[]>;
  createInvoice(invoice: Partial<Invoice>): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice>;
  
  // Analytics
  getSalesStats(garageId: string): Promise<{
    totalInvoices: number;
    totalPartsTotal: number;
    totalServiceCharges: number;
    totalProfit: number;
  }>;
  
  getMonthlySalesData(garageId: string): Promise<Array<{
    month: string;
    year: number;
    serviceCharges: number;
    invoiceCount: number;
  }>>;

  updateUserGarage(userId: string, garageId: string): Promise<User>;
  
  // Super Admin functionality
  getAllGarages(): Promise<Garage[]>;
  getAllUsers(): Promise<User[]>;
  getUsersByGarage(garageId: string): Promise<User[]>;
  updateUserRole(userId: string, role: string, actorId: string): Promise<User>;
  
  // OTP Management
  createOtpRecord(record: Partial<OtpRecord>): Promise<OtpRecord>;
  getOtpRecord(email: string, purpose: string): Promise<OtpRecord | undefined>;
  updateOtpRecord(id: string, record: Partial<OtpRecord>): Promise<OtpRecord>;
  
  // Audit Logs
  createAuditLog(log: Partial<AuditLog>): Promise<AuditLog>;
  getAuditLogs(garageId?: string): Promise<AuditLog[]>;
  
  // Access Requests
  createAccessRequest(request: Partial<AccessRequest>): Promise<AccessRequest>;
  getAccessRequests(garageId?: string): Promise<AccessRequest[]>;
  updateAccessRequest(id: string, request: Partial<AccessRequest>): Promise<AccessRequest>;
  checkExistingAccessRequest(email: string): Promise<AccessRequest | null>;
  
  // Notifications
  createNotification(notification: any): Promise<any>;
  getNotifications(garageId: string): Promise<any[]>;
  getUnreadNotificationCount(garageId: string): Promise<number>;
  markNotificationAsRead(id: string, garageId: string): Promise<void>;
  markAllNotificationsAsRead(garageId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async ping(): Promise<boolean> {
    try {
      const result = await pool.query('SELECT 1 as ping');
      return result.rows[0]?.ping === 1;
    } catch (error) {
      console.error('Database ping failed:', error);
      return false;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
      return result.rows[0];
    } catch (error) {
      console.error('getUserByEmail error:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);
      return result.rows[0];
    } catch (error) {
      console.error('getUserByUsername error:', error);
      return undefined;
    }
  }

  async getUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $1 LIMIT 1', [emailOrUsername]);
      return result.rows[0];
    } catch (error) {
      console.error('getUserByEmailOrUsername error:', error);
      return undefined;
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('getUserById error:', error);
      return undefined;
    }
  }

  async createUser(user: Partial<User>): Promise<User> {
    const id = user.id || crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO users (id, email, password, role, garage_id, name, must_change_password, first_login, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [
        id, 
        user.email, 
        user.password, 
        user.role, 
        user.garage_id, 
        user.name, 
        user.must_change_password || false,
        (user as any).firstLogin !== false, // Default to true unless explicitly set to false
        (user as any).status || 'active',
        new Date()
      ]
    );
    return result.rows[0];
  }

  async createGarage(garage: Partial<Garage>): Promise<Garage> {
    const id = garage.id || crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO garages (id, name, owner_name, phone, email, logo, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, garage.name, garage.owner_name, garage.phone, garage.email, garage.logo, new Date()]
    );
    return result.rows[0];
  }

  async getGarage(id: string): Promise<Garage | undefined> {
    try {
      const result = await pool.query('SELECT * FROM garages WHERE id = $1', [id]);
      const garage = result.rows[0];
      if (garage) {
        // Convert snake_case to camelCase for frontend compatibility
        return {
          ...garage,
          ownerName: garage.owner_name,
          createdAt: garage.created_at
        };
      }
      return garage;
    } catch (error) {
      console.error('getGarage error:', error);
      return undefined;
    }
  }

  async getGarageStaff(garageId: string): Promise<User[]> {
    try {
      const result = await pool.query(
        `SELECT id, email, name, role, status, garage_id, created_at 
         FROM users 
         WHERE garage_id = $1 AND role = 'mechanic_staff'
         ORDER BY created_at DESC`,
        [garageId]
      );
      return result.rows;
    } catch (error) {
      console.error('getGarageStaff error:', error);
      return [];
    }
  }


  async updateGarage(id: string, garage: Partial<Garage>): Promise<Garage> {
    const result = await pool.query(
      'UPDATE garages SET name = COALESCE($2, name), owner_name = COALESCE($3, owner_name), phone = COALESCE($4, phone), email = COALESCE($5, email), logo = COALESCE($6, logo) WHERE id = $1 RETURNING *',
      [id, garage.name, garage.owner_name, garage.phone, garage.email, garage.logo]
    );
    return result.rows[0];
  }

  async getCustomers(garageId: string): Promise<Customer[]> {
    const result = await pool.query('SELECT * FROM customers WHERE garage_id = $1 ORDER BY created_at DESC', [garageId]);
    return result.rows.map(customer => ({
      ...customer,
      bikeNumber: customer.bike_number,
      totalJobs: customer.total_jobs,
      totalSpent: customer.total_spent,
      lastVisit: customer.last_visit,
      createdAt: customer.created_at
    }));
  }

  async getCustomer(id: string, garageId: string): Promise<Customer | undefined> {
    try {
      const result = await pool.query('SELECT * FROM customers WHERE id = $1 AND garage_id = $2', [id, garageId]);
      const customer = result.rows[0];
      if (!customer) return undefined;
      
      return {
        ...customer,
        bikeNumber: customer.bike_number,
        totalJobs: customer.total_jobs,
        totalSpent: customer.total_spent,
        lastVisit: customer.last_visit,
        createdAt: customer.created_at
      };
    } catch (error) {
      console.error('getCustomer error:', error);
      return undefined;
    }
  }

  async searchCustomers(garageId: string, query: string): Promise<Customer[]> {
    const result = await pool.query(
      'SELECT * FROM customers WHERE garage_id = $1 AND (name ILIKE $2 OR phone ILIKE $2 OR bike_number ILIKE $2)',
      [garageId, `%${query}%`]
    );
    return result.rows.map(customer => ({
      ...customer,
      bikeNumber: customer.bike_number,
      totalJobs: customer.total_jobs,
      totalSpent: customer.total_spent,
      lastVisit: customer.last_visit,
      createdAt: customer.created_at
    }));
  }

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    const id = customer.id || crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO customers (id, garage_id, name, phone, bike_number, total_jobs, total_spent, last_visit, created_at, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [id, customer.garage_id, customer.name, customer.phone, customer.bike_number, customer.total_jobs || 0, customer.total_spent || 0, customer.last_visit, new Date(), customer.notes]
    );
    return result.rows[0];
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    const result = await pool.query(
      'UPDATE customers SET name = COALESCE($2, name), phone = COALESCE($3, phone), bike_number = COALESCE($4, bike_number), total_jobs = COALESCE($5, total_jobs), total_spent = COALESCE($6, total_spent), last_visit = COALESCE($7, last_visit), notes = COALESCE($8, notes) WHERE id = $1 RETURNING *',
      [id, customer.name, customer.phone, customer.bike_number, customer.total_jobs, customer.total_spent, customer.last_visit, customer.notes]
    );
    const updatedCustomer = result.rows[0];
    
    return {
      ...updatedCustomer,
      bikeNumber: updatedCustomer.bike_number,
      totalJobs: updatedCustomer.total_jobs,
      totalSpent: updatedCustomer.total_spent,
      lastVisit: updatedCustomer.last_visit,
      createdAt: updatedCustomer.created_at
    };
  }

  async updateUserGarage(userId: string, garageId: string): Promise<User> {
    const result = await pool.query(
      'UPDATE users SET garage_id = $2 WHERE id = $1 RETURNING *',
      [userId, garageId]
    );
    return result.rows[0];
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const values = fields.map(field => (updates as any)[field]);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
      [userId, ...values]
    );
    return result.rows[0];
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $2, must_change_password = FALSE WHERE id = $1',
      [userId, hashedPassword]
    );
  }

  // Spare Parts methods
  async getSpareParts(garageId: string): Promise<SparePart[]> {
    const result = await pool.query('SELECT * FROM spare_parts WHERE garage_id = $1 ORDER BY created_at DESC', [garageId]);
    // Map database fields to frontend-expected fields
    return result.rows.map(row => ({
      ...row,
      partNumber: row.part_number,
      costPrice: row.cost_price,
      lowStockThreshold: row.low_stock_threshold,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async getLowStockParts(garageId: string): Promise<SparePart[]> {
    const result = await pool.query('SELECT * FROM spare_parts WHERE garage_id = $1 AND quantity <= low_stock_threshold', [garageId]);
    const lowStockParts = result.rows;
    
    // Create notifications for low stock parts (avoid duplicates)
    for (const part of lowStockParts) {
      try {
        // Check if notification already exists for this part (within last 24 hours)
        const existingNotification = await pool.query(
          'SELECT id FROM notifications WHERE garage_id = $1 AND type = $2 AND data->>\'partId\' = $3 AND created_at > NOW() - INTERVAL \'24 hours\'',
          [garageId, 'low_stock', part.id]
        );
        
        if (existingNotification.rows.length === 0) {
          // Create new low stock notification
          await this.createNotification({
            garageId,
            title: 'Low Stock Alert',
            message: `${part.name} (${part.part_number || 'No part number'}) is running low. Only ${part.quantity} left (threshold: ${part.low_stock_threshold})`,
            type: 'low_stock',
            data: { partId: part.id, partName: part.name, quantity: part.quantity, threshold: part.low_stock_threshold }
          });
        }
      } catch (error) {
        console.error('Error creating low stock notification:', error);
      }
    }
    
    // Map database fields to frontend-expected fields for low stock parts
    return lowStockParts.map(row => ({
      ...row,
      partNumber: row.part_number,
      costPrice: row.cost_price,
      lowStockThreshold: row.low_stock_threshold,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async getSparePart(id: string, garageId: string): Promise<SparePart | undefined> {
    try {
      const result = await pool.query('SELECT * FROM spare_parts WHERE id = $1 AND garage_id = $2', [id, garageId]);
      if (result.rows[0]) {
        const row = result.rows[0];
        return {
          ...row,
          partNumber: row.part_number,
          costPrice: row.cost_price,
          lowStockThreshold: row.low_stock_threshold,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
      return undefined;
    } catch (error) {
      console.error('getSparePart error:', error);
      return undefined;
    }
  }

  async searchSpareParts(garageId: string, query: string): Promise<SparePart[]> {
    const result = await pool.query(
      'SELECT * FROM spare_parts WHERE garage_id = $1 AND (name ILIKE $2 OR part_number ILIKE $2)',
      [garageId, `%${query}%`]
    );
    // Map database fields to frontend-expected fields
    return result.rows.map(row => ({
      ...row,
      partNumber: row.part_number,
      costPrice: row.cost_price,
      lowStockThreshold: row.low_stock_threshold,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async createSparePart(part: Partial<SparePart>): Promise<SparePart> {
    const id = part.id || crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO spare_parts (id, garage_id, name, part_number, price, quantity, low_stock_threshold, barcode, created_at, cost_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [id, part.garage_id, part.name, part.part_number, part.price, part.quantity || 0, part.low_stock_threshold || 5, part.barcode, new Date(), part.cost_price]
    );
    const row = result.rows[0];
    // Map database fields to frontend-expected fields
    return {
      ...row,
      partNumber: row.part_number,
      costPrice: row.cost_price,
      lowStockThreshold: row.low_stock_threshold,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async updateSparePart(id: string, part: Partial<SparePart>): Promise<SparePart> {
    const result = await pool.query(
      'UPDATE spare_parts SET name = COALESCE($2, name), part_number = COALESCE($3, part_number), price = COALESCE($4, price), quantity = COALESCE($5, quantity), low_stock_threshold = COALESCE($6, low_stock_threshold), barcode = COALESCE($7, barcode), cost_price = COALESCE($8, cost_price) WHERE id = $1 RETURNING *',
      [id, part.name, part.part_number, part.price, part.quantity, part.low_stock_threshold, part.barcode, part.cost_price]
    );
    const row = result.rows[0];
    // Map database fields to frontend-expected fields
    return {
      ...row,
      partNumber: row.part_number,
      costPrice: row.cost_price,
      lowStockThreshold: row.low_stock_threshold,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async deleteSparePart(id: string, garageId: string): Promise<void> {
    await pool.query('DELETE FROM spare_parts WHERE id = $1 AND garage_id = $2', [id, garageId]);
  }

  // Job Cards (simplified implementation)
  async getJobCards(garageId: string, status?: string): Promise<JobCard[]> {
    let query = 'SELECT * FROM job_cards WHERE garage_id = $1';
    let params = [garageId];
    
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  }

  async getJobCard(id: string, garageId: string): Promise<JobCard | undefined> {
    try {
      const result = await pool.query('SELECT * FROM job_cards WHERE id = $1 AND garage_id = $2', [id, garageId]);
      return result.rows[0];
    } catch (error) {
      console.error('getJobCard error:', error);
      return undefined;
    }
  }

  async createJobCard(jobCard: Partial<JobCard>): Promise<JobCard> {
    const id = jobCard.id || crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO job_cards (id, garage_id, customer_id, customer_name, phone, bike_number, complaint, status, spare_parts, service_charge, total_amount, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [id, jobCard.garage_id, jobCard.customer_id, jobCard.customer_name, jobCard.phone, jobCard.bike_number, jobCard.complaint, jobCard.status || 'pending', JSON.stringify(jobCard.spare_parts), jobCard.service_charge || 0, jobCard.total_amount || 0, new Date()]
    );
    return result.rows[0];
  }

  async updateJobCard(id: string, jobCard: Partial<JobCard>): Promise<JobCard> {
    // Get the current job card to compare spare parts
    const currentResult = await pool.query('SELECT * FROM job_cards WHERE id = $1', [id]);
    const currentJobCard = currentResult.rows[0];
    
    // If spare_parts are being updated, handle inventory
    if (jobCard.spare_parts) {
      const currentParts = currentJobCard.spare_parts || [];
      const newParts = jobCard.spare_parts;
      
      // Return old quantities to inventory
      for (const currentPart of currentParts) {
        await pool.query(
          'UPDATE spare_parts SET quantity = quantity + $1 WHERE id = $2',
          [currentPart.quantity, currentPart.id]
        );
      }
      
      // Check new parts inventory and deduct quantities
      for (const newPart of newParts) {
        const partResult = await pool.query('SELECT quantity FROM spare_parts WHERE id = $1', [newPart.id]);
        if (partResult.rows.length === 0) {
          throw new Error(`Spare part with ID ${newPart.id} not found`);
        }
        
        const availableQuantity = parseInt(partResult.rows[0].quantity);
        if (availableQuantity < newPart.quantity) {
          throw new Error(`Insufficient stock for ${newPart.name}. Available: ${availableQuantity}, Required: ${newPart.quantity}`);
        }
        
        // Deduct the quantity
        await pool.query(
          'UPDATE spare_parts SET quantity = quantity - $1 WHERE id = $2',
          [newPart.quantity, newPart.id]
        );
      }
    }

    const result = await pool.query(
      `UPDATE job_cards SET 
        complaint = COALESCE($2, complaint), 
        spare_parts = COALESCE($3, spare_parts), 
        service_charge = COALESCE($4, service_charge), 
        total_amount = COALESCE($5, total_amount), 
        water_wash_charge = COALESCE($6, water_wash_charge), 
        diesel_charge = COALESCE($7, diesel_charge), 
        petrol_charge = COALESCE($8, petrol_charge), 
        foundry_charge = COALESCE($9, foundry_charge),
        status = COALESCE($10, status), 
        completed_at = COALESCE($11, completed_at), 
        completed_by = COALESCE($12, completed_by), 
        completion_notes = COALESCE($13, completion_notes), 
        work_summary = COALESCE($14, work_summary) 
       WHERE id = $1 RETURNING *`,
      [
        id, 
        jobCard.complaint, 
        jobCard.spare_parts ? JSON.stringify(jobCard.spare_parts) : null, 
        jobCard.service_charge, 
        jobCard.total_amount, 
        (jobCard as any).waterWashCharge || (jobCard as any).water_wash_charge, 
        (jobCard as any).dieselCharge || (jobCard as any).diesel_charge, 
        (jobCard as any).petrolCharge || (jobCard as any).petrol_charge, 
        (jobCard as any).foundryCharge || (jobCard as any).foundry_charge,
        jobCard.status, 
        jobCard.completed_at, 
        jobCard.completed_by, 
        jobCard.completion_notes, 
        jobCard.work_summary
      ]
    );
    return result.rows[0];
  }

  // Invoices (simplified implementation)
  async getInvoices(garageId: string): Promise<Invoice[]> {
    const result = await pool.query(`
      SELECT 
        i.*,
        c.name as customer_name,
        c.bike_number,
        c.phone,
        c.total_jobs as visit_count
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.garage_id = $1 
      ORDER BY i.created_at DESC
    `, [garageId]);
    return result.rows;
  }

  async getCustomerInvoices(customerId: string, garageId: string): Promise<Invoice[]> {
    const result = await pool.query('SELECT * FROM invoices WHERE customer_id = $1 AND garage_id = $2 ORDER BY created_at DESC', [customerId, garageId]);
    return result.rows;
  }

  async getInvoiceByJobCardId(jobCardId: string): Promise<Invoice | undefined> {
    const result = await pool.query('SELECT * FROM invoices WHERE job_card_id = $1 LIMIT 1', [jobCardId]);
    return result.rows[0];
  }

  async createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
    const id = invoice.id || crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO invoices (id, garage_id, job_card_id, customer_id, invoice_number, download_token, whatsapp_sent, total_amount, parts_total, service_charge, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [id, invoice.garage_id, invoice.job_card_id, invoice.customer_id, invoice.invoice_number, invoice.download_token, invoice.whatsapp_sent || false, invoice.total_amount || 0, invoice.parts_total || 0, invoice.service_charge || 0, new Date()]
    );
    
    // Update customer visit count and last visit date when invoice is created
    if (invoice.customer_id && invoice.garage_id) {
      try {
        console.log(`📊 [INVOICE] Updating visit count for customer ${invoice.customer_id}`);
        await pool.query(
          'UPDATE customers SET total_jobs = total_jobs + 1, last_visit = $1, total_spent = total_spent + $2 WHERE id = $3 AND garage_id = $4',
          [new Date(), invoice.total_amount || 0, invoice.customer_id, invoice.garage_id]
        );
        console.log(`✅ [INVOICE] Customer visit count updated successfully`);
      } catch (error) {
        console.error('❌ [INVOICE] Error updating customer visit count:', error);
      }
    }
    
    // Ensure jobCardId is available in the returned invoice
    const createdInvoice = result.rows[0];
    if (createdInvoice && !createdInvoice.job_card_id && createdInvoice.job_card_id) {
      createdInvoice.job_card_id = createdInvoice.job_card_id;
    }
    
    return createdInvoice;
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    const result = await pool.query(
      'UPDATE invoices SET whatsapp_sent = COALESCE($2, whatsapp_sent), download_token = COALESCE($3, download_token) WHERE id = $1 RETURNING *',
      [id, invoice.whatsapp_sent, invoice.download_token]
    );
    return result.rows[0];
  }

  // Utility function to sync customer visit counts based on existing invoices
  async syncCustomerVisitCounts(garageId: string): Promise<void> {
    try {
      const result = await pool.query(`
        UPDATE customers 
        SET total_jobs = (
          SELECT COUNT(*) 
          FROM invoices 
          WHERE invoices.customer_id = customers.id
        ),
        total_spent = (
          SELECT COALESCE(SUM(total_amount), 0) 
          FROM invoices 
          WHERE invoices.customer_id = customers.id
        ),
        last_visit = (
          SELECT MAX(created_at)
          FROM invoices 
          WHERE invoices.customer_id = customers.id
        )
        WHERE garage_id = $1
      `, [garageId]);
      console.log(`✅ Synced visit counts and last visit dates for customers in garage ${garageId}`);
    } catch (error) {
      console.error('Error syncing customer visit counts:', error);
    }
  }

  // Analytics (simplified implementation)
  async getSalesStats(garageId: string): Promise<{
    totalInvoices: number;
    totalPartsTotal: number;
    totalServiceCharges: number;
    totalProfit: number;
  }> {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_invoices, 
        COALESCE(SUM(parts_total), 0) as total_parts_total, 
        COALESCE(SUM(service_charge), 0) as total_service_charges,
        COALESCE(SUM(i.service_charge), 0) - 
        COALESCE(SUM(COALESCE(j.water_wash_charge, 0) + COALESCE(j.diesel_charge, 0) + COALESCE(j.petrol_charge, 0) + COALESCE(j.foundry_charge, 0)), 0) as total_profit
       FROM invoices i
       LEFT JOIN job_cards j ON i.job_card_id = j.id
       WHERE i.garage_id = $1`,
      [garageId]
    );
    
    const row = result.rows[0];
    return {
      totalInvoices: parseInt(row.total_invoices),
      totalPartsTotal: parseFloat(row.total_parts_total),
      totalServiceCharges: parseFloat(row.total_service_charges), 
      totalProfit: parseFloat(row.total_profit)
    };
  }

  async getTodaySalesStats(garageId: string): Promise<{
    todayProfit: number;
    todayInvoices: number;
    todayService: number;
    todayParts: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const result = await pool.query(
      `SELECT 
        COUNT(*) as today_invoices,
        COALESCE(SUM(i.parts_total), 0) as today_parts,
        COALESCE(SUM(i.service_charge), 0) as today_service,
        COALESCE(SUM(i.service_charge), 0) - 
        COALESCE(SUM(COALESCE(j.water_wash_charge, 0) + COALESCE(j.diesel_charge, 0) + COALESCE(j.petrol_charge, 0) + COALESCE(j.foundry_charge, 0)), 0) as today_profit
       FROM invoices i
       LEFT JOIN job_cards j ON i.job_card_id = j.id
       WHERE i.garage_id = $1 AND i.created_at >= $2 AND i.created_at < $3`,
      [garageId, today.toISOString(), tomorrow.toISOString()]
    );
    
    const row = result.rows[0];
    return {
      todayProfit: parseFloat(row.today_profit || 0),
      todayInvoices: parseInt(row.today_invoices || 0),
      todayService: parseFloat(row.today_service || 0),
      todayParts: parseFloat(row.today_parts || 0)
    };
  }

  async getSalesDataByDateRange(garageId: string, startDate: string, endDate: string): Promise<Array<{
    date: string;
    period: string;
    revenue: number;
    totalSales: number;
    serviceCharges: number;
    partsRevenue: number;
    profit: number;
    count: number;
    invoiceCount: number;
  }>> {
    const result = await pool.query(
      `SELECT 
        DATE(i.created_at) as date,
        DATE(i.created_at) as period,
        COALESCE(SUM(i.total_amount), 0) as revenue,
        COALESCE(SUM(i.total_amount), 0) as total_sales,
        COALESCE(SUM(i.service_charge), 0) as service_charges,
        COALESCE(SUM(i.parts_total), 0) as parts_revenue,
        COALESCE(SUM(i.service_charge), 0) - 
        COALESCE(SUM(COALESCE(j.water_wash_charge, 0) + COALESCE(j.diesel_charge, 0) + COALESCE(j.petrol_charge, 0) + COALESCE(j.foundry_charge, 0)), 0) as profit,
        COUNT(*) as count,
        COUNT(*) as invoice_count
       FROM invoices i
       LEFT JOIN job_cards j ON i.job_card_id = j.id
       WHERE i.garage_id = $1 AND DATE(i.created_at) BETWEEN $2 AND $3
       GROUP BY DATE(i.created_at)
       ORDER BY DATE(i.created_at) ASC`,
      [garageId, startDate, endDate]
    );

    return result.rows.map(row => ({
      date: row.date,
      period: row.period,
      revenue: parseFloat(row.revenue || 0),
      totalSales: parseFloat(row.total_sales || 0),
      serviceCharges: parseFloat(row.service_charges || 0),
      partsRevenue: parseFloat(row.parts_revenue || 0),
      profit: parseFloat(row.profit || 0),
      count: parseInt(row.count || 0),
      invoiceCount: parseInt(row.invoice_count || 0)
    }));
  }

  async getMonthlySalesData(garageId: string): Promise<Array<{
    month: string;
    year: number;
    serviceCharges: number;
    invoiceCount: number;
  }>> {
    const result = await pool.query(
      `SELECT 
        EXTRACT(MONTH FROM created_at) as month,
        EXTRACT(YEAR FROM created_at) as year,
        COALESCE(SUM(service_charge), 0) as service_charges,
        COUNT(*) as invoice_count
       FROM invoices 
       WHERE garage_id = $1 
       GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
       ORDER BY year DESC, month DESC
       LIMIT 12`,
      [garageId]
    );

    return result.rows.map(row => ({
      month: new Date(0, row.month - 1).toLocaleString('default', { month: 'short' }),
      year: parseInt(row.year),
      serviceCharges: parseFloat(row.service_charges),
      invoiceCount: parseInt(row.invoice_count)
    }));
  }

  // Super Admin functionality implementations
  async getAllGarages(): Promise<Garage[]> {
    const result = await pool.query('SELECT * FROM garages ORDER BY created_at DESC');
    return result.rows;
  }

  async getAllUsers(): Promise<User[]> {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  }

  async getUsersByGarage(garageId: string): Promise<User[]> {
    const result = await pool.query('SELECT * FROM users WHERE garage_id = $1 ORDER BY created_at DESC', [garageId]);
    return result.rows;
  }

  async updateUserRole(userId: string, role: string, actorId: string): Promise<User> {
    // First, check if this would demote the last admin
    if (role === 'mechanic_staff') {
      const user = await pool.query('SELECT garage_id FROM users WHERE id = $1', [userId]);
      if (user.rows[0]?.garage_id) {
        const adminCount = await pool.query(
          'SELECT COUNT(*) as count FROM users WHERE garage_id = $1 AND role = $2',
          [user.rows[0].garage_id, 'garage_admin']
        );
        if (parseInt(adminCount.rows[0].count) <= 1) {
          throw new Error('Cannot demote the last admin in the garage');
        }
      }
    }

    // Update the user role
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
      [role, userId]
    );

    // Create audit log
    const actor = await pool.query('SELECT email, garage_id FROM users WHERE id = $1', [actorId]);
    const targetUser = result.rows[0];
    
    await this.createAuditLog({
      actor_id: actorId,
      actor_email: actor.rows[0]?.email || 'system',
      target_user_id: userId,
      target_email: targetUser.email,
      action: 'role_change',
      details: { new_role: role, previous_role: targetUser.role },
      garage_id: targetUser.garage_id || actor.rows[0]?.garage_id
    });

    return result.rows[0];
  }

  // OTP Management implementations
  async createOtpRecord(record: Partial<OtpRecord>): Promise<OtpRecord> {
    const id = crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO otp_records (id, email, hashed_otp, salt, purpose, attempts, used, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [id, record.email, record.hashed_otp, record.salt, record.purpose, record.attempts || 0, record.used || false, record.expires_at]
    );
    return result.rows[0];
  }

  async getOtpRecord(email: string, purpose: string): Promise<OtpRecord | undefined> {
    const result = await pool.query(
      'SELECT * FROM otp_records WHERE email = $1 AND purpose = $2 AND used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, purpose]
    );
    return result.rows[0];
  }

  async updateOtpRecord(id: string, record: Partial<OtpRecord>): Promise<OtpRecord> {
    const fields = Object.keys(record).filter(key => key !== 'id');
    const values = fields.map(field => (record as any)[field]);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await pool.query(
      `UPDATE otp_records SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  }

  // Audit Logs implementations  
  async createAuditLog(log: Partial<AuditLog>): Promise<AuditLog> {
    const id = crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO audit_logs (id, actor_id, actor_email, target_user_id, target_email, action, details, garage_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [id, log.actor_id, log.actor_email, log.target_user_id, log.target_email, log.action, JSON.stringify(log.details), log.garage_id]
    );
    return result.rows[0];
  }

  async getAuditLogs(garageId?: string): Promise<AuditLog[]> {
    let query = 'SELECT * FROM audit_logs';
    let params: any[] = [];
    
    if (garageId) {
      query += ' WHERE garage_id = $1';
      params = [garageId];
    }
    
    query += ' ORDER BY created_at DESC LIMIT 100';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Access Requests implementations
  async createAccessRequest(request: Partial<AccessRequest>): Promise<AccessRequest> {
    const id = crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO access_requests (id, garage_id, user_id, email, name, requested_role, status, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [id, request.garage_id, request.user_id, request.email, request.name, request.requested_role, request.status || 'pending', request.note]
    );
    return result.rows[0];
  }

  async checkExistingAccessRequest(email: string): Promise<AccessRequest | null> {
    const result = await pool.query(
      'SELECT * FROM access_requests WHERE email = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
      [email, 'pending']
    );
    return result.rows[0] || null;
  }

  async getAccessRequests(garageId?: string): Promise<AccessRequest[]> {
    let query = 'SELECT * FROM access_requests';
    let params: any[] = [];
    
    if (garageId) {
      query += ' WHERE garage_id = $1';
      params = [garageId];
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  async updateAccessRequest(id: string, request: Partial<AccessRequest>): Promise<AccessRequest> {
    const fields = Object.keys(request).filter(key => key !== 'id');
    const values = fields.map(field => (request as any)[field]);
    
    // Add processed_at if status is being changed to approved/denied
    if (fields.includes('status') && (request.status === 'approved' || request.status === 'denied')) {
      if (!fields.includes('processed_at')) {
        fields.push('processed_at');
        values.push(new Date());
      }
    }
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await pool.query(
      `UPDATE access_requests SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  }

  // Notification methods
  async createNotification(notification: any): Promise<any> {
    const id = crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO notifications (id, garage_id, title, message, type, is_read, data, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [id, notification.garageId, notification.title, notification.message, notification.type, false, JSON.stringify(notification.data || {}), new Date()]
    );
    return result.rows[0];
  }

  async getNotifications(garageId: string): Promise<any[]> {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE garage_id = $1 ORDER BY created_at DESC LIMIT 50',
      [garageId]
    );
    return result.rows;
  }

  async getUnreadNotificationCount(garageId: string): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE garage_id = $1 AND is_read = false',
      [garageId]
    );
    return parseInt(result.rows[0].count);
  }

  async markNotificationAsRead(id: string, garageId: string): Promise<void> {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND garage_id = $2',
      [id, garageId]
    );
  }

  async markAllNotificationsAsRead(garageId: string): Promise<void> {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE garage_id = $1 AND is_read = false',
      [garageId]
    );
  }

  async fixUndefinedWorkSummaries(): Promise<void> {
    try {
      // Fix work summaries that contain "undefined"
      const result = await pool.query(`
        UPDATE job_cards 
        SET work_summary = 'Service completed for ' || bike_number || ' - ' || complaint
        WHERE work_summary LIKE '%undefined%' AND bike_number IS NOT NULL
      `);
      if (result.rowCount && result.rowCount > 0) {
        console.log(`✅ Fixed ${result.rowCount} work summaries with undefined values`);
      }
    } catch (error) {
      console.error('❌ Failed to fix undefined work summaries:', error);
    }
  }
}

// Export storage instance
export const storage = new DatabaseStorage();
import { pool } from "./db.js";

// Type definitions (keeping the same interface types)
export interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  garage_id: string | null;
  name: string | null;
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
}

export interface Invoice {
  id: string;
  garage_id: string;
  job_card_id: string | null;
  customer_id: string | null;
  invoice_number: string;
  pdf_url: string | null;
  whatsapp_sent: boolean;
  total_amount: number;
  parts_total: number;
  service_charge: number;
  created_at: Date;
}

export interface IStorage {
  // Database health
  ping(): Promise<boolean>;
  
  // Auth
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  createGarage(garage: Partial<Garage>): Promise<Garage>;
  
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

  async createUser(user: Partial<User>): Promise<User> {
    const id = user.id || crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO users (id, email, password, role, garage_id, name, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, user.email, user.password, user.role, user.garage_id, user.name, new Date()]
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
      return result.rows[0];
    } catch (error) {
      console.error('getGarage error:', error);
      return undefined;
    }
  }

  async getAllGarages(): Promise<Garage[]> {
    try {
      const result = await pool.query('SELECT * FROM garages ORDER BY name');
      return result.rows;
    } catch (error) {
      console.error('getAllGarages error:', error);
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
    return result.rows;
  }

  async getCustomer(id: string, garageId: string): Promise<Customer | undefined> {
    try {
      const result = await pool.query('SELECT * FROM customers WHERE id = $1 AND garage_id = $2', [id, garageId]);
      return result.rows[0];
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
    return result.rows;
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
    return result.rows[0];
  }

  async updateUserGarage(userId: string, garageId: string): Promise<User> {
    const result = await pool.query(
      'UPDATE users SET garage_id = $2 WHERE id = $1 RETURNING *',
      [userId, garageId]
    );
    return result.rows[0];
  }

  // Spare Parts methods
  async getSpareParts(garageId: string): Promise<SparePart[]> {
    const result = await pool.query('SELECT * FROM spare_parts WHERE garage_id = $1 ORDER BY created_at DESC', [garageId]);
    return result.rows;
  }

  async getLowStockParts(garageId: string): Promise<SparePart[]> {
    const result = await pool.query('SELECT * FROM spare_parts WHERE garage_id = $1 AND quantity <= low_stock_threshold', [garageId]);
    return result.rows;
  }

  async getSparePart(id: string, garageId: string): Promise<SparePart | undefined> {
    try {
      const result = await pool.query('SELECT * FROM spare_parts WHERE id = $1 AND garage_id = $2', [id, garageId]);
      return result.rows[0];
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
    return result.rows;
  }

  async createSparePart(part: Partial<SparePart>): Promise<SparePart> {
    const id = part.id || crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO spare_parts (id, garage_id, name, part_number, price, quantity, low_stock_threshold, barcode, created_at, cost_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [id, part.garage_id, part.name, part.part_number, part.price, part.quantity || 0, part.low_stock_threshold || 5, part.barcode, new Date(), part.cost_price]
    );
    return result.rows[0];
  }

  async updateSparePart(id: string, part: Partial<SparePart>): Promise<SparePart> {
    const result = await pool.query(
      'UPDATE spare_parts SET name = COALESCE($2, name), part_number = COALESCE($3, part_number), price = COALESCE($4, price), quantity = COALESCE($5, quantity), low_stock_threshold = COALESCE($6, low_stock_threshold), barcode = COALESCE($7, barcode), cost_price = COALESCE($8, cost_price) WHERE id = $1 RETURNING *',
      [id, part.name, part.part_number, part.price, part.quantity, part.low_stock_threshold, part.barcode, part.cost_price]
    );
    return result.rows[0];
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
    const result = await pool.query(
      'UPDATE job_cards SET status = COALESCE($2, status), service_charge = COALESCE($3, service_charge), total_amount = COALESCE($4, total_amount), completed_at = COALESCE($5, completed_at) WHERE id = $1 RETURNING *',
      [id, jobCard.status, jobCard.service_charge, jobCard.total_amount, jobCard.completed_at]
    );
    return result.rows[0];
  }

  // Invoices (simplified implementation)
  async getInvoices(garageId: string): Promise<Invoice[]> {
    const result = await pool.query('SELECT * FROM invoices WHERE garage_id = $1 ORDER BY created_at DESC', [garageId]);
    return result.rows;
  }

  async getCustomerInvoices(customerId: string, garageId: string): Promise<Invoice[]> {
    const result = await pool.query('SELECT * FROM invoices WHERE customer_id = $1 AND garage_id = $2 ORDER BY created_at DESC', [customerId, garageId]);
    return result.rows;
  }

  async createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
    const id = invoice.id || crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO invoices (id, garage_id, job_card_id, customer_id, invoice_number, pdf_url, whatsapp_sent, total_amount, parts_total, service_charge, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [id, invoice.garage_id, invoice.job_card_id, invoice.customer_id, invoice.invoice_number, invoice.pdf_url, invoice.whatsapp_sent || false, invoice.total_amount || 0, invoice.parts_total || 0, invoice.service_charge || 0, new Date()]
    );
    return result.rows[0];
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    const result = await pool.query(
      'UPDATE invoices SET whatsapp_sent = COALESCE($2, whatsapp_sent), pdf_url = COALESCE($3, pdf_url) WHERE id = $1 RETURNING *',
      [id, invoice.whatsapp_sent, invoice.pdf_url]
    );
    return result.rows[0];
  }

  // Analytics (simplified implementation)
  async getSalesStats(garageId: string): Promise<{
    totalInvoices: number;
    totalPartsTotal: number;
    totalServiceCharges: number;
    totalProfit: number;
  }> {
    const result = await pool.query(
      'SELECT COUNT(*) as total_invoices, COALESCE(SUM(parts_total), 0) as total_parts_total, COALESCE(SUM(service_charge), 0) as total_service_charges, COALESCE(SUM(total_amount), 0) as total_profit FROM invoices WHERE garage_id = $1',
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
}

// Export storage instance
export const storage = new DatabaseStorage();
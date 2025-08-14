// Simplified storage for deployment - removes problematic notification references
import { db } from "./db";
import { 
  garages, users, customers, spareParts, jobCards, invoices,
  type Garage, type User, type Customer, type SparePart, type JobCard, type Invoice,
  type InsertGarage, type InsertUser, type InsertCustomer, type InsertSparePart, type InsertJobCard, type InsertInvoice
} from "../shared/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Garage operations
  createGarage(garage: InsertGarage): Promise<Garage>;
  getGarage(id: string): Promise<Garage | undefined>;
  updateGarage(id: string, garage: Partial<Garage>): Promise<Garage>;

  // User operations  
  createUser(user: InsertUser & { password: string }): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: string, user: Partial<User>): Promise<User>;

  // Customer operations
  getCustomers(garageId: string): Promise<Customer[]>;
  searchCustomers(garageId: string, query: string): Promise<Customer[]>;
  getCustomer(id: string, garageId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer>;

  // Spare parts operations
  getSpareParts(garageId: string): Promise<SparePart[]>;
  getSparePart(id: string, garageId: string): Promise<SparePart | undefined>;
  createSparePart(part: InsertSparePart): Promise<SparePart>;
  updateSparePart(id: string, part: Partial<SparePart>): Promise<SparePart>;

  // Job card operations
  getJobCards(garageId: string, status?: string): Promise<JobCard[]>;
  getJobCard(id: string, garageId: string): Promise<JobCard | undefined>;
  createJobCard(jobCard: any): Promise<JobCard>;
  updateJobCard(id: string, jobCard: Partial<JobCard>): Promise<JobCard>;

  // Invoice operations
  getInvoices(garageId: string): Promise<any[]>;
  getCustomerInvoices(customerId: string, garageId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice>;

  // Advanced spare parts operations
  searchSpareParts(garageId: string, query: string): Promise<SparePart[]>;
  getLowStockParts(garageId: string): Promise<SparePart[]>;
  deleteSparePart(id: string, garageId: string): Promise<void>;

  // Analytics operations
  getSalesStats(garageId: string): Promise<any>;
  getMonthlySalesData(garageId: string): Promise<any>;
  getSalesDataByDateRange(garageId: string, startDate: string, endDate: string): Promise<any>;
  getCustomerAnalytics(garageId: string): Promise<any>;
  getTopCustomersByServices(garageId: string): Promise<any>;
  getTopCustomersByRevenue(garageId: string): Promise<any>;

  // Notification operations
  createNotification(notification: any): Promise<any>;
  createLowStockNotifications(garageId: string): Promise<void>;
  getNotifications(garageId: string): Promise<any[]>;
  getUnreadNotificationCount(garageId: string): Promise<number>;
  markNotificationAsRead(notificationId: string, garageId: string): Promise<void>;
  markAllNotificationsAsRead(garageId: string): Promise<void>;

  // Debug operations for production troubleshooting
  getAllUsers(): Promise<User[]>;
  getAllGarages(): Promise<Garage[]>;
}

export class DatabaseStorage implements IStorage {
  async createGarage(garage: InsertGarage): Promise<Garage> {
    const result = await db.insert(garages).values([garage]).returning();
    return result[0];
  }

  async getGarage(id: string): Promise<Garage | undefined> {
    const result = await db.select().from(garages).where(eq(garages.id, id)).limit(1);
    return result[0];
  }

  async updateGarage(id: string, garage: Partial<Garage>): Promise<Garage> {
    const result = await db.update(garages).set(garage).where(eq(garages.id, id)).returning();
    return result[0];
  }

  async createUser(user: InsertUser & { password: string }): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const result = await db.insert(users).values([{
      ...user,
      password: hashedPassword
    }]).returning();
    return result[0];
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getCustomers(garageId: string): Promise<Customer[]> {
    return await db.select().from(customers)
      .where(eq(customers.garageId, garageId))
      .orderBy(desc(customers.createdAt));
  }

  async searchCustomers(garageId: string, query: string): Promise<Customer[]> {
    return await db.select().from(customers)
      .where(and(
        eq(customers.garageId, garageId),
        sql`LOWER(${customers.name}) LIKE LOWER(${'%' + query + '%'})`
      ))
      .orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string, garageId: string): Promise<Customer | undefined> {
    const result = await db.select().from(customers)
      .where(and(eq(customers.id, id), eq(customers.garageId, garageId)))
      .limit(1);
    return result[0];
  }

  async getCustomerByBikeNumber(bikeNumber: string, garageId: string): Promise<Customer | undefined> {
    const result = await db.select().from(customers)
      .where(and(eq(customers.bikeNumber, bikeNumber), eq(customers.garageId, garageId)))
      .limit(1);
    return result[0];
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    // Check for duplicate bike number in the same garage
    const existingCustomer = await this.getCustomerByBikeNumber(customer.bikeNumber, customer.garageId);
    if (existingCustomer) {
      throw new Error(`Customer with bike number "${customer.bikeNumber}" already exists. Customer: ${existingCustomer.name}`);
    }

    const result = await db.insert(customers).values([customer]).returning();
    return result[0];
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    const result = await db.update(customers).set(customer).where(eq(customers.id, id)).returning();
    return result[0];
  }

  async getSpareParts(garageId: string): Promise<SparePart[]> {
    return await db.select().from(spareParts)
      .where(eq(spareParts.garageId, garageId))
      .orderBy(desc(spareParts.createdAt));
  }

  async getSparePart(id: string, garageId: string): Promise<SparePart | undefined> {
    const result = await db.select().from(spareParts)
      .where(and(eq(spareParts.id, id), eq(spareParts.garageId, garageId)))
      .limit(1);
    return result[0];
  }

  async createSparePart(part: InsertSparePart): Promise<SparePart> {
    const result = await db.insert(spareParts).values([part]).returning();
    return result[0];
  }

  async updateSparePart(id: string, part: Partial<SparePart>): Promise<SparePart> {
    const result = await db.update(spareParts).set(part).where(eq(spareParts.id, id)).returning();
    return result[0];
  }

  async getJobCards(garageId: string, status?: string): Promise<JobCard[]> {
    const conditions = [eq(jobCards.garageId, garageId)];
    if (status) {
      conditions.push(eq(jobCards.status, status));
    }
    
    return await db.select().from(jobCards)
      .where(and(...conditions))
      .orderBy(desc(jobCards.createdAt));
  }

  async getJobCard(id: string, garageId: string): Promise<JobCard | undefined> {
    const result = await db.select().from(jobCards)
      .where(and(eq(jobCards.id, id), eq(jobCards.garageId, garageId)))
      .limit(1);
    return result[0];
  }

  async createJobCard(jobCard: any): Promise<JobCard> {
    const result = await db.insert(jobCards).values([jobCard]).returning();
    return result[0];
  }

  async updateJobCard(id: string, jobCard: Partial<JobCard>): Promise<JobCard> {
    const result = await db.update(jobCards).set(jobCard).where(eq(jobCards.id, id)).returning();
    return result[0];
  }

  async getInvoices(garageId: string): Promise<any[]> {
    return await db.select({
      id: invoices.id,
      garageId: invoices.garageId,
      jobCardId: invoices.jobCardId,
      customerId: invoices.customerId,
      invoiceNumber: invoices.invoiceNumber,
      pdfUrl: invoices.pdfUrl,
      whatsappSent: invoices.whatsappSent,
      totalAmount: invoices.totalAmount,
      partsTotal: invoices.partsTotal,
      serviceCharge: invoices.serviceCharge,
      createdAt: invoices.createdAt
    })
    .from(invoices)
    .where(eq(invoices.garageId, garageId))
    .orderBy(desc(invoices.createdAt));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values([invoice]).returning();
    return result[0];
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    const result = await db.update(invoices).set(invoice).where(eq(invoices.id, id)).returning();
    return result[0];
  }

  async getCustomerInvoices(customerId: string, garageId: string): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(and(eq(invoices.customerId, customerId), eq(invoices.garageId, garageId)))
      .orderBy(desc(invoices.createdAt));
  }

  // Advanced spare parts operations
  async searchSpareParts(garageId: string, query: string): Promise<SparePart[]> {
    return await db.select().from(spareParts)
      .where(and(
        eq(spareParts.garageId, garageId),
        sql`LOWER(${spareParts.name}) LIKE LOWER(${'%' + query + '%'}) OR LOWER(${spareParts.partNumber}) LIKE LOWER(${'%' + query + '%'})`
      ))
      .orderBy(desc(spareParts.createdAt));
  }

  async getLowStockParts(garageId: string): Promise<SparePart[]> {
    return await db.select().from(spareParts)
      .where(and(
        eq(spareParts.garageId, garageId),
        sql`quantity <= low_stock_threshold`
      ));
  }

  async deleteSparePart(id: string, garageId: string): Promise<void> {
    await db.delete(spareParts).where(and(eq(spareParts.id, id), eq(spareParts.garageId, garageId)));
  }

  // Analytics operations (simplified implementations)
  async getSalesStats(garageId: string): Promise<any> {
    const result = await db.select({
      totalInvoices: sql`COUNT(*)`,
      totalRevenue: sql`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`,
      totalPartsTotal: sql`SUM(CAST(${invoices.partsTotal} AS DECIMAL))`,
      totalServiceCharges: sql`SUM(CAST(${invoices.serviceCharge} AS DECIMAL))`
    }).from(invoices).where(eq(invoices.garageId, garageId));
    
    const stats = result[0];
    const partsRevenue = Number(stats.totalPartsTotal) || 0;
    const serviceCharges = Number(stats.totalServiceCharges) || 0;
    
    // For now, profit = service charges only (cost price calculation will be enhanced later)
    const totalProfit = serviceCharges;
    
    return {
      totalInvoices: stats.totalInvoices || 0,
      totalPartsTotal: partsRevenue,
      totalServiceCharges: serviceCharges,
      totalProfit: totalProfit,
    };
  }

  async getTodaySalesStats(garageId: string): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await db.select({
      todayInvoices: sql`COUNT(*)`,
      todayRevenue: sql`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`,
      todayPartsTotal: sql`SUM(CAST(${invoices.partsTotal} AS DECIMAL))`,
      todayServiceCharges: sql`SUM(CAST(${invoices.serviceCharge} AS DECIMAL))`
    }).from(invoices)
    .where(and(
      eq(invoices.garageId, garageId),
      sql`DATE(${invoices.createdAt}) = ${today}::date`
    ));
    
    const stats = result[0];
    const todayPartsRevenue = Number(stats.todayPartsTotal) || 0;
    const todayServiceCharges = Number(stats.todayServiceCharges) || 0;
    
    // For now, today's profit = service charges only 
    const todayProfit = todayServiceCharges;
    
    return {
      todayInvoices: stats.todayInvoices || 0,
      todayRevenue: Number(stats.todayRevenue) || 0,
      todayPartsTotal: todayPartsRevenue,
      todayServiceCharges: todayServiceCharges,
      todayProfit: todayProfit,
    };
  }

  async getMonthlySalesData(garageId: string): Promise<any> {
    return await db.select({
      month: sql`DATE_TRUNC('month', ${invoices.createdAt})`,
      revenue: sql`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`,
      count: sql`COUNT(*)`
    }).from(invoices)
      .where(eq(invoices.garageId, garageId))
      .groupBy(sql`DATE_TRUNC('month', ${invoices.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${invoices.createdAt})`);
  }

  async getSalesDataByDateRange(garageId: string, startDate: string, endDate: string): Promise<any> {
    const result = await db.select({
      date: sql`DATE(${invoices.createdAt})`,
      totalRevenue: sql`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`,
      serviceCharges: sql`SUM(CAST(${invoices.serviceCharge} AS DECIMAL))`,
      partsRevenue: sql`SUM(CAST(${invoices.partsTotal} AS DECIMAL))`,
      count: sql`COUNT(*)`
    }).from(invoices)
      .where(and(
        eq(invoices.garageId, garageId),
        gte(invoices.createdAt, new Date(startDate)),
        lte(invoices.createdAt, new Date(endDate))
      ))
      .groupBy(sql`DATE(${invoices.createdAt})`)
      .orderBy(sql`DATE(${invoices.createdAt})`);
    
    // Transform the result to include calculated profit
    return result.map(item => ({
      date: item.date,
      revenue: Number(item.totalRevenue) || 0,
      serviceCharges: Number(item.serviceCharges) || 0,
      partsRevenue: Number(item.partsRevenue) || 0,
      profit: Number(item.serviceCharges) || 0, // For now, profit = service charges (parts cost calculation being enhanced)
      count: Number(item.count) || 0
    }));
  }

  async getCustomerAnalytics(garageId: string): Promise<any> {
    return await db.select({
      customerId: invoices.customerId,
      totalSpent: sql`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`,
      totalJobs: sql`COUNT(*)`
    }).from(invoices)
      .where(eq(invoices.garageId, garageId))
      .groupBy(invoices.customerId)
      .orderBy(sql`SUM(CAST(${invoices.totalAmount} AS DECIMAL)) DESC`);
  }

  async getTopCustomersByServices(garageId: string): Promise<any> {
    return await db.select({
      customerId: invoices.customerId,
      serviceCount: sql`COUNT(*)`
    }).from(invoices)
      .where(eq(invoices.garageId, garageId))
      .groupBy(invoices.customerId)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(10);
  }

  async getTopCustomersByRevenue(garageId: string): Promise<any> {
    return await db.select({
      customerId: invoices.customerId,
      totalRevenue: sql`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`
    }).from(invoices)
      .where(eq(invoices.garageId, garageId))
      .groupBy(invoices.customerId)
      .orderBy(sql`SUM(CAST(${invoices.totalAmount} AS DECIMAL)) DESC`)
      .limit(10);
  }

  // Notification operations (simplified - no actual notifications table)
  async createNotification(notification: any): Promise<any> {
    console.log('Notification created:', notification);
    return { id: 'mock-notification-id', ...notification };
  }

  async createLowStockNotifications(garageId: string): Promise<void> {
    const lowStockParts = await this.getLowStockParts(garageId);
    console.log(`Found ${lowStockParts.length} low stock parts for garage ${garageId}`);
  }

  async getNotifications(garageId: string): Promise<any[]> {
    return [];
  }

  async getUnreadNotificationCount(garageId: string): Promise<number> {
    return 0;
  }

  async markNotificationAsRead(notificationId: string, garageId: string): Promise<void> {
    console.log(`Marked notification ${notificationId} as read for garage ${garageId}`);
  }

  async markAllNotificationsAsRead(garageId: string): Promise<void> {
    console.log(`Marked all notifications as read for garage ${garageId}`);
  }

  // Debug operations for production troubleshooting
  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result;
  }

  async getAllGarages(): Promise<Garage[]> {
    const result = await db.select().from(garages);
    return result;
  }
}

export const storage = new DatabaseStorage();
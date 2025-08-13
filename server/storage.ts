import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { 
  garages, users, customers, spareParts, jobCards, invoices, superAdminRequests,
  type Garage, type User, type Customer, type SparePart, type JobCard, type Invoice,
  type SuperAdminRequest,
  type InsertGarage, type InsertUser, type InsertCustomer, type InsertSparePart, type InsertJobCard, type InsertInvoice,
  type InsertSuperAdminRequest
} from "./schema.js";
import { eq, and, desc, sql } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({ connectionString });
const db = drizzle({ client: pool });

export interface IStorage {
  // Auth
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createGarage(garage: InsertGarage): Promise<Garage>;
  
  // Garages
  getGarage(id: string): Promise<Garage | undefined>;
  updateGarage(id: string, garage: Partial<Garage>): Promise<Garage>;
  
  // Customers
  getCustomers(garageId: string): Promise<Customer[]>;
  getCustomer(id: string, garageId: string): Promise<Customer | undefined>;
  searchCustomers(garageId: string, query: string): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer>;
  
  // Spare Parts
  getSpareParts(garageId: string): Promise<SparePart[]>;
  getLowStockParts(garageId: string): Promise<SparePart[]>;
  getSparePart(id: string, garageId: string): Promise<SparePart | undefined>;
  searchSpareParts(garageId: string, query: string): Promise<SparePart[]>;
  createSparePart(part: InsertSparePart): Promise<SparePart>;
  updateSparePart(id: string, part: Partial<SparePart>): Promise<SparePart>;
  deleteSparePart(id: string, garageId: string): Promise<void>;
  
  // Job Cards
  getJobCards(garageId: string, status?: string): Promise<JobCard[]>;
  getJobCard(id: string, garageId: string): Promise<JobCard | undefined>;
  createJobCard(jobCard: InsertJobCard): Promise<JobCard>;
  updateJobCard(id: string, jobCard: Partial<JobCard>): Promise<JobCard>;
  
  // Invoices
  getInvoices(garageId: string): Promise<Invoice[]>;
  getCustomerInvoices(customerId: string, garageId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
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
}

export class SupabaseStorage implements IStorage {
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values([user]).returning();
    return result[0];
  }

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

  async getCustomers(garageId: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.garageId, garageId)).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string, garageId: string): Promise<Customer | undefined> {
    const result = await db.select().from(customers)
      .where(and(eq(customers.id, id), eq(customers.garageId, garageId)))
      .limit(1);
    return result[0];
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values([customer]).returning();
    return result[0];
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    const result = await db.update(customers).set(customer).where(eq(customers.id, id)).returning();
    return result[0];
  }

  async searchCustomers(garageId: string, query: string): Promise<Customer[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(customers)
      .where(and(
        eq(customers.garageId, garageId),
        sql`(LOWER(${customers.name}) LIKE ${searchTerm} OR LOWER(${customers.phone}) LIKE ${searchTerm} OR LOWER(${customers.bikeNumber}) LIKE ${searchTerm})`
      ))
      .orderBy(desc(customers.createdAt))
      .limit(10);
  }

  async searchSpareParts(garageId: string, query: string): Promise<SparePart[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(spareParts)
      .where(and(
        eq(spareParts.garageId, garageId),
        sql`(LOWER(${spareParts.partNumber}) LIKE ${searchTerm} OR LOWER(${spareParts.name}) LIKE ${searchTerm})`
      ))
      .orderBy(desc(spareParts.createdAt))
      .limit(10);
  }

  async getSpareParts(garageId: string): Promise<SparePart[]> {
    try {
      return await db.select().from(spareParts).where(eq(spareParts.garageId, garageId)).orderBy(desc(spareParts.createdAt));
    } catch (error) {
      console.error('Error fetching spare parts:', error);
      return [];
    }
  }

  async getLowStockParts(garageId: string): Promise<SparePart[]> {
    try {
      return await db.select().from(spareParts)
        .where(and(
          eq(spareParts.garageId, garageId),
          sql`quantity <= low_stock_threshold`
        ));
    } catch (error) {
      console.error('Error fetching low stock parts:', error);
      return [];
    }
  }

  async createLowStockNotifications(garageId: string): Promise<void> {
    try {
      const lowStockParts = await this.getLowStockParts(garageId);
      
      // Remove existing low stock notifications for this garage
      await db.delete(notifications)
        .where(and(
          eq(notifications.garageId, garageId),
          eq(notifications.type, 'low_stock')
        ));

      // Create new notifications for each low stock part
      if (lowStockParts.length > 0) {
        const notificationsToInsert = lowStockParts.map(part => ({
          garageId,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${part.name} (${part.partNumber}) is running low. Only ${part.quantity} left.`,
          isRead: false,
          data: { partId: part.id, partNumber: part.partNumber, currentStock: part.quantity }
        }));

        await db.insert(notifications).values(notificationsToInsert);
      }
    } catch (error) {
      console.error('Error creating low stock notifications:', error);
    }
  }

  async getSparePart(id: string, garageId: string): Promise<SparePart | undefined> {
    const result = await db.select().from(spareParts)
      .where(and(eq(spareParts.id, id), eq(spareParts.garageId, garageId)))
      .limit(1);
    return result[0];
  }

  async createSparePart(part: InsertSparePart): Promise<SparePart> {
    try {
      const result = await db.insert(spareParts).values([part]).returning();
      return result[0];
    } catch (error: any) {
      if (error.code === '23505' && error.constraint === 'spare_parts_part_number_unique') {
        throw new Error(`Part number "${part.partNumber}" already exists`);
      }
      throw error;
    }
  }

  async updateSparePart(id: string, part: Partial<SparePart>): Promise<SparePart> {
    const result = await db.update(spareParts).set(part).where(eq(spareParts.id, id)).returning();
    return result[0];
  }

  async deleteSparePart(id: string, garageId: string): Promise<void> {
    await db.delete(spareParts).where(and(eq(spareParts.id, id), eq(spareParts.garageId, garageId)));
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
      createdAt: invoices.createdAt,
      jobCard: {
        customerName: sql`COALESCE(${jobCards.customerName}, 'Unknown')`.as('customerName'),
        phone: sql`COALESCE(${jobCards.phone}, '')`.as('phone'),
        bikeNumber: sql`COALESCE(${jobCards.bikeNumber}, '')`.as('bikeNumber'),
        complaint: sql`COALESCE(${jobCards.complaint}, '')`.as('complaint')
      }
    })
    .from(invoices)
    .leftJoin(jobCards, eq(invoices.jobCardId, jobCards.id))
    .where(eq(invoices.garageId, garageId))
    .orderBy(desc(invoices.createdAt));
  }

  async getCustomerInvoices(customerId: string, garageId: string): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(and(eq(invoices.customerId, customerId), eq(invoices.garageId, garageId)))
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

  async getSalesStats(garageId: string): Promise<{
    totalInvoices: number;
    totalPartsTotal: number;
    totalServiceCharges: number;
    totalProfit: number;
  }> {
    const result = await db.select({
      totalInvoices: sql<number>`count(*)`,
      totalPartsTotal: sql<number>`sum(${invoices.partsTotal})`,
      totalServiceCharges: sql<number>`sum(${invoices.serviceCharge})`,
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

  async getMonthlySalesData(garageId: string): Promise<Array<{
    month: string;
    year: number;
    serviceCharges: number;
    invoiceCount: number;
  }>> {
    const result = await db.select({
      month: sql<string>`to_char(${invoices.createdAt}, 'Month')`,
      year: sql<number>`extract(year from ${invoices.createdAt})`,
      serviceCharges: sql<number>`sum(${invoices.serviceCharge})`,
      invoiceCount: sql<number>`count(*)`,
    })
    .from(invoices)
    .where(eq(invoices.garageId, garageId))
    .groupBy(
      sql`extract(year from ${invoices.createdAt})`,
      sql`extract(month from ${invoices.createdAt})`,
      sql`to_char(${invoices.createdAt}, 'Month')`
    )
    .orderBy(
      sql`extract(year from ${invoices.createdAt}) desc`,
      sql`extract(month from ${invoices.createdAt}) desc`
    )
    .limit(6);

    return result.map(item => ({
      month: item.month?.trim() || '',
      year: Number(item.year) || new Date().getFullYear(),
      serviceCharges: Number(item.serviceCharges) || 0,
      invoiceCount: Number(item.invoiceCount) || 0,
    }));
  }

  // Notifications methods
  async getNotifications(garageId: string): Promise<SelectNotification[]> {
    try {
      return await db.select().from(notifications)
        .where(eq(notifications.garageId, garageId))
        .orderBy(desc(notifications.createdAt));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async createNotification(notification: InsertNotification): Promise<SelectNotification | null> {
    try {
      const result = await db.insert(notifications).values([notification]).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  async markNotificationAsRead(id: string): Promise<void> {
    try {
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllNotificationsAsRead(garageId: string): Promise<void> {
    try {
      await db.update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.garageId, garageId), eq(notifications.isRead, false)));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  async getUnreadNotificationCount(garageId: string): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(eq(notifications.garageId, garageId), eq(notifications.isRead, false)));
      return Number(result[0]?.count) || 0;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  // Enhanced sales analytics methods
  async getSalesDataByDateRange(garageId: string, startDate: string, endDate: string, groupBy: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<Array<{
    period: string;
    totalSales: number;
    serviceCharges: number;
    partsRevenue: number;
    profit: number;
    invoiceCount: number;
  }>> {
    try {
      let dateFormatSql: any;
      let groupBySql: any;

      switch (groupBy) {
        case 'hour':
          dateFormatSql = sql`to_char(${invoices.createdAt} AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:00')`;
          groupBySql = sql`to_char(${invoices.createdAt} AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:00')`;
          break;
        case 'day':
          dateFormatSql = sql`to_char(${invoices.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')`;
          groupBySql = sql`to_char(${invoices.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')`;
          break;
        case 'week':
          dateFormatSql = sql`to_char(date_trunc('week', ${invoices.createdAt}), 'YYYY-MM-DD')`;
          groupBySql = sql`to_char(date_trunc('week', ${invoices.createdAt}), 'YYYY-MM-DD')`;
          break;
        case 'quarter':
          dateFormatSql = sql`to_char(date_trunc('quarter', ${invoices.createdAt}), 'YYYY') || '-Q' || extract(quarter from ${invoices.createdAt})`;
          groupBySql = sql`to_char(date_trunc('quarter', ${invoices.createdAt}), 'YYYY') || '-Q' || extract(quarter from ${invoices.createdAt})`;
          break;
        case 'year':
          dateFormatSql = sql`to_char(${invoices.createdAt}, 'YYYY')`;
          groupBySql = sql`to_char(${invoices.createdAt}, 'YYYY')`;
          break;
        default: // month
          dateFormatSql = sql`to_char(${invoices.createdAt}, 'YYYY-MM')`;
          groupBySql = sql`to_char(${invoices.createdAt}, 'YYYY-MM')`;
          break;
      }

      const result = await db.select({
        period: dateFormatSql.as('period'),
        serviceCharges: sql<number>`sum(${invoices.serviceCharge})`.as('serviceCharges'),
        partsRevenue: sql<number>`sum(${invoices.partsTotal})`.as('partsRevenue'),
        totalSales: sql<number>`sum(${invoices.serviceCharge} + ${invoices.partsTotal})`.as('totalSales'),
        invoiceCount: sql<number>`count(*)`.as('invoiceCount'),
      })
      .from(invoices)
      .where(and(
        eq(invoices.garageId, garageId),
        sql`DATE(${invoices.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') >= ${startDate}::date`,
        sql`DATE(${invoices.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') <= ${endDate}::date`
      ))
      .groupBy(groupBySql)
      .orderBy(groupBySql);

      console.log(`SQL Result:`, result);

      return result.map(item => ({
        period: String(item.period) || '',
        totalSales: Number(item.totalSales) || 0,
        serviceCharges: Number(item.serviceCharges) || 0,
        partsRevenue: Number(item.partsRevenue) || 0,
        profit: Number(item.serviceCharges) || 0, // For now, profit = service charges
        invoiceCount: Number(item.invoiceCount) || 0,
      }));
    } catch (error) {
      console.error('Error fetching sales data by date range:', error);
      return [];
    }
  }

  // Customer analytics methods
  async getCustomerAnalytics(garageId: string, startDate: string, endDate: string, groupBy: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<Array<{
    customerId: string;
    customerName: string;
    serviceCount: number;
    totalRevenue: number;
    lastVisit: string;
  }>> {
    try {
      const result = await db.select({
        customerId: invoices.customerId,
        customerName: customers.name,
        serviceCount: sql<number>`count(*)`.as('serviceCount'),
        totalRevenue: sql<number>`sum(${invoices.serviceCharge} + ${invoices.partsTotal})`.as('totalRevenue'),
        lastVisit: sql<string>`max(${invoices.createdAt})`.as('lastVisit'),
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(
        eq(invoices.garageId, garageId),
        sql`${invoices.createdAt} >= ${startDate}::date`,
        sql`${invoices.createdAt} < (${endDate}::date + interval '1 day')`
      ))
      .groupBy(invoices.customerId, customers.name)
      .orderBy(sql<number>`sum(${invoices.serviceCharge} + ${invoices.partsTotal}) DESC`);

      return result.map(item => ({
        customerId: String(item.customerId) || '',
        customerName: String(item.customerName) || '',
        serviceCount: Number(item.serviceCount) || 0,
        totalRevenue: Number(item.totalRevenue) || 0,
        lastVisit: String(item.lastVisit) || '',
      }));
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      return [];
    }
  }

  async getTopCustomersByServices(garageId: string, startDate: string, endDate: string, limit: number = 10): Promise<Array<{
    customerName: string;
    serviceCount: number;
    totalRevenue: number;
  }>> {
    try {
      const result = await db.select({
        customerName: customers.name,
        serviceCount: sql<number>`count(*)`.as('serviceCount'),
        totalRevenue: sql<number>`sum(${invoices.serviceCharge} + ${invoices.partsTotal})`.as('totalRevenue'),
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(
        eq(invoices.garageId, garageId),
        sql`${invoices.createdAt} >= ${startDate}::date`,
        sql`${invoices.createdAt} < (${endDate}::date + interval '1 day')`
      ))
      .groupBy(customers.name)
      .orderBy(sql<number>`count(*) DESC`)
      .limit(limit);

      return result.map(item => ({
        customerName: String(item.customerName) || '',
        serviceCount: Number(item.serviceCount) || 0,
        totalRevenue: Number(item.totalRevenue) || 0,
      }));
    } catch (error) {
      console.error('Error fetching top customers by services:', error);
      return [];
    }
  }

  async getTopCustomersByRevenue(garageId: string, startDate: string, endDate: string, limit: number = 10): Promise<Array<{
    customerName: string;
    serviceCount: number;
    totalRevenue: number;
  }>> {
    try {
      const result = await db.select({
        customerName: customers.name,
        serviceCount: sql<number>`count(*)`.as('serviceCount'),
        totalRevenue: sql<number>`sum(${invoices.serviceCharge} + ${invoices.partsTotal})`.as('totalRevenue'),
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(
        eq(invoices.garageId, garageId),
        sql`${invoices.createdAt} >= ${startDate}::date`,
        sql`${invoices.createdAt} < (${endDate}::date + interval '1 day')`
      ))
      .groupBy(customers.name)
      .orderBy(sql<number>`sum(${invoices.serviceCharge} + ${invoices.partsTotal}) DESC`)
      .limit(limit);

      return result.map(item => ({
        customerName: String(item.customerName) || '',
        serviceCount: Number(item.serviceCount) || 0,
        totalRevenue: Number(item.totalRevenue) || 0,
      }));
    } catch (error) {
      console.error('Error fetching top customers by revenue:', error);
      return [];
    }
  }
}

export const storage = new SupabaseStorage();

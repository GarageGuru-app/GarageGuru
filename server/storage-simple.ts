// Simplified storage for deployment - removes problematic notification references
import { db } from "./db";
import { 
  garages, users, customers, spareParts, jobCards, invoices,
  type Garage, type User, type Customer, type SparePart, type JobCard, type Invoice,
  type InsertGarage, type InsertUser, type InsertCustomer, type InsertSparePart, type InsertJobCard, type InsertInvoice
} from "@shared/schema";
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
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice>;
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

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
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
}

export const storage = new DatabaseStorage();
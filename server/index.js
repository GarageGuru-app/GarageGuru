// standalone.ts
import express from "express";
import { createServer } from "http";
import cors from "cors";

// storage.ts
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var garages = pgTable("garages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  logo: text("logo"),
  // Cloudinary URL
  createdAt: timestamp("created_at").defaultNow()
});
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  // 'garage_admin', 'mechanic_staff', 'super_admin'
  garageId: varchar("garage_id").references(() => garages.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  garageId: varchar("garage_id").notNull().references(() => garages.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  bikeNumber: text("bike_number").notNull(),
  notes: text("notes"),
  totalJobs: integer("total_jobs").default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
  lastVisit: timestamp("last_visit"),
  createdAt: timestamp("created_at").defaultNow()
});
var spareParts = pgTable("spare_parts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  garageId: varchar("garage_id").notNull().references(() => garages.id),
  partNumber: text("part_number").notNull(),
  // Unique identifier for the part
  name: text("name").notNull(),
  // Display name for the part
  quantity: integer("quantity").notNull().default(0),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  createdAt: timestamp("created_at").defaultNow()
});
var jobCards = pgTable("job_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  garageId: varchar("garage_id").notNull().references(() => garages.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  description: text("description").notNull(),
  serviceCharge: decimal("service_charge", { precision: 10, scale: 2 }).notNull(),
  spareParts: jsonb("spare_parts").$type().default([]),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  // 'pending', 'completed'
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  garageId: varchar("garage_id").notNull().references(() => garages.id),
  jobCardId: varchar("job_card_id").notNull().references(() => jobCards.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  fileName: text("file_name").notNull(),
  // PDF filename
  cloudinaryUrl: text("cloudinary_url").notNull(),
  // URL to the PDF
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var superAdminRequests = pgTable("super_admin_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userEmail: text("user_email").notNull(),
  activationCode: text("activation_code").notNull(),
  status: text("status").notNull().default("pending"),
  // 'pending', 'approved', 'rejected'
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at")
});
var insertGarageSchema = createInsertSchema(garages).omit({
  id: true,
  createdAt: true
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  totalJobs: true,
  totalSpent: true,
  lastVisit: true
});
var insertSparePartSchema = createInsertSchema(spareParts).omit({
  id: true,
  createdAt: true
});
var insertJobCardSchema = createInsertSchema(jobCards).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  status: true,
  customerId: true
}).extend({
  customerName: z.string().min(1, "Customer name is required"),
  phone: z.string().min(1, "Phone number is required"),
  bikeNumber: z.string().min(1, "Bike number is required"),
  spareParts: z.array(z.object({
    id: z.string(),
    partNumber: z.string(),
    name: z.string(),
    quantity: z.number(),
    price: z.number()
  })).optional().default([]),
  serviceCharge: z.union([
    z.string(),
    z.number().transform(String)
  ]).optional(),
  totalAmount: z.union([
    z.string(),
    z.number().transform(String)
  ]).optional()
});
var insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true
});
var insertSuperAdminRequestSchema = createInsertSchema(superAdminRequests).omit({
  id: true,
  requestedAt: true,
  processedAt: true
});

// storage.ts
import { eq, and, desc, sql as sql2 } from "drizzle-orm";
neonConfig.webSocketConstructor = ws;
var connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}
var pool = new Pool({ connectionString });
var db = drizzle({ client: pool });
var SupabaseStorage = class {
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }
  async createUser(user) {
    const result = await db.insert(users).values([user]).returning();
    return result[0];
  }
  async createGarage(garage) {
    const result = await db.insert(garages).values([garage]).returning();
    return result[0];
  }
  async getGarage(id) {
    const result = await db.select().from(garages).where(eq(garages.id, id)).limit(1);
    return result[0];
  }
  async updateGarage(id, garage) {
    const result = await db.update(garages).set(garage).where(eq(garages.id, id)).returning();
    return result[0];
  }
  async getCustomers(garageId) {
    return await db.select().from(customers).where(eq(customers.garageId, garageId)).orderBy(desc(customers.createdAt));
  }
  async getCustomer(id, garageId) {
    const result = await db.select().from(customers).where(and(eq(customers.id, id), eq(customers.garageId, garageId))).limit(1);
    return result[0];
  }
  async createCustomer(customer) {
    const result = await db.insert(customers).values([customer]).returning();
    return result[0];
  }
  async updateCustomer(id, customer) {
    const result = await db.update(customers).set(customer).where(eq(customers.id, id)).returning();
    return result[0];
  }
  async searchCustomers(garageId, query) {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(customers).where(and(
      eq(customers.garageId, garageId),
      sql2`(LOWER(${customers.name}) LIKE ${searchTerm} OR LOWER(${customers.phone}) LIKE ${searchTerm} OR LOWER(${customers.bikeNumber}) LIKE ${searchTerm})`
    )).orderBy(desc(customers.createdAt)).limit(10);
  }
  async searchSpareParts(garageId, query) {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(spareParts).where(and(
      eq(spareParts.garageId, garageId),
      sql2`(LOWER(${spareParts.partNumber}) LIKE ${searchTerm} OR LOWER(${spareParts.name}) LIKE ${searchTerm})`
    )).orderBy(desc(spareParts.createdAt)).limit(10);
  }
  async getSpareParts(garageId) {
    try {
      return await db.select().from(spareParts).where(eq(spareParts.garageId, garageId)).orderBy(desc(spareParts.createdAt));
    } catch (error) {
      console.error("Error fetching spare parts:", error);
      return [];
    }
  }
  async getLowStockParts(garageId) {
    try {
      return await db.select().from(spareParts).where(and(
        eq(spareParts.garageId, garageId),
        sql2`quantity <= low_stock_threshold`
      ));
    } catch (error) {
      console.error("Error fetching low stock parts:", error);
      return [];
    }
  }
  async createLowStockNotifications(garageId) {
    try {
      const lowStockParts = await this.getLowStockParts(garageId);
      await db.delete(notifications).where(and(
        eq(notifications.garageId, garageId),
        eq(notifications.type, "low_stock")
      ));
      if (lowStockParts.length > 0) {
        const notificationsToInsert = lowStockParts.map((part) => ({
          garageId,
          type: "low_stock",
          title: "Low Stock Alert",
          message: `${part.name} (${part.partNumber}) is running low. Only ${part.quantity} left.`,
          isRead: false,
          data: { partId: part.id, partNumber: part.partNumber, currentStock: part.quantity }
        }));
        await db.insert(notifications).values(notificationsToInsert);
      }
    } catch (error) {
      console.error("Error creating low stock notifications:", error);
    }
  }
  async getSparePart(id, garageId) {
    const result = await db.select().from(spareParts).where(and(eq(spareParts.id, id), eq(spareParts.garageId, garageId))).limit(1);
    return result[0];
  }
  async createSparePart(part) {
    try {
      const result = await db.insert(spareParts).values([part]).returning();
      return result[0];
    } catch (error) {
      if (error.code === "23505" && error.constraint === "spare_parts_part_number_unique") {
        throw new Error(`Part number "${part.partNumber}" already exists`);
      }
      throw error;
    }
  }
  async updateSparePart(id, part) {
    const result = await db.update(spareParts).set(part).where(eq(spareParts.id, id)).returning();
    return result[0];
  }
  async deleteSparePart(id, garageId) {
    await db.delete(spareParts).where(and(eq(spareParts.id, id), eq(spareParts.garageId, garageId)));
  }
  async getJobCards(garageId, status) {
    const conditions = [eq(jobCards.garageId, garageId)];
    if (status) {
      conditions.push(eq(jobCards.status, status));
    }
    return await db.select().from(jobCards).where(and(...conditions)).orderBy(desc(jobCards.createdAt));
  }
  async getJobCard(id, garageId) {
    const result = await db.select().from(jobCards).where(and(eq(jobCards.id, id), eq(jobCards.garageId, garageId))).limit(1);
    return result[0];
  }
  async createJobCard(jobCard) {
    const result = await db.insert(jobCards).values([jobCard]).returning();
    return result[0];
  }
  async updateJobCard(id, jobCard) {
    const result = await db.update(jobCards).set(jobCard).where(eq(jobCards.id, id)).returning();
    return result[0];
  }
  async getInvoices(garageId) {
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
        customerName: sql2`COALESCE(${jobCards.customerName}, 'Unknown')`.as("customerName"),
        phone: sql2`COALESCE(${jobCards.phone}, '')`.as("phone"),
        bikeNumber: sql2`COALESCE(${jobCards.bikeNumber}, '')`.as("bikeNumber"),
        complaint: sql2`COALESCE(${jobCards.complaint}, '')`.as("complaint")
      }
    }).from(invoices).leftJoin(jobCards, eq(invoices.jobCardId, jobCards.id)).where(eq(invoices.garageId, garageId)).orderBy(desc(invoices.createdAt));
  }
  async getCustomerInvoices(customerId, garageId) {
    return await db.select().from(invoices).where(and(eq(invoices.customerId, customerId), eq(invoices.garageId, garageId))).orderBy(desc(invoices.createdAt));
  }
  async createInvoice(invoice) {
    const result = await db.insert(invoices).values([invoice]).returning();
    return result[0];
  }
  async updateInvoice(id, invoice) {
    const result = await db.update(invoices).set(invoice).where(eq(invoices.id, id)).returning();
    return result[0];
  }
  async getSalesStats(garageId) {
    const result = await db.select({
      totalInvoices: sql2`count(*)`,
      totalPartsTotal: sql2`sum(${invoices.partsTotal})`,
      totalServiceCharges: sql2`sum(${invoices.serviceCharge})`
    }).from(invoices).where(eq(invoices.garageId, garageId));
    const stats = result[0];
    const partsRevenue = Number(stats.totalPartsTotal) || 0;
    const serviceCharges = Number(stats.totalServiceCharges) || 0;
    const totalProfit = serviceCharges;
    return {
      totalInvoices: stats.totalInvoices || 0,
      totalPartsTotal: partsRevenue,
      totalServiceCharges: serviceCharges,
      totalProfit
    };
  }
  async getMonthlySalesData(garageId) {
    const result = await db.select({
      month: sql2`to_char(${invoices.createdAt}, 'Month')`,
      year: sql2`extract(year from ${invoices.createdAt})`,
      serviceCharges: sql2`sum(${invoices.serviceCharge})`,
      invoiceCount: sql2`count(*)`
    }).from(invoices).where(eq(invoices.garageId, garageId)).groupBy(
      sql2`extract(year from ${invoices.createdAt})`,
      sql2`extract(month from ${invoices.createdAt})`,
      sql2`to_char(${invoices.createdAt}, 'Month')`
    ).orderBy(
      sql2`extract(year from ${invoices.createdAt}) desc`,
      sql2`extract(month from ${invoices.createdAt}) desc`
    ).limit(6);
    return result.map((item) => ({
      month: item.month?.trim() || "",
      year: Number(item.year) || (/* @__PURE__ */ new Date()).getFullYear(),
      serviceCharges: Number(item.serviceCharges) || 0,
      invoiceCount: Number(item.invoiceCount) || 0
    }));
  }
  // Notifications methods
  async getNotifications(garageId) {
    try {
      return await db.select().from(notifications).where(eq(notifications.garageId, garageId)).orderBy(desc(notifications.createdAt));
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }
  async createNotification(notification) {
    try {
      const result = await db.insert(notifications).values([notification]).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating notification:", error);
      return null;
    }
  }
  async markNotificationAsRead(id) {
    try {
      await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }
  async markAllNotificationsAsRead(garageId) {
    try {
      await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.garageId, garageId), eq(notifications.isRead, false)));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }
  async getUnreadNotificationCount(garageId) {
    try {
      const result = await db.select({ count: sql2`count(*)` }).from(notifications).where(and(eq(notifications.garageId, garageId), eq(notifications.isRead, false)));
      return Number(result[0]?.count) || 0;
    } catch (error) {
      console.error("Error getting unread notification count:", error);
      return 0;
    }
  }
  // Enhanced sales analytics methods
  async getSalesDataByDateRange(garageId, startDate, endDate, groupBy = "month") {
    try {
      let dateFormatSql;
      let groupBySql;
      switch (groupBy) {
        case "hour":
          dateFormatSql = sql2`to_char(${invoices.createdAt} AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:00')`;
          groupBySql = sql2`to_char(${invoices.createdAt} AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:00')`;
          break;
        case "day":
          dateFormatSql = sql2`to_char(${invoices.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')`;
          groupBySql = sql2`to_char(${invoices.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')`;
          break;
        case "week":
          dateFormatSql = sql2`to_char(date_trunc('week', ${invoices.createdAt}), 'YYYY-MM-DD')`;
          groupBySql = sql2`to_char(date_trunc('week', ${invoices.createdAt}), 'YYYY-MM-DD')`;
          break;
        case "quarter":
          dateFormatSql = sql2`to_char(date_trunc('quarter', ${invoices.createdAt}), 'YYYY') || '-Q' || extract(quarter from ${invoices.createdAt})`;
          groupBySql = sql2`to_char(date_trunc('quarter', ${invoices.createdAt}), 'YYYY') || '-Q' || extract(quarter from ${invoices.createdAt})`;
          break;
        case "year":
          dateFormatSql = sql2`to_char(${invoices.createdAt}, 'YYYY')`;
          groupBySql = sql2`to_char(${invoices.createdAt}, 'YYYY')`;
          break;
        default:
          dateFormatSql = sql2`to_char(${invoices.createdAt}, 'YYYY-MM')`;
          groupBySql = sql2`to_char(${invoices.createdAt}, 'YYYY-MM')`;
          break;
      }
      const result = await db.select({
        period: dateFormatSql.as("period"),
        serviceCharges: sql2`sum(${invoices.serviceCharge})`.as("serviceCharges"),
        partsRevenue: sql2`sum(${invoices.partsTotal})`.as("partsRevenue"),
        totalSales: sql2`sum(${invoices.serviceCharge} + ${invoices.partsTotal})`.as("totalSales"),
        invoiceCount: sql2`count(*)`.as("invoiceCount")
      }).from(invoices).where(and(
        eq(invoices.garageId, garageId),
        sql2`DATE(${invoices.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') >= ${startDate}::date`,
        sql2`DATE(${invoices.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') <= ${endDate}::date`
      )).groupBy(groupBySql).orderBy(groupBySql);
      console.log(`SQL Result:`, result);
      return result.map((item) => ({
        period: String(item.period) || "",
        totalSales: Number(item.totalSales) || 0,
        serviceCharges: Number(item.serviceCharges) || 0,
        partsRevenue: Number(item.partsRevenue) || 0,
        profit: Number(item.serviceCharges) || 0,
        // For now, profit = service charges
        invoiceCount: Number(item.invoiceCount) || 0
      }));
    } catch (error) {
      console.error("Error fetching sales data by date range:", error);
      return [];
    }
  }
  // Customer analytics methods
  async getCustomerAnalytics(garageId, startDate, endDate, groupBy = "month") {
    try {
      const result = await db.select({
        customerId: invoices.customerId,
        customerName: customers.name,
        serviceCount: sql2`count(*)`.as("serviceCount"),
        totalRevenue: sql2`sum(${invoices.serviceCharge} + ${invoices.partsTotal})`.as("totalRevenue"),
        lastVisit: sql2`max(${invoices.createdAt})`.as("lastVisit")
      }).from(invoices).innerJoin(customers, eq(invoices.customerId, customers.id)).where(and(
        eq(invoices.garageId, garageId),
        sql2`${invoices.createdAt} >= ${startDate}::date`,
        sql2`${invoices.createdAt} < (${endDate}::date + interval '1 day')`
      )).groupBy(invoices.customerId, customers.name).orderBy(sql2`sum(${invoices.serviceCharge} + ${invoices.partsTotal}) DESC`);
      return result.map((item) => ({
        customerId: String(item.customerId) || "",
        customerName: String(item.customerName) || "",
        serviceCount: Number(item.serviceCount) || 0,
        totalRevenue: Number(item.totalRevenue) || 0,
        lastVisit: String(item.lastVisit) || ""
      }));
    } catch (error) {
      console.error("Error fetching customer analytics:", error);
      return [];
    }
  }
  async getTopCustomersByServices(garageId, startDate, endDate, limit = 10) {
    try {
      const result = await db.select({
        customerName: customers.name,
        serviceCount: sql2`count(*)`.as("serviceCount"),
        totalRevenue: sql2`sum(${invoices.serviceCharge} + ${invoices.partsTotal})`.as("totalRevenue")
      }).from(invoices).innerJoin(customers, eq(invoices.customerId, customers.id)).where(and(
        eq(invoices.garageId, garageId),
        sql2`${invoices.createdAt} >= ${startDate}::date`,
        sql2`${invoices.createdAt} < (${endDate}::date + interval '1 day')`
      )).groupBy(customers.name).orderBy(sql2`count(*) DESC`).limit(limit);
      return result.map((item) => ({
        customerName: String(item.customerName) || "",
        serviceCount: Number(item.serviceCount) || 0,
        totalRevenue: Number(item.totalRevenue) || 0
      }));
    } catch (error) {
      console.error("Error fetching top customers by services:", error);
      return [];
    }
  }
  async getTopCustomersByRevenue(garageId, startDate, endDate, limit = 10) {
    try {
      const result = await db.select({
        customerName: customers.name,
        serviceCount: sql2`count(*)`.as("serviceCount"),
        totalRevenue: sql2`sum(${invoices.serviceCharge} + ${invoices.partsTotal})`.as("totalRevenue")
      }).from(invoices).innerJoin(customers, eq(invoices.customerId, customers.id)).where(and(
        eq(invoices.garageId, garageId),
        sql2`${invoices.createdAt} >= ${startDate}::date`,
        sql2`${invoices.createdAt} < (${endDate}::date + interval '1 day')`
      )).groupBy(customers.name).orderBy(sql2`sum(${invoices.serviceCharge} + ${invoices.partsTotal}) DESC`).limit(limit);
      return result.map((item) => ({
        customerName: String(item.customerName) || "",
        serviceCount: Number(item.serviceCount) || 0,
        totalRevenue: Number(item.totalRevenue) || 0
      }));
    } catch (error) {
      console.error("Error fetching top customers by revenue:", error);
      return [];
    }
  }
};
var storage = new SupabaseStorage();

// routes.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// emailService.ts
import sgMail from "@sendgrid/mail";
var EmailService = class _EmailService {
  static instance;
  isConfigured = false;
  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
    }
  }
  static getInstance() {
    if (!_EmailService.instance) {
      _EmailService.instance = new _EmailService();
    }
    return _EmailService.instance;
  }
  async sendAccessRequestNotification(superAdminEmail, requestData) {
    if (!this.isConfigured) {
      console.log("\u{1F4E7} SendGrid not configured - logging request instead");
      this.logAccessRequest(requestData);
      return false;
    }
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || superAdminEmail;
    console.log(`\u{1F4E7} Using from email: ${fromEmail}`);
    console.log(`\u{1F4E7} Environment check - SENDGRID_FROM_EMAIL: ${process.env.SENDGRID_FROM_EMAIL ? "SET" : "NOT SET"}`);
    try {
      const msg = {
        to: superAdminEmail,
        from: {
          email: fromEmail,
          name: "GarageGuru System"
        },
        subject: `GarageGuru Admin - New Access Request from ${requestData.name}`,
        html: this.generateAccessRequestEmail(requestData),
        text: this.generateAccessRequestText(requestData)
      };
      console.log(`\u{1F4E7} Attempting to send email from verified sender: ${fromEmail}`);
      await sgMail.send(msg);
      console.log(`\u{1F4E7} Access request email sent to ${superAdminEmail}`);
      return true;
    } catch (error) {
      console.error("\u{1F4E7} Email send failed:", error);
      if (error.response && error.response.body && error.response.body.errors) {
        console.error("SendGrid Error Details:", error.response.body.errors);
        const isIdentityError = error.response.body.errors.some(
          (err) => err.message && err.message.includes("verified Sender Identity")
        );
        if (isIdentityError) {
          console.log("\n\u{1F6A8} SENDGRID SENDER IDENTITY ISSUE \u{1F6A8}");
          console.log("========================================");
          console.log("Common solutions:");
          console.log("1. Wait 10-15 minutes after verification");
          console.log("2. Try Domain Authentication instead of Single Sender");
          console.log("3. Use a custom domain email (not Gmail/Yahoo)");
          console.log("4. Re-verify the sender email in SendGrid dashboard");
          console.log("========================================\n");
        }
      }
      this.logAccessRequest(requestData);
      return false;
    }
  }
  generateAccessRequestEmail(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          \u{1F511} New Access Request - GarageGuru
        </h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">Request Details</h3>
          <p><strong>\u{1F464} Name:</strong> ${data.name}</p>
          <p><strong>\u{1F4E7} Email:</strong> ${data.email}</p>
          <p><strong>\u{1F3AF} Requested Role:</strong> ${data.requestType.toUpperCase()}</p>
          <p><strong>\u23F0 Time:</strong> ${data.timestamp}</p>
          ${data.message ? `<p><strong>\u{1F4AC} Message:</strong><br>${data.message}</p>` : ""}
        </div>

        <div style="background: #ecfccb; padding: 15px; border-radius: 8px; border-left: 4px solid #65a30d;">
          <h4 style="margin-top: 0; color: #365314;">Current Activation Codes:</h4>
          <p><strong>\u{1F534} Admin Code:</strong> ${process.env.ADMIN_ACTIVATION_CODE || "Not configured"}</p>
          <p><strong>\u{1F535} Staff Code:</strong> ${process.env.STAFF_ACTIVATION_CODE || "Not configured"}</p>
        </div>

        <div style="margin: 20px 0; padding: 15px; background: #fef3c7; border-radius: 8px;">
          <h4 style="margin-top: 0;">To Approve Access:</h4>
          <ol>
            <li>Review the request details above</li>
            <li>Reply to <strong>${data.email}</strong> with the appropriate activation code</li>
            <li>Or generate new codes if needed</li>
          </ol>
        </div>

        <div style="margin: 30px 0; padding: 20px; background: #1e40af; color: white; border-radius: 8px; text-align: center;">
          <h3 style="margin: 0;">GarageGuru Management System</h3>
          <p style="margin: 5px 0;">Access Control Notification</p>
        </div>
      </div>
    `;
  }
  generateAccessRequestText(data) {
    return `
\u{1F511} NEW ACCESS REQUEST - GARAGEGURU

Request Details:
\u{1F464} Name: ${data.name}
\u{1F4E7} Email: ${data.email}
\u{1F3AF} Requested Role: ${data.requestType.toUpperCase()}
\u23F0 Time: ${data.timestamp}
${data.message ? `\u{1F4AC} Message: ${data.message}` : ""}

Current Activation Codes:
\u{1F534} Admin Code: ${process.env.ADMIN_ACTIVATION_CODE || "Not configured"}
\u{1F535} Staff Code: ${process.env.STAFF_ACTIVATION_CODE || "Not configured"}

To Approve Access:
1. Review the request details above
2. Reply to ${data.email} with the appropriate activation code
3. Or generate new codes if needed

---
GarageGuru Management System
Access Control Notification
    `;
  }
  logAccessRequest(data) {
    console.log("\n\u{1F511} NEW ACCESS REQUEST \u{1F511}");
    console.log("================================");
    console.log(`\u{1F4E7} Email: ${data.email}`);
    console.log(`\u{1F464} Name: ${data.name}`);
    console.log(`\u{1F3AF} Requested Role: ${data.requestType}`);
    console.log(`\u{1F4AC} Message: ${data.message || "No message provided"}`);
    console.log(`\u23F0 Time: ${data.timestamp}`);
    console.log("================================\n");
  }
};

// gmailEmailService.ts
import nodemailer from "nodemailer";
var GmailEmailService = class _GmailEmailService {
  static instance;
  transporter = null;
  isConfigured = false;
  constructor() {
    this.setupGmailTransporter();
  }
  static getInstance() {
    if (!_GmailEmailService.instance) {
      _GmailEmailService.instance = new _GmailEmailService();
    }
    return _GmailEmailService.instance;
  }
  setupGmailTransporter() {
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    if (gmailUser && gmailAppPassword) {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailAppPassword
        }
      });
      this.isConfigured = true;
      console.log("\u{1F4E7} Gmail SMTP configured successfully");
    } else {
      console.log("\u{1F4E7} Gmail SMTP not configured - missing credentials");
    }
  }
  async sendAccessRequestNotification(superAdminEmail, requestData) {
    if (!this.isConfigured) {
      console.log("\u{1F4E7} Gmail SMTP not configured - logging request instead");
      this.logAccessRequest(requestData);
      return false;
    }
    try {
      const mailOptions = {
        from: `"GarageGuru System" <${process.env.GMAIL_USER}>`,
        to: superAdminEmail,
        subject: `GarageGuru Admin - New Access Request from ${requestData.name}`,
        html: this.generateAccessRequestEmail(requestData),
        text: this.generateAccessRequestText(requestData)
      };
      console.log(`\u{1F4E7} Sending email via Gmail SMTP to: ${superAdminEmail}`);
      await this.transporter.sendMail(mailOptions);
      console.log(`\u{1F4E7} Access request email sent successfully via Gmail`);
      return true;
    } catch (error) {
      console.error("\u{1F4E7} Gmail SMTP send failed:", error);
      if (error.code === "EAUTH") {
        console.log("\n\u{1F6A8} GMAIL AUTHENTICATION ERROR \u{1F6A8}");
        console.log("========================================");
        console.log("Fix: Generate App-Specific Password");
        console.log("1. Go to Google Account settings");
        console.log("2. Security \u2192 2-Step Verification");
        console.log("3. App passwords \u2192 Generate new password");
        console.log("4. Use that password as GMAIL_APP_PASSWORD");
        console.log("========================================\n");
      }
      this.logAccessRequest(requestData);
      return false;
    }
  }
  generateAccessRequestEmail(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GarageGuru Admin - Access Request</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px 20px; text-align: center;">
            <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
              <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L9 8H15L12 4Z" fill="#1e40af"/>
                <path d="M8 10V18C8 19.1 8.9 20 10 20H14C15.1 20 16 19.1 16 18V10H8Z" fill="#3b82f6"/>
                <circle cx="10" cy="14" r="1" fill="white"/>
                <circle cx="14" cy="14" r="1" fill="white"/>
                <rect x="11" y="16" width="2" height="2" fill="white"/>
              </svg>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">GarageGuru</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0 0 0; font-size: 16px;">Automotive Management System</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
              \u{1F511} New Access Request
            </h2>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">Request Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 100px;">\u{1F464} Name:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${data.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">\u{1F4E7} Email:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${data.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">\u{1F3AF} Role:</td>
                  <td style="padding: 8px 0; color: #1f2937; text-transform: uppercase; font-weight: bold;">${data.requestType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">\u23F0 Time:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${data.timestamp}</td>
                </tr>
                ${data.message ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">\u{1F4AC} Message:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${data.message}</td>
                </tr>
                ` : ""}
              </table>
            </div>

            <div style="background: #ecfccb; padding: 20px; border-radius: 8px; border-left: 4px solid #65a30d; margin: 20px 0;">
              <h4 style="margin: 0 0 15px 0; color: #365314; font-size: 16px;">\u{1F510} Current Activation Codes</h4>
              <div style="background: white; padding: 15px; border-radius: 6px; font-family: monospace;">
                <p style="margin: 0 0 10px 0;"><strong style="color: #dc2626;">\u{1F534} Admin Code:</strong> <span style="background: #fee2e2; padding: 4px 8px; border-radius: 4px; color: #991b1b;">${process.env.ADMIN_ACTIVATION_CODE || "Not configured"}</span></p>
                <p style="margin: 0;"><strong style="color: #2563eb;">\u{1F535} Staff Code:</strong> <span style="background: #dbeafe; padding: 4px 8px; border-radius: 4px; color: #1d4ed8;">${process.env.STAFF_ACTIVATION_CODE || "Not configured"}</span></p>
              </div>
            </div>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <h4 style="margin: 0 0 15px 0; color: #92400e; font-size: 16px;">\u2705 To Approve Access</h4>
              <ol style="margin: 0; padding-left: 20px; color: #78350f;">
                <li style="margin-bottom: 8px;">Review the request details above</li>
                <li style="margin-bottom: 8px;">Reply to <strong>${data.email}</strong> with the appropriate activation code</li>
                <li>Or generate new codes if needed from your admin dashboard</li>
              </ol>
            </div>
          </div>

          <!-- Professional Signature/Footer -->
          <div style="background: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 20px;">Ananth Automotive Garage</h3>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Professional Automotive Service & Management</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="text-align: center; padding: 10px; border-right: 1px solid #e5e7eb; width: 33.33%;">
                    <div style="color: #3b82f6; font-size: 20px; margin-bottom: 5px;">\u{1F4E7}</div>
                    <div style="font-size: 12px; color: #6b7280;">Email</div>
                    <div style="font-size: 13px; color: #1f2937; font-weight: bold;">ananthautomotivegarage@gmail.com</div>
                  </td>
                  <td style="text-align: center; padding: 10px; border-right: 1px solid #e5e7eb; width: 33.33%;">
                    <div style="color: #10b981; font-size: 20px; margin-bottom: 5px;">\u{1F527}</div>
                    <div style="font-size: 12px; color: #6b7280;">Service</div>
                    <div style="font-size: 13px; color: #1f2937; font-weight: bold;">Professional Automotive</div>
                  </td>
                  <td style="text-align: center; padding: 10px; width: 33.33%;">
                    <div style="color: #f59e0b; font-size: 20px; margin-bottom: 5px;">\u26A1</div>
                    <div style="font-size: 12px; color: #6b7280;">System</div>
                    <div style="font-size: 13px; color: #1f2937; font-weight: bold;">GarageGuru Platform</div>
                  </td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                This is an automated notification from GarageGuru Management System.<br>
                Powered by Ananth Automotive Garage - Excellence in Automotive Service
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  generateAccessRequestText(data) {
    return `
\u{1F511} NEW ACCESS REQUEST - GARAGEGURU

Request Details:
\u{1F464} Name: ${data.name}
\u{1F4E7} Email: ${data.email}
\u{1F3AF} Requested Role: ${data.requestType.toUpperCase()}
\u23F0 Time: ${data.timestamp}
${data.message ? `\u{1F4AC} Message: ${data.message}` : ""}

Current Activation Codes:
\u{1F534} Admin Code: ${process.env.ADMIN_ACTIVATION_CODE || "Not configured"}
\u{1F535} Staff Code: ${process.env.STAFF_ACTIVATION_CODE || "Not configured"}

To Approve Access:
1. Review the request details above
2. Reply to ${data.email} with the appropriate activation code
3. Or generate new codes if needed

---
GarageGuru Management System
Access Control Notification
    `;
  }
  logAccessRequest(data) {
    console.log("\n\u{1F511} NEW ACCESS REQUEST \u{1F511}");
    console.log("================================");
    console.log(`\u{1F4E7} Email: ${data.email}`);
    console.log(`\u{1F464} Name: ${data.name}`);
    console.log(`\u{1F3AF} Requested Role: ${data.requestType}`);
    console.log(`\u{1F4AC} Message: ${data.message || "No message provided"}`);
    console.log(`\u23F0 Time: ${data.timestamp}`);
    console.log("================================\n");
  }
};

// routes.ts
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
var authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await storage.getUserByEmail(decoded.email);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
var requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
};
var requireGarageAccess = (req, res, next) => {
  if (req.user.role === "super_admin") {
    next();
    return;
  }
  const garageId = req.params.garageId || req.params.id || req.body.garageId;
  if (!garageId || garageId !== req.user.garageId) {
    return res.status(403).json({ message: "Access denied to this garage" });
  }
  next();
};
async function registerRoutes(app2) {
  app2.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      service: "garage-guru-backend",
      environment: process.env.NODE_ENV || "development"
    });
  });
  if (process.env.NODE_ENV === "production") {
    app2.get("/", (req, res) => {
      res.json({
        message: "Garage Guru Backend API",
        status: "running",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        version: "1.0.0",
        endpoints: {
          health: "/health",
          auth: "/api/auth/*",
          garages: "/api/garages/*"
        }
      });
    });
  }
  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "ananthautomotivegarage@gmail.com";
  app2.post("/api/auth/request-access", async (req, res) => {
    try {
      const { email, name, requestType, message } = req.body;
      const requestData = {
        email,
        name,
        requestType: requestType || "staff",
        message,
        timestamp: (/* @__PURE__ */ new Date()).toLocaleString()
      };
      const gmailService = GmailEmailService.getInstance();
      let emailSent = await gmailService.sendAccessRequestNotification(
        SUPER_ADMIN_EMAIL,
        requestData
      );
      if (!emailSent) {
        const sendGridService = EmailService.getInstance();
        emailSent = await sendGridService.sendAccessRequestNotification(
          SUPER_ADMIN_EMAIL,
          requestData
        );
      }
      const responseMessage = emailSent ? `Access request sent to super admin (${SUPER_ADMIN_EMAIL}). You will receive activation code via email if approved.` : `Access request logged for super admin review. Check server logs or configure email delivery.`;
      res.json({ message: responseMessage });
    } catch (error) {
      console.error("Access request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/auth/generate-codes", authenticateToken, requireRole(["super_admin"]), async (req, res) => {
    try {
      const timestamp2 = Date.now().toString(36);
      const randomAdmin = Math.random().toString(36).substring(2, 8).toUpperCase();
      const randomStaff = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newAdminCode = `GARAGE-ADMIN-2025-${randomAdmin}`;
      const newStaffCode = `GARAGE-STAFF-2025-${randomStaff}`;
      console.log("\n\u{1F511} NEW ACTIVATION CODES GENERATED \u{1F511}");
      console.log("===================================");
      console.log(`\u{1F534} Admin Code: ${newAdminCode}`);
      console.log(`\u{1F535} Staff Code: ${newStaffCode}`);
      console.log(`\u23F0 Generated: ${(/* @__PURE__ */ new Date()).toLocaleString()}`);
      console.log("===================================\n");
      console.log("\u{1F4A1} To use these codes, update your environment variables:");
      console.log(`ADMIN_ACTIVATION_CODE=${newAdminCode}`);
      console.log(`STAFF_ACTIVATION_CODE=${newStaffCode}
`);
      res.json({
        adminCode: newAdminCode,
        staffCode: newStaffCode,
        message: "New activation codes generated. Update environment variables to activate."
      });
    } catch (error) {
      console.error("Code generation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, activationCode, garageName, ownerName, phone } = req.body;
      if (email === SUPER_ADMIN_EMAIL) {
        const hashedPassword2 = await bcrypt.hash(password, 10);
        const user2 = await storage.createUser({
          email,
          password: hashedPassword2,
          name,
          role: "super_admin",
          garageId: null
        });
        const token2 = jwt.sign({ email: user2.email, id: user2.id }, JWT_SECRET);
        return res.json({
          token: token2,
          user: { ...user2, password: void 0 },
          garage: null
        });
      }
      const ADMIN_CODE = process.env.ADMIN_ACTIVATION_CODE;
      const STAFF_CODE = process.env.STAFF_ACTIVATION_CODE;
      if (!ADMIN_CODE || !STAFF_CODE) {
        return res.status(500).json({ message: "Server configuration error: Activation codes not configured" });
      }
      const validCodes = {
        [ADMIN_CODE]: "garage_admin",
        [STAFF_CODE]: "mechanic_staff"
      };
      if (!validCodes[activationCode]) {
        return res.status(400).json({ message: "Invalid activation code. Contact super admin for access." });
      }
      const role = validCodes[activationCode];
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      let garageId = null;
      if (role === "garage_admin") {
        const garage = await storage.createGarage({
          name: garageName,
          ownerName,
          phone,
          email
        });
        garageId = garage.id;
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
        user: { ...user, password: void 0 },
        garage: garageId ? await storage.getGarage(garageId) : null
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign({ email: user.email, id: user.id }, JWT_SECRET);
      let garage = null;
      if (user.garageId) {
        garage = await storage.getGarage(user.garageId);
      }
      res.json({
        token,
        user: { ...user, password: void 0 },
        garage
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/user/profile", authenticateToken, async (req, res) => {
    try {
      let garage = null;
      if (req.user.garageId) {
        garage = await storage.getGarage(req.user.garageId);
      }
      res.json({
        user: { ...req.user, password: void 0 },
        garage
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.put("/api/garages/:id", authenticateToken, requireRole(["garage_admin"]), requireGarageAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertGarageSchema.partial().parse(req.body);
      const garage = await storage.updateGarage(id, updateData);
      res.json(garage);
    } catch (error) {
      res.status(500).json({ message: "Failed to update garage" });
    }
  });
  app2.get("/api/garages/:garageId/customers", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const customers2 = await storage.getCustomers(garageId);
      res.json(customers2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });
  app2.post("/api/garages/:garageId/customers", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const customerData = insertCustomerSchema.parse({ ...req.body, garageId });
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to create customer" });
    }
  });
  app2.get("/api/garages/:garageId/customers/search", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.json([]);
      }
      const customers2 = await storage.searchCustomers(garageId, q);
      res.json(customers2);
    } catch (error) {
      res.status(500).json({ message: "Failed to search customers" });
    }
  });
  app2.get("/api/garages/:garageId/spare-parts/search", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.json([]);
      }
      const spareParts2 = await storage.searchSpareParts(garageId, q);
      res.json(spareParts2);
    } catch (error) {
      res.status(500).json({ message: "Failed to search spare parts" });
    }
  });
  app2.get("/api/garages/:garageId/customers/:customerId/invoices", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId, customerId } = req.params;
      const invoices2 = await storage.getCustomerInvoices(customerId, garageId);
      res.json(invoices2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer invoices" });
    }
  });
  app2.get("/api/garages/:garageId/spare-parts", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const spareParts2 = await storage.getSpareParts(garageId);
      res.json(spareParts2);
    } catch (error) {
      console.error("Error in spare parts endpoint:", error);
      res.status(500).json({ message: "Failed to fetch spare parts" });
    }
  });
  app2.get("/api/garages/:garageId/spare-parts/low-stock", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const lowStockParts = await storage.getLowStockParts(garageId);
      await storage.createLowStockNotifications(garageId);
      res.json(lowStockParts);
    } catch (error) {
      console.error("Error in low stock endpoint:", error);
      res.status(500).json({ message: "Failed to fetch low stock parts" });
    }
  });
  app2.post("/api/garages/:garageId/spare-parts", authenticateToken, requireRole(["garage_admin"]), requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const partData = insertSparePartSchema.parse({ ...req.body, garageId });
      const sparePart = await storage.createSparePart(partData);
      res.json(sparePart);
    } catch (error) {
      console.error("Spare part creation error:", error);
      if (error instanceof Error) {
        if (error.message.includes("already exists")) {
          res.status(409).json({ message: error.message });
        } else {
          res.status(400).json({ message: error.message });
        }
      } else {
        res.status(500).json({ message: "Failed to create spare part" });
      }
    }
  });
  app2.put("/api/garages/:garageId/spare-parts/:id", authenticateToken, requireRole(["garage_admin"]), requireGarageAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertSparePartSchema.partial().parse(req.body);
      const sparePart = await storage.updateSparePart(id, updateData);
      res.json(sparePart);
    } catch (error) {
      res.status(500).json({ message: "Failed to update spare part" });
    }
  });
  app2.delete("/api/garages/:garageId/spare-parts/:id", authenticateToken, requireRole(["garage_admin"]), requireGarageAccess, async (req, res) => {
    try {
      const { garageId, id } = req.params;
      await storage.deleteSparePart(id, garageId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete spare part" });
    }
  });
  app2.get("/api/garages/:garageId/job-cards", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const { status } = req.query;
      const jobCards2 = await storage.getJobCards(garageId, status);
      res.json(jobCards2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job cards" });
    }
  });
  app2.post("/api/garages/:garageId/job-cards", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const jobCardData = insertJobCardSchema.parse({ ...req.body, garageId });
      let customer = await storage.getCustomers(garageId).then(
        (customers2) => customers2.find((c) => c.phone === jobCardData.phone && c.bikeNumber === jobCardData.bikeNumber)
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
        spareParts: jobCardData.spareParts || []
      });
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
      console.error("Job card creation error:", error);
      res.status(500).json({ message: "Failed to create job card" });
    }
  });
  app2.put("/api/garages/:garageId/job-cards/:id", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertJobCardSchema.partial().parse(req.body);
      const jobCard = await storage.updateJobCard(id, {
        ...updateData,
        spareParts: updateData.spareParts?.map((part) => ({
          id: part.id,
          partNumber: part.partNumber,
          name: part.name,
          quantity: part.quantity,
          sellingPrice: String(part.price || part.sellingPrice || 0)
        }))
      });
      res.json(jobCard);
    } catch (error) {
      res.status(500).json({ message: "Failed to update job card" });
    }
  });
  app2.get("/api/garages/:garageId/invoices", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const invoices2 = await storage.getInvoices(garageId);
      res.json(invoices2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  app2.post("/api/garages/:garageId/invoices", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const invoiceData = insertInvoiceSchema.parse({ ...req.body, garageId });
      const istTime = (/* @__PURE__ */ new Date()).toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" });
      const localTimestamp = new Date(istTime);
      const invoice = await storage.createInvoice({
        ...invoiceData
      });
      const jobCard = await storage.updateJobCard(invoice.jobCardId, {
        status: "completed",
        completedAt: /* @__PURE__ */ new Date()
      });
      const customer = await storage.getCustomer(jobCard.customerId, garageId);
      if (customer) {
        const newTotalJobs = (customer.totalJobs || 0) + 1;
        await storage.updateCustomer(customer.id, {
          totalJobs: newTotalJobs,
          totalSpent: String(Number(customer.totalSpent || 0) + Number(invoice.totalAmount)),
          lastVisit: /* @__PURE__ */ new Date()
        });
        if (newTotalJobs === 50 || newTotalJobs === 100 || newTotalJobs >= 150 && newTotalJobs % 50 === 0) {
          await storage.createNotification({
            garageId,
            customerId: customer.id,
            type: "milestone",
            title: `Customer Milestone - ${newTotalJobs} Visits!`,
            message: `${customer.name} has reached ${newTotalJobs} service visits. Consider offering a loyalty reward!`,
            data: { visits: newTotalJobs, customerName: customer.name }
          });
        }
      }
      res.json(invoice);
    } catch (error) {
      console.error("Invoice creation error:", error);
      res.status(500).json({ message: "Failed to create invoice", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.get("/api/garages/:garageId/sales/stats", authenticateToken, requireRole(["garage_admin"]), requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const stats = await storage.getSalesStats(garageId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales stats" });
    }
  });
  app2.get("/api/garages/:garageId/sales/monthly", authenticateToken, requireRole(["garage_admin"]), requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const monthlyData = await storage.getMonthlySalesData(garageId);
      res.json(monthlyData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly sales data" });
    }
  });
  app2.get("/api/garages/:garageId/sales/analytics", authenticateToken, requireRole(["garage_admin"]), requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const { startDate, endDate, groupBy = "month" } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      const analyticsData = await storage.getSalesDataByDateRange(
        garageId,
        startDate,
        endDate,
        groupBy
      );
      res.json(analyticsData);
    } catch (error) {
      console.error("Sales analytics error:", error);
      res.status(500).json({ message: "Failed to fetch sales analytics" });
    }
  });
  app2.get("/api/garages/:garageId/customers/analytics", authenticateToken, requireRole(["garage_admin"]), requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const { startDate, endDate, groupBy = "month" } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      const analyticsData = await storage.getCustomerAnalytics(
        garageId,
        startDate,
        endDate,
        groupBy
      );
      res.json(analyticsData);
    } catch (error) {
      console.error("Customer analytics error:", error);
      res.status(500).json({ message: "Failed to fetch customer analytics" });
    }
  });
  app2.get("/api/garages/:garageId/customers/top-by-services", authenticateToken, requireRole(["garage_admin"]), requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const { startDate, endDate, limit = "10" } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      const topCustomers = await storage.getTopCustomersByServices(
        garageId,
        startDate,
        endDate,
        parseInt(limit)
      );
      res.json(topCustomers);
    } catch (error) {
      console.error("Top customers by services error:", error);
      res.status(500).json({ message: "Failed to fetch top customers by services" });
    }
  });
  app2.get("/api/garages/:garageId/customers/top-by-revenue", authenticateToken, requireRole(["garage_admin"]), requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const { startDate, endDate, limit = "10" } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      const topCustomers = await storage.getTopCustomersByRevenue(
        garageId,
        startDate,
        endDate,
        parseInt(limit)
      );
      res.json(topCustomers);
    } catch (error) {
      console.error("Top customers by revenue error:", error);
      res.status(500).json({ message: "Failed to fetch top customers by revenue" });
    }
  });
  app2.get("/api/garages/:garageId/notifications", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const notifications2 = await storage.getNotifications(garageId);
      res.json(notifications2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  app2.get("/api/garages/:garageId/notifications/unread-count", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const count = await storage.getUnreadNotificationCount(garageId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread notification count" });
    }
  });
  app2.put("/api/garages/:garageId/notifications/:id/read", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  app2.put("/api/garages/:garageId/notifications/mark-all-read", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      await storage.markAllNotificationsAsRead(garageId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });
  app2.put("/api/garages/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { logo } = req.body;
      const userGarageId = req.user.garageId;
      if (userGarageId !== id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const garage = await storage.updateGarage(id, { logo });
      res.json(garage);
    } catch (error) {
      console.error("Garage update error:", error);
      res.status(500).json({ message: "Failed to update garage" });
    }
  });
}

// standalone.ts
var app = express();
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    /\.vercel\.app$/,
    // Allow any Vercel subdomain
    /\.render\.com$/
    // Allow any Render subdomain
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});
registerRoutes(app);
app.use((err, _req, res, _next) => {
  console.error("Error:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});
var port = parseInt(process.env.PORT || "3001", 10);
var server = createServer(app);
server.listen(port, "0.0.0.0", () => {
  console.log(`\u{1F680} Backend server running on port ${port}`);
  console.log(`\u{1F517} Health check: http://localhost:${port}/health`);
});
var standalone_default = app;
export {
  standalone_default as default
};

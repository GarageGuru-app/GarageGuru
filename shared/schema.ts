import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tenants/Garages table
export const garages = pgTable("garages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  logo: text("logo"), // Cloudinary URL
  createdAt: timestamp("created_at").defaultNow(),
});

// Users table with role-based access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'garage_admin', 'mechanic_staff', 'super_admin'
  garageId: varchar("garage_id").references(() => garages.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customers table (per garage)
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  garageId: varchar("garage_id").notNull().references(() => garages.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  bikeNumber: text("bike_number").notNull(),
  notes: text("notes"),
  totalJobs: integer("total_jobs").default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
  lastVisit: timestamp("last_visit"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Spare parts inventory (per garage)
export const spareParts = pgTable("spare_parts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  garageId: varchar("garage_id").notNull().references(() => garages.id),
  partNumber: text("part_number").notNull().unique(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Selling price
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull().default("0"), // Cost price
  quantity: integer("quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(2),
  barcode: text("barcode"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job cards/complaints
export const jobCards = pgTable("job_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  garageId: varchar("garage_id").notNull().references(() => garages.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  bikeNumber: text("bike_number").notNull(),
  complaint: text("complaint").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'completed'
  spareParts: jsonb("spare_parts").$type<Array<{id: string, partNumber: string, name: string, quantity: number, price: number}>>().default([]),
  serviceCharge: decimal("service_charge", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  garageId: varchar("garage_id").notNull().references(() => garages.id),
  jobCardId: varchar("job_card_id").notNull().references(() => jobCards.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  invoiceNumber: text("invoice_number").notNull(),
  pdfUrl: text("pdf_url"), // Cloudinary URL
  whatsappSent: boolean("whatsapp_sent").default(false),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  partsTotal: decimal("parts_total", { precision: 10, scale: 2 }).notNull(),
  serviceCharge: decimal("service_charge", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Insert schemas
export const insertGarageSchema = createInsertSchema(garages).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  totalJobs: true,
  totalSpent: true,
  lastVisit: true,
});

export const insertSparePartSchema = createInsertSchema(spareParts).omit({
  id: true,
  createdAt: true,
}).extend({
  partNumber: z.string().min(1, "Part number is required"),
  name: z.string().min(1, "Part name is required"),
  price: z.union([
    z.string().refine((val) => parseFloat(val) > 0, "Selling price must be greater than 0"),
    z.number().positive("Selling price must be greater than 0").transform(String)
  ]),
  costPrice: z.union([
    z.string().refine((val) => parseFloat(val) >= 0, "Cost price must be 0 or greater"),
    z.number().min(0, "Cost price must be 0 or greater").transform(String)
  ]).optional().default("0"),
  quantity: z.number().int().min(0, "Quantity must be 0 or greater")
});

export const insertJobCardSchema = createInsertSchema(jobCards).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  status: true,
  customerId: true,
}).extend({
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

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
}).extend({
  createdAt: z.date().optional()
});

// Types
export type Garage = typeof garages.$inferSelect;
export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type SparePart = typeof spareParts.$inferSelect;
export type JobCard = typeof jobCards.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;

export type InsertGarage = z.infer<typeof insertGarageSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertSparePart = z.infer<typeof insertSparePartSchema>;
export type InsertJobCard = z.infer<typeof insertJobCardSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  garageId: varchar("garage_id").notNull().references(() => garages.id),
  customerId: varchar("customer_id").references(() => customers.id),
  type: varchar("type").notNull(), // 'milestone', 'low_stock', 'system'
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  data: jsonb("data"), // Additional data for the notification
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ 
  id: true, 
  createdAt: true 
});
export type SelectNotification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

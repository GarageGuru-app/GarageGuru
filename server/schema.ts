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
  partNumber: text("part_number").notNull(), // Unique identifier for the part
  name: text("name").notNull(), // Display name for the part
  quantity: integer("quantity").notNull().default(0),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job cards for tracking services
export const jobCards = pgTable("job_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  garageId: varchar("garage_id").notNull().references(() => garages.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  description: text("description").notNull(),
  serviceCharge: decimal("service_charge", { precision: 10, scale: 2 }).notNull(),
  spareParts: jsonb("spare_parts").$type<Array<{
    id: string;
    partNumber: string;
    name: string;
    quantity: number;
    sellingPrice: string;
  }>>().default([]),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'completed'
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoices for billing
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  garageId: varchar("garage_id").notNull().references(() => garages.id),
  jobCardId: varchar("job_card_id").notNull().references(() => jobCards.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  fileName: text("file_name").notNull(), // PDF filename
  cloudinaryUrl: text("cloudinary_url").notNull(), // URL to the PDF
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Super admin access requests
export const superAdminRequests = pgTable("super_admin_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userEmail: text("user_email").notNull(),
  activationCode: text("activation_code").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Insert schemas for form validation
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
});

export const insertJobCardSchema = createInsertSchema(jobCards).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  status: true,
  customerId: true,
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

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertSuperAdminRequestSchema = createInsertSchema(superAdminRequests).omit({
  id: true,
  requestedAt: true,
  processedAt: true,
});

// Types
export type Garage = typeof garages.$inferSelect;
export type InsertGarage = z.infer<typeof insertGarageSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type SparePart = typeof spareParts.$inferSelect;
export type InsertSparePart = z.infer<typeof insertSparePartSchema>;

export type JobCard = typeof jobCards.$inferSelect;
export type InsertJobCard = z.infer<typeof insertJobCardSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type SuperAdminRequest = typeof superAdminRequests.$inferSelect;
export type InsertSuperAdminRequest = z.infer<typeof insertSuperAdminRequestSchema>;
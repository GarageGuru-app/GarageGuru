// ServiceGuru Mobile - Offline Database with SQLite/IndexedDB
import Dexie, { Table } from 'dexie';

// Database Interfaces - Matches web app schema
export interface User {
  id: string;
  email: string;
  password: string; // Hashed
  role: 'garage_admin' | 'mechanic_staff';
  garage_id: string;
  name: string;
  must_change_password?: boolean;
  created_at: Date;
}

export interface Garage {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  email: string;
  logo?: string;
  created_at: Date;
}

export interface Customer {
  id: string;
  garage_id: string;
  name: string;
  phone: string;
  bike_number: string;
  total_jobs: number;
  total_spent: number;
  last_visit?: Date;
  created_at: Date;
  notes?: string;
  sync_status: 'synced' | 'pending' | 'conflict';
}

export interface SparePart {
  id: string;
  garage_id: string;
  name: string;
  part_number?: string;
  price: number;
  quantity: number;
  low_stock_threshold: number;
  barcode?: string;
  cost_price?: number;
  created_at: Date;
  sync_status: 'synced' | 'pending' | 'conflict';
}

export interface JobCard {
  id: string;
  garage_id: string;
  customer_id: string;
  complaint: string;
  service_charges: number;
  status: 'pending' | 'in_progress' | 'completed' | 'invoiced';
  spare_parts_used: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    cost_price?: number;
  }[];
  created_at: Date;
  completed_at?: Date;
  sync_status: 'synced' | 'pending' | 'conflict';
}

export interface Invoice {
  id: string;
  garage_id: string;
  job_card_id: string;
  customer_id: string;
  invoice_number: string;
  total_amount: number;
  service_charges: number;
  parts_total: number;
  pdf_path?: string;
  created_at: Date;
  sync_status: 'synced' | 'pending' | 'conflict';
}

export interface SyncLog {
  id?: number;
  table_name: string;
  record_id: string;
  action: 'insert' | 'update' | 'delete';
  data: any;
  synced: boolean;
  created_at: Date;
  error?: string;
}

// Offline Database Class
class ServiceGuruDatabase extends Dexie {
  users!: Table<User>;
  garages!: Table<Garage>;
  customers!: Table<Customer>;
  spare_parts!: Table<SparePart>;
  job_cards!: Table<JobCard>;
  invoices!: Table<Invoice>;
  sync_logs!: Table<SyncLog>;

  constructor() {
    super('ServiceGuruMobile');
    
    this.version(1).stores({
      users: 'id, email, garage_id, role',
      garages: 'id, name, owner_name',
      customers: 'id, garage_id, name, phone, bike_number, sync_status',
      spare_parts: 'id, garage_id, name, part_number, barcode, sync_status',
      job_cards: 'id, garage_id, customer_id, status, sync_status, created_at',
      invoices: 'id, garage_id, job_card_id, customer_id, invoice_number, sync_status',
      sync_logs: '++id, table_name, record_id, synced, created_at'
    });
  }
}

export const db = new ServiceGuruDatabase();

// Database Utilities
export class DatabaseManager {
  
  // Initialize database with default data
  static async initialize() {
    const userCount = await db.users.count();
    if (userCount === 0) {
      // Create default garage and admin user for demo
      const garageId = crypto.randomUUID();
      const userId = crypto.randomUUID();
      
      await db.garages.add({
        id: garageId,
        name: "Demo Garage",
        owner_name: "Admin User",
        phone: "+91 9999999999",
        email: "admin@demgarage.com",
        created_at: new Date()
      });
      
      await db.users.add({
        id: userId,
        email: "admin@demo.com",
        password: "admin123", // In real app, this would be hashed
        role: 'garage_admin',
        garage_id: garageId,
        name: "Admin User",
        created_at: new Date()
      });
      
      console.log('🏗️ Database initialized with demo data');
    }
  }
  
  // Sync data with Gmail backup
  static async syncWithGmail(): Promise<boolean> {
    try {
      const pendingLogs = await db.sync_logs.where('synced').equals(false).toArray();
      console.log(`📧 Syncing ${pendingLogs.length} records with Gmail backup`);
      
      // In a real implementation, this would:
      // 1. Export data to JSON
      // 2. Encrypt the data
      // 3. Email to user's Gmail as attachment
      // 4. Mark sync_logs as synced
      
      return true;
    } catch (error) {
      console.error('Gmail sync failed:', error);
      return false;
    }
  }
  
  // Add sync log entry
  static async addSyncLog(tableName: string, recordId: string, action: 'insert' | 'update' | 'delete', data: any) {
    await db.sync_logs.add({
      table_name: tableName,
      record_id: recordId,
      action,
      data,
      synced: false,
      created_at: new Date()
    });
  }
  
  // Get garage data for current user
  static async getCurrentGarage(): Promise<Garage | null> {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return null;
    
    const user = JSON.parse(currentUser) as User;
    return await db.garages.get(user.garage_id) || null;
  }
  
  // Authentication
  static async authenticate(email: string, password: string): Promise<User | null> {
    const user = await db.users.where('email').equals(email).first();
    if (user && user.password === password) { // In real app, use proper hashing
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('authToken', 'offline-token-' + user.id);
      return user;
    }
    return null;
  }
  
  static getCurrentUser(): User | null {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  }
  
  static logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  }
}

// Initialize database on load
DatabaseManager.initialize();
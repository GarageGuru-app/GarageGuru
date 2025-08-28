import { startServer } from './adapter';
import { runMigrations } from './migrations';
import { syncCustomerStats } from './sync-stats';
import nodemailer from 'nodemailer';

// Configure Gmail SMTP transporter
let transporter: any = null;

try {
  transporter = nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
  console.log('📧 Gmail SMTP configured successfully');
} catch (error) {
  console.warn('⚠️ Gmail SMTP configuration failed:', error);
}

async function startLocalServer() {
  try {
    // Run database migrations
    await runMigrations();
    
    // Sync customer statistics
    await syncCustomerStats();
    
    // Start the unified Hono server
    startServer(5000);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export transporter for other modules
export { transporter };

startLocalServer();
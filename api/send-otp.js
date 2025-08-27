import nodemailer from 'nodemailer';
import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

function setupGmailTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailAppPassword) {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, purpose = 'password reset' } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await pool.query(
      'INSERT INTO otp_codes (email, code, expires_at, purpose, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET code = $2, expires_at = $3, purpose = $4, created_at = $5',
      [email, otp, expiry, purpose, new Date()]
    );

    // Send email
    const transporter = setupGmailTransporter();
    if (transporter) {
      const mailOptions = {
        from: `"GarageGuru System" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `GarageGuru ${purpose.charAt(0).toUpperCase() + purpose.slice(1)} Code`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">GarageGuru ${purpose.charAt(0).toUpperCase() + purpose.slice(1)}</h2>
            <p>Your ${purpose} verification code is:</p>
            <div style="font-size: 24px; font-weight: bold; color: #007bff; padding: 20px; background: #f8f9fa; text-align: center; margin: 20px 0; border-radius: 8px;">
              ${otp}
            </div>
            <p><strong>⚠️ Security Notice:</strong></p>
            <ul>
              <li>This code expires in 10 minutes</li>
              <li>Only use this code if you requested a ${purpose}</li>
              <li>Never share this code with anyone</li>
            </ul>
            <p>If you didn't request this ${purpose}, please contact support immediately.</p>
          </div>
        `,
        text: `Your GarageGuru ${purpose} code is: ${otp}. This code expires in 10 minutes. If you didn't request this ${purpose}, please contact support.`
      };

      await transporter.sendMail(mailOptions);
      console.log(`📧 OTP sent via Gmail to: ${email}`);
    } else {
      console.log(`📧 Gmail not configured - OTP for ${email}: ${otp}`);
    }

    res.json({ 
      success: true, 
      message: 'OTP sent successfully' 
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
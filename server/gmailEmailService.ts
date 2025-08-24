import nodemailer from 'nodemailer';

interface AccessRequestData {
  email: string;
  name: string;
  requestType: string;
  message?: string;
  timestamp: string;
  garageId?: string;
  garageName?: string;
  garageOwner?: string;
  generatedActivationCode?: string;
}

export class GmailEmailService {
  private static instance: GmailEmailService;
  private transporter: any = null;
  private isConfigured = false;

  constructor() {
    this.setupGmailTransporter();
  }

  static getInstance(): GmailEmailService {
    if (!GmailEmailService.instance) {
      GmailEmailService.instance = new GmailEmailService();
    }
    return GmailEmailService.instance;
  }

  private setupGmailTransporter() {
    const gmailUser = process.env.GMAIL_USER; // Your Gmail address
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD; // App-specific password

    if (gmailUser && gmailAppPassword) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      });
      this.isConfigured = true;
      console.log('📧 Gmail SMTP configured successfully');
    } else {
      console.log('📧 Gmail SMTP not configured - missing credentials');
    }
  }

  async sendOtpEmail(
    email: string,
    otp: string,
    purpose: string = 'password reset'
  ): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('📧 Gmail SMTP not configured - logging OTP instead');
      console.log(`📧 OTP for ${email}: ${otp} (${purpose})`);
      return false;
    }

    try {
      const mailOptions = {
        from: `"GarageGuru System" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: purpose.includes('notification') 
          ? 'GarageGuru Super Admin Password Changed - Security Alert'
          : `GarageGuru Super Admin ${purpose.charAt(0).toUpperCase() + purpose.slice(1)} Code`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${purpose.includes('notification') ? `
              <h2 style="color: #333;">Security Alert: Password Changed</h2>
              <p>A super admin password has been successfully changed.</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p>If you did not make this change, please contact support immediately.</p>
            ` : `
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
            `}
          </div>
        `,
        text: purpose.includes('notification') 
          ? `Security Alert: A super admin password has been changed at ${new Date().toLocaleString()}. If you did not make this change, please contact support immediately.`
          : `Your GarageGuru ${purpose} code is: ${otp}. This code expires in 10 minutes. If you didn't request this ${purpose}, please contact support.`
      };

      console.log(`📧 Sending OTP email via Gmail to: ${email}`);
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 OTP email sent successfully via Gmail`);
      return true;
    } catch (error: any) {
      console.error('📧 Gmail OTP send failed:', error);
      console.log(`📧 OTP for ${email}: ${otp} (${purpose})`);
      return false;
    }
  }

  async sendAccessRequestNotification(
    superAdminEmail: string,
    requestData: AccessRequestData
  ): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('📧 Gmail SMTP not configured - logging request instead');
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

      console.log(`📧 Sending email via Gmail SMTP to: ${superAdminEmail}`);
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Access request email sent successfully via Gmail`);
      return true;
    } catch (error: any) {
      console.error('📧 Gmail SMTP send failed:', error);
      
      if (error.code === 'EAUTH') {
        console.log('\n🚨 GMAIL AUTHENTICATION ERROR 🚨');
        console.log('========================================');
        console.log('Fix: Generate App-Specific Password');
        console.log('1. Go to Google Account settings');
        console.log('2. Security → 2-Step Verification');
        console.log('3. App passwords → Generate new password');
        console.log('4. Use that password as GMAIL_APP_PASSWORD');
        console.log('========================================\n');
      }
      
      this.logAccessRequest(requestData);
      return false;
    }
  }

  private generateAccessRequestEmail(data: AccessRequestData): string {
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
              🔑 New Access Request
            </h2>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">Request Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 100px;">👤 Name:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${data.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">📧 Email:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${data.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">🎯 Role:</td>
                  <td style="padding: 8px 0; color: #1f2937; text-transform: uppercase; font-weight: bold;">${data.requestType}</td>
                </tr>
                ${data.garageId && data.garageName ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">🏪 Garage:</td>
                  <td style="padding: 8px 0; color: #1f2937;"><strong>${data.garageName}</strong><br><small style="color: #6b7280;">Owner: ${data.garageOwner}</small></td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">⏰ Time:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${data.timestamp}</td>
                </tr>
                ${data.message ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">💬 Message:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${data.message}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div style="background: #3b82f6; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
              <h4 style="margin: 0 0 15px 0; color: white; font-size: 20px;">⚡ ACTION REQUIRED</h4>
              <div style="background: white; padding: 25px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0 0 10px 0; font-size: 16px; color: #1f2937; font-weight: bold;">Review and Process This Request</p>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Use the Super Admin Dashboard to approve or deny this access request</p>
              </div>
              <p style="margin: 10px 0 0 0; color: white; font-size: 14px; font-weight: bold;">
                ${data.requestType.toUpperCase()} ACCESS REQUEST
              </p>
            </div>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <h4 style="margin: 0 0 15px 0; color: #92400e; font-size: 16px;">📝 How to Process This Request</h4>
              <ol style="margin: 0; padding-left: 20px; color: #78350f;">
                <li style="margin-bottom: 8px;">Log in to the Super Admin Dashboard</li>
                <li style="margin-bottom: 8px;">Go to the "Access Requests" tab</li>
                <li style="margin-bottom: 8px;">Review the request details</li>
                <li style="margin-bottom: 8px;">Click "Approve" to create account and send credentials</li>
                <li>Or click "Deny" to reject the request</li>
              </ol>
              <p style="margin: 15px 0 0 0; font-size: 13px; color: #78350f; font-style: italic;">
                📧 Email notifications will be sent automatically to the user based on your decision.
              </p>
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
                    <div style="color: #3b82f6; font-size: 20px; margin-bottom: 5px;">📧</div>
                    <div style="font-size: 12px; color: #6b7280;">Email</div>
                    <div style="font-size: 13px; color: #1f2937; font-weight: bold;">ananthautomotivegarage@gmail.com</div>
                  </td>
                  <td style="text-align: center; padding: 10px; border-right: 1px solid #e5e7eb; width: 33.33%;">
                    <div style="color: #10b981; font-size: 20px; margin-bottom: 5px;">🔧</div>
                    <div style="font-size: 12px; color: #6b7280;">Service</div>
                    <div style="font-size: 13px; color: #1f2937; font-weight: bold;">Professional Automotive</div>
                  </td>
                  <td style="text-align: center; padding: 10px; width: 33.33%;">
                    <div style="color: #f59e0b; font-size: 20px; margin-bottom: 5px;">⚡</div>
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

  private generateAccessRequestText(data: AccessRequestData): string {
    return `
🔑 NEW ACCESS REQUEST - GARAGEGURU

Request Details:
👤 Name: ${data.name}
📧 Email: ${data.email}
🎯 Requested Role: ${data.requestType.toUpperCase()}
${data.garageId && data.garageName ? `🏪 Selected Garage: ${data.garageName} (Owner: ${data.garageOwner})` : ''}
⏰ Time: ${data.timestamp}
${data.message ? `💬 Message: ${data.message}` : ''}

⚡ ACTION REQUIRED: Review and Process Request

To Process This Request:
1. Log in to the Super Admin Dashboard
2. Go to the "Access Requests" tab  
3. Review the request details
4. Click "Approve" to create account and send credentials
5. Or click "Deny" to reject the request

📧 Email notifications will be sent automatically to the user.

---
GarageGuru Management System
Access Control Notification
    `;
  }

  async sendAccessApprovalNotification(
    userEmail: string,
    approvalData: {
      name: string;
      role: string;
      email: string;
      temporaryPassword: string | null;
    }
  ): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('📧 Gmail SMTP not configured - logging approval instead');
      console.log(`✅ ACCESS APPROVED for ${approvalData.email} as ${approvalData.role}`);
      return false;
    }

    try {
      console.log(`📧 Sending approval notification via Gmail to: ${userEmail}`);
      
      const mailOptions = {
        from: `"GarageGuru System" <${process.env.GMAIL_USER}>`,
        to: userEmail,
        subject: '🎉 Access Approved - GarageGuru Account Created',
        text: this.generateApprovalEmailText(approvalData),
        html: this.generateApprovalEmailHTML(approvalData)
      };

      await this.transporter.sendMail(mailOptions);
      console.log('📧 Approval notification sent successfully via Gmail');
      return true;
    } catch (error) {
      console.error('📧 Failed to send approval notification:', error);
      return false;
    }
  }

  async sendAccessDenialNotification(
    userEmail: string,
    denialData: {
      name: string;
      requestType: string;
    }
  ): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('📧 Gmail SMTP not configured - logging denial instead');
      console.log(`❌ ACCESS DENIED for ${userEmail}`);
      return false;
    }

    try {
      console.log(`📧 Sending denial notification via Gmail to: ${userEmail}`);
      
      const mailOptions = {
        from: `"GarageGuru System" <${process.env.GMAIL_USER}>`,
        to: userEmail,
        subject: '❌ Access Request Update - GarageGuru',
        text: this.generateDenialEmailText(denialData),
        html: this.generateDenialEmailHTML(denialData)
      };

      await this.transporter.sendMail(mailOptions);
      console.log('📧 Denial notification sent successfully via Gmail');
      return true;
    } catch (error) {
      console.error('📧 Failed to send denial notification:', error);
      return false;
    }
  }

  private generateApprovalEmailHTML(data: {
    name: string;
    role: string;
    email: string;
    temporaryPassword: string | null;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GarageGuru - Access Approved</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
            <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
              <span style="font-size: 40px;">🎉</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to GarageGuru!</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0 0 0; font-size: 16px;">Your Access Has Been Approved</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="color: #10b981; margin: 0 0 20px 0; font-size: 24px;">🎊 Congratulations ${data.name}!</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Your access request has been <strong style="color: #10b981;">approved</strong>! You can now log in to the GarageGuru system with your new account.
            </p>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="margin: 0 0 15px 0; color: #10b981; font-size: 18px;">🔑 Your Login Credentials</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 100px;">📧 Email:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-family: monospace; background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${data.email}</td>
                </tr>
                ${data.temporaryPassword ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">🔒 Password:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-family: monospace; background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${data.temporaryPassword}</td>
                </tr>
                ` : `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">🔒 Password:</td>
                  <td style="padding: 8px 0; color: #1f2937;">Use your existing password</td>
                </tr>
                `}
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">👤 Role:</td>
                  <td style="padding: 8px 0; color: #1f2937; text-transform: capitalize;">${data.role.replace('_', ' ')}</td>
                </tr>
              </table>
            </div>
            
            ${data.temporaryPassword ? `
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h4 style="margin: 0 0 10px 0; color: #d97706; font-size: 16px;">⚠️ Important Security Notice</h4>
              <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                This is a <strong>temporary password</strong>. For security reasons, you will be prompted to change your password when you first log in. Please choose a strong, unique password.
              </p>
            </div>
            ` : `
            <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">ℹ️ Account Updated</h4>
              <p style="color: #1e3a8a; font-size: 14px; margin: 0; line-height: 1.5;">
                Your existing account has been updated with new access permissions. You can log in using your current password.
              </p>
            </div>
            `}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://your-domain.replit.app'}/login" 
                 style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                🚀 Login to GarageGuru
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
              If you have any questions or need assistance, please contact the system administrator.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This email was sent from GarageGuru Management System<br>
              &copy; 2025 GarageGuru. All rights reserved.
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;
  }

  private generateApprovalEmailText(data: {
    name: string;
    role: string;
    email: string;
    temporaryPassword: string | null;
  }): string {
    return `
🎉 WELCOME TO GARAGEGURU - ACCESS APPROVED!

Congratulations ${data.name}!

Your access request has been APPROVED! You can now log in to the GarageGuru system.

🔑 LOGIN CREDENTIALS:
📧 Email: ${data.email}
🔒 Password: ${data.temporaryPassword ? data.temporaryPassword : 'Use your existing password'}
👤 Role: ${data.role.replace('_', ' ')}

${data.temporaryPassword ? 
`⚠️ IMPORTANT SECURITY NOTICE:
This is a temporary password. You will be prompted to change your password when you first log in.` :
`ℹ️ ACCOUNT UPDATED:
Your existing account has been updated with new access permissions. You can log in using your current password.`}

🚀 LOGIN NOW:
${process.env.FRONTEND_URL || 'https://your-domain.replit.app'}/login

If you have any questions, please contact the system administrator.

---
GarageGuru Management System
© 2025 GarageGuru. All rights reserved.
    `;
  }

  private generateDenialEmailHTML(data: {
    name: string;
    requestType: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GarageGuru - Access Request Update</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px 20px; text-align: center;">
            <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
              <span style="font-size: 40px;">📋</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">GarageGuru</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0 0 0; font-size: 16px;">Access Request Update</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="color: #ef4444; margin: 0 0 20px 0; font-size: 24px;">Access Request Status</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Dear ${data.name},
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for your interest in the GarageGuru Management System. After careful review, we are unable to approve your request for <strong>${data.requestType}</strong> access at this time.
            </p>
            
            <div style="background: #fef2f2; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h3 style="margin: 0 0 15px 0; color: #ef4444; font-size: 18px;">📋 Next Steps</h3>
              <ul style="color: #374151; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Contact the system administrator for more information</li>
                <li style="margin-bottom: 8px;">Ensure you have the correct authorization from your organization</li>
                <li style="margin-bottom: 8px;">You may submit a new request in the future if circumstances change</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
              If you believe this decision was made in error or have questions, please contact the system administrator.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This email was sent from GarageGuru Management System<br>
              &copy; 2025 GarageGuru. All rights reserved.
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;
  }

  private generateDenialEmailText(data: {
    name: string;
    requestType: string;
  }): string {
    return `
GARAGEGURU - ACCESS REQUEST UPDATE

Dear ${data.name},

Thank you for your interest in the GarageGuru Management System. 

After careful review, we are unable to approve your request for ${data.requestType.toUpperCase()} access at this time.

📋 NEXT STEPS:
• Contact the system administrator for more information
• Ensure you have the correct authorization from your organization  
• You may submit a new request in the future if circumstances change

If you believe this decision was made in error or have questions, please contact the system administrator.

---
GarageGuru Management System
© 2025 GarageGuru. All rights reserved.
    `;
  }

  private logAccessRequest(data: AccessRequestData): void {
    console.log('\n🔑 NEW ACCESS REQUEST 🔑');
    console.log('================================');
    console.log(`📧 Email: ${data.email}`);
    console.log(`👤 Name: ${data.name}`);
    console.log(`🎯 Requested Role: ${data.requestType}`);
    console.log(`💬 Message: ${data.message || 'No message provided'}`);
    console.log(`⏰ Time: ${data.timestamp}`);
    console.log('================================\n');
  }
}
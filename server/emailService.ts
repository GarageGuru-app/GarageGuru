import sgMail from '@sendgrid/mail';

interface AccessRequestData {
  email: string;
  name: string;
  requestType: string;
  message?: string;
  timestamp: string;
}

export class EmailService {
  private static instance: EmailService;
  private isConfigured = false;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
    }
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendAccessRequestNotification(
    superAdminEmail: string,
    requestData: AccessRequestData
  ): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('📧 SendGrid not configured - logging request instead');
      this.logAccessRequest(requestData);
      return false;
    }

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || superAdminEmail;
    console.log(`📧 Using from email: ${fromEmail}`);
    console.log(`📧 Environment check - SENDGRID_FROM_EMAIL: ${process.env.SENDGRID_FROM_EMAIL ? 'SET' : 'NOT SET'}`);

    try {
      const msg = {
        to: superAdminEmail,
        from: {
          email: fromEmail,
          name: 'GarageGuru System'
        },
        subject: `GarageGuru Admin - New Access Request from ${requestData.name}`,
        html: this.generateAccessRequestEmail(requestData),
        text: this.generateAccessRequestText(requestData)
      };

      console.log(`📧 Attempting to send email from verified sender: ${fromEmail}`);
      await sgMail.send(msg);
      console.log(`📧 Access request email sent to ${superAdminEmail}`);
      return true;
    } catch (error: any) {
      console.error('📧 Email send failed:', error);
      
      // Log specific SendGrid error details
      if (error.response && error.response.body && error.response.body.errors) {
        console.error('SendGrid Error Details:', error.response.body.errors);
        
        // Check if it's a sender identity issue
        const isIdentityError = error.response.body.errors.some((err: any) => 
          err.message && err.message.includes('verified Sender Identity')
        );
        
        if (isIdentityError) {
          console.log('\n🚨 SENDGRID SENDER IDENTITY ISSUE 🚨');
          console.log('========================================');
          console.log('Common solutions:');
          console.log('1. Wait 10-15 minutes after verification');
          console.log('2. Try Domain Authentication instead of Single Sender');
          console.log('3. Use a custom domain email (not Gmail/Yahoo)');
          console.log('4. Re-verify the sender email in SendGrid dashboard');
          console.log('========================================\n');
        }
      }
      
      this.logAccessRequest(requestData);
      return false;
    }
  }

  private generateAccessRequestEmail(data: AccessRequestData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          🔑 New Access Request - GarageGuru
        </h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">Request Details</h3>
          <p><strong>👤 Name:</strong> ${data.name}</p>
          <p><strong>📧 Email:</strong> ${data.email}</p>
          <p><strong>🎯 Requested Role:</strong> ${data.requestType.toUpperCase()}</p>
          <p><strong>⏰ Time:</strong> ${data.timestamp}</p>
          ${data.message ? `<p><strong>💬 Message:</strong><br>${data.message}</p>` : ''}
        </div>

        <div style="background: #ecfccb; padding: 15px; border-radius: 8px; border-left: 4px solid #65a30d;">
          <h4 style="margin-top: 0; color: #365314;">Current Activation Codes:</h4>
          <p><strong>🔴 Admin Code:</strong> ${process.env.ADMIN_ACTIVATION_CODE || 'Not configured'}</p>
          <p><strong>🔵 Staff Code:</strong> ${process.env.STAFF_ACTIVATION_CODE || 'Not configured'}</p>
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

  private generateAccessRequestText(data: AccessRequestData): string {
    return `
🔑 NEW ACCESS REQUEST - GARAGEGURU

Request Details:
👤 Name: ${data.name}
📧 Email: ${data.email}
🎯 Requested Role: ${data.requestType.toUpperCase()}
⏰ Time: ${data.timestamp}
${data.message ? `💬 Message: ${data.message}` : ''}

Current Activation Codes:
🔴 Admin Code: ${process.env.ADMIN_ACTIVATION_CODE || 'Not configured'}
🔵 Staff Code: ${process.env.STAFF_ACTIVATION_CODE || 'Not configured'}

To Approve Access:
1. Review the request details above
2. Reply to ${data.email} with the appropriate activation code
3. Or generate new codes if needed

---
GarageGuru Management System
Access Control Notification
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
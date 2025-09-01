// Alternative Email Service Implementations
// Choose one based on your preference and requirements

import nodemailer from 'nodemailer';

interface EmailServiceConfig {
  provider: 'resend' | 'mailgun' | 'postmark' | 'gmail' | 'brevo';
  apiKey?: string;
  domain?: string;
  username?: string;
  password?: string;
}

interface AccessRequestData {
  email: string;
  name: string;
  requestType: string;
  message?: string;
  timestamp: string;
}

export class AlternativeEmailService {
  private config: EmailServiceConfig;

  constructor(config: EmailServiceConfig) {
    this.config = config;
  }

  async sendAccessRequestNotification(
    superAdminEmail: string,
    requestData: AccessRequestData
  ): Promise<boolean> {
    switch (this.config.provider) {
      case 'resend':
        return this.sendWithResend(superAdminEmail, requestData);
      case 'mailgun':
        return this.sendWithMailgun(superAdminEmail, requestData);
      case 'postmark':
        return this.sendWithPostmark(superAdminEmail, requestData);
      case 'gmail':
        return this.sendWithGmail(superAdminEmail, requestData);
      case 'brevo':
        return this.sendWithBrevo(superAdminEmail, requestData);
      default:
        console.error('Unknown email provider:', this.config.provider);
        return false;
    }
  }

  // 1. RESEND - Modern, developer-friendly
  private async sendWithResend(superAdminEmail: string, requestData: AccessRequestData): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `ServiceGuru <noreply@${this.config.domain}>`,
          to: [superAdminEmail],
          subject: `🔑 New Access Request - ${requestData.name}`,
          html: this.generateAccessRequestEmail(requestData),
        }),
      });

      if (response.ok) {
        console.log('📧 Email sent successfully via Resend');
        return true;
      } else {
        console.error('Resend error:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Resend send failed:', error);
      return false;
    }
  }

  // 2. MAILGUN - Reliable and powerful
  private async sendWithMailgun(superAdminEmail: string, requestData: AccessRequestData): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('from', `ServiceGuru <noreply@${this.config.domain}>`);
      formData.append('to', superAdminEmail);
      formData.append('subject', `🔑 New Access Request - ${requestData.name}`);
      formData.append('html', this.generateAccessRequestEmail(requestData));

      const response = await fetch(`https://api.mailgun.net/v3/${this.config.domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.config.apiKey}`).toString('base64')}`,
        },
        body: formData,
      });

      if (response.ok) {
        console.log('📧 Email sent successfully via Mailgun');
        return true;
      } else {
        console.error('Mailgun error:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Mailgun send failed:', error);
      return false;
    }
  }

  // 3. POSTMARK - Fast transactional emails
  private async sendWithPostmark(superAdminEmail: string, requestData: AccessRequestData): Promise<boolean> {
    try {
      const response = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': this.config.apiKey!,
        },
        body: JSON.stringify({
          From: `noreply@${this.config.domain}`,
          To: superAdminEmail,
          Subject: `🔑 New Access Request - ${requestData.name}`,
          HtmlBody: this.generateAccessRequestEmail(requestData),
        }),
      });

      if (response.ok) {
        console.log('📧 Email sent successfully via Postmark');
        return true;
      } else {
        console.error('Postmark error:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Postmark send failed:', error);
      return false;
    }
  }

  // 4. GMAIL SMTP - Free option
  private async sendWithGmail(superAdminEmail: string, requestData: AccessRequestData): Promise<boolean> {
    try {
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: this.config.username,
          pass: this.config.password, // App-specific password
        },
      });

      await transporter.sendMail({
        from: `"ServiceGuru System" <${this.config.username}>`,
        to: superAdminEmail,
        subject: `🔑 New Access Request - ${requestData.name}`,
        html: this.generateAccessRequestEmail(requestData),
      });

      console.log('📧 Email sent successfully via Gmail SMTP');
      return true;
    } catch (error) {
      console.error('Gmail SMTP send failed:', error);
      return false;
    }
  }

  // 5. BREVO (formerly Sendinblue) - Free tier available
  private async sendWithBrevo(superAdminEmail: string, requestData: AccessRequestData): Promise<boolean> {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey!,
        },
        body: JSON.stringify({
          sender: {
            name: 'ServiceGuru System',
            email: `noreply@${this.config.domain}`,
          },
          to: [{ email: superAdminEmail }],
          subject: `🔑 New Access Request - ${requestData.name}`,
          htmlContent: this.generateAccessRequestEmail(requestData),
        }),
      });

      if (response.ok) {
        console.log('📧 Email sent successfully via Brevo');
        return true;
      } else {
        console.error('Brevo error:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Brevo send failed:', error);
      return false;
    }
  }

  private generateAccessRequestEmail(data: AccessRequestData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          🔑 New Access Request - ServiceGuru
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

        <div style="margin: 30px 0; padding: 20px; background: #1e40af; color: white; border-radius: 8px; text-align: center;">
          <h3 style="margin: 0;">ServiceGuru Management System</h3>
          <p style="margin: 5px 0;">Access Control Notification</p>
        </div>
      </div>
    `;
  }
}
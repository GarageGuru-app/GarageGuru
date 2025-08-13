// Type definitions for email services
export interface EmailConfig {
  to: string;
  from: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailService {
  sendEmail(config: EmailConfig): Promise<EmailResult>;
}
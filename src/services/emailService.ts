
// Ensure dotenv is loaded if not already (for tsx watch/dev mode)
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

class EmailService {
  private transporter: any = null;

  constructor() {
    this.initializeNodemailer();
  }

  private initializeNodemailer() {
    const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD } = process.env;
    
    console.log('🔍 Debug SMTP Environment Variables:');
    console.log('SMTP_HOST:', SMTP_HOST || 'UNDEFINED');
    console.log('SMTP_PORT:', SMTP_PORT || 'UNDEFINED');
    console.log('SMTP_SECURE:', SMTP_SECURE || 'UNDEFINED');
    console.log('SMTP_USER:', SMTP_USER || 'UNDEFINED');
    console.log('SMTP_PASSWORD:', SMTP_PASSWORD ? '***HIDDEN***' : 'UNDEFINED');
    
    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASSWORD) {
      try {
        this.transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: parseInt(SMTP_PORT),
          secure: SMTP_SECURE === 'true', // true for 465, false for other ports
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASSWORD,
          },
        });
        console.log('✅ Nodemailer SMTP service initialized');
        console.log(`📧 SMTP Host: ${SMTP_HOST}:${SMTP_PORT}`);
        console.log(`📧 SMTP User: ${SMTP_USER}`);
      } catch (error) {
        console.error('❌ Failed to initialize Nodemailer:', error);
        this.transporter = null;
      }
    } else {
      console.error('❌ Missing SMTP credentials:', {
        SMTP_HOST: !!SMTP_HOST,
        SMTP_PORT: !!SMTP_PORT,
        SMTP_USER: !!SMTP_USER,
        SMTP_PASSWORD: !!SMTP_PASSWORD
      });
      this.transporter = null;
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      console.log('📧 Sending email via Nodemailer SMTP');
      console.log('📧 To:', options.to);
      console.log('📧 Subject:', options.subject);

      if (!this.transporter) {
        console.error('❌ Nodemailer not configured, cannot send email');
        return { 
          success: false, 
          error: 'SMTP transporter not initialized' 
        };
      }

      const mailOptions = {
        from: options.from || process.env.DEFAULT_FROM_EMAIL || 'noreply@yourcompany.com',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || `<p>${options.text}</p>`,
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('✅ Email sent successfully via Nodemailer');
      console.log('📧 Message ID:', info.messageId);
      
      return { 
        success: true, 
        messageId: info.messageId 
      };

    } catch (error: any) {
      console.error('❌ Email sending error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send email' 
      };
    }
  }

  async testEmailService(): Promise<EmailResult & { details?: any }> {
    try {
      const result = await this.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email - Backend API',
        text: 'This is a test email from the CRM backend API using Nodemailer.',
      });

      return {
        ...result,
        details: { message: 'Nodemailer SMTP email service test completed' }
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message,
        details: { message: 'Nodemailer SMTP email service test failed' }
      };
    }
  }
}

export const emailService = new EmailService();

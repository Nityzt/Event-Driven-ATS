const nodemailer = require('nodemailer');

/**
 * Email service.
 * Uses configured SMTP (Ethereal / Resend / SendGrid / …) when EMAIL_* env vars
 * are present, otherwise auto-creates an Ethereal test inbox so every message
 * still produces a clickable preview URL. `sendEmail` resolves with
 * { success, previewUrl } and never throws — callers should check `success`.
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        // Configured SMTP (works for Ethereal, Resend, SendGrid, etc.)
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT) || 587,
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000,
        });
        console.log('[Email] Using SMTP:', process.env.EMAIL_HOST, '/', process.env.EMAIL_USER);
      } else {
        // Fallback: create a fresh Ethereal account
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000,
        });
        console.log('[Email] Using Ethereal test account:', testAccount.user);
      }

      this.initialized = true;
      console.log('[Email] Email service initialized');
    } catch (error) {
      console.error('[Email] Failed to initialize email service:', error);
    }
  }

  async sendEmail({ to, subject, text, html }) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"ATS System" <noreply@ats.com>',
        to,
        subject,
        text,
        html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info) || null;
      console.log('[Email] Preview URL:', previewUrl || 'N/A');

      return { success: true, messageId: info.messageId, previewUrl };
    } catch (error) {
      console.error('[Email] Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();

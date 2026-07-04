const nodemailer = require('nodemailer');
const AuditLog = require('../models/AuditLog');

/**
 * Email service.
 * Prefers Resend's HTTPS API when configured — this bypasses the outbound
 * SMTP port blocks some hosts enforce (e.g. Render free tier blocks 25/465/587
 * as of Sept 2025). Falls back to SMTP (Ethereal / Gmail / other) otherwise.
 * If the real send fails for any reason, falls back to a logged mock send —
 * same graceful-degradation pattern as smsService — so a workflow run never
 * gets stuck on a flaky mail provider. `sendEmail` always resolves with
 * { success, previewUrl, mocked } and never throws.
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.useResendApi = false;
  }

  async initialize() {
    if (this.initialized) return;

    this.useResendApi = process.env.EMAIL_HOST === 'smtp.resend.com' && !!process.env.EMAIL_PASS;
    if (this.useResendApi) {
      console.log('[Email] Using Resend HTTPS API (bypasses SMTP port blocks)');
      this.initialized = true;
      return;
    }

    try {
      if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        // Configured SMTP (Ethereal, Gmail, SendGrid, etc.)
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

      console.log('[Email] Email service initialized');
    } catch (error) {
      console.error('[Email] Failed to initialize email service:', error);
    }
    this.initialized = true;
  }

  async sendViaResendApi({ to, subject, text, html }) {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.EMAIL_PASS}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'TalentBay ATS <onboarding@resend.dev>',
        to,
        subject,
        text,
        html,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      throw new Error(`Resend API ${resp.status}: ${body}`);
    }

    const data = await resp.json();
    return data.id;
  }

  async logAudit(to, subject, messageId, mocked) {
    try {
      await AuditLog.create({
        action: 'EMAIL_SENT',
        resource: 'Email',
        changes: { after: { to, subject, messageId, mocked } },
      });
    } catch (err) {
      console.error('[Email] Failed to write AuditLog:', err.message);
    }
  }

  async mockSend({ to, subject }, reason) {
    console.log('[Email Mock] To:', to, '| Subject:', subject, '| Reason for mock:', reason);
    const messageId = `mock-${Date.now()}`;
    await this.logAudit(to, subject, messageId, true);
    return { success: true, messageId, previewUrl: null, mocked: true };
  }

  async sendEmail({ to, subject, text, html }) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.useResendApi) {
      try {
        const messageId = await this.sendViaResendApi({ to, subject, text, html });
        console.log('[Email] Sent via Resend API, id:', messageId);
        await this.logAudit(to, subject, messageId, false);
        return { success: true, messageId, previewUrl: null };
      } catch (error) {
        console.error('[Email] Resend API failed, falling back to mock:', error.message);
        return this.mockSend({ to, subject }, error.message);
      }
    }

    if (!this.transporter) {
      return this.mockSend({ to, subject }, 'Email transporter unavailable');
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
      await this.logAudit(to, subject, info.messageId, false);

      return { success: true, messageId: info.messageId, previewUrl };
    } catch (error) {
      console.error('[Email] Failed to send email, falling back to mock:', error.message);
      return this.mockSend({ to, subject }, error.message);
    }
  }
}

module.exports = new EmailService();

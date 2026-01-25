const nodemailer = require('nodemailer');

// Email configuration
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Initialize email service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      if (process.env.NODE_ENV === 'production') {
        // Production: Use real SMTP credentials from .env
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        // Development: Use Ethereal test account
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log('[Email] Using Ethereal test account:', testAccount.user);
      }

      this.initialized = true;
      console.log('[Email] Email service initialized');
    } catch (error) {
      console.error('[Email] Failed to initialize email service:', error);
    }
  }

  /**
   * Send an email
   */
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

      // Log preview URL for development
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Email] Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('[Email] Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send application confirmation to candidate
   */
  async sendApplicationConfirmation(candidate, job) {
    const html = `
      <h2>Application Received</h2>
      <p>Dear ${candidate.name},</p>
      <p>Thank you for applying to the <strong>${job.title}</strong> position at ${job.company}.</p>
      <p>We have received your application and will review it shortly.</p>
      <p>Best regards,<br>${job.company} Hiring Team</p>
    `;

    return await this.sendEmail({
      to: candidate.email,
      subject: `Application Received - ${job.title}`,
      text: `Thank you for applying to ${job.title} at ${job.company}.`,
      html,
    });
  }

  /**
   * Send high match notification to recruiter
   */
  async sendHighMatchNotification(match, candidate, job) {
    const html = `
      <h2>🎯 High-Quality Match Detected!</h2>
      <p>A candidate with a <strong>${match.overallScore}%</strong> match has applied.</p>
      <h3>Candidate Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${candidate.name}</li>
        <li><strong>Email:</strong> ${candidate.email}</li>
        <li><strong>Match Score:</strong> ${match.overallScore}% (${match.matchQuality})</li>
        <li><strong>Matched Skills:</strong> ${match.matchedSkills.join(', ')}</li>
        ${match.missingSkills.length > 0 ? `<li><strong>Missing Skills:</strong> ${match.missingSkills.join(', ')}</li>` : ''}
      </ul>
      <h3>Job Details:</h3>
      <ul>
        <li><strong>Position:</strong> ${job.title}</li>
        <li><strong>Company:</strong> ${job.company}</li>
      </ul>
    `;

    return await this.sendEmail({
      to: process.env.RECRUITER_EMAIL || 'recruiter@company.com',
      subject: `🎯 High Match Alert: ${candidate.name} - ${job.title}`,
      text: `High-quality match detected: ${candidate.name} (${match.overallScore}%)`,
      html,
    });
  }

  /**
   * Send interview invitation
   */
  async sendInterviewInvitation(candidate, job, interviewDetails) {
    const html = `
      <h2>Interview Invitation</h2>
      <p>Dear ${candidate.name},</p>
      <p>Congratulations! We would like to invite you for an interview for the <strong>${job.title}</strong> position.</p>
      <h3>Interview Details:</h3>
      <ul>
        <li><strong>Date:</strong> ${interviewDetails.date}</li>
        <li><strong>Time:</strong> ${interviewDetails.time}</li>
        <li><strong>Duration:</strong> ${interviewDetails.duration || '30-60 minutes'}</li>
        <li><strong>Type:</strong> ${interviewDetails.type || 'Video Call'}</li>
        ${interviewDetails.meetingLink ? `<li><strong>Meeting Link:</strong> <a href="${interviewDetails.meetingLink}">${interviewDetails.meetingLink}</a></li>` : ''}
      </ul>
      <p>Please confirm your availability by replying to this email.</p>
      <p>Best regards,<br>${job.company} Hiring Team</p>
    `;

    return await this.sendEmail({
      to: candidate.email,
      subject: `Interview Invitation - ${job.title} at ${job.company}`,
      text: `You've been invited for an interview for ${job.title}`,
      html,
    });
  }

  /**
   * Send rejection email
   */
  async sendRejectionEmail(candidate, job) {
    const html = `
      <h2>Application Update</h2>
      <p>Dear ${candidate.name},</p>
      <p>Thank you for your interest in the <strong>${job.title}</strong> position at ${job.company}.</p>
      <p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
      <p>We appreciate the time you invested in the application process and encourage you to apply for future openings that match your skills and experience.</p>
      <p>Best regards,<br>${job.company} Hiring Team</p>
    `;

    return await this.sendEmail({
      to: candidate.email,
      subject: `Application Update - ${job.title}`,
      text: `Thank you for your application to ${job.title} at ${job.company}.`,
      html,
    });
  }

  /**
   * Send status update email
   */
  async sendStatusUpdate(candidate, job, oldStatus, newStatus) {
    const statusMessages = {
      applied: 'Your application has been received',
      screening: 'Your application is under review',
      interview: 'You have been selected for an interview',
      offer: 'Congratulations! We would like to extend an offer',
      rejected: 'Your application status has been updated',
      hired: 'Welcome to the team!',
    };

    const html = `
      <h2>Application Status Update</h2>
      <p>Dear ${candidate.name},</p>
      <p>${statusMessages[newStatus] || 'Your application status has been updated'}.</p>
      <h3>Details:</h3>
      <ul>
        <li><strong>Position:</strong> ${job.title}</li>
        <li><strong>Company:</strong> ${job.company}</li>
        <li><strong>Previous Status:</strong> ${oldStatus}</li>
        <li><strong>New Status:</strong> ${newStatus}</li>
      </ul>
      <p>Best regards,<br>${job.company} Hiring Team</p>
    `;

    return await this.sendEmail({
      to: candidate.email,
      subject: `Application Status Update - ${job.title}`,
      text: `Your application status has been updated to: ${newStatus}`,
      html,
    });
  }
}

module.exports = new EmailService();
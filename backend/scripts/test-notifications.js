// Throwaway smoke test for real email + SMS providers.
// Usage: node scripts/test-notifications.js you@email.com +15551234567
require('dotenv').config();

const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

const [, , toEmail, toPhone] = process.argv;

// Reject any awaited step that hangs, so the script can never lock up.
const withTimeout = (p, ms, label) =>
  Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);

(async () => {
  // --- Show what dotenv actually loaded (masked) ---
  const mask = (v) => (v ? v.slice(0, 4) + '…(' + v.length + ' chars)' : '(empty)');
  console.log('\nEmail config seen by the app:');
  console.log('  EMAIL_HOST  =', process.env.EMAIL_HOST || '(empty)');
  console.log('  EMAIL_PORT  =', process.env.EMAIL_PORT || '(empty)');
  console.log('  EMAIL_SECURE=', process.env.EMAIL_SECURE || '(empty)');
  console.log('  EMAIL_USER  =', process.env.EMAIL_USER || '(empty)');
  console.log('  EMAIL_PASS  =', mask(process.env.EMAIL_PASS));
  console.log('  EMAIL_FROM  =', process.env.EMAIL_FROM || '(empty)');

  // --- Verify SMTP connectivity FIRST, with hard timeouts ---
  if (toEmail && process.env.EMAIL_HOST) {
    console.log('\n--- Verifying SMTP connection (10s timeout) ---');
    const probe = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
    });
    try {
      await withTimeout(probe.verify(), 10000, 'SMTP verify');
      console.log('SMTP connection OK ✅');
    } catch (e) {
      console.error('SMTP verify FAILED ❌:', e.message);
      console.error('  → Check EMAIL_PORT/EMAIL_SECURE pairing (587→false, 465→true) and the API key.');
      process.exit(1);
    }
  }

  // --- Connect Mongo so the SMS AuditLog write succeeds (short timeout) ---
  if (toPhone && process.env.MONGO_URI) {
    try {
      await withTimeout(
        mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 4000 }),
        6000,
        'Mongo connect'
      );
      console.log('\nMongo connected (for AuditLog) ✅');
    } catch (e) {
      console.warn('\nMongo connect failed — SMS will still send, AuditLog write skipped:', e.message);
    }
  }

  if (toEmail) {
    console.log(`\n--- Sending test EMAIL to ${toEmail} ---`);
    try {
      const res = await withTimeout(
        emailService.sendEmail({
          to: toEmail,
          subject: 'TalentBay test email',
          text: 'Plain-text body — if you see this, SMTP works.',
          html: '<h2>TalentBay</h2><p>If you see this, Resend SMTP works. ✅</p>',
        }),
        15000,
        'Email send'
      );
      console.log('Email result:', res);
    } catch (e) {
      console.error('Email send FAILED ❌:', e.message);
    }
  } else {
    console.log('\nNo email arg — skipping email. Pass an address as arg 1.');
  }

  if (toPhone) {
    console.log(`\n--- Sending test SMS to ${toPhone} ---`);
    try {
      const res = await withTimeout(
        smsService.send(toPhone, 'TalentBay test SMS — Twilio works ✅', { correlationId: 'local-test' }),
        15000,
        'SMS send'
      );
      console.log('SMS result:', res);
    } catch (e) {
      console.error('SMS send FAILED ❌:', e.message);
    }
  } else {
    console.log('No phone arg — skipping SMS. Pass E.164 number as arg 2.');
  }

  await mongoose.disconnect().catch(() => {});
  process.exit(0);
})();

const AuditLog = require('../models/AuditLog');
const metrics = require('./metrics');

// Use Twilio when credentials are present, otherwise log as mock
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('[SMS] Twilio client initialised');
  } catch {
    console.warn('[SMS] twilio package not installed — falling back to mock');
  }
}

async function send(to, message, meta = {}) {
  const payload = { to, message, ...meta, timestamp: new Date().toISOString() };
  let sid;

  if (twilioClient && process.env.TWILIO_FROM_NUMBER) {
    try {
      const result = await twilioClient.messages.create({
        from: process.env.TWILIO_FROM_NUMBER,
        to,
        body: message,
      });
      sid = result.sid;
      console.log('[SMS] Sent via Twilio to', to, '| SID:', sid);
    } catch (err) {
      console.error('[SMS] Twilio error — falling back to mock:', err.message);
      console.log('[SMS Mock]', JSON.stringify(payload, null, 2));
      sid = `mock-${Date.now()}`;
    }
  } else {
    console.log('[SMS Mock]', JSON.stringify(payload, null, 2));
    sid = `mock-${Date.now()}`;
  }

  try {
    await AuditLog.create({
      action: 'SMS_SENT',
      resource: 'SMS',
      changes: { after: { ...payload, sid } },
      correlationId: meta.correlationId,
    });
  } catch (err) {
    console.error('[SMS] Failed to write AuditLog:', err.message);
  }

  metrics.sms_sent++;
  return { sid, status: 'sent' };
}

module.exports = { send };

const AuditLog = require('../models/AuditLog');
const metrics = require('./metrics');

async function send(to, message, meta = {}) {
  const payload = { to, message, ...meta, timestamp: new Date().toISOString() };
  console.log('[SMS Mock]', JSON.stringify(payload, null, 2));

  try {
    await AuditLog.create({
      action: 'SMS_SENT',
      resource: 'SMS',
      changes: { after: payload },
      correlationId: meta.correlationId
    });
  } catch (err) {
    console.error('[SMS Mock] Failed to write AuditLog:', err.message);
  }

  metrics.sms_sent++;
  return { sid: `mock-${Date.now()}`, status: 'sent' };
}

module.exports = { send };

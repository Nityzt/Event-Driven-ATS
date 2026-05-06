const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'SMS_SENT', 'EMAIL_SENT', 'WEBHOOK_CALLED', 'WORKFLOW_TRIGGER', 'STAGE_CHANGE']
  },
  resource: {
    type: String, // e.g., 'Candidate', 'Job', 'Application'
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  correlationId: String
}, {
  timestamps: true
});

// Index for efficient querying
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ correlationId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
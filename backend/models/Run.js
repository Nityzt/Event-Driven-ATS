const mongoose = require('mongoose');

const runSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  state: {
    type: String,
    enum: ['queued', 'running', 'paused', 'completed', 'failed', 'cancelled'],
    default: 'queued'
  },
  stepPointer: {
    type: Number,
    default: 0 // Which step we're currently on
  },
  logs: [{
    step: Number,
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'retrying', 'failed']
    },
    message: String,
    error: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  startedAt: Date,
  completedAt: Date,
  failedAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
runSchema.index({ workflowId: 1, applicationId: 1 });
runSchema.index({ state: 1, createdAt: -1 });

module.exports = mongoose.model('Run', runSchema);
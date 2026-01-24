const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workflow name is required'],
    trim: true
  },
  description: String,
  triggers: [{
    event: {
      type: String,
      enum: ['Application.created', 'Stage.changed', 'Manual'],
      required: true
    },
    conditions: mongoose.Schema.Types.Mixed // e.g., { stage: 'Interview' }
  }],
  steps: [{
    type: {
      type: String,
      enum: ['sendEmail', 'sendSMS', 'wait', 'webhook'],
      required: true
    },
    config: {
      // For email/SMS:
      to: String,
      subject: String,
      body: String,
      message: String,
      
      // For wait:
      duration: Number, // in hours
      
      // For webhook:
      url: String,
      payload: mongoose.Schema.Types.Mixed,
      method: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'PATCH'],
        default: 'POST'
      }
    }
  }],
  enabled: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Workflow', workflowSchema);
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Job description is required']
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  operationalSkills: [{
    type: String,
    trim: true
  }],
  hygieneSkills: [{ // Boost score +5% each if matched
    type: String,
    trim: true
  }],
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  seniority: {
    type: String,
    enum: ['Entry', 'Mid', 'Senior', 'Lead', 'Executive'],
    required: [true, 'Seniority level is required']
  },
  status: {
    type: String,
    enum: ['Open', 'Closed', 'On Hold'],
    default: 'Open'
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Text index for search
jobSchema.index({ 
  title: 'text', 
  description: 'text',
  requiredSkills: 'text',
  operationalSkills: 'text'
});

module.exports = mongoose.model('Job', jobSchema);
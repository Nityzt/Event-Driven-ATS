const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Candidate name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/, 'Please enter a valid phone number']
  },
  resume: {
    filename: String,
    path: String,
    uploadedAt: Date,
    extractedText: String // Text extracted from PDF
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: [{
    company: String,
    title: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String
  }],
  location: {
    type: String,
    trim: true
  },
  seniority: {
    type: String,
    enum: ['Entry', 'Mid', 'Senior', 'Lead', 'Executive']
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Hired', 'Rejected'],
    default: 'Active'
  },
  timeline: [{
    event: String,
    description: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Text index for search functionality
candidateSchema.index({
  name: 'text',
  email: 'text',
  skills: 'text',
  location: 'text',
  'resume.extractedText': 'text',
  'experience.title': 'text'
}, {
  weights: {
    name: 10,
    skills: 8,
    'experience.title': 3,
    location: 2,
    email: 1,
    'resume.extractedText': 1
  }
});

module.exports = mongoose.model('Candidate', candidateSchema);
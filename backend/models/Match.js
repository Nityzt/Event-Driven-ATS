const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  },
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  breakdown: {
    skillsScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    experienceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    locationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    educationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    hygieneBonus: {
      type: Number,
      default: 0,
      min: 0
    },
    baseScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  matchedSkills: {
    required: [{
      type: String
    }],
    operational: [{
      type: String
    }],
    hygiene: [{
      type: String
    }]
  },
  missingSkills: {
    required: [{
      type: String
    }],
    operational: [{
      type: String
    }]
  },
  matchQuality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    required: true
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one match record per candidate-job pair
matchSchema.index({ candidate: 1, job: 1 }, { unique: true });

// Index for finding high-quality matches
matchSchema.index({ job: 1, overallScore: -1 });
matchSchema.index({ candidate: 1, overallScore: -1 });

// Virtual to determine if this is a strong match
matchSchema.virtual('isStrongMatch').get(function() {
  return this.overallScore >= 75;
});

matchSchema.virtual('score').get(function() {
  return this.overallScore;
});

matchSchema.virtual('baseScore').get(function() {
  const hygieneBonus = (this.matchedSkills?.hygiene?.length || 0) * 5;
  return Math.max(0, this.overallScore - hygieneBonus);
});

matchSchema.set('toJSON', { virtuals: true });
matchSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Match', matchSchema);

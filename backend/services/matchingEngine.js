const Match = require('../models/Match');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');

const eventEmitter = require('./eventEmitter');

class MatchingEngine {
  constructor() {
    // Configurable weights (should sum to 100)
    this.weights = {
      skills: 50,
      experience: 30,
      location: 10,
      education: 10
    };

    // Score thresholds for match quality
    this.thresholds = {
      excellent: 85,
      good: 70,
      fair: 50,
      poor: 0
    };
  }

  /**
   * Calculate match score between a candidate and a job
   * @param {Object} candidate - Candidate object
   * @param {Object} job - Job object
   * @returns {Object} Match score breakdown
   */
  async calculateMatch(candidate, job) {
    const breakdown = {
      skillsScore: this.calculateSkillsScore(candidate, job),
      experienceScore: this.calculateExperienceScore(candidate, job),
      locationScore: this.calculateLocationScore(candidate, job),
      educationScore: this.calculateEducationScore(candidate, job)
    };

    // Calculate weighted overall score
    const overallScore = (
      (breakdown.skillsScore * this.weights.skills / 100) +
      (breakdown.experienceScore * this.weights.experience / 100) +
      (breakdown.locationScore * this.weights.location / 100) +
      (breakdown.educationScore * this.weights.education / 100)
    );

    // Determine matched and missing skills
    const { matchedSkills, missingSkills } = this.analyzeSkills(candidate, job);

    // Determine match quality
    const matchQuality = this.determineMatchQuality(overallScore);

    return {
      overallScore: Math.round(overallScore * 100) / 100, // Round to 2 decimals
      breakdown,
      matchedSkills,
      missingSkills,
      matchQuality
    };
  }

  /**
   * Calculate skills match score
   * @param {Object} candidate
   * @param {Object} job
   * @returns {Number} Score from 0-100
   */
  calculateSkillsScore(candidate, job) {
    if (!job.requirements?.skills || job.requirements.skills.length === 0) {
      return 100; // No skills required = perfect match
    }

    const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase().trim());
    const requiredSkills = job.requirements.skills.map(s => s.toLowerCase().trim());

    if (candidateSkills.length === 0) {
      return 0; // Candidate has no skills
    }

    // Calculate exact matches
    const matchedCount = requiredSkills.filter(skill => 
      candidateSkills.includes(skill)
    ).length;

    // Calculate partial matches (substring matching for related skills)
    const partialMatches = requiredSkills.filter(reqSkill => 
      !candidateSkills.includes(reqSkill) && 
      candidateSkills.some(candSkill => 
        candSkill.includes(reqSkill) || reqSkill.includes(candSkill)
      )
    ).length;

    const totalScore = (matchedCount * 100 + partialMatches * 50) / requiredSkills.length;
    
    return Math.min(100, totalScore);
  }

  /**
   * Calculate experience match score
   * @param {Object} candidate
   * @param {Object} job
   * @returns {Number} Score from 0-100
   */
  calculateExperienceScore(candidate, job) {
    const candidateYears = candidate.experience?.yearsOfExperience || 0;
    const requiredYears = job.requirements?.minExperience || 0;

    if (requiredYears === 0) {
      return 100; // No experience required
    }

    if (candidateYears === 0) {
      return 0; // No experience provided
    }

    if (candidateYears >= requiredYears) {
      // Candidate meets or exceeds requirement
      // Give bonus for more experience, but cap to avoid over-qualification penalty
      const bonus = Math.min(20, (candidateYears - requiredYears) * 2);
      return Math.min(100, 100 + bonus);
    } else {
      // Candidate has less experience than required
      // Linear scaling: 0 years = 0%, required years = 100%
      return (candidateYears / requiredYears) * 100;
    }
  }

  /**
   * Calculate location match score
   * @param {Object} candidate
   * @param {Object} job
   * @returns {Number} Score from 0-100
   */
  calculateLocationScore(candidate, job) {
    const candidateLocation = candidate.location?.toLowerCase().trim() || '';
    const jobLocation = job.location?.toLowerCase().trim() || '';

    if (!jobLocation) {
      return 100; // No location requirement
    }

    if (!candidateLocation) {
      return 50; // Unknown location = neutral score
    }

    // Check for remote work
    if (jobLocation.includes('remote') || candidateLocation.includes('remote')) {
      return 100;
    }

    // Extract city/state for comparison
    const candidateParts = candidateLocation.split(',').map(p => p.trim());
    const jobParts = jobLocation.split(',').map(p => p.trim());

    // Exact match
    if (candidateLocation === jobLocation) {
      return 100;
    }

    // Same city
    if (candidateParts[0] === jobParts[0]) {
      return 90;
    }

    // Same state/country (if multiple parts)
    if (candidateParts.length > 1 && jobParts.length > 1) {
      if (candidateParts[candidateParts.length - 1] === jobParts[jobParts.length - 1]) {
        return 70; // Same state/country, different city
      }
    }

    // No match
    return 30; // Willing to relocate consideration
  }

  /**
   * Calculate education match score
   * @param {Object} candidate
   * @param {Object} job
   * @returns {Number} Score from 0-100
   */
  calculateEducationScore(candidate, job) {
    const candidateEducation = candidate.education?.level?.toLowerCase() || '';
    const requiredEducation = job.requirements?.education?.toLowerCase() || '';

    if (!requiredEducation) {
      return 100; // No education requirement
    }

    if (!candidateEducation) {
      return 50; // No education info = neutral
    }

    // Education hierarchy
    const educationLevels = {
      'high school': 1,
      'associate': 2,
      'bachelor': 3,
      'master': 4,
      'phd': 5,
      'doctorate': 5
    };

    const candidateLevel = Object.keys(educationLevels).find(key => 
      candidateEducation.includes(key)
    ) || 'high school';

    const requiredLevel = Object.keys(educationLevels).find(key => 
      requiredEducation.includes(key)
    ) || 'high school';

    const candidateRank = educationLevels[candidateLevel];
    const requiredRank = educationLevels[requiredLevel];

    if (candidateRank >= requiredRank) {
      return 100; // Meets or exceeds requirement
    } else {
      // Partial credit for close matches
      const difference = requiredRank - candidateRank;
      return Math.max(0, 100 - (difference * 25));
    }
  }

  /**
   * Analyze which skills match and which are missing
   * @param {Object} candidate
   * @param {Object} job
   * @returns {Object} { matchedSkills, missingSkills }
   */
  analyzeSkills(candidate, job) {
    const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase().trim());
    const requiredSkills = (job.requirements?.skills || []).map(s => s.toLowerCase().trim());

    const matchedSkills = requiredSkills.filter(skill => 
      candidateSkills.includes(skill)
    );

    const missingSkills = requiredSkills.filter(skill => 
      !candidateSkills.includes(skill)
    );

    return {
      matchedSkills,
      missingSkills
    };
  }

  /**
   * Determine match quality based on overall score
   * @param {Number} score
   * @returns {String} Quality level
   */
  determineMatchQuality(score) {
    if (score >= this.thresholds.excellent) return 'excellent';
    if (score >= this.thresholds.good) return 'good';
    if (score >= this.thresholds.fair) return 'fair';
    return 'poor';
  }

  /**
   * Save or update match in database
   * @param {String} candidateId
   * @param {String} jobId
   * @param {String} applicationId (optional)
   * @returns {Object} Saved match document
   */
  async saveMatch(candidateId, jobId, applicationId = null) {
    // Fetch candidate and job
    const candidate = await Candidate.findById(candidateId);
    const job = await Job.findById(jobId);

    if (!candidate || !job) {
      throw new Error('Candidate or Job not found');
    }

    // Calculate match score
    const matchData = await this.calculateMatch(candidate, job);

    // Upsert match document
    const match = await Match.findOneAndUpdate(
      { candidate: candidateId, job: jobId },
      {
        candidate: candidateId,
        job: jobId,
        application: applicationId,
        overallScore: matchData.overallScore,
        breakdown: matchData.breakdown,
        matchedSkills: matchData.matchedSkills,
        missingSkills: matchData.missingSkills,
        matchQuality: matchData.matchQuality,
        calculatedAt: new Date()
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    ).populate('candidate job');

    // Emit event for high-quality matches
    if (match.overallScore >= this.thresholds.good) {
      eventEmitter.emit('match:high-quality', {
        matchId: match._id,
        candidateId: match.candidate._id,
        jobId: match.job._id,
        score: match.overallScore,
        quality: match.matchQuality
      });
    }

    return match;
  }

  /**
   * Find top matches for a job
   * @param {String} jobId
   * @param {Number} limit
   * @returns {Array} Top matching candidates
   */
  async findTopMatchesForJob(jobId, limit = 10) {
    return await Match.find({ job: jobId })
      .sort({ overallScore: -1 })
      .limit(limit)
      .populate('candidate');
  }

  /**
   * Find top job matches for a candidate
   * @param {String} candidateId
   * @param {Number} limit
   * @returns {Array} Top matching jobs
   */
  async findTopMatchesForCandidate(candidateId, limit = 10) {
    return await Match.find({ candidate: candidateId })
      .sort({ overallScore: -1 })
      .limit(limit)
      .populate('job');
  }

  /**
   * Recalculate all matches for a specific job
   * Useful when job requirements change
   * @param {String} jobId
   */
  async recalculateJobMatches(jobId) {
    // Get all applications for this job
    const Application = require('../models/Application');
    const applications = await Application.find({ job: jobId });

    const results = [];
    for (const application of applications) {
      try {
        const match = await this.saveMatch(
          application.candidate,
          application.job,
          application._id
        );
        results.push(match);
      } catch (error) {
        console.error(`Error recalculating match for application ${application._id}:`, error);
      }
    }

    return results;
  }

  /**
   * Recalculate all matches for a specific candidate
   * Useful when candidate profile is updated
   * @param {String} candidateId
   */
  async recalculateCandidateMatches(candidateId) {
    const Application = require('../models/Application');
    const applications = await Application.find({ candidate: candidateId });

    const results = [];
    for (const application of applications) {
      try {
        const match = await this.saveMatch(
          application.candidate,
          application.job,
          application._id
        );
        results.push(match);
      } catch (error) {
        console.error(`Error recalculating match for application ${application._id}:`, error);
      }
    }

    return results;
  }
}

module.exports = new MatchingEngine();
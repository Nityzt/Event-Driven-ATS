const Match = require('../models/Match');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Application = require('../models/Application');

const eventEmitter = require('./eventEmitter');

function normalizeSkill(skill) {
  return String(skill || '').toLowerCase().trim();
}

function canonicalSkill(skill) {
  return String(skill || '').trim();
}

function isSkillMatch(candidateSkill, targetSkill) {
  const candidate = normalizeSkill(candidateSkill);
  const target = normalizeSkill(targetSkill);
  if (!candidate || !target) return false;
  return candidate === target || candidate.includes(target) || target.includes(candidate);
}

function matchSkillGroup(candidateSkills, targetSkills) {
  const matched = [];
  const missing = [];

  for (const targetSkill of targetSkills || []) {
    const normalizedTarget = normalizeSkill(targetSkill);
    const hasMatch = candidateSkills.some(candidateSkill => isSkillMatch(candidateSkill, normalizedTarget));

    if (hasMatch) {
      matched.push(canonicalSkill(targetSkill));
    } else {
      missing.push(canonicalSkill(targetSkill));
    }
  }

  return { matched, missing };
}

function percent(part, whole) {
  if (!whole) return 100;
  return (part / whole) * 100;
}

class MatchingEngine {
  constructor() {
    // Configurable weights (should sum to 100)
    this.weights = {
      skills: 60,       // absorbed education's former 10% (no education data model yet)
      experience: 30,
      location: 10,
      education: 0      // neither Candidate nor Job stores education, so it always
                        // returned 100 and gave every candidate a free +10. Kept at 0
                        // until an education field exists, so it can't inflate scores.
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
    const skillAnalysis = this.analyzeSkills(candidate, job);

    const breakdown = {
      skillsScore: this.calculateSkillsScore(skillAnalysis, job, candidate),
      experienceScore: this.calculateExperienceScore(candidate, job),
      locationScore: this.calculateLocationScore(candidate, job),
      educationScore: this.calculateEducationScore(candidate, job)
    };

    // Calculate weighted base score, then apply hygiene boost (+5 each, capped at 100).
    const baseScore = (
      (breakdown.skillsScore * this.weights.skills / 100) +
      (breakdown.experienceScore * this.weights.experience / 100) +
      (breakdown.locationScore * this.weights.location / 100) +
      (breakdown.educationScore * this.weights.education / 100)
    );
    const hygieneBonus = skillAnalysis.matchedSkills.hygiene.length * 5;
    const overallScore = Math.min(100, baseScore + hygieneBonus);

    // Determine match quality
    const matchQuality = this.determineMatchQuality(overallScore);

    return {
      overallScore: Math.round(overallScore * 100) / 100, // Round to 2 decimals
      breakdown: {
        ...breakdown,
        hygieneBonus,
        baseScore: Math.round(baseScore * 100) / 100
      },
      matchedSkills: skillAnalysis.matchedSkills,
      missingSkills: skillAnalysis.missingSkills,
      matchQuality
    };
  }

  calculateTitleSimilarity(candidate, job) {
    const experience = candidate.experience;
    const lastTitle = (Array.isArray(experience) && experience.length > 0)
      ? (experience[experience.length - 1]?.title || '')
      : '';
    const candidateTitle = lastTitle || (candidate.seniority ? `${candidate.seniority} Developer` : '');
    if (!candidateTitle) return 50;

    const tokenize = str => str.toLowerCase().split(/[\s\-_/]+/).filter(t => t.length >= 3);
    const candidateTokens = new Set(tokenize(candidateTitle));
    const jobTokens = new Set(tokenize(job.title || ''));
    if (jobTokens.size === 0) return 50;

    const intersection = [...candidateTokens].filter(t => jobTokens.has(t));
    const union = new Set([...candidateTokens, ...jobTokens]);
    return Math.round((intersection.length / union.size) * 100);
  }

  /**
   * Calculate skills match score (blends required/operational skills with title similarity)
   * @param {Object} skillAnalysis - output of analyzeSkills()
   * @param {Object} job
   * @param {Object} candidate - needed for title similarity
   * @returns {Number} Score from 0-100
   */
  calculateSkillsScore(skillAnalysis, job, candidate) {
    const requiredSkills = job.requiredSkills || [];
    const operationalSkills = job.operationalSkills || [];
    const requiredScore = percent(skillAnalysis.matchedSkills.required.length, requiredSkills.length);
    const operationalScore = percent(skillAnalysis.matchedSkills.operational.length, operationalSkills.length);

    let rawSkillsScore;
    if (!requiredSkills.length && !operationalSkills.length) {
      rawSkillsScore = 100;
    } else if (requiredSkills.length > 0 && skillAnalysis.matchedSkills.required.length === 0) {
      rawSkillsScore = 0; // hard filter: no required skills matched
    } else if (!requiredSkills.length) {
      rawSkillsScore = operationalScore;
    } else if (!operationalSkills.length) {
      rawSkillsScore = requiredScore;
    } else {
      // Required skills carry most of the skills score, while operational skills refine rank.
      rawSkillsScore = Math.min(100, (requiredScore * 0.7) + (operationalScore * 0.3));
    }

    const titleSimilarity = candidate ? this.calculateTitleSimilarity(candidate, job) : 50;
    return Math.min(100, (rawSkillsScore * 0.85) + (titleSimilarity * 0.15));
  }

  /**
   * Calculate experience match score
   * @param {Object} candidate
   * @param {Object} job
   * @returns {Number} Score from 0-100
   */
  calculateExperienceScore(candidate, job) {
    const candidateYears = this.calculateCandidateYears(candidate);
    const requiredYears = this.requiredYearsForSeniority(job.seniority);

    if (requiredYears === 0) {
      return 100; // No experience required
    }

    if (candidateYears === 0) {
      return 0; // No experience provided
    }

    if (candidateYears >= requiredYears) {
      // Meets or exceeds the requirement.
      return 100;
    }
    // Less experience than required → linear scaling (0 years = 0%, required years = 100%).
    return (candidateYears / requiredYears) * 100;
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
    const requiredEducation = job.education?.toLowerCase() || '';

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
    const candidateSkills = (candidate.skills || []).map(normalizeSkill);
    const required = matchSkillGroup(candidateSkills, job.requiredSkills || []);
    const operational = matchSkillGroup(candidateSkills, job.operationalSkills || []);
    const hygiene = matchSkillGroup(candidateSkills, job.hygieneSkills || []);

    return {
      matchedSkills: {
        required: required.matched,
        operational: operational.matched,
        hygiene: hygiene.matched
      },
      missingSkills: {
        required: required.missing,
        operational: operational.missing
      }
    };
  }

  calculateCandidateYears(candidate) {
    if (!Array.isArray(candidate.experience) || candidate.experience.length === 0) {
      return 0;
    }

    return candidate.experience.reduce((total, exp) => {
      const start = exp.startDate ? new Date(exp.startDate) : null;
      const end = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : null);
      if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        return total;
      }
      return total + ((end - start) / (365.25 * 24 * 60 * 60 * 1000));
    }, 0);
  }

  requiredYearsForSeniority(seniority) {
    const mapping = {
      Entry: 0,
      Mid: 2,
      Senior: 5,
      Lead: 7,
      Executive: 10
    };
    return mapping[seniority] || 0;
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
    const applications = await Application.find({ jobId });

    const results = [];
    for (const application of applications) {
      try {
        const match = await this.saveMatch(
          application.candidateId,
          application.jobId,
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
    const applications = await Application.find({ candidateId });

    const results = [];
    for (const application of applications) {
      try {
        const match = await this.saveMatch(
          application.candidateId,
          application.jobId,
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

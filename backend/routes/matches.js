const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const matchingEngine = require('../services/matchingEngine');
const { authenticate } = require('../middleware/auth');

function serializeMatch(match) {
  if (!match) return match;
  const data = typeof match.toObject === 'function' ? match.toObject({ virtuals: true }) : match;
  return {
    ...data,
    score: data.overallScore,
    baseScore: data.breakdown?.baseScore ?? Math.max(0, data.overallScore - ((data.matchedSkills?.hygiene?.length || 0) * 5)),
    matchedSkills: {
      required: data.matchedSkills?.required || [],
      operational: data.matchedSkills?.operational || [],
      hygiene: data.matchedSkills?.hygiene || []
    },
    missingSkills: {
      required: data.missingSkills?.required || [],
      operational: data.missingSkills?.operational || []
    }
  };
}

function serializeMatches(matches) {
  return matches.map(serializeMatch);
}

// All match routes require authentication.
router.use(authenticate);

// GET /api/matches — list matches with optional filters.
router.get('/', async (req, res) => {
  try {
    const {
      jobId,
      candidateId,
      minScore = 0,
      quality,
      page = 1,
      limit = 20,
      sortBy = 'score',
      jobTitle
    } = req.query;

    const query = {};
    if (jobId) query.job = jobId;
    if (candidateId) query.candidate = candidateId;
    if (Number(minScore) > 0) query.overallScore = { $gte: Number(minScore) };
    if (quality) query.matchQuality = quality;

    if (jobTitle) {
      const Job = require('../models/Job');
      const matchingJobs = await Job.find({ $text: { $search: jobTitle } }, { _id: 1 }).lean();
      if (matchingJobs.length === 0) {
        return res.json({ success: true, data: { matches: [], total: 0, pagination: { page: 1, limit: Number(limit), total: 0, pages: 0 } } });
      }
      const jobIdSet = matchingJobs.map(j => String(j._id));
      query.job = query.job
        ? { $in: jobIdSet.filter(id => id === String(query.job)) }
        : { $in: jobIdSet };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = sortBy === 'recency' ? { calculatedAt: -1, createdAt: -1 } : { overallScore: -1 };

    const [matches, total] = await Promise.all([
      Match.find(query)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('candidate', 'name email phone skills location experience education')
        .populate('job', 'title requiredSkills operationalSkills hygieneSkills location seniority status')
        .populate('application', 'stage createdAt'),
      Match.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        total,
        matches: serializeMatches(matches),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/matches/score?candidateId=&jobId= — calculate without saving.
router.get('/score', async (req, res) => {
  try {
    const { candidateId, jobId } = req.query;
    if (!candidateId || !jobId) {
      return res.status(400).json({ success: false, error: 'candidateId and jobId are required' });
    }

    const Candidate = require('../models/Candidate');
    const Job = require('../models/Job');
    const [candidate, job] = await Promise.all([
      Candidate.findById(candidateId),
      Job.findById(jobId)
    ]);

    if (!candidate || !job) {
      return res.status(404).json({ success: false, error: 'Candidate or Job not found' });
    }

    const score = await matchingEngine.calculateMatch(candidate, job);
    res.json({ success: true, data: score });
  } catch (error) {
    console.error('Error calculating match score:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/matches/job/:jobId — matches for a job.
router.get('/job/:jobId', async (req, res) => {
  try {
    const { limit = 50, minScore = 0, quality, sortBy = 'score', search, location, seniority } = req.query;
    const Candidate = require('../models/Candidate');
    const query = { job: req.params.jobId };
    if (Number(minScore) > 0) query.overallScore = { $gte: Number(minScore) };
    if (quality) query.matchQuality = quality;

    // Candidate-level filters: resolve to ID sets then intersect
    const candidateIdSets = [];
    if (search) {
      const results = await Candidate.find({ $text: { $search: search } }, { _id: 1 }).lean();
      if (results.length === 0) {
        return res.json({ success: true, data: { total: 0, matches: [] } });
      }
      candidateIdSets.push(results.map(r => String(r._id)));
    }
    if (location) {
      const results = await Candidate.find({ location }, { _id: 1 }).lean();
      if (results.length === 0) {
        return res.json({ success: true, data: { total: 0, matches: [] } });
      }
      candidateIdSets.push(results.map(r => String(r._id)));
    }
    if (seniority) {
      const results = await Candidate.find({ seniority }, { _id: 1 }).lean();
      if (results.length === 0) {
        return res.json({ success: true, data: { total: 0, matches: [] } });
      }
      candidateIdSets.push(results.map(r => String(r._id)));
    }
    if (candidateIdSets.length > 0) {
      const intersection = candidateIdSets.reduce((acc, set) => acc.filter(id => set.includes(id)));
      if (intersection.length === 0) {
        return res.json({ success: true, data: { total: 0, matches: [] } });
      }
      query.candidate = { $in: intersection };
    }

    const sort = sortBy === 'recency' ? { calculatedAt: -1, createdAt: -1 } : { overallScore: -1 };
    const matches = await Match.find(query)
      .sort(sort)
      .limit(Number(limit))
      .populate('candidate', 'name email phone skills location seniority experience education')
      .populate('application', 'stage createdAt');

    res.json({
      success: true,
      data: {
        total: matches.length,
        matches: serializeMatches(matches)
      }
    });
  } catch (error) {
    console.error('Error fetching job matches:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/matches/candidate/:candidateId — matches for a candidate.
router.get('/candidate/:candidateId', async (req, res) => {
  try {
    const { limit = 50, minScore = 0, quality, sortBy = 'score' } = req.query;
    const query = { candidate: req.params.candidateId };
    if (Number(minScore) > 0) query.overallScore = { $gte: Number(minScore) };
    if (quality) query.matchQuality = quality;

    const sort = sortBy === 'recency' ? { calculatedAt: -1, createdAt: -1 } : { overallScore: -1 };
    const matches = await Match.find(query)
      .sort(sort)
      .limit(Number(limit))
      .populate('job', 'title requiredSkills operationalSkills hygieneSkills location seniority status')
      .populate('application', 'stage createdAt');

    res.json({
      success: true,
      data: {
        total: matches.length,
        matches: serializeMatches(matches)
      }
    });
  } catch (error) {
    console.error('Error fetching candidate matches:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/matches/calculate — save/recalculate one candidate-job match.
router.post('/calculate', async (req, res) => {
  try {
    const { candidateId, jobId, applicationId } = req.body;
    if (!candidateId || !jobId) {
      return res.status(400).json({ success: false, error: 'candidateId and jobId are required' });
    }

    const match = await matchingEngine.saveMatch(candidateId, jobId, applicationId);

    res.status(201).json({
      success: true,
      message: 'Match calculated successfully',
      data: serializeMatch(match)
    });
  } catch (error) {
    console.error('Error calculating match:', error);
    if (error.message === 'Candidate or Job not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/matches/recalculate/job/:jobId — recalculate matches for all applications on a job.
router.post('/recalculate/job/:jobId', async (req, res) => {
  try {
    const matches = await matchingEngine.recalculateJobMatches(req.params.jobId);

    res.json({
      success: true,
      message: 'Job matches recalculated successfully',
      data: {
        count: matches.length,
        matches: serializeMatches(matches)
      }
    });
  } catch (error) {
    console.error('Error recalculating job matches:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/matches/recalculate/candidate/:candidateId — recalculate matches for a candidate.
router.post('/recalculate/candidate/:candidateId', async (req, res) => {
  try {
    const matches = await matchingEngine.recalculateCandidateMatches(req.params.candidateId);

    res.json({
      success: true,
      message: 'Candidate matches recalculated successfully',
      data: {
        count: matches.length,
        matches: serializeMatches(matches)
      }
    });
  } catch (error) {
    console.error('Error recalculating candidate matches:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/matches/top-candidates/:jobId
router.get('/top-candidates/:jobId', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const matches = await matchingEngine.findTopMatchesForJob(req.params.jobId, Number(limit));

    res.json({
      success: true,
      data: {
        jobId: req.params.jobId,
        topMatches: serializeMatches(matches)
      }
    });
  } catch (error) {
    console.error('Error fetching top candidates:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/matches/top-jobs/:candidateId
router.get('/top-jobs/:candidateId', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const matches = await matchingEngine.findTopMatchesForCandidate(req.params.candidateId, Number(limit));

    res.json({
      success: true,
      data: {
        candidateId: req.params.candidateId,
        topMatches: serializeMatches(matches)
      }
    });
  } catch (error) {
    console.error('Error fetching top jobs:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/matches/stats/job/:jobId
router.get('/stats/job/:jobId', async (req, res) => {
  try {
    const matches = await Match.find({ job: req.params.jobId });
    const stats = {
      totalMatches: matches.length,
      averageScore: matches.length > 0
        ? matches.reduce((sum, match) => sum + match.overallScore, 0) / matches.length
        : 0,
      qualityDistribution: {
        excellent: matches.filter(match => match.matchQuality === 'excellent').length,
        good: matches.filter(match => match.matchQuality === 'good').length,
        fair: matches.filter(match => match.matchQuality === 'fair').length,
        poor: matches.filter(match => match.matchQuality === 'poor').length
      },
      topScore: matches.length > 0 ? Math.max(...matches.map(match => match.overallScore)) : 0
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching match stats:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/matches/:matchId — keep parameterized route after static routes.
router.get('/:matchId', async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate('candidate', 'name email phone skills location experience education')
      .populate('job', 'title requiredSkills operationalSkills hygieneSkills location seniority status')
      .populate('application', 'stage createdAt');

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    res.json({ success: true, data: serializeMatch(match) });
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/matches/:matchId
router.delete('/:matchId', async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.matchId);
    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    res.json({
      success: true,
      message: 'Match deleted successfully',
      data: { matchId: req.params.matchId }
    });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;

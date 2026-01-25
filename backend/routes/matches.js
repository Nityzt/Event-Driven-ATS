const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const matchingEngine = require('../services/matchingEngine');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/matches/:matchId
 * @desc    Get a specific match by ID
 * @access  Private
 */
router.get('/:matchId', authenticate, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate('candidate', 'name email skills location experience education')
      .populate('job', 'title company requirements location');

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/matches/job/:jobId
 * @desc    Get all matches for a specific job, sorted by score
 * @access  Private
 */
router.get('/job/:jobId', authenticate, async (req, res) => {
  try {
    const { limit = 50, minScore = 0, quality } = req.query;

    const query = { job: req.params.jobId };
    
    if (minScore) {
      query.overallScore = { $gte: parseFloat(minScore) };
    }

    if (quality) {
      query.matchQuality = quality;
    }

    const matches = await Match.find(query)
      .sort({ overallScore: -1 })
      .limit(parseInt(limit))
      .populate('candidate', 'name email skills location experience education')
      .populate('application', 'status appliedAt');

    res.json({
      total: matches.length,
      matches
    });
  } catch (error) {
    console.error('Error fetching job matches:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/matches/candidate/:candidateId
 * @desc    Get all matches for a specific candidate, sorted by score
 * @access  Private
 */
router.get('/candidate/:candidateId', authenticate, async (req, res) => {
  try {
    const { limit = 50, minScore = 0, quality } = req.query;

    const query = { candidate: req.params.candidateId };
    
    if (minScore) {
      query.overallScore = { $gte: parseFloat(minScore) };
    }

    if (quality) {
      query.matchQuality = quality;
    }

    const matches = await Match.find(query)
      .sort({ overallScore: -1 })
      .limit(parseInt(limit))
      .populate('job', 'title company requirements location salary')
      .populate('application', 'status appliedAt');

    res.json({
      total: matches.length,
      matches
    });
  } catch (error) {
    console.error('Error fetching candidate matches:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/matches/calculate
 * @desc    Manually calculate/recalculate a match between candidate and job
 * @access  Private
 */
router.post('/calculate', authenticate, async (req, res) => {
  try {
    const { candidateId, jobId, applicationId } = req.body;

    if (!candidateId || !jobId) {
      return res.status(400).json({ 
        error: 'candidateId and jobId are required' 
      });
    }

    const match = await matchingEngine.saveMatch(
      candidateId, 
      jobId, 
      applicationId
    );

    res.status(201).json({
      message: 'Match calculated successfully',
      match
    });
  } catch (error) {
    console.error('Error calculating match:', error);
    if (error.message === 'Candidate or Job not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/matches/recalculate/job/:jobId
 * @desc    Recalculate all matches for a job
 * @access  Private
 */
router.post('/recalculate/job/:jobId', authenticate, async (req, res) => {
  try {
    const matches = await matchingEngine.recalculateJobMatches(req.params.jobId);

    res.json({
      message: 'Job matches recalculated successfully',
      count: matches.length,
      matches
    });
  } catch (error) {
    console.error('Error recalculating job matches:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/matches/recalculate/candidate/:candidateId
 * @desc    Recalculate all matches for a candidate
 * @access  Private
 */
router.post('/recalculate/candidate/:candidateId', authenticate, async (req, res) => {
  try {
    const matches = await matchingEngine.recalculateCandidateMatches(req.params.candidateId);

    res.json({
      message: 'Candidate matches recalculated successfully',
      count: matches.length,
      matches
    });
  } catch (error) {
    console.error('Error recalculating candidate matches:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/matches/top-candidates/:jobId
 * @desc    Get top N matching candidates for a job
 * @access  Private
 */
router.get('/top-candidates/:jobId', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const matches = await matchingEngine.findTopMatchesForJob(
      req.params.jobId, 
      parseInt(limit)
    );

    res.json({
      jobId: req.params.jobId,
      topMatches: matches
    });
  } catch (error) {
    console.error('Error fetching top candidates:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/matches/top-jobs/:candidateId
 * @desc    Get top N matching jobs for a candidate
 * @access  Private
 */
router.get('/top-jobs/:candidateId', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const matches = await matchingEngine.findTopMatchesForCandidate(
      req.params.candidateId, 
      parseInt(limit)
    );

    res.json({
      candidateId: req.params.candidateId,
      topMatches: matches
    });
  } catch (error) {
    console.error('Error fetching top jobs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/matches/stats/job/:jobId
 * @desc    Get match statistics for a job
 * @access  Private
 */
router.get('/stats/job/:jobId', authenticate, async (req, res) => {
  try {
    const matches = await Match.find({ job: req.params.jobId });

    const stats = {
      totalMatches: matches.length,
      averageScore: matches.length > 0 
        ? matches.reduce((sum, m) => sum + m.overallScore, 0) / matches.length 
        : 0,
      qualityDistribution: {
        excellent: matches.filter(m => m.matchQuality === 'excellent').length,
        good: matches.filter(m => m.matchQuality === 'good').length,
        fair: matches.filter(m => m.matchQuality === 'fair').length,
        poor: matches.filter(m => m.matchQuality === 'poor').length
      },
      topScore: matches.length > 0 
        ? Math.max(...matches.map(m => m.overallScore)) 
        : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching match stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   DELETE /api/matches/:matchId
 * @desc    Delete a match record
 * @access  Private
 */
router.delete('/:matchId', authenticate, async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.matchId);

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json({ 
      message: 'Match deleted successfully',
      matchId: req.params.matchId 
    });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
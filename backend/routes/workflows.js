const express = require('express');
const router = express.Router();
const agenda = require('../services/workflowJobs');
const { authenticate } = require('../middleware/auth.js');

/**
 * @route   GET /api/workflows/jobs
 * @desc    Get all scheduled jobs
 * @access  Private
 */
router.get('/jobs', authenticate, async (req, res) => {
  try {
    const jobs = await agenda.jobs({});
    
    const jobList = jobs.map(job => ({
      id: job.attrs._id,
      name: job.attrs.name,
      data: job.attrs.data,
      nextRunAt: job.attrs.nextRunAt,
      lastRunAt: job.attrs.lastRunAt,
      lastFinishedAt: job.attrs.lastFinishedAt,
      failCount: job.attrs.failCount,
      failReason: job.attrs.failReason,
      lockedAt: job.attrs.lockedAt
    }));

    res.json({
      total: jobList.length,
      jobs: jobList
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/workflows/trigger/application-confirmation
 * @desc    Manually trigger application confirmation email
 * @access  Private
 */
router.post('/trigger/application-confirmation', authenticate, async (req, res) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ error: 'applicationId is required' });
    }

    await agenda.now('send-application-confirmation', { applicationId });

    res.json({
      message: 'Application confirmation email scheduled',
      applicationId
    });
  } catch (error) {
    console.error('Error triggering confirmation email:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/workflows/trigger/high-match-notification
 * @desc    Manually trigger high match notification
 * @access  Private
 */
router.post('/trigger/high-match-notification', authenticate, async (req, res) => {
  try {
    const { matchId } = req.body;

    if (!matchId) {
      return res.status(400).json({ error: 'matchId is required' });
    }

    await agenda.now('notify-recruiter-high-match', { matchId });

    res.json({
      message: 'High match notification scheduled',
      matchId
    });
  } catch (error) {
    console.error('Error triggering high match notification:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/workflows/trigger/schedule-interview
 * @desc    Manually schedule interview
 * @access  Private
 */
router.post('/trigger/schedule-interview', authenticate, async (req, res) => {
  try {
    const { candidateId, jobId, interviewType, scheduleTime } = req.body;

    if (!candidateId || !jobId) {
      return res.status(400).json({ error: 'candidateId and jobId are required' });
    }

    const when = scheduleTime || 'now';
    
    if (when === 'now') {
      await agenda.now('schedule-interview', {
        candidateId,
        jobId,
        interviewType: interviewType || 'phone-screen'
      });
    } else {
      await agenda.schedule(when, 'schedule-interview', {
        candidateId,
        jobId,
        interviewType: interviewType || 'phone-screen'
      });
    }

    res.json({
      message: `Interview scheduled for ${when}`,
      candidateId,
      jobId,
      interviewType
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/workflows/trigger/rejection-email
 * @desc    Manually send rejection email
 * @access  Private
 */
router.post('/trigger/rejection-email', authenticate, async (req, res) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ error: 'applicationId is required' });
    }

    await agenda.now('send-rejection-email', { applicationId });

    res.json({
      message: 'Rejection email scheduled',
      applicationId
    });
  } catch (error) {
    console.error('Error triggering rejection email:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/workflows/trigger/status-update
 * @desc    Manually send status update notification
 * @access  Private
 */
router.post('/trigger/status-update', authenticate, async (req, res) => {
  try {
    const { applicationId, oldStatus, newStatus } = req.body;

    if (!applicationId || !oldStatus || !newStatus) {
      return res.status(400).json({ 
        error: 'applicationId, oldStatus, and newStatus are required' 
      });
    }

    await agenda.now('send-status-update', {
      applicationId,
      oldStatus,
      newStatus
    });

    res.json({
      message: 'Status update notification scheduled',
      applicationId,
      oldStatus,
      newStatus
    });
  } catch (error) {
    console.error('Error triggering status update:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   DELETE /api/workflows/jobs/:jobId
 * @desc    Cancel a scheduled job
 * @access  Private
 */
router.delete('/jobs/:jobId', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;

    const numRemoved = await agenda.cancel({ _id: jobId });

    if (numRemoved === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      message: 'Job cancelled successfully',
      jobId
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/workflows/stats
 * @desc    Get workflow statistics
 * @access  Private
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const jobs = await agenda.jobs({});
    
    const stats = {
      total: jobs.length,
      running: jobs.filter(j => j.attrs.lockedAt && !j.attrs.lastFinishedAt).length,
      scheduled: jobs.filter(j => j.attrs.nextRunAt && !j.attrs.lockedAt).length,
      failed: jobs.filter(j => j.attrs.failCount > 0).length,
      completed: jobs.filter(j => j.attrs.lastFinishedAt).length,
      byType: {}
    };

    // Count by job type
    jobs.forEach(job => {
      const name = job.attrs.name;
      stats.byType[name] = (stats.byType[name] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching workflow stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
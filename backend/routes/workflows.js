const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const agenda = require('../config/agenda'); // direct import fixes the previous bug
const { authenticate, authorize } = require('../middleware/auth.js');
const wfCtrl = require('../controllers/workflowController');

const workflowValidation = [
  body('name').trim().notEmpty().withMessage('Workflow name is required'),
  body('triggers').isArray({ min: 1 }).withMessage('At least one trigger is required'),
  body('steps').isArray({ min: 1 }).withMessage('At least one step is required'),
  body('steps.*.type').isIn(['sendEmail', 'sendSMS', 'wait', 'webhook'])
    .withMessage('Invalid step type')
];

// ── CRUD ─────────────────────────────────────────────────────────────────────

router.get('/',    authenticate, wfCtrl.getWorkflows);
router.get('/:id', authenticate, wfCtrl.getWorkflow);

router.post('/',
  authenticate,
  authorize('Recruiter', 'Admin'),
  workflowValidation,
  wfCtrl.createWorkflow
);

router.put('/:id',
  authenticate,
  authorize('Recruiter', 'Admin'),
  workflowValidation,
  wfCtrl.updateWorkflow
);

router.delete('/:id',
  authenticate,
  authorize('Admin'),
  wfCtrl.deleteWorkflow
);

router.patch('/:id/toggle',
  authenticate,
  authorize('Recruiter', 'Admin'),
  wfCtrl.toggleWorkflow
);

// POST /api/workflows/preview — dry-run step resolution
router.post('/preview', authenticate, wfCtrl.previewRun);

// ── Agenda job management ─────────────────────────────────────────────────────

router.get('/jobs', authenticate, async (req, res) => {
  try {
    const jobs = await agenda.jobs({});
    const jobList = jobs.map(job => ({
      id:             job.attrs._id,
      name:           job.attrs.name,
      data:           job.attrs.data,
      nextRunAt:      job.attrs.nextRunAt,
      lastRunAt:      job.attrs.lastRunAt,
      lastFinishedAt: job.attrs.lastFinishedAt,
      failCount:      job.attrs.failCount,
      failReason:     job.attrs.failReason,
      lockedAt:       job.attrs.lockedAt
    }));
    res.json({ total: jobList.length, jobs: jobList });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stats', authenticate, async (req, res) => {
  try {
    const jobs = await agenda.jobs({});
    const stats = {
      total:     jobs.length,
      running:   jobs.filter(j => j.attrs.lockedAt && !j.attrs.lastFinishedAt).length,
      scheduled: jobs.filter(j => j.attrs.nextRunAt && !j.attrs.lockedAt).length,
      failed:    jobs.filter(j => j.attrs.failCount > 0).length,
      completed: jobs.filter(j => j.attrs.lastFinishedAt).length,
      byType:    {}
    };
    jobs.forEach(j => {
      stats.byType[j.attrs.name] = (stats.byType[j.attrs.name] || 0) + 1;
    });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/jobs/:jobId', authenticate, async (req, res) => {
  try {
    const n = await agenda.cancel({ _id: req.params.jobId });
    if (n === 0) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Job cancelled', jobId: req.params.jobId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Manual triggers ───────────────────────────────────────────────────────────

router.post('/trigger/application-confirmation', authenticate, async (req, res) => {
  try {
    const { applicationId } = req.body;
    if (!applicationId) return res.status(400).json({ error: 'applicationId required' });
    await agenda.now('send-application-confirmation', { applicationId });
    res.json({ message: 'Scheduled', applicationId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/trigger/high-match-notification', authenticate, async (req, res) => {
  try {
    const { matchId } = req.body;
    if (!matchId) return res.status(400).json({ error: 'matchId required' });
    await agenda.now('notify-recruiter-high-match', { matchId });
    res.json({ message: 'Scheduled', matchId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/trigger/schedule-interview', authenticate, async (req, res) => {
  try {
    const { candidateId, jobId, interviewType, scheduleTime } = req.body;
    if (!candidateId || !jobId) return res.status(400).json({ error: 'candidateId and jobId required' });
    const when = scheduleTime || 'now';
    if (when === 'now') {
      await agenda.now('schedule-interview', { candidateId, jobId, interviewType: interviewType || 'phone-screen' });
    } else {
      await agenda.schedule(when, 'schedule-interview', { candidateId, jobId, interviewType: interviewType || 'phone-screen' });
    }
    res.json({ message: `Interview scheduled for ${when}`, candidateId, jobId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/trigger/rejection-email', authenticate, async (req, res) => {
  try {
    const { applicationId } = req.body;
    if (!applicationId) return res.status(400).json({ error: 'applicationId required' });
    await agenda.now('send-rejection-email', { applicationId });
    res.json({ message: 'Scheduled', applicationId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/trigger/status-update', authenticate, async (req, res) => {
  try {
    const { applicationId, oldStatus, newStatus } = req.body;
    if (!applicationId || !oldStatus || !newStatus) {
      return res.status(400).json({ error: 'applicationId, oldStatus, and newStatus required' });
    }
    await agenda.now('send-status-update', { applicationId, oldStatus, newStatus });
    res.json({ message: 'Scheduled', applicationId, oldStatus, newStatus });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

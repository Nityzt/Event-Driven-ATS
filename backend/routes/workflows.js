const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const agenda = require('../config/agenda'); // direct import (config singleton)
const { authenticate, authorize } = require('../middleware/auth.js');
const wfCtrl = require('../controllers/workflowController');

const workflowValidation = [
  body('name').trim().notEmpty().withMessage('Workflow name is required'),
  body('triggers').isArray({ min: 1 }).withMessage('At least one trigger is required'),
  body('steps').isArray({ min: 1 }).withMessage('At least one step is required'),
  body('steps.*.type').isIn(['sendEmail', 'sendSMS', 'wait', 'webhook'])
    .withMessage('Invalid step type')
];

// ── Literal routes FIRST ───────────────────────────────────────────────────────
// These must be registered before '/:id' so Express doesn't treat "preview",
// "jobs" or "stats" as a workflow id (which previously 500'd on an ObjectId cast).

router.get('/', authenticate, wfCtrl.getWorkflows);

// POST /api/workflows/preview — dry-run step resolution
router.post('/preview', authenticate, wfCtrl.previewRun);

// Agenda job introspection (ops/debug)
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

// ── CRUD ───────────────────────────────────────────────────────────────────────

router.post('/',
  authenticate,
  authorize('Recruiter', 'Admin'),
  workflowValidation,
  wfCtrl.createWorkflow
);

router.get('/:id', authenticate, wfCtrl.getWorkflow);

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

module.exports = router;

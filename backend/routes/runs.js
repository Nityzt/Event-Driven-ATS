const express = require('express');
const router = express.Router();
const Run = require('../models/Run');
const Workflow = require('../models/Workflow');
const { authenticate, authorize } = require('../middleware/auth');
const { executeRun } = require('../services/workflowEngine');
const agenda = require('../config/agenda');

// GET /api/runs — list runs (filter by workflowId, applicationId, state)
router.get('/', authenticate, async (req, res) => {
  try {
    const { workflowId, applicationId, state, page = 1, limit = 20 } = req.query;
    const query = {};
    if (workflowId)   query.workflowId   = workflowId;
    if (applicationId) query.applicationId = applicationId;
    if (state)        query.state        = state;

    const skip = (Number(page) - 1) * Number(limit);
    const [runs, total] = await Promise.all([
      Run.find(query)
        .populate('workflowId', 'name')
        .populate('applicationId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Run.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: { runs, pagination: { page: Number(page), limit: Number(limit), total } }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/runs/:id — single run with full logs
router.get('/:id', authenticate, async (req, res) => {
  try {
    const run = await Run.findById(req.params.id)
      .populate('workflowId', 'name steps triggers')
      .populate('applicationId');

    if (!run) return res.status(404).json({ success: false, error: 'Run not found' });

    res.json({ success: true, data: run });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/runs/:id/pause
router.post('/:id/pause', authenticate, authorize('Recruiter', 'Admin'), async (req, res) => {
  try {
    const run = await Run.findById(req.params.id);
    if (!run) return res.status(404).json({ success: false, error: 'Run not found' });
    if (run.state !== 'running' && run.state !== 'queued') {
      return res.status(400).json({ success: false, error: `Cannot pause a run in state "${run.state}"` });
    }

    // Cancel any pending Agenda resume job for this run
    await agenda.cancel({ 'data.runId': req.params.id });

    run.state = 'paused';
    await run.save();

    res.json({ success: true, data: { state: run.state } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/runs/:id/resume
router.post('/:id/resume', authenticate, authorize('Recruiter', 'Admin'), async (req, res) => {
  try {
    const run = await Run.findById(req.params.id).populate('workflowId');
    if (!run) return res.status(404).json({ success: false, error: 'Run not found' });
    if (run.state !== 'paused') {
      return res.status(400).json({ success: false, error: `Cannot resume a run in state "${run.state}"` });
    }

    const workflow = run.workflowId; // populated
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Associated workflow not found' });
    }

    run.state = 'queued';
    await run.save();

    // Resume execution with empty context (templates will fall back to {{var}} when context missing)
    const context = req.body.context || {};
    executeRun(run._id.toString(), workflow, context).catch(err =>
      console.error('[Runs] Error resuming run:', err)
    );

    res.json({ success: true, message: 'Run resumed', data: { state: 'running' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/runs/:id/cancel
router.post('/:id/cancel', authenticate, authorize('Recruiter', 'Admin'), async (req, res) => {
  try {
    const run = await Run.findById(req.params.id);
    if (!run) return res.status(404).json({ success: false, error: 'Run not found' });
    if (['completed', 'failed', 'cancelled'].includes(run.state)) {
      return res.status(400).json({ success: false, error: `Cannot cancel a run in state "${run.state}"` });
    }

    await agenda.cancel({ 'data.runId': req.params.id });

    run.state = 'cancelled';
    await run.save();

    res.json({ success: true, data: { state: run.state } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

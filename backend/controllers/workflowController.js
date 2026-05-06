const Workflow = require('../models/Workflow');
const { previewWorkflow } = require('../services/workflowEngine');
const { validationResult } = require('express-validator');

// GET /api/workflows
exports.getWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: workflows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/workflows/:id
exports.getWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    res.json({ success: true, data: workflow });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/workflows
exports.createWorkflow = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, description, triggers, steps, enabled } = req.body;

    const workflow = await Workflow.create({
      name,
      description,
      triggers,
      steps,
      enabled: enabled !== undefined ? enabled : true,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: workflow });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/workflows/:id
exports.updateWorkflow = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    const { name, description, triggers, steps, enabled } = req.body;
    if (name       !== undefined) workflow.name        = name;
    if (description!== undefined) workflow.description = description;
    if (triggers   !== undefined) workflow.triggers    = triggers;
    if (steps      !== undefined) workflow.steps       = steps;
    if (enabled    !== undefined) workflow.enabled     = enabled;

    await workflow.save();
    res.json({ success: true, data: workflow });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/workflows/:id
exports.deleteWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    await workflow.deleteOne();
    res.json({ success: true, message: 'Workflow deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PATCH /api/workflows/:id/toggle
exports.toggleWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    workflow.enabled = !workflow.enabled;
    await workflow.save();
    res.json({ success: true, data: { enabled: workflow.enabled } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/workflows/preview
exports.previewRun = async (req, res) => {
  try {
    const { triggers, steps, name } = req.body;
    if (!steps || !steps.length) {
      return res.status(400).json({ success: false, error: 'steps array required' });
    }

    const resolvedSteps = previewWorkflow({ steps, triggers: triggers || [], name: name || 'Preview' });
    res.json({ success: true, data: { resolvedSteps } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/audit-logs
router.get('/', authenticate, authorize('Admin', 'Recruiter'), async (req, res) => {
  try {
    const { action, resource, page = 1, limit = 20 } = req.query;
    const query = {};
    if (action)   query.action   = action;
    if (resource) query.resource = resource;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: { logs, total, page: Number(page), limit: Number(limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/audit-logs/:id
router.get('/:id', authenticate, authorize('Admin', 'Recruiter'), async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate('user', 'name email');
    if (!log) return res.status(404).json({ success: false, error: 'Log not found' });
    res.json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

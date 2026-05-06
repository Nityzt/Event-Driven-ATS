const express = require('express');
const router = express.Router();
const {
  getApplications,
  getApplication,
  getApplicationTimeline,
  createApplication,
  updateApplication,
  deleteApplication
} = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middleware/auth');
const eventEmitter = require('../services/eventEmitter');

// All routes require authentication
router.use(authenticate);

// GET all applications
router.get('/', getApplications);

// GET single application
router.get('/:id', getApplication);

// GET application timeline
router.get('/:id/timeline', getApplicationTimeline);

// GET SSE stream for real-time run logs on an application
router.get('/:id/timeline/stream', authenticate, (req, res) => {
  const applicationId = req.params.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send a heartbeat every 20s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 20000);

  const onLog = (data) => {
    res.write(`data: ${JSON.stringify({ type: 'run_log', ...data })}\n\n`);
  };

  const onCompleted = (data) => {
    res.write(`data: ${JSON.stringify({ type: 'run_completed', ...data })}\n\n`);
  };

  eventEmitter.on(`run:log:${applicationId}`,       onLog);
  eventEmitter.on(`run:completed:${applicationId}`, onCompleted);

  req.on('close', () => {
    clearInterval(heartbeat);
    eventEmitter.off(`run:log:${applicationId}`,       onLog);
    eventEmitter.off(`run:completed:${applicationId}`, onCompleted);
  });
});

// POST create application - Recruiter or Admin
router.post(
  '/', 
  authorize('Recruiter', 'Admin'),
  createApplication
);

// PATCH update application - Recruiter or Admin
router.patch(
  '/:id',
  authorize('Recruiter', 'Admin'),
  updateApplication
);

// DELETE application - Admin only
router.delete(
  '/:id',
  authorize('Admin'),
  deleteApplication
);

module.exports = router;
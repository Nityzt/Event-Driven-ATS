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

// All routes require authentication
router.use(authenticate);

// GET all applications
router.get('/', getApplications);

// GET single application
router.get('/:id', getApplication);

// GET application timeline
router.get('/:id/timeline', getApplicationTimeline);

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
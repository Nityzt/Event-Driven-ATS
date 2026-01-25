const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob
} = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// GET all jobs
router.get('/', getJobs);

// GET single job
router.get('/:id', getJob);

// POST create job - Recruiter or Admin
router.post(
  '/', 
  authorize('Recruiter', 'Admin'),
  createJob
);

// PATCH update job - Recruiter or Admin
router.patch(
  '/:id',
  authorize('Recruiter', 'Admin'),
  updateJob
);

// DELETE job - Admin only
router.delete(
  '/:id',
  authorize('Admin'),
  deleteJob
);

module.exports = router;
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob
} = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/auth');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

const jobCreateRules = [
  body('title').trim().notEmpty().withMessage('title is required'),
  body('description').trim().notEmpty().withMessage('description is required'),
  body('location').trim().notEmpty().withMessage('location is required'),
  body('seniority').optional().isIn(['Entry', 'Mid', 'Senior', 'Lead', 'Executive']).withMessage('invalid seniority')
];

const jobUpdateRules = [
  body('title').optional().trim().notEmpty().withMessage('title cannot be blank'),
  body('description').optional().trim().notEmpty().withMessage('description cannot be blank'),
  body('location').optional().trim().notEmpty().withMessage('location cannot be blank'),
  body('seniority').optional().isIn(['Entry', 'Mid', 'Senior', 'Lead', 'Executive']).withMessage('invalid seniority')
];

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
  jobCreateRules,
  validate,
  createJob
);

// PATCH update job - Recruiter or Admin
router.patch(
  '/:id',
  authorize('Recruiter', 'Admin'),
  jobUpdateRules,
  validate,
  updateJob
);

// DELETE job - Admin only
router.delete(
  '/:id',
  authorize('Admin'),
  deleteJob
);

module.exports = router;
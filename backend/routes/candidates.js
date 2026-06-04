const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {
  getCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate
} = require('../controllers/candidateController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../config/multer');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

const candidateCreateRules = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('email').trim().isEmail().withMessage('valid email is required')
];

const candidateUpdateRules = [
  body('name').optional().trim().notEmpty().withMessage('name cannot be blank'),
  body('email').optional().trim().isEmail().withMessage('valid email is required')
];

// All routes require authentication
router.use(authenticate);

// GET all candidates
router.get('/', getCandidates);

// GET single candidate
router.get('/:id', getCandidate);

// POST create candidate (with file upload) - Recruiter or Admin
router.post(
  '/',
  authorize('Recruiter', 'Admin'),
  upload.single('resume'),
  candidateCreateRules,
  validate,
  createCandidate
);

// PATCH update candidate - Recruiter or Admin
router.patch(
  '/:id',
  authorize('Recruiter', 'Admin'),
  upload.single('resume'),
  candidateUpdateRules,
  validate,
  updateCandidate
);

// DELETE candidate - Admin only
router.delete(
  '/:id',
  authorize('Admin'),
  deleteCandidate
);

module.exports = router;
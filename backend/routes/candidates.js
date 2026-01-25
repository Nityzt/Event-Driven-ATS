const express = require('express');
const router = express.Router();
const {
  getCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate
} = require('../controllers/candidateController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../config/multer');

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
  upload.single('resume'), // 'resume' is the field name
  createCandidate
);

// PATCH update candidate - Recruiter or Admin
router.patch(
  '/:id',
  authorize('Recruiter', 'Admin'),
  upload.single('resume'),
  updateCandidate
);

// DELETE candidate - Admin only
router.delete(
  '/:id',
  authorize('Admin'),
  deleteCandidate
);

module.exports = router;
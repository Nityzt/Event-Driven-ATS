const Candidate = require('../models/Candidate');
const AuditLog = require('../models/AuditLog');
const { extractTextFromPDF, extractSkills } = require('../services/pdfService');
const eventEmitter = require('../services/eventEmitter');

function parseArrayField(value, fallback = []) {
  if (value === undefined || value === null || value === '') return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return JSON.parse(value);
  return fallback;
}

// @desc    Get all candidates
// @route   GET /api/candidates
// @access  Private
exports.getCandidates = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10, cursor } = req.query;
    
    const query = {};
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    const countQuery = { ...query };
    const limitVal = parseInt(limit);
    let candidates;
    let hasMore = false;
    let nextCursor = null;
    
    if (cursor) {
      const cursorDoc = await Candidate.findById(cursor);
      if (cursorDoc) {
        query.$or = [
          { createdAt: { $lt: cursorDoc.createdAt } },
          {
            createdAt: cursorDoc.createdAt,
            _id: { $lt: cursorDoc._id }
          }
        ];
      }
      
      candidates = await Candidate.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limitVal + 1);
        
      if (candidates.length > limitVal) {
        hasMore = true;
        nextCursor = candidates[limitVal - 1]._id.toString();
        candidates.pop();
      }
    } else {
      const skip = (parseInt(page) - 1) * limitVal;
      
      candidates = await Candidate.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limitVal + 1);
        
      if (candidates.length > limitVal) {
        hasMore = true;
        nextCursor = candidates[limitVal - 1]._id.toString();
        candidates.pop();
      }
    }
    
    const total = await Candidate.countDocuments(countQuery);
    
    res.json({
      success: true,
      data: {
        candidates,
        pagination: {
          page: parseInt(page),
          limit: limitVal,
          total,
          pages: Math.ceil(total / limitVal),
          nextCursor,
          hasMore
        }
      }
    });
    
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching candidates'
    });
  }
};

// @desc    Get single candidate
// @route   GET /api/candidates/:id
// @access  Private
exports.getCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }
    
    res.json({
      success: true,
      data: candidate
    });

  } catch (error) {
    console.error('Get candidate error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching candidate'
    });
  }
};

// @desc    Create new candidate
// @route   POST /api/candidates
// @access  Private (Recruiter, Admin)
exports.createCandidate = async (req, res) => {
  try {
    const { name, email, phone, skills, experience, status, location, seniority } = req.body;

    // Handle resume file if uploaded
    let resumeData = {};
    let extractedSkills = [];
    
    if (req.file) {
      // Virus scan stub
      const { virusCheck } = require('../services/pdfService');
      const isSafe = await virusCheck(req.file.path);
      if (!isSafe) {
        return res.status(400).json({
          success: false,
          error: 'Resume failed security scan (malware detected).'
        });
      }

      // Extract text from PDF
      const extractedText = await extractTextFromPDF(req.file.path);
      
      // Extract skills from text
      extractedSkills = extractSkills(extractedText);
      
      resumeData = {
        filename: req.file.filename,
        path: req.file.path,
        uploadedAt: new Date(),
        extractedText
      };
    }
    
    // Combine manual skills with extracted skills
    const manualSkills = parseArrayField(skills);
    const allSkills = [...new Set([...manualSkills, ...extractedSkills])];
    
    // Create candidate
    const candidate = await Candidate.create({
      name,
      email,
      phone,
      skills: allSkills,
      experience: parseArrayField(experience),
      status: status || 'Active',
      resume: resumeData,
      location,
      seniority,
      timeline: [{
        event: 'Created',
        description: 'Candidate profile created'
      }]
    });
    
    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'CREATE',
      resource: 'Candidate',
      resourceId: candidate._id,
      changes: { after: candidate },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      correlationId: req.correlationId
    });
    
    res.status(201).json({
      success: true,
      data: candidate
    });
    
  } catch (error) {
    console.error('Create candidate error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error creating candidate'
    });
  }
};

// @desc    Update candidate
// @route   PATCH /api/candidates/:id
// @access  Private (Recruiter, Admin)
exports.updateCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }
    
    // Store old state for audit
    const oldState = candidate.toObject();
    
    // Update fields
    const { name, email, phone, skills, experience, status, location, seniority } = req.body;

    if (name) candidate.name = name;
    if (email) candidate.email = email;
    if (phone) candidate.phone = phone;
    if (skills !== undefined) candidate.skills = parseArrayField(skills);
    if (experience !== undefined) candidate.experience = parseArrayField(experience);
    if (status) candidate.status = status;
    if (location !== undefined) candidate.location = location;
    if (seniority !== undefined) candidate.seniority = seniority;
    
    // Handle new resume upload
    if (req.file) {
      const { virusCheck } = require('../services/pdfService');
      const isSafe = await virusCheck(req.file.path);
      if (!isSafe) {
        return res.status(400).json({
          success: false,
          error: 'Resume failed security scan (malware detected).'
        });
      }

      const extractedText = await extractTextFromPDF(req.file.path);
      const extractedSkills = extractSkills(extractedText);
      
      candidate.resume = {
        filename: req.file.filename,
        path: req.file.path,
        uploadedAt: new Date(),
        extractedText
      };
      
      // Add extracted skills
      candidate.skills = [...new Set([...candidate.skills, ...extractedSkills])];
    }
    
    // Add timeline entry
    candidate.timeline.push({
      event: 'Updated',
      description: 'Candidate profile updated'
    });
    
    await candidate.save();

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE',
      resource: 'Candidate',
      resourceId: candidate._id,
      changes: {
        before: oldState,
        after: candidate.toObject()
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      correlationId: req.correlationId
    });

    res.json({
      success: true,
      data: candidate
    });

    eventEmitter.emit('candidate:updated', { candidateId: candidate._id });

  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error updating candidate'
    });
  }
};

// @desc    Delete candidate
// @route   DELETE /api/candidates/:id
// @access  Private (Admin only)
exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }
    
    // Store for audit
    const deletedData = candidate.toObject();
    
    await candidate.deleteOne();
    
    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'DELETE',
      resource: 'Candidate',
      resourceId: candidate._id,
      changes: { before: deletedData },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      correlationId: req.correlationId
    });
    
    res.json({
      success: true,
      message: 'Candidate deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error deleting candidate'
    });
  }
};

const Candidate = require('../models/Candidate');
const AuditLog = require('../models/AuditLog');
const { extractTextFromPDF, extractSkills } = require('../services/pdfService');

// @desc    Get all candidates
// @route   GET /api/candidates
// @access  Private
exports.getCandidates = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const candidates = await Candidate.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Candidate.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        candidates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
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
    const { name, email, phone, skills, experience, status } = req.body;
    
    // Handle resume file if uploaded
    let resumeData = {};
    let extractedSkills = [];
    
    if (req.file) {
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
    const allSkills = skills 
      ? [...new Set([...JSON.parse(skills), ...extractedSkills])]
      : extractedSkills;
    
    // Create candidate
    const candidate = await Candidate.create({
      name,
      email,
      phone,
      skills: allSkills,
      experience: experience ? JSON.parse(experience) : [],
      status: status || 'Active',
      resume: resumeData,
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
    const { name, email, phone, skills, experience, status } = req.body;
    
    if (name) candidate.name = name;
    if (email) candidate.email = email;
    if (phone) candidate.phone = phone;
    if (skills) candidate.skills = JSON.parse(skills);
    if (experience) candidate.experience = JSON.parse(experience);
    if (status) candidate.status = status;
    
    // Handle new resume upload
    if (req.file) {
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
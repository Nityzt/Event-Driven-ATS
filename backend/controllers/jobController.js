const Job = require('../models/Job');
const AuditLog = require('../models/AuditLog');

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Private
exports.getJobs = async (req, res) => {
  try {
    const { search, status, location, seniority, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by location
    if (location) {
      query.location = new RegExp(location, 'i'); // Case-insensitive
    }
    
    // Filter by seniority
    if (seniority) {
      query.seniority = seniority;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const jobs = await Job.find(query)
      .populate('postedBy', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Job.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching jobs'
    });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Private
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name email role');
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    res.json({
      success: true,
      data: job
    });
    
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching job'
    });
  }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Recruiter, Admin)
exports.createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      requiredSkills,
      operationalSkills,
      hygieneSkills,
      location,
      seniority,
      status
    } = req.body;
    
    // Create job
    const job = await Job.create({
      title,
      description,
      requiredSkills: requiredSkills || [],
      operationalSkills: operationalSkills || [],
      hygieneSkills: hygieneSkills || [],
      location,
      seniority,
      status: status || 'Open',
      postedBy: req.user._id
    });
    
    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'CREATE',
      resource: 'Job',
      resourceId: job._id,
      changes: { after: job },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      correlationId: req.correlationId
    });
    
    res.status(201).json({
      success: true,
      data: job
    });
    
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error creating job'
    });
  }
};

// @desc    Update job
// @route   PATCH /api/jobs/:id
// @access  Private (Recruiter, Admin)
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    // Store old state for audit
    const oldState = job.toObject();
    
    // Update fields
    const {
      title,
      description,
      requiredSkills,
      operationalSkills,
      hygieneSkills,
      location,
      seniority,
      status
    } = req.body;
    
    if (title !== undefined) job.title = title;
    if (description !== undefined) job.description = description;
    if (requiredSkills !== undefined) job.requiredSkills = requiredSkills;
    if (operationalSkills !== undefined) job.operationalSkills = operationalSkills;
    if (hygieneSkills !== undefined) job.hygieneSkills = hygieneSkills;
    if (location !== undefined) job.location = location;
    if (seniority !== undefined) job.seniority = seniority;
    if (status !== undefined) job.status = status;
    
    await job.save();
    
    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE',
      resource: 'Job',
      resourceId: job._id,
      changes: { 
        before: oldState, 
        after: job.toObject() 
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      correlationId: req.correlationId
    });
    
    res.json({
      success: true,
      data: job
    });
    
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error updating job'
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Admin only)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    // Store for audit
    const deletedData = job.toObject();
    
    await job.deleteOne();
    
    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'DELETE',
      resource: 'Job',
      resourceId: job._id,
      changes: { before: deletedData },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      correlationId: req.correlationId
    });
    
    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error deleting job'
    });
  }
};
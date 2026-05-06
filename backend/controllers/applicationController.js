const Application = require('../models/Application');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const AuditLog = require('../models/AuditLog');
const workflowEngine = require('../services/workflowEngine');

// @desc    Get all applications
// @route   GET /api/applications
// @access  Private
exports.getApplications = async (req, res) => {
  try {
    const { jobId, candidateId, stage, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    // Filter by job
    if (jobId) {
      query.jobId = jobId;
    }
    
    // Filter by candidate
    if (candidateId) {
      query.candidateId = candidateId;
    }
    
    // Filter by stage
    if (stage) {
      query.stage = stage;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const applications = await Application.find(query)
      .populate('candidateId', 'name email phone skills')
      .populate('jobId', 'title location seniority status')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Application.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching applications'
    });
  }
};

// @desc    Get single application with timeline
// @route   GET /api/applications/:id
// @access  Private
exports.getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('candidateId')
      .populate('jobId')
      .populate('timeline.changedBy', 'name email');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }
    
    res.json({
      success: true,
      data: application
    });
    
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching application'
    });
  }
};

// @desc    Get application timeline
// @route   GET /api/applications/:id/timeline
// @access  Private
exports.getApplicationTimeline = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .select('timeline candidateId jobId stage')
      .populate('candidateId', 'name')
      .populate('jobId', 'title')
      .populate('timeline.changedBy', 'name email');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }
    
    // Also get workflow runs for this application
    const Run = require('../models/Run');
    const runs = await Run.find({ applicationId: application._id })
      .populate('workflowId', 'name')
      .select('workflowId state logs createdAt updatedAt')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        application: {
          id: application._id,
          candidate: application.candidateId,
          job: application.jobId,
          currentStage: application.stage
        },
        timeline: application.timeline,
        workflowRuns: runs
      }
    });
    
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching timeline'
    });
  }
};

// @desc    Create new application (triggers workflows!)
// @route   POST /api/applications
// @access  Private (Recruiter, Admin)
exports.createApplication = async (req, res) => {
  try {
    const { candidateId, jobId, stage, notes } = req.body;
    
    // Verify candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }
    
    // Verify job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    // Check if application already exists
    const existingApplication = await Application.findOne({
      candidateId,
      jobId
    });
    
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: 'Application already exists for this candidate and job'
      });
    }
    
    // Create application
    const application = await Application.create({
      candidateId,
      jobId,
      stage: stage || 'Applied',
      notes,
      timeline: [{
        stage: stage || 'Applied',
        changedBy: req.user._id
      }]
    });
    
    // Add to candidate timeline
    candidate.timeline.push({
      event: 'Application Submitted',
      description: `Applied to ${job.title}`
    });
    await candidate.save();
    
    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'CREATE',
      resource: 'Application',
      resourceId: application._id,
      changes: { after: application },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      correlationId: req.correlationId
    });
    
    // Populate before sending response
    await application.populate('candidateId', 'name email');
    await application.populate('jobId', 'title location');
    
    console.log(`✅ Application created: ${application._id}`);

    res.status(201).json({
      success: true,
      data: application
    });

    // Trigger Application.created workflows asynchronously after response
    workflowEngine.trigger('Application.created', {
      applicationId: application._id,
      candidateId:   candidateId,
      jobId:         jobId,
      candidate:     { name: candidate.name, email: candidate.email, phone: candidate.phone, skills: candidate.skills },
      job:           { title: job.title, location: job.location, company: job.company || '' },
      application:   { stage: application.stage, appliedAt: application.createdAt }
    }).catch(err => console.error('[AppController] Workflow trigger error:', err));
    
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error creating application'
    });
  }
};

// @desc    Update application stage
// @route   PATCH /api/applications/:id
// @access  Private (Recruiter, Admin)
exports.updateApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }
    
    const { stage, notes } = req.body;
    
    // Store old state
    const oldStage = application.stage;
    
    // Update stage
    if (stage && stage !== oldStage) {
      application.stage = stage;
      
      // Add to timeline
      application.timeline.push({
        stage,
        changedBy: req.user._id
      });
      
      console.log(`📊 Stage changed from "${oldStage}" to "${stage}"`);
      console.log(`🎯 This will trigger "Stage.changed" workflows`);
    }
    
    // Update notes
    if (notes !== undefined) {
      application.notes = notes;
    }
    
    await application.save();
    
    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE',
      resource: 'Application',
      resourceId: application._id,
      changes: { 
        before: { stage: oldStage }, 
        after: { stage: application.stage } 
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      correlationId: req.correlationId
    });
    
    await application.populate('candidateId', 'name email');
    await application.populate('jobId', 'title location');

    res.json({
      success: true,
      data: application
    });

    // Trigger Stage.changed workflows if stage actually changed
    if (stage && stage !== oldStage) {
      const candidate = await Candidate.findById(application.candidateId);
      const job = await Job.findById(application.jobId);
      workflowEngine.trigger('Stage.changed', {
        applicationId: application._id,
        candidateId:   application.candidateId,
        jobId:         application.jobId,
        oldStage,
        newStage:      stage,
        candidate:     candidate ? { name: candidate.name, email: candidate.email, phone: candidate.phone } : {},
        job:           job       ? { title: job.title, location: job.location, company: job.company || '' } : {},
        application:   { stage, appliedAt: application.createdAt }
      }).catch(err => console.error('[AppController] Workflow trigger error:', err));
    }
    
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error updating application'
    });
  }
};

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private (Admin only)
exports.deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }
    
    const deletedData = application.toObject();
    
    await application.deleteOne();
    
    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'DELETE',
      resource: 'Application',
      resourceId: application._id,
      changes: { before: deletedData },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      correlationId: req.correlationId
    });
    
    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error deleting application'
    });
  }
};
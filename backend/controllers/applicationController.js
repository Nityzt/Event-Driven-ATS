const Application = require('../models/Application');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Run = require('../models/Run');
const AuditLog = require('../models/AuditLog');
const workflowEngine = require('../services/workflowEngine');
const eventEmitter = require('../services/eventEmitter');

function logAudit({ user, action, resource, resourceId, changes, req }) {
  return AuditLog.create({
    user,
    action,
    resource,
    resourceId,
    changes,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    correlationId: req.correlationId
  });
}

exports.getApplications = async (req, res) => {
  try {
    const { jobId, candidateId, stage, page = 1, limit = 10 } = req.query;

    const query = {
      ...(jobId       && { jobId }),
      ...(candidateId && { candidateId }),
      ...(stage       && { stage }),
    };

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
    
    await logAudit({ user: req.user._id, action: 'CREATE', resource: 'Application', resourceId: application._id, changes: { after: application }, req });

    await application.populate('candidateId', 'name email');
    await application.populate('jobId', 'title location');

    res.status(201).json({
      success: true,
      data: application
    });

    // Trigger Application.created workflows asynchronously after response
    eventEmitter.emit('application:created', {
      applicationId: application._id,
      candidateId,
      jobId
    });

    workflowEngine.trigger('Application.created', {
      correlationId: req.correlationId,
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
    const oldStage = application.stage;

    if (stage && stage !== oldStage) {
      application.stage = stage;
      application.timeline.push({ stage, changedBy: req.user._id });
    }

    if (notes !== undefined) application.notes = notes;
    
    await application.save();
    
    await logAudit({ user: req.user._id, action: 'UPDATE', resource: 'Application', resourceId: application._id, changes: { before: { stage: oldStage }, after: { stage: application.stage } }, req });
    
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
        correlationId: req.correlationId,
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
    
    await logAudit({ user: req.user._id, action: 'DELETE', resource: 'Application', resourceId: application._id, changes: { before: deletedData }, req });
    
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

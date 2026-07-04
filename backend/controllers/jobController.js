const Job = require('../models/Job');
const AuditLog = require('../models/AuditLog');
const eventEmitter = require('../services/eventEmitter');

// Escape user input before interpolating it into a RegExp.
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

exports.getJobs = async (req, res) => {
  try {
    const { search, status, location, seniority, page = 1, limit = 10, cursor } = req.query;

    const query = {
      ...(search   && { $text: { $search: search } }),
      ...(status   && { status }),
      ...(location && { location: new RegExp(`^${escapeRegex(location)}$`, 'i') }),
      ...(seniority && { seniority }),
    };
    
    const countQuery = { ...query };
    const limitVal = parseInt(limit);
    let jobs;
    let hasMore = false;
    let nextCursor = null;
    
    if (cursor) {
      const cursorDoc = await Job.findById(cursor);
      if (cursorDoc) {
        query.$or = [
          { createdAt: { $lt: cursorDoc.createdAt } },
          {
            createdAt: cursorDoc.createdAt,
            _id: { $lt: cursorDoc._id }
          }
        ];
      }
      
      jobs = await Job.find(query)
        .populate('postedBy', 'name email')
        .sort({ createdAt: -1, _id: -1 })
        .limit(limitVal + 1);
        
      if (jobs.length > limitVal) {
        hasMore = true;
        nextCursor = jobs[limitVal - 1]._id.toString();
        jobs.pop();
      }
    } else {
      const skip = (parseInt(page) - 1) * limitVal;
      
      jobs = await Job.find(query)
        .populate('postedBy', 'name email')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limitVal + 1);
        
      if (jobs.length > limitVal) {
        hasMore = true;
        nextCursor = jobs[limitVal - 1]._id.toString();
        jobs.pop();
      }
    }
    
    const total = await Job.countDocuments(countQuery);
    
    res.json({
      success: true,
      data: {
        jobs,
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
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching jobs'
    });
  }
};

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

exports.createJob = async (req, res) => {
  try {
    const { title, description, requiredSkills, operationalSkills, hygieneSkills, location, seniority, status } = req.body;

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
    
    await logAudit({ user: req.user._id, action: 'CREATE', resource: 'Job', resourceId: job._id, changes: { after: job }, req });

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

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

    const oldState = job.toObject();
    const { title, description, requiredSkills, operationalSkills, hygieneSkills, location, seniority, status } = req.body;

    if (title !== undefined) job.title = title;
    if (description !== undefined) job.description = description;
    if (requiredSkills !== undefined) job.requiredSkills = requiredSkills;
    if (operationalSkills !== undefined) job.operationalSkills = operationalSkills;
    if (hygieneSkills !== undefined) job.hygieneSkills = hygieneSkills;
    if (location !== undefined) job.location = location;
    if (seniority !== undefined) job.seniority = seniority;
    if (status !== undefined) job.status = status;

    await job.save();
    await logAudit({ user: req.user._id, action: 'UPDATE', resource: 'Job', resourceId: job._id, changes: { before: oldState, after: job.toObject() }, req });

    res.json({
      success: true,
      data: job
    });

    eventEmitter.emit('job:updated', { jobId: job._id });

  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error updating job'
    });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    const deletedData = job.toObject();
    await job.deleteOne();
    await logAudit({ user: req.user._id, action: 'DELETE', resource: 'Job', resourceId: job._id, changes: { before: deletedData }, req });
    
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

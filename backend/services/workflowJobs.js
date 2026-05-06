const agenda = require('../config/agenda');
const emailService = require('./emailService');
const Application = require('../models/Application');
const Match = require('../models/Match');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const eventEmitter = require('./eventEmitter');

/**
 * Define all workflow jobs
 */

// Job 1: Send application confirmation email
agenda.define('send-application-confirmation', async (job) => {
  const { applicationId } = job.attrs.data;
  
  try {
    console.log(`[Workflow] Processing application confirmation for ${applicationId}`);
    
    const application = await Application.findById(applicationId)
      .populate('candidate')
      .populate('job');
    
    if (!application) {
      console.error(`[Workflow] Application ${applicationId} not found`);
      return;
    }

    await emailService.sendApplicationConfirmation(
      application.candidate,
      application.job
    );

    console.log(`[Workflow] ✓ Application confirmation sent to ${application.candidate.email}`);
  } catch (error) {
    console.error('[Workflow] Error sending application confirmation:', error);
    throw error;
  }
});

// Job 2: Send high match notification to recruiter
agenda.define('notify-recruiter-high-match', async (job) => {
  const { matchId } = job.attrs.data;
  
  try {
    console.log(`[Workflow] Processing high match notification for ${matchId}`);
    
    const match = await Match.findById(matchId)
      .populate('candidate')
      .populate('job');
    
    if (!match) {
      console.error(`[Workflow] Match ${matchId} not found`);
      return;
    }

    await emailService.sendHighMatchNotification(
      match,
      match.candidate,
      match.job
    );

    console.log(`[Workflow] ✓ High match notification sent for ${match.candidate.name}`);
  } catch (error) {
    console.error('[Workflow] Error sending high match notification:', error);
    throw error;
  }
});

// Job 3: Auto-update application status based on match quality
agenda.define('auto-update-application-status', async (job) => {
  const { applicationId, matchQuality, matchScore } = job.attrs.data;
  
  try {
    console.log(`[Workflow] Auto-updating status for application ${applicationId}`);
    
    const application = await Application.findById(applicationId);
    
    if (!application) {
      console.error(`[Workflow] Application ${applicationId} not found`);
      return;
    }

    const oldStatus = application.status;
    let newStatus = oldStatus;

    // Auto-update based on match quality
    if (matchQuality === 'excellent' && matchScore >= 90) {
      newStatus = 'screening'; // Move excellent matches to screening
    } else if (matchQuality === 'poor' && matchScore < 40) {
      newStatus = 'rejected'; // Auto-reject very poor matches
    }

    if (newStatus !== oldStatus) {
      application.status = newStatus;
      await application.save();

      console.log(`[Workflow] ✓ Status updated: ${oldStatus} → ${newStatus}`);

      // Emit event
      eventEmitter.emit('application:status-changed', {
        applicationId: application._id,
        oldStatus,
        newStatus,
        reason: 'auto-update-by-match-score'
      });
    } else {
      console.log(`[Workflow] No status change needed for ${applicationId}`);
    }
  } catch (error) {
    console.error('[Workflow] Error auto-updating application status:', error);
    throw error;
  }
});

// Job 4: Schedule interview for excellent matches
agenda.define('schedule-interview', async (job) => {
  const { candidateId, jobId, interviewType = 'phone-screen' } = job.attrs.data;
  
  try {
    console.log(`[Workflow] Scheduling ${interviewType} for candidate ${candidateId}`);
    
    const candidate = await Candidate.findById(candidateId);
    const jobDoc = await Job.findById(jobId);
    
    if (!candidate || !jobDoc) {
      console.error(`[Workflow] Candidate or Job not found`);
      return;
    }

    // In a real system, this would integrate with a calendar service
    // For now, we'll just send an email invitation
    const interviewDetails = {
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 3 days from now
      time: '10:00 AM',
      duration: '30-60 minutes',
      type: interviewType === 'phone-screen' ? 'Phone Screen' : 'Technical Interview',
      meetingLink: 'https://meet.google.com/xxx-xxxx-xxx' // Placeholder
    };

    await emailService.sendInterviewInvitation(candidate, jobDoc, interviewDetails);

    console.log(`[Workflow] ✓ Interview invitation sent to ${candidate.email}`);
  } catch (error) {
    console.error('[Workflow] Error scheduling interview:', error);
    throw error;
  }
});

// Job 5: Send rejection email
agenda.define('send-rejection-email', async (job) => {
  const { applicationId } = job.attrs.data;
  
  try {
    console.log(`[Workflow] Sending rejection email for application ${applicationId}`);
    
    const application = await Application.findById(applicationId)
      .populate('candidate')
      .populate('job');
    
    if (!application) {
      console.error(`[Workflow] Application ${applicationId} not found`);
      return;
    }

    await emailService.sendRejectionEmail(
      application.candidate,
      application.job
    );

    console.log(`[Workflow] ✓ Rejection email sent to ${application.candidate.email}`);
  } catch (error) {
    console.error('[Workflow] Error sending rejection email:', error);
    throw error;
  }
});

// Job 6: Send status update notification
agenda.define('send-status-update', async (job) => {
  const { applicationId, oldStatus, newStatus } = job.attrs.data;
  
  try {
    console.log(`[Workflow] Sending status update for application ${applicationId}`);
    
    const application = await Application.findById(applicationId)
      .populate('candidate')
      .populate('job');
    
    if (!application) {
      console.error(`[Workflow] Application ${applicationId} not found`);
      return;
    }

    await emailService.sendStatusUpdate(
      application.candidate,
      application.job,
      oldStatus,
      newStatus
    );

    console.log(`[Workflow] ✓ Status update email sent to ${application.candidate.email}`);
  } catch (error) {
    console.error('[Workflow] Error sending status update:', error);
    throw error;
  }
});

// Job 7: Periodic reminder to review pending applications
agenda.define('review-pending-applications-reminder', async (job) => {
  try {
    console.log('[Workflow] Checking for pending applications...');
    
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    
    const pendingApplications = await Application.find({
      status: 'applied',
      createdAt: { $lt: twoDaysAgo }
    }).populate('candidate job');

    if (pendingApplications.length > 0) {
      console.log(`[Workflow] Found ${pendingApplications.length} pending applications`);
      
      // In a real system, send email to recruiter
      console.log(`[Workflow] ⚠️  ${pendingApplications.length} applications pending review for >2 days`);
    } else {
      console.log('[Workflow] No pending applications requiring attention');
    }
  } catch (error) {
    console.error('[Workflow] Error checking pending applications:', error);
    throw error;
  }
});

// Job 8: Clean up old rejected applications (after 90 days)
agenda.define('cleanup-old-applications', async (job) => {
  try {
    console.log('[Workflow] Cleaning up old applications...');
    
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    const result = await Application.deleteMany({
      status: 'rejected',
      updatedAt: { $lt: ninetyDaysAgo }
    });

    console.log(`[Workflow] ✓ Cleaned up ${result.deletedCount} old rejected applications`);
  } catch (error) {
    console.error('[Workflow] Error cleaning up applications:', error);
    throw error;
  }
});

// Job 9: Resume a paused workflow run (triggered by wait step)
agenda.define('resume-run', async (job) => {
  const { runId, workflowId, applicationId, context } = job.attrs.data;

  try {
    console.log(`[WorkflowEngine] Resuming run ${runId}`);
    const Workflow = require('../models/Workflow');
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      console.error(`[WorkflowEngine] Workflow ${workflowId} not found for resume`);
      return;
    }

    const { executeRun } = require('./workflowEngine');
    await executeRun(runId, workflow, context || {});
  } catch (err) {
    console.error('[WorkflowEngine] Error in resume-run job:', err);
    throw err;
  }
});

console.log('[Workflow] Job definitions loaded');

// Function to initialize workflows
async function initializeWorkflows() {
    console.log('[WorkflowJobs] Initializing workflows...');
    await agenda.start(); // starts processing jobs
    console.log('[WorkflowJobs] Agenda started');
}

module.exports = {
  agenda,
  initializeWorkflows
};
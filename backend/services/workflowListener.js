const eventEmitter = require('./eventEmitter');
const agenda = require('./workflowJobs');

/**
 * Workflow Event Listeners
 * These listeners trigger Agenda jobs in response to system events
 */

// When an application is created, send confirmation email
eventEmitter.on('application:created', async (data) => {
  try {
    console.log(`[WorkflowListener] Application created: ${data.applicationId}`);
    
    // Schedule confirmation email (immediate)
    await agenda.now('send-application-confirmation', {
      applicationId: data.applicationId
    });
  } catch (error) {
    console.error('[WorkflowListener] Error scheduling application confirmation:', error);
  }
});

// When a high-quality match is detected, notify recruiter
eventEmitter.on('match:high-quality', async (data) => {
  try {
    console.log(`[WorkflowListener] High-quality match detected: ${data.score}%`);
    
    // Schedule recruiter notification (immediate)
    await agenda.now('notify-recruiter-high-match', {
      matchId: data.matchId
    });

    // If excellent match (≥90%), auto-schedule phone screen
    if (data.score >= 90) {
      console.log(`[WorkflowListener] Excellent match (${data.score}%) - auto-scheduling interview`);
      
      await agenda.schedule('in 5 minutes', 'schedule-interview', {
        candidateId: data.candidateId,
        jobId: data.jobId,
        interviewType: 'phone-screen'
      });
    }
  } catch (error) {
    console.error('[WorkflowListener] Error processing high-quality match:', error);
  }
});

// When a match is calculated, auto-update application status
eventEmitter.on('match:calculated', async (data) => {
  try {
    if (data.applicationId) {
      console.log(`[WorkflowListener] Match calculated for application: ${data.applicationId}`);
      
      // Schedule status update (in 1 minute to allow for manual review)
      await agenda.schedule('in 1 minute', 'auto-update-application-status', {
        applicationId: data.applicationId,
        matchQuality: data.quality,
        matchScore: data.score
      });
    }
  } catch (error) {
    console.error('[WorkflowListener] Error scheduling status update:', error);
  }
});

// When application status changes, send notification
eventEmitter.on('application:status-changed', async (data) => {
  try {
    console.log(`[WorkflowListener] Status changed: ${data.oldStatus} → ${data.newStatus}`);
    
    // Send status update email (immediate)
    await agenda.now('send-status-update', {
      applicationId: data.applicationId,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus
    });

    // If rejected, schedule rejection email
    if (data.newStatus === 'rejected') {
      await agenda.schedule('in 5 minutes', 'send-rejection-email', {
        applicationId: data.applicationId
      });
    }
  } catch (error) {
    console.error('[WorkflowListener] Error processing status change:', error);
  }
});

// Schedule recurring jobs
async function scheduleRecurringJobs() {
  try {
    // Review pending applications daily at 9 AM
    await agenda.every('0 9 * * *', 'review-pending-applications-reminder');
    console.log('[WorkflowListener] ✓ Scheduled: Daily pending applications review');

    // Clean up old applications weekly on Sunday at 2 AM
    await agenda.every('0 2 * * 0', 'cleanup-old-applications');
    console.log('[WorkflowListener] ✓ Scheduled: Weekly application cleanup');
  } catch (error) {
    console.error('[WorkflowListener] Error scheduling recurring jobs:', error);
  }
}

// Initialize workflow listeners
async function initializeWorkflows() {
  try {
    // Start Agenda
    await agenda.start();
    console.log('[WorkflowListener] Agenda started');

    // Schedule recurring jobs
    await scheduleRecurringJobs();
    
    console.log('[WorkflowListener] Workflow listeners initialized');
  } catch (error) {
    console.error('[WorkflowListener] Error initializing workflows:', error);
  }
}

module.exports = { initializeWorkflows };
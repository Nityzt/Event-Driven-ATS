const agenda = require('../config/agenda');

/**
 * Agenda job definitions.
 *
 * The candidate-facing workflow (sendEmail / sendSMS / wait / webhook steps) is
 * driven entirely by services/workflowEngine.js. The only Agenda job that engine
 * relies on is `resume-run`, which wakes a paused run after a `wait` step.
 *
 * The previous hard-coded jobs (application-confirmation, high-match-notification,
 * auto-update-application-status, schedule-interview, rejection/status emails,
 * cleanup, etc.) and services/workflowListener.js were never wired into server.js
 * and referenced stale fields (candidate vs candidateId, status vs stage,
 * job.company, matchedSkills.join), so they were removed.
 */

// Resume a paused workflow run — scheduled by the `wait` step in workflowEngine.
agenda.define('resume-run', async (job) => {
  const { runId, workflowId, context } = job.attrs.data;

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
  await agenda.start(); // begin processing scheduled jobs (e.g. resume-run)
  console.log('[WorkflowJobs] Agenda started');
}

module.exports = {
  agenda,
  initializeWorkflows
};

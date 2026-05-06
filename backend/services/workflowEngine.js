const Workflow = require('../models/Workflow');
const Run = require('../models/Run');
const emailService = require('./emailService');
const smsService = require('./smsService');
const eventEmitter = require('./eventEmitter');
const metrics = require('./metrics');
const axios = require('axios');

// Resolve {{key.subkey}} template variables from context
function resolveTemplate(template, context) {
  if (typeof template !== 'string') return template;
  return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const val = path.trim().split('.').reduce((obj, k) => obj?.[k], context);
    return val !== undefined && val !== null ? String(val) : `{{${path.trim()}}}`;
  });
}

function resolveConfig(config, context) {
  if (!config || typeof config !== 'object') return config;
  const out = {};
  for (const [k, v] of Object.entries(config)) {
    if (typeof v === 'string') out[k] = resolveTemplate(v, context);
    else if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = resolveConfig(v, context);
    else out[k] = v;
  }
  return out;
}

function unitToMs(unit) {
  if (unit === 'minutes') return 60 * 1000;
  if (unit === 'days')    return 24 * 60 * 60 * 1000;
  return 60 * 60 * 1000; // default: hours
}

function pushLog(run, step, status, message, error = null) {
  run.logs.push({ step, status, message, error, createdAt: new Date() });
  eventEmitter.emit(`run:log:${run.applicationId}`, {
    runId: run._id,
    workflowId: run.workflowId,
    step,
    status,
    message,
    error,
    createdAt: new Date()
  });
}

async function callWebhook(url, method, payload, run, stepIndex) {
  const delays = [0, 1000, 2000, 4000];
  let lastErr;

  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, delays[attempt]));
      metrics.steps_retried++;
      pushLog(run, stepIndex, 'retrying', `Webhook retry attempt ${attempt + 1}/${delays.length}`);
    }

    try {
      const resp = await axios({ method: method || 'POST', url, data: payload, timeout: 10000 });
      if (resp.status >= 500) throw new Error(`Server error ${resp.status}`);
      return { success: true, status: resp.status };
    } catch (err) {
      lastErr = err;
      if (attempt < delays.length - 1) {
        console.warn(`[WorkflowEngine] Webhook attempt ${attempt + 1} failed: ${err.message}`);
      }
    }
  }
  throw lastErr;
}

// Execute a run from its current stepPointer
async function executeRun(runId, workflow, context) {
  const run = await Run.findById(runId);
  if (!run || ['cancelled', 'failed'].includes(run.state)) return;

  run.state = 'running';
  if (!run.startedAt) run.startedAt = new Date();
  await run.save();

  const steps = workflow.steps;

  for (let i = run.stepPointer; i < steps.length; i++) {
    // Re-check state between steps (another process may pause/cancel)
    const fresh = await Run.findById(runId);
    if (!fresh || ['paused', 'cancelled', 'failed'].includes(fresh.state)) return;

    const step = steps[i];
    const cfg = resolveConfig(step.config, context);

    pushLog(run, i, 'running', `Step ${i + 1}: ${step.type}`);
    run.stepPointer = i;
    await run.save();

    try {
      switch (step.type) {
        case 'sendEmail': {
          const to = cfg.to || context.candidate?.email;
          await emailService.sendEmail({
            to,
            subject: cfg.subject || 'ATS Notification',
            text:    cfg.body || cfg.message || '',
            html:    cfg.body || cfg.message || ''
          });
          metrics.emails_sent++;
          pushLog(run, i, 'completed', `Email sent to ${to}`);
          break;
        }

        case 'sendSMS': {
          const to = cfg.to || context.candidate?.phone || context.candidate?.email;
          await smsService.send(to, cfg.message || '', {
            applicationId: run.applicationId?.toString(),
            correlationId: run._id.toString()
          });
          pushLog(run, i, 'completed', `SMS sent to ${to}`);
          break;
        }

        case 'wait': {
          const ms = (cfg.duration || 1) * unitToMs(cfg.unit);
          // Schedule resume via Agenda (required at call site to avoid circular dep)
          const agendaRef = require('../config/agenda');
          await agendaRef.schedule(new Date(Date.now() + ms), 'resume-run', {
            runId:         run._id.toString(),
            workflowId:    workflow._id.toString(),
            applicationId: run.applicationId?.toString(),
            context
          });

          run.state = 'paused';
          run.stepPointer = i + 1; // continue from next step on resume
          await run.save();
          pushLog(run, i, 'completed', `Waiting ${cfg.duration} ${cfg.unit || 'hours'}`);
          return; // halt; Agenda will call executeRun again
        }

        case 'webhook': {
          await callWebhook(cfg.url, cfg.method, cfg.payload, run, i);
          pushLog(run, i, 'completed', `Webhook called: ${cfg.url}`);
          break;
        }

        default:
          pushLog(run, i, 'completed', `Unknown step type "${step.type}" skipped`);
      }
    } catch (err) {
      run.state = 'failed';
      run.failedAt = new Date();
      pushLog(run, i, 'failed', `Step ${i + 1} failed: ${err.message}`, err.message);
      await run.save();
      console.error(`[WorkflowEngine] Run ${runId} failed at step ${i}:`, err.message);
      return;
    }
  }

  // All steps done
  run.state = 'completed';
  run.completedAt = new Date();
  run.stepPointer = steps.length;
  await run.save();
  pushLog(run, steps.length, 'completed', 'Workflow run completed successfully');
  eventEmitter.emit(`run:completed:${run.applicationId}`, { runId: run._id });
}

// Called by event listeners when an event fires
async function trigger(eventName, context) {
  try {
    const workflows = await Workflow.find({
      enabled: true,
      'triggers.event': eventName
    });

    if (!workflows.length) return;

    console.log(`[WorkflowEngine] "${eventName}" matched ${workflows.length} workflow(s)`);

    for (const workflow of workflows) {
      // For Stage.changed, check trigger condition if a target stage is specified
      if (eventName === 'Stage.changed') {
        const conditionMet = workflow.triggers.some(t => {
          if (t.event !== 'Stage.changed') return false;
          if (t.conditions?.stage && t.conditions.stage !== context.newStage) return false;
          return true;
        });
        if (!conditionMet) continue;
      }

      const run = await Run.create({
        workflowId:    workflow._id,
        applicationId: context.applicationId,
        state:         'queued',
        stepPointer:   0
      });

      metrics.runs_started++;
      console.log(`[WorkflowEngine] Created Run ${run._id} for workflow "${workflow.name}"`);

      // Fire-and-forget; errors logged inside executeRun
      executeRun(run._id.toString(), workflow, context).catch(err =>
        console.error('[WorkflowEngine] Uncaught error in executeRun:', err)
      );
    }
  } catch (err) {
    console.error('[WorkflowEngine] Error triggering workflows:', err);
  }
}

// Dry-run: return resolved step list with sample context (no side effects)
function previewWorkflow(workflow) {
  const sample = {
    candidate: { name: 'Jane Smith', email: 'jane@example.com', phone: '+1-555-0100' },
    job:       { title: 'Senior Developer', location: 'San Francisco, CA', company: 'Acme Corp' },
    application: { stage: 'Applied', appliedAt: new Date().toISOString() }
  };

  return workflow.steps.map((step, i) => ({
    stepNumber:     i + 1,
    type:           step.type,
    resolvedConfig: resolveConfig(step.config, sample)
  }));
}

module.exports = { trigger, executeRun, previewWorkflow };

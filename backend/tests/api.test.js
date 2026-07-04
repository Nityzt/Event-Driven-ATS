const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const Workflow = require('../models/Workflow');
const Run = require('../models/Run');
const Match = require('../models/Match');
const metrics = require('../services/metrics');
const { executeRun } = require('../services/workflowEngine');
const http = require('http');

const MONGO_TEST_URI = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/event-ats-test';

let adminToken;
let recruiterToken;
let viewerToken;
let adminId;
let recruiterId;

beforeAll(async () => {
  await mongoose.connect(MONGO_TEST_URI);
  // Clean slate
  await Promise.all([
    User.deleteMany({}),
    Job.deleteMany({}),
    Candidate.deleteMany({}),
    Application.deleteMany({}),
    Workflow.deleteMany({}),
    Run.deleteMany({}),
    Match.deleteMany({})
  ]);

  // Public registration is Viewer-only by design, so Admin/Recruiter accounts are
  // created directly via the model and then logged in to obtain access tokens.
  const admin = await User.create({ name: 'Admin', email: 'admin@test.com', password: 'password123', role: 'Admin' });
  const recruiter = await User.create({ name: 'Recruiter', email: 'recruiter@test.com', password: 'password123', role: 'Recruiter' });
  await User.create({ name: 'Viewer', email: 'viewer@test.com', password: 'password123', role: 'Viewer' });
  adminId = admin._id;
  recruiterId = recruiter._id;

  const login = (email) =>
    request(app).post('/api/auth/login').send({ email, password: 'password123' });
  adminToken     = (await login('admin@test.com')).body.data?.accessToken;
  recruiterToken = (await login('recruiter@test.com')).body.data?.accessToken;
  viewerToken    = (await login('viewer@test.com')).body.data?.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
});

// ── 1. Auth: register ────────────────────────────────────────────────────────
describe('Auth', () => {
  test('1. POST /api/auth/register — success', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'New User', email: 'newuser@test.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  test('2. POST /api/auth/register — duplicate email returns 400/409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin', email: 'admin@test.com', password: 'password123' });
    expect([400, 409]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  test('3. POST /api/auth/register — missing name returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'noname@test.com', password: 'password123' });
    expect(res.status).toBe(400);
  });

  test('4. POST /api/auth/login — valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  test('5. POST /api/auth/login — wrong password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('6. GET /api/auth/me — returns current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('email', 'admin@test.com');
  });
});

// ── 2. Authorization ─────────────────────────────────────────────────────────
describe('Authorization', () => {
  test('7. GET /api/jobs — no auth returns 401', async () => {
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(401);
  });

  test('8. POST /api/jobs — Viewer role returns 403', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ title: 'Test Job', description: 'A job', location: 'NYC', seniority: 'Mid', requiredSkills: ['JS'] });
    expect(res.status).toBe(403);
  });
});

// ── 3. Workflows CRUD ────────────────────────────────────────────────────────
let createdWorkflowId;
describe('Workflows', () => {
  const wfPayload = {
    name: 'Test Workflow',
    triggers: [{ event: 'Application.created' }],
    steps: [
      { type: 'sendEmail', config: { subject: 'Hello {{candidate.name}}', body: 'Thanks for applying to {{job.title}}' } }
    ]
  };

  test('9. POST /api/workflows — Recruiter can create', async () => {
    const res = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send(wfPayload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('name', 'Test Workflow');
    createdWorkflowId = res.body.data._id;
  });

  test('10. GET /api/workflows — lists created workflow', async () => {
    const res = await request(app)
      .get('/api/workflows')
      .set('Authorization', `Bearer ${recruiterToken}`);
    expect(res.status).toBe(200);
    const names = res.body.data.map(w => w.name);
    expect(names).toContain('Test Workflow');
  });

  test('11. PATCH /api/workflows/:id/toggle — toggles enabled', async () => {
    const res = await request(app)
      .patch(`/api/workflows/${createdWorkflowId}/toggle`)
      .set('Authorization', `Bearer ${recruiterToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.data.enabled).toBe('boolean');
  });

  test('12. POST /api/workflows/preview — returns resolved steps', async () => {
    const res = await request(app)
      .post('/api/workflows/preview')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send(wfPayload);
    expect(res.status).toBe(200);
    expect(res.body.data.resolvedSteps).toBeInstanceOf(Array);
    const step = res.body.data.resolvedSteps[0];
    expect(step.resolvedConfig.subject).toContain('Jane Smith'); // sample context
  });
});

// ── 4. Matching ───────────────────────────────────────────────────────────────
describe('Matching', () => {
  let jobId, candidateId;

  beforeAll(async () => {
    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'React Dev', description: 'React role', location: 'Remote', seniority: 'Senior', requiredSkills: ['React', 'JavaScript'] });
    jobId = jobRes.body.data?._id;

    const candRes = await request(app)
      .post('/api/candidates')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ name: 'John Doe', email: 'john@match.com', skills: ['React', 'JavaScript', 'TypeScript'], seniority: 'Senior' });
    candidateId = candRes.body.data?._id;
  });

  test('13. POST /api/matches/calculate — returns score object', async () => {
    const res = await request(app)
      .post('/api/matches/calculate')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ candidateId, jobId });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('overallScore');
    expect(typeof res.body.data.overallScore).toBe('number');
    expect(res.body.data.matchedSkills.required).toEqual(expect.arrayContaining(['React', 'JavaScript']));
  });
});

// ── 5. Application + Run trigger ──────────────────────────────────────────────
describe('Application & Run', () => {
  let jobId, candidateId;

  beforeAll(async () => {
    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Node Dev', description: 'Node role', location: 'Remote', seniority: 'Mid', requiredSkills: ['Node.js'] });
    jobId = jobRes.body.data?._id;

    const candRes = await request(app)
      .post('/api/candidates')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ name: 'App Tester', email: 'apptest@test.com', skills: ['Node.js'], seniority: 'Mid' });
    candidateId = candRes.body.data?._id;
  });

  test('14. POST /api/applications — creates application and auto-calculates match', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ candidateId, jobId });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('stage', 'Applied');

    let match = null;
    for (let i = 0; i < 10; i++) {
      match = await Match.findOne({ candidate: candidateId, job: jobId });
      if (match) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    expect(match).toBeTruthy();
    expect(match.overallScore).toBeGreaterThan(0);
  });
});

// ── 6. Workflow retry behaviour ──────────────────────────────────────────────
describe('Workflow retries', () => {
  test('15. executeRun retries webhook 5xx responses and fails after max attempts', async () => {
    const server = http.createServer((req, res) => {
      res.statusCode = 500;
      res.end('retry me');
    });

    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const previousRetries = metrics.steps_retried;

    try {
      const recruiter = await User.findOne({ email: 'recruiter@test.com' });
      const candidate = await Candidate.create({ name: 'Retry Tester', email: 'retry@test.com', skills: ['Node.js'] });
      const job = await Job.create({
        title: 'Retry Job',
        description: 'Retry workflow job',
        location: 'Remote',
        seniority: 'Mid',
        requiredSkills: ['Node.js'],
        postedBy: recruiter._id
      });
      const application = await Application.create({ candidateId: candidate._id, jobId: job._id });
      const workflow = await Workflow.create({
        name: 'Webhook Retry Workflow',
        triggers: [{ event: 'Manual' }],
        steps: [{ type: 'webhook', config: { url: `http://127.0.0.1:${port}`, method: 'POST', payload: { ok: true } } }],
        createdBy: recruiter._id
      });
      const run = await Run.create({ workflowId: workflow._id, applicationId: application._id });

      await executeRun(run._id.toString(), workflow, {});

      const failedRun = await Run.findById(run._id);
      expect(failedRun.state).toBe('failed');
      expect(failedRun.logs.some(log => log.status === 'retrying')).toBe(true);
      expect(metrics.steps_retried - previousRetries).toBe(3);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });
});

// ── 7. Metrics endpoint ───────────────────────────────────────────────────────
describe('Metrics', () => {
  test('16. GET /metrics — returns counter object', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('runs_started');
    expect(res.body.data).toHaveProperty('emails_sent');
    expect(res.body.data).toHaveProperty('sms_sent');
    expect(res.body.data).toHaveProperty('steps_retried');
  });
});

// ── 8. Health check ───────────────────────────────────────────────────────────
describe('Health', () => {
  test('17. GET /healthz — returns ok', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ── 6. Workflow idempotency ───────────────────────────────────────────────────
describe('Workflow idempotency', () => {
  let idempJobId, idempCandId, idempAppId, idempWorkflowId;

  beforeAll(async () => {
    const wfRes = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        name: 'Idempotency Test Workflow',
        triggers: [{ event: 'Stage.changed' }],
        steps: [{ type: 'sendEmail', config: { subject: 'Stage changed', body: 'Hello' } }]
      });
    idempWorkflowId = wfRes.body.data?._id;

    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Idemp Job', description: 'Test', location: 'Remote', seniority: 'Mid', requiredSkills: ['JS'] });
    idempJobId = jobRes.body.data?._id;

    const candRes = await request(app)
      .post('/api/candidates')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ name: 'Idemp Candidate', email: 'idemp@test.com', skills: ['JS'], seniority: 'Mid' });
    idempCandId = candRes.body.data?._id;

    const appRes = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ candidateId: idempCandId, jobId: idempJobId });
    idempAppId = appRes.body.data?._id;
  });

  test('18. Triggering the same stage change twice only creates one run for that transition', async () => {
    // First PATCH — stage changes from Applied → Screening, triggers Stage.changed workflow
    await request(app)
      .patch(`/api/applications/${idempAppId}`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ stage: 'Screening' });

    // Second PATCH with the same stage — controller skips workflow trigger because stage didn't change
    await request(app)
      .patch(`/api/applications/${idempAppId}`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ stage: 'Screening' });

    await new Promise(resolve => setTimeout(resolve, 200));

    const runsRes = await request(app)
      .get('/api/runs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .query({ applicationId: idempAppId });

    const runs = runsRes.body.data?.runs || [];
    const relevantRuns = runs.filter(
      r => r.workflowId?._id === idempWorkflowId || r.workflowId === idempWorkflowId
    );

    expect(relevantRuns.length).toBe(1);
  });
});

// ── 8. Input validation ──────────────────────────────────────────────────────
describe('Input validation', () => {
  test('19. POST /api/jobs — missing title returns 400', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ description: 'A job', location: 'NYC', seniority: 'Mid' });
    expect(res.status).toBe(400);
  });

  test('20. POST /api/candidates — missing email returns 400', async () => {
    const res = await request(app)
      .post('/api/candidates')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ name: 'No Email User' });
    expect(res.status).toBe(400);
  });

  test('21. POST /api/applications — missing candidateId returns 400', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ jobId: '507f1f77bcf86cd799439011' });
    expect(res.status).toBe(400);
  });
});

// ── 9. Rate limiting ─────────────────────────────────────────────────────────
describe('Rate limiting', () => {
  test('22. /api/auth rate limit eventually returns 429', async () => {
    let limited = false;

    for (let i = 0; i < 12; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: `missing-${i}@test.com`, password: 'wrongpassword' });

      if (res.status === 429) {
        limited = true;
        break;
      }
    }

    expect(limited).toBe(true);
  });
});

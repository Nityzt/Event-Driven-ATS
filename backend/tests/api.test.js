const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const Workflow = require('../models/Workflow');
const Run = require('../models/Run');

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
    Run.deleteMany({})
  ]);

  // Pre-seed an admin and recruiter
  const adminRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Admin', email: 'admin@test.com', password: 'password123', role: 'Admin' });
  adminToken = adminRes.body.data?.accessToken;
  adminId    = adminRes.body.data?.user?._id;

  const recruiterRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Recruiter', email: 'recruiter@test.com', password: 'password123', role: 'Recruiter' });
  recruiterToken = recruiterRes.body.data?.accessToken;
  recruiterId    = recruiterRes.body.data?.user?._id;

  const viewerRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Viewer', email: 'viewer@test.com', password: 'password123', role: 'Viewer' });
  viewerToken = viewerRes.body.data?.accessToken;
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
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('overallScore');
    expect(typeof res.body.overallScore).toBe('number');
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

  test('14. POST /api/applications — creates application', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ candidateId, jobId });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('stage', 'Applied');
  });
});

// ── 6. Metrics endpoint ───────────────────────────────────────────────────────
describe('Metrics', () => {
  test('15. GET /metrics — returns counter object', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('runs_started');
    expect(res.body.data).toHaveProperty('emails_sent');
    expect(res.body.data).toHaveProperty('sms_sent');
    expect(res.body.data).toHaveProperty('steps_retried');
  });
});

// ── 7. Health check ───────────────────────────────────────────────────────────
describe('Health', () => {
  test('16. GET /healthz — returns ok', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

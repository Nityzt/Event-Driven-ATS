# Event-Driven ATS

A full-stack Applicant Tracking System built on the MERN stack, featuring a custom event-driven workflow automation engine with real-time Server-Sent Events, MongoDB-backed job scheduling via Agenda, JWT/RBAC authentication, and a visual workflow builder.

---

## Features

| Area | What it does |
|---|---|
| **Jobs** | Full CRUD — post, edit, delete openings; required + hygiene skills; location and seniority filters; text search |
| **Candidates** | Full CRUD — register candidates; resume PDF upload + text extraction; skill tags; location/seniority filters |
| **Applications** | Link candidates to jobs; progress through stages (Applied → Screening → Interview → Offer → Hired / Rejected) |
| **Matching Engine** | Score candidates against job requirements (skills 50%, experience 30%, location 10%, education 10%); hygiene skills add +5% each; stores match breakdown per candidate-job pair |
| **Workflow Automation** | Build trigger-based workflows in a drag-and-drop visual builder; supported steps: sendEmail, sendSMS, wait, webhook with retry |
| **Workflow Runs** | Every triggered workflow creates a Run record; Recruiter/Admin can pause, resume, and cancel in-flight runs |
| **Real-time Timeline** | Per-application SSE stream shows live step execution as workflows run |
| **Audit Logs** | Full action trail with before/after diffs; filterable by action type and resource (Admin/Recruiter only) |
| **Profile** | View account info; self-service password change |
| **Metrics** | In-memory counters at `GET /metrics` — runs started, emails sent, SMS sent, webhook retries |
| **Security** | Helmet, CORS, rate limiting (100/15 min general, 10/15 min auth), JWT access + refresh tokens, RBAC |

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, @dnd-kit (drag-and-drop) |
| Backend | Node.js 20, Express 5, Mongoose 9 |
| Database | MongoDB 7 |
| Job Scheduling | Agenda (MongoDB-backed, `agendaJobs` collection) |
| Auth | JWT — access token 15m, refresh token 7d; bcryptjs for password hashing |
| Email | Nodemailer (Ethereal for dev, any SMTP for prod) |
| Real-time | Server-Sent Events (SSE) via Node.js EventEmitter |
| Testing | Jest 30 + Supertest |
| Containers | Docker + docker-compose |

---

## Project Structure

```
event-driven-ats/
├── backend/
│   ├── config/
│   │   ├── agenda.js          # Agenda instance (singleton — always import from here)
│   │   ├── database.js        # Mongoose connection
│   │   └── multer.js          # Resume PDF upload config
│   ├── controllers/
│   │   ├── applicationController.js
│   │   ├── authController.js
│   │   ├── candidateController.js
│   │   ├── jobController.js
│   │   └── workflowController.js
│   ├── middleware/
│   │   ├── auth.js            # authenticate + authorize(roles)
│   │   ├── errorHandler.js    # global error middleware
│   │   └── requestLogger.js   # morgan + correlation ID
│   ├── models/
│   │   ├── Application.js     # candidateId, jobId, stage, timeline[]
│   │   ├── AuditLog.js        # action enum, before/after changes
│   │   ├── Candidate.js       # skills[], experience[], resume
│   │   ├── Job.js             # requiredSkills[], hygieneSkills[]
│   │   ├── Match.js           # overallScore, breakdown, matchQuality
│   │   ├── Run.js             # workflowId, state, stepPointer, logs[]
│   │   ├── User.js            # role: Admin|Recruiter|Viewer
│   │   └── Workflow.js        # triggers[], steps[], enabled
│   ├── routes/
│   │   ├── applications.js    # includes SSE endpoint
│   │   ├── auditLogs.js
│   │   ├── auth.js
│   │   ├── candidates.js
│   │   ├── jobs.js
│   │   ├── matches.js
│   │   ├── runs.js            # pause/resume/cancel
│   │   └── workflows.js       # CRUD + preview + agenda mgmt + manual triggers
│   ├── scripts/
│   │   └── seed.js            # 50 candidates, 10 jobs, 3 workflows, 2 users
│   ├── services/
│   │   ├── emailService.js    # nodemailer wrapper
│   │   ├── eventEmitter.js    # shared Node.js EventEmitter
│   │   ├── matchingEngine.js  # scoring logic
│   │   ├── matchListener.js   # auto-calculate matches on application create
│   │   ├── metrics.js         # in-memory counters
│   │   ├── pdfService.js      # PDF text extraction
│   │   ├── smsService.js      # mock SMS: console + AuditLog
│   │   ├── workflowEngine.js  # trigger, executeRun, previewWorkflow
│   │   ├── workflowJobs.js    # Agenda job definitions (incl. resume-run)
│   │   └── workflowListener.js
│   ├── tests/
│   │   ├── api.test.js        # 16 integration tests
│   │   ├── matchingEngine.test.js
│   │   └── setup.js           # sets env vars before server.js loads
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── frontend/
│   └── src/
│       ├── api/               # axios wrapper per resource
│       │   ├── client.js      # axios instance with auth interceptor
│       │   ├── index.js       # re-exports all API modules
│       │   ├── applications.js, auth.js, candidates.js, jobs.js
│       │   ├── matches.js, runs.js, workflows.js, auditLogs.js
│       ├── components/
│       │   ├── common/        # ErrorBoundary, ProtectedRoute
│       │   ├── matching/      # MatchingScreen, JobSelector, CandidateList, ScoreBar
│       │   ├── timeline/      # ApplicationTimeline (SSE), TimelineEvent
│       │   ├── upload/        # ResumeUploader
│       │   ├── workflow/      # WorkflowBuilder (dnd-kit), WorkflowStep, WorkflowTrigger, StepPalette
│       │   ├── Layout.jsx
│       │   ├── Navbar.jsx
│       │   └── Sidebar.jsx
│       ├── contexts/
│       │   └── AuthContext.jsx  # login, logout, register, hasRole, isAuthenticated
│       ├── hooks/
│       │   ├── useDebounce.js
│       │   ├── useOptimisticUpdate.js
│       │   ├── usePagination.js
│       │   └── useSSE.js      # SSE connection hook
│       ├── pages/
│       │   ├── Applications.jsx
│       │   ├── AuditLogs.jsx
│       │   ├── Candidates.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Jobs.jsx
│       │   ├── Login.jsx
│       │   ├── Matches.jsx
│       │   ├── Profile.jsx
│       │   └── Workflows.jsx  # tabs: Workflows | Runs
│       ├── App.jsx
│       └── main.jsx
├── .dockerignore (frontend)
├── Dockerfile (frontend — multi-stage)
├── nginx.conf
├── docker-compose.yml
└── README.md
```

---

## Quick Start

### Option A — Docker (recommended for a clean full-stack run)

Requires Docker Desktop.

```bash
# From the project root
docker-compose up --build
```

Services start in order: MongoDB → Backend → Frontend (each waits for the previous health check).

| URL | What |
|---|---|
| http://localhost | Frontend (React SPA via nginx) |
| http://localhost/api | Backend API (proxied by nginx) |
| http://localhost/healthz | Health check |
| http://localhost/metrics | In-memory counters |

**Seed on first run:**
```bash
docker-compose exec backend node scripts/seed.js
```

---

### Option B — Local Development

**Prerequisites:** Node.js 20+, MongoDB running on `localhost:27017`

**1. Backend**
```bash
cd backend

# Copy and fill in environment variables
cp .env.example .env   # edit MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET, EMAIL_*

npm install
npm run seed    # creates users, jobs, candidates, workflows
npm run dev     # nodemon — http://localhost:5001
```

**2. Frontend** (separate terminal)
```bash
cd frontend
npm install
npm run dev     # Vite dev server — http://localhost:5173
```

The Vite dev server proxies `/api` → `http://localhost:5001/api` via `VITE_API_URL`.

---

## Environment Variables

Create `backend/.env` (copy from `.env.example`):

| Variable | Default / Example | Purpose |
|---|---|---|
| `PORT` | `5001` | Backend listen port |
| `NODE_ENV` | `development` | Enables dev logging |
| `MONGO_URI` | `mongodb://localhost:27017/event-ats` | Database connection |
| `JWT_SECRET` | *(required)* | Access token signing — use 32+ random chars |
| `JWT_REFRESH_SECRET` | *(required)* | Refresh token signing — different from above |
| `JWT_EXPIRE` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRE` | `7d` | Refresh token lifetime |
| `EMAIL_HOST` | `smtp.ethereal.email` | SMTP host |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_USER` | *(Ethereal user)* | SMTP credentials |
| `EMAIL_PASS` | *(Ethereal pass)* | SMTP credentials |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |

**Docker overrides** are set directly in `docker-compose.yml` and can be overridden by a `.env` file at the project root with `JWT_SECRET` and `JWT_REFRESH_SECRET`.

---

## Seed Credentials

```
Admin     admin@ats.com      / admin123
Recruiter recruiter@ats.com  / recruiter123
```

Seed creates: 2 users · 10 jobs · 50 candidates · 10 applications · 3 sample workflows

---

## API Overview

All endpoints under `/api` require `Authorization: Bearer <token>` unless marked public.

### Auth (`/api/auth`)
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/register` | Public | Returns `{ data: { user, accessToken, refreshToken } }` |
| POST | `/login` | Public | Same response shape |
| POST | `/refresh` | Public | Exchange refresh token |
| GET | `/me` | Auth | Current user |
| POST | `/logout` | Auth | |
| PATCH | `/change-password` | Auth | `{ currentPassword, newPassword }` |

### Jobs · Candidates · Applications
Standard CRUD under `/api/jobs`, `/api/candidates`, `/api/applications`.  
Stage update: `PATCH /api/applications/:id` with `{ stage }`.  
SSE timeline: `GET /api/applications/:id/timeline/stream`.

### Matching (`/api/matches`)
| Method | Path | Notes |
|---|---|---|
| POST | `/calculate` | Score one candidate against one job |
| GET | `/job/:jobId` | Ranked candidates for a job |
| GET | `/candidate/:candidateId` | Matched jobs for a candidate |
| POST | `/recalculate/job/:jobId` | Recalculate all matches for a job |

### Workflows (`/api/workflows`)
| Method | Path | Access |
|---|---|---|
| GET | `/` | Auth |
| GET | `/:id` | Auth |
| POST | `/` | Recruiter, Admin |
| PUT | `/:id` | Recruiter, Admin |
| DELETE | `/:id` | Admin |
| PATCH | `/:id/toggle` | Recruiter, Admin |
| POST | `/preview` | Auth — dry-run, no side effects |
| GET | `/jobs` | Auth — Agenda job queue |
| GET | `/stats` | Auth — Agenda stats |

### Runs (`/api/runs`)
| Method | Path | Notes |
|---|---|---|
| GET | `/` | Filter by `workflowId`, `applicationId`, `state` |
| GET | `/:id` | Full run with step logs |
| POST | `/:id/pause` | Recruiter, Admin |
| POST | `/:id/resume` | Recruiter, Admin |
| POST | `/:id/cancel` | Recruiter, Admin |

### System endpoints (no `/api` prefix)
| Path | Notes |
|---|---|
| `GET /healthz` | DB connection status |
| `GET /metrics` | `{ runs_started, steps_retried, emails_sent, sms_sent }` |
| `POST /webhook/echo` | Test webhook target — echoes payload |

---

## Running Tests

MongoDB must be running on `localhost:27017`. Tests use a separate `event-ats-test` database (cleared on each run).

```bash
cd backend
npm run test:once   # run once with verbose output (CI)
npm test            # watch mode
```

**16 integration tests** cover: auth (register, login, validation, RBAC), workflow CRUD + toggle + preview, matching calculation, application creation, metrics endpoint, health endpoint.

---

## Workflow Engine

Workflows are built in the UI and stored as MongoDB documents. On triggering events:

```
Application created  ──► workflowEngine.trigger('Application.created', context)
Stage changed        ──► workflowEngine.trigger('Stage.changed', context)
```

For each matching enabled Workflow:
1. A **Run** record is created (`state: queued`)
2. `executeRun()` processes steps sequentially from `stepPointer`

| Step type | Behaviour |
|---|---|
| `sendEmail` | Sends via nodemailer; increments `metrics.emails_sent` |
| `sendSMS` | Mock: logs to console + AuditLog; increments `metrics.sms_sent` |
| `wait` | Schedules Agenda `resume-run` job; sets run `state: paused`; returns |
| `webhook` | HTTP POST with 4-attempt exponential backoff (0 → 1s → 2s → 4s) on 5xx; each retry increments `metrics.steps_retried` |

Step configs support `{{candidate.name}}`, `{{job.title}}` etc. — resolved at runtime against the trigger context.

Each step emits an SSE event on `run:log:<applicationId>` so the frontend timeline updates live.

---

## RBAC

| Role | Capabilities |
|---|---|
| **Admin** | Full access — all CRUD, delete, audit logs |
| **Recruiter** | Create/edit jobs, candidates, applications, workflows; view audit logs; pause/resume/cancel runs |
| **Viewer** | Read-only — jobs, candidates, applications, matches |

---

## Docker Details

```
docker-compose up --build
```

- **mongo** (mongo:7) — data persisted in `mongo_data` volume
- **backend** — built from `backend/Dockerfile`; resume uploads in `uploads_data` volume; health-checked via `GET /healthz`
- **frontend** — multi-stage build (Node 20 → nginx:alpine); `VITE_API_URL=/api` baked at build time; nginx proxies `/api/` → backend:5001, with SSE buffering disabled on `/api/applications/`

To change `JWT_SECRET` for Docker: set it in a `.env` file at the project root (docker-compose reads it automatically).

# TalentFlow — Event-Driven ATS

A full-stack Applicant Tracking System built on the MERN stack, featuring a custom event-driven workflow automation engine with real-time Server-Sent Events, MongoDB-backed job scheduling via Agenda, JWT/RBAC authentication, a visual workflow builder, and a polished production-ready UI with a custom design system.

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
| **Onboarding** | First-time user wizard walks through features and role-conditional quick-start links |
| **Global Search** | Navbar search bar — debounced live search across candidates and jobs with an inline dropdown |
| **Notifications** | Navbar bell — recent-applications feed with stage badges and time-ago formatting |

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 3, React Router v6, @dnd-kit (drag-and-drop) |
| UI Library | Custom component library — Button, Input, Select, Card, Badge, Modal, Skeleton, EmptyState, Spinner, PageHeader |
| Styling | Inter font, indigo design tokens (`brand.*`), Zinc neutrals, `cn()` via clsx + tailwind-merge |
| Toasts | react-hot-toast (replaces all `alert()`/`confirm()` dialogs) |
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
│   │   ├── api.test.js        # 18 integration tests
│   │   └── setup.js           # sets env vars before server.js loads
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── favicon.svg        # Indigo "T" lettermark SVG
│   └── src/
│       ├── api/               # axios wrapper per resource
│       │   ├── client.js      # axios instance with auth interceptor (unwraps response.data)
│       │   ├── index.js       # re-exports all API modules
│       │   └── applications.js, auth.js, candidates.js, jobs.js,
│       │       matches.js, runs.js, workflows.js, auditLogs.js
│       ├── components/
│       │   ├── ui/            # Design system components
│       │   │   ├── Badge.jsx      # variants + stageToBadgeVariant(), stateToBadgeVariant()
│       │   │   ├── Button.jsx     # variants: primary|secondary|outline|ghost|danger
│       │   │   ├── Card.jsx       # padding variants, hover shadow
│       │   │   ├── EmptyState.jsx # icon + title + description + optional CTA
│       │   │   ├── Input.jsx      # label, hint, error, icon slots
│       │   │   ├── Modal.jsx      # portal, focus trap, a11y, animations
│       │   │   ├── PageHeader.jsx # title + subtitle + right actions slot
│       │   │   ├── Select.jsx     # same pattern as Input
│       │   │   ├── Skeleton.jsx   # shimmer presets per page type
│       │   │   └── Spinner.jsx    # SVG spinner, sizes xs–lg
│       │   ├── common/        # ErrorBoundary, ProtectedRoute
│       │   ├── matching/      # MatchingScreen, JobSelector, CandidateList, ScoreBar, SkillPill
│       │   ├── onboarding/
│       │   │   └── OnboardingModal.jsx  # 4-step first-use wizard
│       │   ├── timeline/      # ApplicationTimeline (SSE), TimelineEvent
│       │   ├── upload/        # ResumeUploader
│       │   ├── workflow/      # WorkflowBuilder (dnd-kit), WorkflowStep, WorkflowTrigger, StepPalette
│       │   ├── Layout.jsx     # responsive shell with mobile sidebar overlay
│       │   ├── Navbar.jsx     # hamburger menu, live search, notifications feed, settings, user menu
│       │   └── Sidebar.jsx    # mobile drawer + desktop fixed; brand header + nav + user footer
│       ├── contexts/
│       │   └── AuthContext.jsx  # login, logout, register, hasRole, isAuthenticated
│       ├── hooks/
│       │   ├── useDebounce.js
│       │   ├── useOptimisticUpdate.js
│       │   ├── usePagination.js
│       │   └── useSSE.js      # SSE connection hook
│       ├── lib/
│       │   └── utils.js       # cn() = twMerge(clsx(...)) helper
│       ├── pages/
│       │   ├── Applications.jsx
│       │   ├── AuditLogs.jsx
│       │   ├── Candidates.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Jobs.jsx
│       │   ├── Login.jsx      # split-screen layout (brand panel + form)
│       │   ├── Matches.jsx
│       │   ├── Profile.jsx
│       │   └── Workflows.jsx  # tabs: Workflows | Runs
│       ├── App.jsx
│       ├── index.css          # Tailwind directives + CSS custom props + skeleton shimmer
│       └── main.jsx           # React.StrictMode + Toaster
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
| GET | `/` | List all matches; filter by `jobId`, `candidateId`, `minScore`, `quality` |
| POST | `/calculate` | Score one candidate against one job (save/upsert) |
| GET | `/score?candidateId=&jobId=` | Calculate score on-the-fly without saving |
| GET | `/job/:jobId` | Ranked candidates for a job |
| GET | `/candidate/:candidateId` | Matched jobs for a candidate |
| POST | `/recalculate/job/:jobId` | Recalculate all matches for a job |
| POST | `/recalculate/candidate/:candidateId` | Recalculate all matches for a candidate |
| GET | `/top-candidates/:jobId` | Top `limit` candidates for a job |
| GET | `/top-jobs/:candidateId` | Top `limit` jobs for a candidate |
| GET | `/stats/job/:jobId` | Aggregate score stats + quality distribution for a job |
| GET | `/:matchId` | Single match record |
| DELETE | `/:matchId` | Delete a match record |

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
| `GET /healthz` | DB connection status — returns `200 OK` (connected) or `500 Server Error` (disconnected) |
| `GET /metrics` | `{ runs_started, steps_retried, emails_sent, sms_sent }` |
| `POST /webhook/echo` | Test webhook target — echoes payload |

### API Pagination & Security Extensions
1. **Cursor-Based Pagination**
   - Available on `GET /api/candidates` and `GET /api/jobs`.
   - Provide an optional `cursor` query parameter representing the `_id` of the last document on the previous page.
   - Response pagination object includes `nextCursor` and `hasMore`.
   - Reverts to page-offset pagination when `cursor` is omitted.
2. **Resume Virus Scanning**
   - Candidate resume uploads automatically execute a mock security/malware scan stub.
   - Returns `400 Bad Request` and aborts parsing if a threat is detected.
3. **Request Correlation IDs**
   - All HTTP requests generate a unique correlation ID via UUID (`X-Correlation-ID` header).
   - This ID is propagated into audit logs, workflow runs, and individual run step logs.

---

## Running Tests

MongoDB must be running on `localhost:27017`. Tests use a separate `event-ats-test` database (cleared on each run).

```bash
cd backend
npm run test:once   # run once with verbose output (CI)
npm test            # watch mode
```

**18 integration tests** cover: auth (register, login, validation, RBAC), workflow CRUD + toggle + preview, matching calculation, application creation, webhook retry behaviour, rate-limit enforcement, metrics endpoint, health endpoint.

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

## Design System

The frontend uses a custom design system built entirely with Tailwind CSS — no third-party component library.

### Tokens
| Token | Value | Usage |
|---|---|---|
| `brand.600` | `#4f46e5` | Primary buttons, active nav, links |
| `brand.50–950` | indigo scale | Badge backgrounds, hover states |
| `surface.DEFAULT` | `#ffffff` | Card backgrounds |
| `surface.muted` | `#f4f4f5` | Page background, skeleton base |
| Font | Inter (Google Fonts) | All text |

### Components (`src/components/ui/`)
- **Button** — variants: `primary` `secondary` `outline` `ghost` `danger`; loading spinner; `leftIcon`/`rightIcon` slots
- **Input** — label, hint, error text, left/right icon slots; auto-generated aria-describedby
- **Select** — same API as Input, custom ChevronDown arrow
- **Card** — padding variants (`none` `sm` `md` `lg`); optional hover shadow transition
- **Badge** — variants: `default` `success` `warning` `danger` `info` `purple` `brand`; exports `stageToBadgeVariant()` and `stateToBadgeVariant()` helpers
- **Modal** — React portal, focus trap, Escape to close, body scroll lock, ARIA dialog role
- **Skeleton** — shimmer animation presets: `StatCardSkeleton`, `JobCardSkeleton`, `CandidateCardSkeleton`, `TableRowSkeleton`
- **EmptyState** — icon + title + description + optional primary CTA button
- **Spinner** — SVG-based, sizes `xs` `sm` `md` `lg`
- **PageHeader** — title + subtitle + right-aligned actions slot

### `cn()` helper (`src/lib/utils.js`)
```js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) { return twMerge(clsx(inputs)); }
```

---

## Onboarding

First-time users see a 4-step onboarding wizard on login:

1. **Welcome** — brand logo and value proposition
2. **Features** — Workflow Builder / AI Matching / Real-time Timeline
3. **Quick Start** — role-conditional links (Admin/Recruiter: create job + workflow; Viewer: browse)
4. **Done** — celebration + Dashboard CTA

Completion is stored in `localStorage` under key `ats_onboarding_complete`. Refreshing after completion skips the modal entirely.

---

## RBAC

| Role | Capabilities |
|---|---|
| **Admin** | Full access — all CRUD, delete, audit logs |
| **Recruiter** | Create/edit jobs, candidates, applications, workflows; view audit logs; pause/resume/cancel runs |
| **Viewer** | Read-only — jobs, candidates, applications, matches |

---

## Docker Details & Seeding

### Seeding the Database
The first time you start the Docker containers, you must seed the database with test data:

```bash
docker-compose exec backend node scripts/seed.js
```

This clears the database and populates 50 candidates, 10 jobs, 3 sample workflows, and 2 users:
- **Admin**: `admin@ats.com` / `admin123`
- **Recruiter**: `recruiter@ats.com` / `recruiter123`

### Multi-Container Setup
- **mongo** (mongo:7) — data persisted in `mongo_data` volume; health-checked via `mongosh` ping.
- **backend** — built from `backend/Dockerfile`; resume uploads in `uploads_data` volume; health-checked via `GET /healthz` (depends on mongo healthy).
- **frontend** — multi-stage build (Node 20 → nginx:alpine); `VITE_API_URL=/api` baked at build time; nginx proxies `/api/` → backend:5001, with SSE buffering disabled on `/api/applications/` (depends on backend healthy).

To change `JWT_SECRET` for Docker: set it in a `.env` file at the project root (docker-compose reads it automatically).

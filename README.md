# VedaAI — AI Assessment Creator

A teacher-facing web platform that lets educators configure assignment parameters and receive AI-generated, curriculum-aligned question papers in real time. Teachers register or sign in (email/password or Google OAuth), complete a two-step wizard, and receive a fully structured CBSE-aligned question paper powered by Google Gemini — with live WebSocket progress updates and one-click PDF export.

---

## Prerequisites

| Tool | Minimum Version | Notes |
|------|----------------|-------|
| [Node.js](https://nodejs.org/) | 20.x | Required for local development and running workspace scripts |
| [npm](https://www.npmjs.com/) | 10.x (bundled with Node 20) | Used for workspace management |


> **Google credentials**: You will need a [Google Cloud OAuth 2.0 client](https://console.cloud.google.com/apis/credentials) and a [Gemini API key](https://aistudio.google.com/app/apikey) before the application can start.

---

## Quick Start

The fastest way to run the entire stack — MongoDB, Redis, API, and web frontend — is with Docker Compose.

**1. Clone the repository**

```bash
git clone <repo-url>
```

**2. Set up environment variables**

```bash
cp .env.example .env
```

Open `.env` and fill in the required values (see [Environment Variable Setup](#environment-variable-setup) below).

**3. Start all services**

```bash
npm run dev
```

This builds the API and web images, then starts all four services. On subsequent runs you can omit `--build` if the source hasn't changed:

```bash
npm run dev
```

**4. Open the app**

| Service | URL |
|---------|-----|
| Web frontend | http://localhost:3000 |
| API | http://localhost:5000 |
| MongoDB | localhost:27017 |
| Redis | localhost:6379 |

**5. Stop all services**

```bash
docker compose down
```

To also remove the persisted MongoDB volume:

```bash
docker compose down -v
```

---

## Environment Variable Setup

All configuration is driven by a single `.env` file at the repository root. Copy the example file and edit it:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string. Docker Compose default: `mongodb://mongodb:27017/vedaai` |
| `REDIS_URL` | Yes | Redis connection URL. Docker Compose default: `redis://redis:6379` |
| `JWT_SECRET` | Yes | Long, random secret for signing JWTs. Generate one with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `GOOGLE_CLIENT_ID` | Yes | OAuth 2.0 Client ID from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth 2.0 Client Secret from Google Cloud Console |
| `FRONTEND_URL` | Yes | Publicly accessible URL of the frontend. Local default: `http://localhost:3000` |
| `GEMINI_API_KEY` | Yes | Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `PORT` | No | Port for the Express API server. Defaults to `5000` |

> **Never commit your `.env` file.** It is listed in `.gitignore` by default.

---

## Local Development (without Docker)

For a faster feedback loop during development, you can run the services locally after starting MongoDB and Redis separately (or via `docker compose up mongodb redis`).

**Install all workspace dependencies from the root:**

```bash
npm install
```

**Start all packages in watch/dev mode:**

```bash
npm run dev
```

This runs `turbo run dev` across all workspaces in parallel — the API on port 5000 and the web app on port 3000.

---

## Workspace Script Reference

All scripts are run from the **repository root** and delegate to [Turborepo](https://turbo.build/).

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Starts all apps in development/watch mode |
| Build | `npm run build` | Compiles TypeScript and builds all packages for production |
| Test | `npm run test` | Runs the full test suite (unit + property-based tests) across all packages |
| Lint | `npm run lint` | Runs ESLint across all packages |
| Clean | `npm run clean` | Removes all `dist/` and `.next/` build artifacts |

### Per-package scripts

You can also run scripts scoped to a single package using Turborepo's `--filter` flag:

```bash
# Run tests only for the API
npx turbo run test --filter=@vedaai/api

# Run dev only for the web app
npx turbo run dev --filter=@vedaai/web
```

---

## Project Structure

```
.
├── apps/
│   ├── api/          # Node.js / Express backend (port 5000)
│   └── web/          # Next.js 14 frontend (port 3000)
├── packages/
│   └── shared/       # Shared TypeScript interfaces (@vedaai/shared)
├── .env.example      # Environment variable template
├── docker-compose.yml
├── package.json      # Root workspace configuration
└── turbo.json        # Turborepo pipeline configuration
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Zustand, Framer Motion |
| Backend | Node.js, Express, Passport.js |
| AI | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| Job Queue | BullMQ (Redis-backed) |
| Real-time | Socket.io |
| Database | MongoDB (Mongoose) |
| Cache | Redis (ioredis) |
| PDF Export | @react-pdf/renderer |
| Testing | Jest, fast-check (property-based tests) |
| Containerisation | Docker, Docker Compose |

---

## Architecture Overview

### System Flow

```
Teacher (Browser)
      │
      │  1. Fill wizard (Step 1: file/questions, Step 2: title/subject/class)
      │  2. POST /api/assignments
      ▼
┌─────────────────────────────────────────────────────────┐
│                    Express API (port 5000)               │
│                                                         │
│  Auth routes  ──► JWT httpOnly cookie (bcrypt + HS256)  │
│  Assignment routes ──► MongoDB (store assignment doc)   │
│                    ──► BullMQ (enqueue generation job)  │
│  Upload routes ──► Multer + file-type + pdf-parse       │
│  Paper routes  ──► Redis cache → MongoDB fallback       │
└──────────────┬──────────────────────────────────────────┘
               │
               │  3. Job picked up by worker (concurrency 1)
               ▼
┌─────────────────────────────────────────────────────────┐
│              BullMQ Worker (generation.worker.ts)        │
│                                                         │
│  Build prompt (prompt.builder.ts)                       │
│      └─► subject, class, school, question types,        │
│          difficulty distribution, reference material     │
│                                                         │
│  Call Gemini 1.5 Flash (gemini.client.ts)               │
│      └─► Parse JSON response (strip code fences)        │
│      └─► Retry with strict JSON-only prompt on failure  │
│                                                         │
│  On success:                                            │
│      ├─► Save GeneratedPaper to MongoDB                 │
│      ├─► Cache paper in Redis (TTL 3600s)               │
│      ├─► Update Assignment status → 'completed'         │
│      └─► Emit job:complete via Socket.io                │
│                                                         │
│  On failure:                                            │
│      ├─► Update Assignment status → 'failed'            │
│      └─► Emit job:failed via Socket.io                  │
└──────────────┬──────────────────────────────────────────┘
               │
               │  4. Real-time events via Socket.io
               ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js Frontend (port 3000)                │
│                                                         │
│  useAssignmentSocket hook                               │
│      ├─► job:progress → animated progress bar           │
│      ├─► job:complete → fetch paper → render output     │
│      └─► job:failed  → show error card + Retry button   │
│                                                         │
│  Output page                                            │
│      ├─► QuestionPaperCard (exam-style layout)          │
│      ├─► AIMessageBubble (download PDF / regenerate)    │
│      └─► PDFDocument (@react-pdf/renderer, A4)          │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **No raw LLM output rendered**: The worker parses Gemini's response as strict JSON and validates `sections` + `answerKey` before saving. The frontend only renders structured `IGeneratedPaper` data.
- **Redis as dual-purpose store**: Acts as both the BullMQ job broker and a paper cache (TTL 3600s), reducing MongoDB reads on the hot path.
- **Zustand over Redux**: Lightweight state management for auth, wizard steps, and assignments list — no boilerplate reducers needed.
- **httpOnly JWT cookie**: Prevents XSS token theft; the Next.js middleware reads the cookie server-side to protect routes.
- **BullMQ concurrency 1**: Prevents Gemini API rate-limit errors by processing one generation job at a time.

# Implementation Plan: VedaAI — AI Assessment Creator

## Overview

Full-stack monorepo implementation covering backend (Express, MongoDB, Redis, BullMQ, Socket.io), frontend (Next.js 14, Zustand, Tailwind), shared types, AI generation worker, PDF export, and property-based tests. Tasks are ordered so each step builds on the previous, with no orphaned code.

---

## Tasks

- [x] 1. Monorepo scaffolding
  - [x] 1.1 Create root `package.json` with workspaces (`apps/api`, `apps/web`, `packages/shared`) and scripts (`dev`, `build`, `test`)
    - Configure npm/yarn workspaces; add root-level `turbo.json` or equivalent if desired
    - _Requirements: 16.1, 16.5_
  - [x] 1.2 Create root `tsconfig.base.json` with `strict: true`, `esModuleInterop`, `resolveJsonModule`, and path aliases; create per-package `tsconfig.json` files that extend it
    - _Requirements: 16.5_
  - [x] 1.3 Create `.env.example` listing every required variable (`MONGO_URI`, `REDIS_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL`, `GEMINI_API_KEY`, `PORT`) with a descriptive comment per variable
    - _Requirements: 16.2_
  - [x] 1.4 Create `docker-compose.yml` defining `mongodb` (mongo:7, port 27017), `redis` (redis:7-alpine, port 6379), `api` (port 5000, depends on mongodb + redis), and `web` (port 3000, depends on api)
    - _Requirements: 16.1_
  - [x] 1.5 Create root `README.md` documenting prerequisites, `docker compose up` quick-start, environment variable setup, and workspace script reference
    - _Requirements: 16.2_

- [x] 2. Shared types package (`packages/shared`)
  - [x] 2.1 Create `packages/shared/package.json` with name `@vedaai/shared`, `types` entry point, and no runtime dependencies
    - _Requirements: 16.3_
  - [x] 2.2 Create `packages/shared/src/index.ts` exporting all TypeScript interfaces: `IUser`, `IAssignment`, `IQuestionType`, `IGeneratedPaper`, `ISection`, `IQuestion`, `IAnswerKeyEntry`, `RegisterDto`, `LoginDto`, `CreateAssignmentDto`, `WsProgressPayload`, `WsCompletePayload`, `WsFailedPayload`
    - Interfaces must match MongoDB schemas exactly (field names, optional/required, enum literals)
    - _Requirements: 16.3, 16.5_

- [x] 3. Backend foundation (`apps/api`)
  - [x] 3.1 Initialise `apps/api/package.json`; install production dependencies: `express`, `mongoose`, `ioredis`, `socket.io`, `bullmq`, `winston`, `helmet`, `cors`, `express-rate-limit`, `joi`, `bcryptjs`, `jsonwebtoken`, `passport`, `passport-google-oauth20`, `multer`, `file-type`, `pdf-parse`, `@google/generative-ai`, `cookie-parser`; install dev dependencies: `typescript`, `ts-node`, `jest`, `ts-jest`, `supertest`, `fast-check`, `@types/*`
    - _Requirements: 14.1, 14.2, 16.4_
  - [x] 3.2 Create `apps/api/src/config/env.ts` that reads and validates all required environment variables at startup, throwing a descriptive error for any missing variable
    - _Requirements: 14.6, 14.7_
  - [x] 3.3 Create `apps/api/src/config/db.ts` establishing the Mongoose connection with retry logic and structured Winston log entries on connect, disconnect, and error
    - _Requirements: 16.4_
  - [x] 3.4 Create `apps/api/src/config/redis.ts` creating and exporting an `ioredis` client instance; log connection events via Winston
    - _Requirements: 16.4_
  - [x] 3.5 Create `apps/api/src/config/logger.ts` configuring a Winston logger with JSON format, timestamp, and transports for stdout (info+) and stderr (error+)
    - _Requirements: 16.4_
  - [x] 3.6 Create `apps/api/src/app.ts` wiring Express with `helmet()`, `cors({ origin: FRONTEND_URL, credentials: true })`, `cookie-parser`, `express.json()`, `express-rate-limit` (100 req / 15 min per IP with `Retry-After` header), and a request-logging middleware that emits a Winston entry per request (method, path, status, duration)
    - _Requirements: 14.1, 14.2, 14.3, 14.6, 14.7, 16.4_
  - [x] 3.7 Create `apps/api/src/server.ts` creating the HTTP server, attaching Socket.io, connecting to MongoDB and Redis, then listening on `PORT`
    - _Requirements: 16.1_

- [x] 4. Auth backend
  - [x] 4.1 Create `apps/api/src/models/user.model.ts` implementing the `UserSchema` (name, email, password, schoolName, location, googleId, avatar, timestamps) with indexes `{ email: 1 }` unique and `{ googleId: 1 }` sparse
    - _Requirements: 1.2, 3.2, 3.3, 3.4_
  - [x] 4.2 Create `apps/api/src/services/auth.service.ts` implementing `register`, `login`, `handleGoogleCallback`, `verifyToken`, and `getMe`; `register` hashes password with bcrypt cost 10; `login` uses `bcrypt.compare`; `handleGoogleCallback` handles new-user creation, googleId match, and email-link scenarios; all methods return `{ user: IUser; token: string }`
    - _Requirements: 1.2, 1.3, 1.7, 2.2, 2.3, 2.7, 3.2, 3.3, 3.4, 4.1, 14.8_
  - [x] 4.3 Create `apps/api/src/middleware/auth.middleware.ts` reading the `token` httpOnly cookie, verifying the JWT (HS256, secret from env), and attaching `req.userId`; return 401 for missing, expired, or malformed tokens
    - _Requirements: 4.2, 4.3, 4.4, 4.5_
  - [x] 4.4 Create `apps/api/src/routes/auth.routes.ts` with `POST /api/auth/register` (Joi validation → auth.service.register → Set-Cookie → 201), `POST /api/auth/login` (Joi validation → auth.service.login → Set-Cookie → 200), `GET /api/auth/me` (auth middleware → auth.service.getMe → 200), and `POST /api/auth/logout` (clear cookie → 200)
    - _Requirements: 1.1, 1.6, 1.7, 2.1, 2.4, 4.6, 4.9_
  - [x] 4.5 Create `apps/api/src/config/passport.ts` configuring `passport-google-oauth20` strategy; on callback call `auth.service.handleGoogleCallback`; mount `GET /api/auth/google` and `GET /api/auth/google/callback` routes; on success set JWT cookie and redirect to `/assignments`; on failure redirect to `/login?error=oauth_failed`
    - _Requirements: 3.1, 3.5, 3.6_

- [x] 5. File upload backend
  - [x] 5.1 Create `apps/api/src/services/file.service.ts` implementing `processUpload(file: Express.Multer.File)`: validate presence (400), size ≤ 10 485 760 bytes (413), magic-byte MIME against `['image/jpeg','image/png','application/pdf']` using `file-type` (415); for PDF call `pdf-parse` and return `{ uploadedFileText }`; for images persist to local `uploads/` directory and return `{ uploadedFileUrl }`; on PDF parse failure return 422
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 14.4_
  - [x] 5.2 Create `apps/api/src/routes/upload.routes.ts` mounting `POST /api/upload` with Multer memory-storage (limit 10 MB) and calling `file.service.processUpload`; serve the `uploads/` directory as static files
    - _Requirements: 7.1, 7.6_

- [x] 6. Assignment backend
  - [x] 6.1 Create `apps/api/src/models/assignment.model.ts` implementing `QuestionTypeSchema` and `AssignmentSchema` (all fields per design) with indexes `{ userId: 1, createdAt: -1 }` and `{ jobId: 1 }` sparse
    - _Requirements: 8.1, 8.8_
  - [x] 6.2 Create `apps/api/src/services/assignment.service.ts` implementing `create`, `list`, `getById`, `deleteById`, and `regenerate`; `create` inserts with `status: 'pending'` and enqueues a BullMQ job to `"question-generation"` queue; `getById` and `deleteById` enforce ownership (403 on mismatch); `deleteById` also deletes the associated `GeneratedPaper` and Redis cache entry; `regenerate` checks status (409 if pending/processing), resets to pending, and enqueues a new job; log all job lifecycle events via Winston
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 13.1, 13.2, 13.3, 16.4_
  - [x] 6.3 Create `apps/api/src/routes/assignment.routes.ts` mounting `POST /api/assignments` (Joi validation → assignment.service.create → 201), `GET /api/assignments` (→ list → 200), `GET /api/assignments/:id` (→ getById → 200), `DELETE /api/assignments/:id` (→ deleteById → 200), and `POST /api/assignments/:id/regenerate` (→ regenerate → 200); all routes protected by auth middleware
    - _Requirements: 8.1, 8.2, 8.3, 8.6, 13.1_

- [x] 7. GeneratedPaper backend
  - [x] 7.1 Create `apps/api/src/models/paper.model.ts` implementing `QuestionSchema`, `SectionSchema`, `AnswerKeyEntrySchema`, and `GeneratedPaperSchema` with index `{ assignmentId: 1 }` unique
    - _Requirements: 9.8, 11.1_
  - [x] 7.2 Create `apps/api/src/routes/paper.routes.ts` mounting `GET /api/assignments/:id/paper` (auth middleware → check Redis cache `paper:{assignmentId}` → on miss fetch from MongoDB → return 200 with paper; return 404 if not found); mount under assignment router
    - _Requirements: 9.8, 11.1_

- [x] 8. WebSocket server
  - [x] 8.1 Create `apps/api/src/sockets/index.ts` attaching Socket.io to the HTTP server with CORS matching `FRONTEND_URL`; implement `join:assignment` handler that calls `socket.join('assignment:{assignmentId}')`; export the `io` instance for use by the worker
    - _Requirements: 10.1, 10.2_

- [x] 9. BullMQ generation worker
  - [x] 9.1 Create `apps/api/src/workers/prompt.builder.ts` implementing `buildPrompt(assignment: IAssignment): string` that includes subject, class, school name, time allowed, instructions, each question type with count and marks, CBSE curriculum context, uploaded text or file URL, and explicit difficulty distribution instruction (40% Easy, 40% Moderate, 20% Hard); implement `sanitizeForPrompt(input: string): string` stripping backticks, backslashes, and collapsing 3+ consecutive newlines
    - _Requirements: 9.4, 9.11, 14.5_
  - [x] 9.2 Create `apps/api/src/workers/gemini.client.ts` wrapping `@google/generative-ai` for `gemini-1.5-flash`; implement `generate(prompt: string): Promise<string>` returning the raw text response; implement `generateStrict(prompt: string): Promise<string>` prepending the JSON-only instruction for retry
    - _Requirements: 9.5_
  - [x] 9.3 Create `apps/api/src/workers/generation.worker.ts` consuming the `"question-generation"` BullMQ queue with concurrency 1; for each job: emit `job:progress` (20%, "Analyzing your inputs...") → fetch Assignment (not found → fail + emit `job:failed`) → build and sanitize prompt → call `gemini.client.generate` → emit `job:progress` (70%, "Structuring your question paper...") → parse JSON response (validate non-empty `sections` and `answerKey`) → on parse failure retry once with `gemini.client.generateStrict` → on second failure update Assignment status to `'failed'` + emit `job:failed` → on success save `GeneratedPaper` to MongoDB → write serialized paper to Redis `paper:{assignmentId}` with TTL 3600 → update Assignment status to `'completed'` → emit `job:complete`; for regeneration jobs delete existing Redis cache entry before saving new paper; log all lifecycle events via Winston
    - _Requirements: 9.1, 9.2, 9.3, 9.6, 9.7, 9.8, 9.9, 9.10, 13.4, 13.5, 16.4_
  - [x] 9.4 Register the worker in `apps/api/src/server.ts` so it starts alongside the Express server
    - _Requirements: 9.1_

- [x] 10. Regeneration endpoint
  - [x] 10.1 Add `POST /api/assignments/:id/regenerate` route in `apps/api/src/routes/assignment.routes.ts` calling `assignment.service.regenerate`; the service method enforces ownership (403), rejects pending/processing status (409), resets status to `'pending'`, and enqueues a new BullMQ job
    - _Requirements: 13.1, 13.2, 13.3_

- [ ] 11. Backend checkpoint — ensure all API routes respond correctly
  - Ensure all tests pass, ask the user if questions arise.


- [x] 12. Frontend foundation (`apps/web`)
  - [x] 12.1 Initialise `apps/web` as a Next.js 14 app-router project; install dependencies: `tailwindcss`, `framer-motion`, `zustand`, `axios`, `socket.io-client`, `react-hook-form`, `zod`, `@hookform/resolvers`, `sonner`, `@react-pdf/renderer`, `date-fns`; configure `tailwind.config.ts` with design tokens (sidebar bg `#1a1f2e`, accent `#6366f1`, card border-radius `0.75rem`, main bg `#f8fafc`)
    - _Requirements: 15.5, 15.6, 15.7_
  - [x] 12.2 Configure `apps/web/next.config.js` with `output: 'standalone'`, environment variable forwarding, and image domain allowlist; configure `apps/web/tsconfig.json` extending base with `strict: true` and path alias `@/*`
    - _Requirements: 16.5_
  - [x] 12.3 Create `apps/web/src/lib/api.ts` exporting an Axios instance with `baseURL: process.env.NEXT_PUBLIC_API_URL`, `withCredentials: true`, and response interceptors that extract `data.data` on success and throw a typed `ApiError` on failure
    - _Requirements: 6.6, 8.9_
  - [x] 12.4 Create `apps/web/src/store/auth.store.ts` (Zustand) with `user: IUser | null`, `setUser`, and `logout` actions; create `apps/web/src/store/wizard.store.ts` with `step1: Step1Data | null`, `step2: Step2Data | null`, `setStep1`, `setStep2`, and `reset`; create `apps/web/src/store/assignments.store.ts` with `assignments: IAssignment[]`, `setAssignments`, `addAssignment`, `removeAssignment`, and `updateAssignment`
    - _Requirements: 6.8, 8.9, 8.11_
  - [x] 12.5 Create `apps/web/src/middleware.ts` reading the `token` cookie and redirecting unauthenticated requests to `/login`; protect the matcher `['/assignments/:path*']`
    - _Requirements: 4.7_
  - [x] 12.6 Create `apps/web/src/app/layout.tsx` as the root layout importing the Inter font from `next/font/google`, wrapping children in a `<Toaster />` (sonner) provider, and applying global Tailwind base styles
    - _Requirements: 15.6_

- [x] 13. Auth frontend
  - [x] 13.1 Create `apps/web/src/app/(auth)/login/page.tsx` rendering an email/password form managed by React Hook Form + Zod (`email` required valid email, `password` required); on submit call `POST /api/auth/login` via api client; on success store user in auth store and redirect to `/assignments`; on error show sonner toast; include a "Sign in with Google" button linking to `GET /api/auth/google`
    - _Requirements: 2.1, 2.5, 2.6, 3.7, 4.8_
  - [x] 13.2 Create `apps/web/src/app/(auth)/register/page.tsx` rendering a registration form (name, email, password, schoolName, location) managed by React Hook Form + Zod matching API constraints; on submit call `POST /api/auth/register`; on success show success toast and redirect to `/assignments`; on error show sonner toast with field-level inline errors; include "Sign in with Google" button
    - _Requirements: 1.8, 1.9, 3.7_
  - [x] 13.3 Create `apps/web/src/hooks/useAuth.ts` calling `GET /api/auth/me` on mount and populating the auth store; used in the root layout to restore session on page load
    - _Requirements: 4.8_

- [x] 14. Layout components
  - [x] 14.1 Create `apps/web/src/components/layout/AppLayout.tsx` rendering the `<Sidebar />` on `md+` viewports and `<BottomTabBar />` on viewports narrower than 768 px; wrap page content in a `<main>` with the main background color token; apply Framer Motion page-transition wrapper (≤ 300 ms)
    - _Requirements: 15.1, 15.2, 15.5, 15.7_
  - [x] 14.2 Create `apps/web/src/components/layout/Sidebar.tsx` with navigation links (Home, Assignments with badge, Library, AI Toolkit), the VedaAI logo, and a logout button that calls `POST /api/auth/logout`, clears the auth store, and redirects to `/login`; apply sidebar background color token; hide on `< md`
    - _Requirements: 4.9, 8.11, 15.2, 15.7_
  - [x] 14.3 Create `apps/web/src/components/layout/BottomTabBar.tsx` with tabs for Home, Assignments, Library, and AI Toolkit; visible only on `< md`; all interactive targets ≥ 44 × 44 px
    - _Requirements: 15.1, 15.9_
  - [x] 14.4 Create `apps/web/src/components/layout/TopHeader.tsx` rendering the page title and any contextual action buttons (e.g., "New Assignment"); used inside `AppLayout` above the page content area
    - _Requirements: 15.7_

- [x] 15. Assignments list page
  - [x] 15.1 Create `apps/web/src/components/assignments/AssignmentCard.tsx` displaying assignment title, subject, class, status badge (color-coded: pending=gray, processing=blue, completed=green, failed=red), due date, and a delete button; delete triggers optimistic removal from the assignments store then calls `DELETE /api/assignments/:id`; on API error restore the card and show a sonner toast
    - _Requirements: 8.9, 8.11, 16.7, 16.8_
  - [x] 15.2 Create `apps/web/src/app/(app)/assignments/page.tsx` fetching `GET /api/assignments` on mount and populating the assignments store; render a search bar (filters by title) and a status filter dropdown; render assignments in a 2-column grid (`md+`) / 1-column (`< md`) using `AssignmentCard`; show a loading skeleton while fetching; show empty state with "Create Your First Assignment" CTA when list is empty
    - _Requirements: 8.9, 8.10, 15.3, 16.6_

- [x] 16. Create assignment wizard
  - [x] 16.1 Create `apps/web/src/components/wizard/FileUploadZone.tsx` accepting drag-and-drop or click-to-browse; validate file type (JPEG, PNG, PDF only) and size (≤ 10 MB) client-side before upload; show image thumbnail for JPEG/PNG and filename + document icon for PDF; show inline error for invalid type or oversized file; on valid file call `POST /api/upload` and store the response in the wizard store
    - _Requirements: 5.2, 5.3, 5.4_
  - [x] 16.2 Create `apps/web/src/components/wizard/QuestionTypeRow.tsx` rendering a type dropdown (MCQ, Short Questions, Long Questions, Diagram/Graph-Based Questions, Numerical Problems, True/False, Fill in the Blanks), a count input, a marks input, and a remove button; all inputs ≥ 44 × 44 px touch targets
    - _Requirements: 5.5, 5.7, 5.8, 15.9_
  - [x] 16.3 Create `apps/web/src/components/wizard/Step1Details.tsx` managed by React Hook Form + Zod (`step1Schema`); render `FileUploadZone`, due date input (validate not in past), question types table using `QuestionTypeRow` with "+ Add Question Type" button, Total Questions and Total Marks computed display (recalculated within 300 ms of any count/marks change), and additional info textarea (2000-char limit with counter and microphone icon decoration); on "Next" validate and save to wizard store
    - _Requirements: 5.1, 5.6, 5.9, 5.10, 5.11, 5.12_
  - [x] 16.4 Create `apps/web/src/components/wizard/Step2Settings.tsx` managed by React Hook Form + Zod (`step2Schema`); render fields for Assignment Title, Subject, Class/Grade, School Name (pre-filled from auth store), Time Allowed, and Instructions; on "Generate Assignment →" validate, merge with Step 1 data from wizard store, call `POST /api/assignments`, on success navigate to `/assignments/{id}`, on error show sonner toast; "Previous" button navigates back to Step 1 without clearing Step 1 store data
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_
  - [x] 16.5 Create `apps/web/src/app/(app)/assignments/create/page.tsx` rendering a wizard progress bar (Step 1 / Step 2), conditionally rendering `Step1Details` or `Step2Settings` based on current step state; reset wizard store on unmount
    - _Requirements: 5.1, 6.1_

- [x] 17. Assignment output page
  - [x] 17.1 Create `apps/web/src/hooks/useAssignmentSocket.ts` establishing a Socket.io connection on mount, emitting `join:assignment` with the assignment ID, listening for `job:progress` (update progress value + message in local state), `job:complete` (fetch paper, update assignments store status), and `job:failed` (set error state); handle connection loss with inline error + "Retry Connection" button; disconnect on unmount
    - _Requirements: 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_
  - [x] 17.2 Create `apps/web/src/components/output/AIMessageBubble.tsx` rendering a dark-background card with a contextual AI message, a "⬇ Download as PDF" button, and a "↺ Regenerate" button; "Regenerate" shows a confirmation dialog (warning + Confirm/Cancel); on confirm call `POST /api/assignments/:id/regenerate` and reset progress state; show sonner toast on regeneration trigger
    - _Requirements: 11.11, 13.6, 13.7, 13.8, 16.8_
  - [x] 17.3 Create `apps/web/src/components/output/QuestionPaperCard.tsx` rendering the paper in a white card styled as a printed exam: school name centered bold, subject + class centered, time allowed left-aligned and total marks right-aligned on the same row, student info blanks (Name, Roll Number, Class/Section), each section with a centered uppercase header followed by sequentially numbered questions each showing a difficulty badge (green=Easy, amber=Moderate, red=Hard) and marks value, and a collapsible Answer Key section (collapsed by default)
    - _Requirements: 11.1, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_
  - [x] 17.4 Create `apps/web/src/app/(app)/assignments/[id]/page.tsx` fetching the assignment on mount; if status is `completed` fetch and display the paper immediately; if status is `pending` or `processing` show loading skeleton and connect via `useAssignmentSocket`; render `AIMessageBubble` above `QuestionPaperCard`; handle `job:failed` with error card + "Retry" button; show loading skeleton while fetching
    - _Requirements: 10.3, 10.7, 11.1, 11.2, 11.3, 16.6_

- [x] 18. PDF export
  - [x] 18.1 Create `apps/web/src/components/PDFDocument.tsx` using `@react-pdf/renderer`; render A4 page with 20 mm margins, school name centered bold, horizontal divider between each section header and its questions, difficulty tag `[Easy]`/`[Moderate]`/`[Hard]` before each question text, Answer Key on a separate page with question number + answer pairs, and page number in the footer of every page; dynamic import with `ssr: false`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  - [x] 18.2 Create `apps/web/src/lib/pdf.utils.ts` implementing `buildFilename(subject: string, cls: string): string` that replaces spaces with underscores and removes all non-alphanumeric characters from both inputs, then returns `{sanitized_subject}_Class{sanitized_class}_QuestionPaper.pdf`; wire the download trigger in `AIMessageBubble` using `@react-pdf/renderer`'s `pdf()` blob API without navigating away; show sonner toast on failure with retry option
    - _Requirements: 12.7, 12.8, 12.9, 16.8_

- [ ] 19. Frontend checkpoint — ensure all pages render and interact correctly
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 20. Property-based tests
  - [ ] 20.1 Create `apps/api/src/__tests__/auth.property.test.ts`
    - [ ] 20.1.1 Write property test for P1: Password Hash Irreversibility
      - Use `fast-check` to generate random valid registration payloads; for each, call `auth.service.register`, then assert `storedHash !== plaintext` and `bcrypt.compare(plaintext, storedHash) === true`
      - `{ numRuns: 100 }`
      - **Property 1: Password Hash Irreversibility**
      - **Validates: Requirements 1.2, 14.8**
      - `// Feature: vedaai-assessment-creator, Property 1: Password Hash Irreversibility`
  - [ ] 20.2 Create `apps/api/src/__tests__/assignment.property.test.ts`
    - [ ] 20.2.1 Write property test for P2: Assignment Ownership Enforcement
      - Generate random `userId` / `assignmentUserId` pairs where they differ; assert that `getById`, `deleteById`, and `regenerate` all throw `ForbiddenError`
      - `{ numRuns: 100 }`
      - **Property 2: Assignment Ownership Enforcement**
      - **Validates: Requirements 8.5, 8.7, 13.3**
      - `// Feature: vedaai-assessment-creator, Property 2: Assignment Ownership Enforcement`
  - [ ] 20.3 Create `apps/api/src/__tests__/paper.property.test.ts`
    - [ ] 20.3.1 Write property test for P3: Question Count and Marks Invariants
      - Generate random section arrays with varying question counts; assert `sum(section.questions.length) === totalQuestions` and `sum(marksPerQuestion × questions.length) === totalMarks`
      - `{ numRuns: 100 }`
      - **Property 3: Question Count and Marks Invariants**
      - **Validates: Requirements 9.5, 9.8**
      - `// Feature: vedaai-assessment-creator, Property 3: Question Count and Marks Invariants`
    - [ ] 20.3.2 Write property test for P4: Difficulty Distribution Invariant
      - Generate random papers with ≥ 10 questions; assert Easy 30–50%, Moderate 30–50%, Hard 10–30%
      - `{ numRuns: 100 }`
      - **Property 4: Difficulty Distribution Invariant**
      - **Validates: Requirements 9.11**
      - `// Feature: vedaai-assessment-creator, Property 4: Difficulty Distribution Invariant`
  - [ ] 20.4 Create `apps/api/src/__tests__/cache.property.test.ts`
    - [ ] 20.4.1 Write property test for P5: Redis Cache Consistency
      - Generate random `IGeneratedPaper` objects; serialize to Redis and deserialize; assert deep equality with the original object across all fields
      - `{ numRuns: 100 }`
      - **Property 5: Redis Cache Consistency**
      - **Validates: Requirements 9.8**
      - `// Feature: vedaai-assessment-creator, Property 5: Redis Cache Consistency`
  - [ ] 20.5 Create `apps/web/src/__tests__/wizard.property.test.ts`
    - [ ] 20.5.1 Write property test for P6: Wizard Step 1 State Preservation
      - Generate random Step 1 field values; set in wizard store; simulate forward navigation to Step 2 then "Previous"; assert every Step 1 field in the store is identical to its pre-navigation value
      - `{ numRuns: 100 }`
      - **Property 6: Wizard Step 1 State Preservation**
      - **Validates: Requirements 6.8**
      - `// Feature: vedaai-assessment-creator, Property 6: Wizard Step 1 State Preservation`
  - [ ] 20.6 Create `apps/web/src/__tests__/pdf.property.test.ts`
    - [ ] 20.6.1 Write property test for P7: PDF Filename Sanitization
      - Generate random subject and class strings including spaces, special characters, unicode, and all-non-alphanumeric strings; assert output matches `{sanitized}_Class{sanitized}_QuestionPaper.pdf` with only alphanumeric chars and underscores
      - `{ numRuns: 100 }`
      - **Property 7: PDF Filename Sanitization**
      - **Validates: Requirements 12.7**
      - `// Feature: vedaai-assessment-creator, Property 7: PDF Filename Sanitization`
  - [ ] 20.7 Create `apps/api/src/__tests__/validation.property.test.ts`
    - [ ] 20.7.1 Write property test for P8: Whitespace-Only Required Field Rejection
      - Generate whitespace-only strings for required fields in `POST /api/auth/register` and `POST /api/assignments`; assert 422 response and no new MongoDB document created
      - `{ numRuns: 100 }`
      - **Property 8: Whitespace-Only Required Field Rejection**
      - **Validates: Requirements 1.6, 6.3**
      - `// Feature: vedaai-assessment-creator, Property 8: Whitespace-Only Required Field Rejection`
  - [ ] 20.8 Create `apps/web/src/__tests__/totals.property.test.ts`
    - [ ] 20.8.1 Write property test for P9: Frontend Total Recalculation Correctness
      - Generate random arrays of `{ count, marks }` rows; render the question types table; assert displayed Total Questions equals `sum(count)` and Total Marks equals `sum(count × marks)`
      - `{ numRuns: 100 }`
      - **Property 9: Frontend Total Recalculation Correctness**
      - **Validates: Requirements 5.6**
      - `// Feature: vedaai-assessment-creator, Property 9: Frontend Total Recalculation Correctness`

- [ ] 21. Docker configuration
  - [ ] 21.1 Create `apps/api/Dockerfile` using a multi-stage build: `node:20-alpine` builder stage running `npm ci` and `tsc`; production stage copying compiled output and `node_modules`; expose port 5000; `CMD ["node", "dist/server.js"]`
    - _Requirements: 16.1_
  - [ ] 21.2 Create `apps/web/Dockerfile` using a multi-stage build: builder stage running `npm ci` and `next build`; production stage using Next.js standalone output; expose port 3000; `CMD ["node", "server.js"]`
    - _Requirements: 16.1_

- [ ] 22. Final checkpoint — full system integration
  - Ensure all tests pass, ask the user if questions arise.


---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all 9 property tests are optional sub-tasks
- Each task references specific requirements for full traceability
- Checkpoints (tasks 11, 19, 22) ensure incremental validation at backend, frontend, and integration boundaries
- Property tests validate universal correctness invariants; unit tests validate specific examples and edge cases
- The `@vedaai/shared` package must be built before `apps/api` or `apps/web` reference it
- All code must use TypeScript strict mode with no `any` types per Requirement 16.5
- The BullMQ worker runs inside the `api` container, bootstrapped from `server.ts`

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["3.1", "3.2"] },
    { "id": 4, "tasks": ["3.3", "3.4", "3.5"] },
    { "id": 5, "tasks": ["3.6", "3.7"] },
    { "id": 6, "tasks": ["4.1", "5.1", "7.1", "8.1"] },
    { "id": 7, "tasks": ["4.2", "5.2", "6.1"] },
    { "id": 8, "tasks": ["4.3", "4.5", "6.2"] },
    { "id": 9, "tasks": ["4.4", "6.3", "7.2"] },
    { "id": 10, "tasks": ["9.1", "9.2"] },
    { "id": 11, "tasks": ["9.3", "10.1"] },
    { "id": 12, "tasks": ["9.4"] },
    { "id": 13, "tasks": ["12.1", "12.2", "12.3"] },
    { "id": 14, "tasks": ["12.4", "12.5", "12.6"] },
    { "id": 15, "tasks": ["13.1", "13.2", "13.3"] },
    { "id": 16, "tasks": ["14.1", "14.2", "14.3", "14.4"] },
    { "id": 17, "tasks": ["15.1", "15.2"] },
    { "id": 18, "tasks": ["16.1", "16.2"] },
    { "id": 19, "tasks": ["16.3", "16.4"] },
    { "id": 20, "tasks": ["16.5"] },
    { "id": 21, "tasks": ["17.1", "17.2", "17.3"] },
    { "id": 22, "tasks": ["17.4"] },
    { "id": 23, "tasks": ["18.1"] },
    { "id": 24, "tasks": ["18.2"] },
    { "id": 25, "tasks": ["20.1.1", "20.2.1", "20.3.1", "20.3.2", "20.4.1", "20.5.1", "20.6.1", "20.7.1", "20.8.1"] },
    { "id": 26, "tasks": ["21.1", "21.2"] }
  ]
}
```

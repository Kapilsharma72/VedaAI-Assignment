# VedaAI

Web app for teachers to create CBSE-style question papers with AI. You sign up, fill in a short form (subject, class, question types, marks), and Gemini generates a structured paper you can view in the browser and download as PDF.

**Live app:** https://veda-ai-assignment-nu.vercel.app  
**Live API:** https://vedaai-api-xdg3.onrender.com

## What’s in the repo

- `apps/web` — Next.js frontend
- `apps/api` — Express API, MongoDB, Redis, BullMQ worker, Socket.io
- `packages/shared` — shared TypeScript types

## Run locally

You need Node 20+, MongoDB, and Redis running.

```bash
git clone https://github.com/Kapilsharma72/VedaAI-Assignment.git
cd VedaAI-Assignment
npm install
cp .env.example .env
```

Edit `.env` with your Mongo URI, Redis URL, JWT secret, Google OAuth keys, and Gemini API key. Then:

```bash
npm run dev
```

- App: http://localhost:3000  
- API: http://localhost:5000  

## Environment variables

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection string |
| `REDIS_URL` | Redis (queues + cache) |
| `JWT_SECRET` | Signs login tokens |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in |
| `FRONTEND_URL` | Frontend URL (CORS + OAuth redirects), e.g. `http://localhost:3000` |
| `GEMINI_API_KEY` | Google AI Studio key for paper generation |
| `PORT` | API port (default `5000`) |

For the web app, set `NEXT_PUBLIC_API_URL` (and optionally `NEXT_PUBLIC_SOCKET_URL`) to your API base URL, e.g. `http://localhost:5000`.

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | Start API + web in dev mode |
| `npm run build` | Build all packages |
| `npm run test` | Run tests |
| `npm run lint` | Lint |

## Stack

Next.js, Express, MongoDB, Redis, BullMQ, Socket.io, Google Gemini, Tailwind, Zustand, React PDF.

## License

Private / assignment project — check with the author before reuse.

# Deployment Guide

## Architecture

| Service | Platform | URL pattern |
|---------|----------|-------------|
| Frontend | Vercel | `https://<project>.vercel.app` |
| API | Render | `https://<service>.onrender.com` |
| MongoDB | MongoDB Atlas (or similar) | connection string |
| Redis | Upstash / Render Redis | `rediss://...` |

## 1. Deploy API on Render

1. Push this repo to GitHub.
2. In [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → connect the repo (`render.yaml` is included).
3. Set these **secret** environment variables when prompted:

   | Variable | Description |
   |----------|-------------|
   | `MONGO_URI` | MongoDB Atlas connection string |
   | `REDIS_URL` | Redis URL (Upstash free tier works) |
   | `JWT_SECRET` | Random 64+ char secret |
   | `GOOGLE_CLIENT_ID` | Google OAuth client ID |
   | `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
   | `GEMINI_API_KEY` | Google AI Studio API key |
   | `FRONTEND_URL` | Your Vercel URL (set after step 2) |

   `API_URL` is optional on Render — `RENDER_EXTERNAL_URL` is used automatically.

4. In **Google Cloud Console** → OAuth credentials, add authorized redirect URI:
   ```
   https://<your-render-service>.onrender.com/api/auth/google/callback
   ```

## 2. Deploy frontend on Vercel

From the repo root (logged in with `vercel` CLI):

```bash
vercel link
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_SOCKET_URL production
vercel --prod
```

Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to your Render API URL (no trailing slash).

## 3. Finish cross-origin setup

1. Set Render `FRONTEND_URL` to your Vercel production URL.
2. Redeploy the API on Render after updating `FRONTEND_URL`.
3. In Google OAuth, add your Vercel URL to **Authorized JavaScript origins** if required.

## Health check

Render uses `GET /health` on the API service.

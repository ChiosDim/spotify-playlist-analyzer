# Spotify Playlist Analyzer

A full-stack web app for analyzing Spotify playlists — genre distribution, audio feature statistics, duplicate detection, playlist comparison, similar-track discovery, and Last.fm-powered recommendations.

**Live demo:** https://spotify-playlist-analyzer-theta.vercel.app

![Backend health](https://img.shields.io/website?url=https%3A%2F%2Fspotify-playlist-analyzer-cuxb.onrender.com%2Fapi%2Fhealth&label=backend)

---

## Features

- **Analyze** — upload an Exportify CSV or pick a Spotify playlist to see genre distribution and audio feature statistics
- **Duplicates** — find repeated tracks by URI or fuzzy name/artist matching
- **Compare** — upload 2–5 playlists and see common + unique tracks
- **Similar Tracks** — find pairs of tracks within a playlist that sound most alike, using a weighted audio + genre similarity score
- **From My Library** — find tracks in your other playlists that are similar to the one you're browsing
- **Discover** — new music recommendations from Last.fm's collaborative filtering, filtered against your library

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React 18 + React Router + Tailwind + DaisyUI + TanStack Query + Recharts |
| Backend | Node.js + Express + Passport (Spotify OAuth) |
| Database | MongoDB Atlas (Mongoose) |
| Cache / Sessions | Redis Cloud |
| External APIs | Spotify Web API, Last.fm, ReccoBeats |
| Observability | Pino + Sentry |
| Deployment | Vercel (frontend) + Render (backend) |
| CI | GitHub Actions |

---

## Architecture

The backend separates pure business logic from HTTP and I/O:

```
backend/src/
├── analyzer/         Pure functions: similarity, stats, duplicates, compare
├── services/         External integrations: Spotify, Last.fm, ReccoBeats
├── controllers/      Thin HTTP orchestration
├── middleware/       Session, upload, error handling
├── routes/           Endpoint definitions
└── models/           Mongoose schemas + the Track class
```

Both the CSV path and the Spotify path produce the same `Track[]` shape, so the same analyzer functions drive every feature.

---

## Local Development

### Prerequisites

- Node.js 22+
- pnpm (`npm install -g pnpm`)
- A MongoDB Atlas cluster (or local MongoDB)
- A Redis instance (Redis Cloud or local)
- A Spotify Developer account

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/spotify-playlist-analyzer
cd spotify-playlist-analyzer

# Backend
cd backend
pnpm install
cp .env.example .env
# Fill in .env with your credentials
pnpm dev

# Frontend (separate terminal)
cd ../frontend
pnpm install
pnpm dev
```

Backend runs on `http://127.0.0.1:5000`, frontend on `http://127.0.0.1:5173`.

### Running Tests

```bash
cd backend && pnpm test
cd frontend && pnpm test
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Express port (default `5000`) |
| `FRONTEND_URL` | Frontend origin for CORS and post-auth redirects |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `REDIS_URL` | Redis Cloud connection string |
| `SESSION_SECRET` | Random 64-character string for signing session cookies |
| `SPOTIFY_CLIENT_ID` | From the Spotify Developer Dashboard |
| `SPOTIFY_CLIENT_SECRET` | From the Spotify Developer Dashboard |
| `SPOTIFY_REDIRECT_URI` | Must match a Redirect URI in the Spotify Dashboard exactly |
| `LASTFM_API_KEY` | From last.fm/api/account/create |
| `SENTRY_DSN` | Optional — backend error tracking |

### Frontend (`frontend/.env.local`)

| Variable | Purpose |
|---|---|
| `VITE_SENTRY_DSN` | Optional — frontend error tracking |

The frontend's API base URL is derived automatically: it uses `http://127.0.0.1:5000/api` in development and `/api` in production (proxied to the backend through Vercel's rewrite rules).

---

## Deployment

Both services deploy automatically on push to `main`.

- **Backend** → Render, built from `backend/Dockerfile`
- **Frontend** → Vercel, built from `frontend/`
- **API proxy** → `frontend/vercel.json` rewrites `/api/*` to the Render backend, keeping cookies first-party

---


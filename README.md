# Spotify Playlist Analyzer

A full-stack web application that analyzes Spotify playlists — built with React, Node.js, Express, MongoDB, and Tailwind CSS.

## Stack

- **Frontend:** Vite + React 18 + React Router + Tailwind CSS + DaisyUI + TanStack Query
- **Backend:** Node.js + Express + Passport.js (Spotify OAuth) + MongoDB + Redis
- **Data:** Exportify CSV + Spotify Web API + ReccoBeats (audio features)
- **Infra:** Fly.io (backend), Vercel (frontend), Cloudflare R2, Upstash Redis, MongoDB Atlas
- **Observability:** Pino + Sentry
- **Testing:** Vitest + RTL + MSW (frontend), Jest + Supertest (backend), Playwright (E2E)

## Project Structure

- `backend/` — Express API server
- `frontend/` — React SPA

## Development

See individual `README.md` files inside `backend/` and `frontend/`.
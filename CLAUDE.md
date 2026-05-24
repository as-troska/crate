# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A music scrobbler app that connects a user's Discogs vinyl collection with Last.fm. It consists of two separate apps that must both be running during development.

## Running the App

**Backend** (Express, port 3000):
```bash
cd backend
node app.js
# or with auto-reload:
npx nodemon app.js
```

**Frontend** (React/Vite, port 5173):
```bash
cd frontend
npm start
```

**Database setup** (first time only):
```bash
cd backend
# Run CREATESCRIPT.sql against SQLite to create user.db
sqlite3 user.db < CREATESCRIPT.sql
```

## Environment Variables

A `.env` file is required in `backend/`:
```
DISCOGSAPPID=...
DISCOGSAPPSECRET=...
LASTFMAPIKEY=...
LASTFMSECRET=...
```

## Architecture

**Backend** (`backend/`):
- `app.js` — Express entry point, defines all routes, imports `discogs.js` and `lastfm.js`
- `discogs.js` — Discogs OAuth 1.0a flow (request token → user authorization → access token) and collection fetching via Discogs API
- `lastfm.js` — Last.fm API key exposure, session key auth flow, session key storage
- `user.db` — SQLite database with a single-row `app` table (id=1) that stores all OAuth tokens and session keys

**Frontend** (`frontend/src/`):
- `App.jsx` — Root component (currently renders `Collection` directly)
- `Login.jsx` — Handles OAuth authorization UI for both Discogs and Last.fm
- `Collection.jsx` — Fetches and displays the user's Discogs vinyl collection

**Auth flow:**
1. Discogs: backend fetches request token → frontend links user to Discogs → callback to `/authorize` captures verifier → backend exchanges for OAuth access token, stores in `app` table
2. Last.fm: frontend fetches API key from `/getKey` → links user to Last.fm → callback to `/authLastFM` with token → backend exchanges for session key, stores in `app` table

All tokens are persisted in the single row (id=1) of `user.db`'s `app` table. The frontend always talks to `http://localhost:3000`.

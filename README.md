# TailorTrack

Smart tailoring management platform — a varsity project for a single
tailoring shop. Customers submit tailoring requests, track status, and
pay a deposit online; the shop's admin reviews requests, quotes a price
and due date, and manages the whole order workflow from one dashboard.

The original requirement proposal and the full design doc (data model,
order lifecycle, API surface) are in [`docs/`](docs/).

## Stack

- **Frontend** — React (Vite, plain JS) + Tailwind CSS
- **Backend** — Express, raw SQL via `pg` (no ORM)
- **Database** — PostgreSQL (Docker locally, Neon/Supabase in production)
- **Deploy** — Vercel (frontend) + Render (backend)

See [`CLAUDE.md`](CLAUDE.md) for why this stack was picked, the model
roles used to build this project, and the git workflow below.

## Project structure

```
frontend/   React app — src/app (shell), src/pages, src/components
backend/    Express API — routes, controllers, middlewares, db
docs/       Requirement proposal + design doc
```

## Running it locally

Requires Node.js and Docker.

```bash
npm install          # installs both frontend and backend
npm run db:up         # starts a local Postgres container
npm run dev            # starts frontend (5173) and backend (3001) together
```

Copy `.env.example` to `.env` in both `frontend/` and `backend/` first —
the defaults already match the local Docker Postgres setup above.

Health checks, useful for confirming everything is wired up:

- `GET http://localhost:3001/health` — is the API running
- `GET http://localhost:3001/health/db` — can the API reach Postgres

## Git workflow

`main` stays clean and deployable at all times. All work happens on a
`dev`/`feature` branch; it only merges into `main` once it's been shown
and explicitly approved. See [`CLAUDE.md`](CLAUDE.md) for the full rule.

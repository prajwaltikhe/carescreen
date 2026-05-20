# CareScreen - GLP-1 Eligibility Screening Form

A 15-screen conditional eligibility form for GLP-1 weight-loss medication screening, with Next.js frontend, NestJS API, PostgreSQL persistence, Vitest unit tests, and Playwright E2E tests.

## Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS 4
- **Backend:** NestJS 11, Prisma 6, PostgreSQL 15
- **Tests:** Vitest 4 (unit), Playwright 1.x (E2E)
- **Infra:** Docker Compose for local PostgreSQL

## Quick start

### Prerequisites

- Node.js 22+
- Docker Desktop (for PostgreSQL)

### 1. Start the database

```bash
docker compose up -d
```

PostgreSQL listens on **localhost:5433** (mapped from container 5432) to avoid conflicts with a local Postgres install.

### 2. Configure backend

```bash
cp backend/.env.example backend/.env
cd backend
npm install
npx prisma db push
npx prisma generate
```

### 3. Install root + frontend dependencies

```bash
cd ..
npm install
npm install -w frontend
```

### 4. Run the app

```bash
npm run dev
```

This single command will concurrently start:
- **API Backend:** http://localhost:3001
- **Frontend UI:** http://localhost:3000

Open [http://localhost:3000](http://localhost:3000) to begin the screening form.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/session/start` | Start session; returns `sessionId` + first question |
| `POST` | `/api/session/answer` | Save answer; returns next question or final result |
| `GET` | `/api/session/:id` | Resume session (answers, current screen, result) |

The Next.js dev server proxies `/api/*` to the NestJS backend.

## Architecture

```
shared/           Pure form schema, branching engine, eligibility evaluator
backend/          NestJS session API + Prisma persistence
frontend/         React wizard UI with localStorage session resume
e2e/              Playwright specs (data-testid selectors)
```

- **Form logic** lives in `shared/form-schema.ts` (nested JSON schema with branches) and `shared/form-engine.ts` (branch resolution).
- **Screen 15 rules** are implemented in `shared/evaluator.ts` as a pure function (100% branch coverage target).
- **State:** Each answer is upserted per screen; `currentScreen` on `Session` tracks progress. Frontend stores `sessionId` in `localStorage` for refresh resume.

## Tests

```bash
# Unit tests + evaluator coverage
npm run test:coverage

# E2E (starts backend + frontend automatically)
npm run test:e2e
```

### E2E coverage

- Happy path → **Eligible**
- Refresh on screen 7 → state restored
- Terminal: underage, pregnancy, already on GLP-1
- Edge: BP crisis + normal both checked → warning + clinical review

## CI

GitHub Actions runs Vitest and Playwright on pull requests (see `.github/workflows/ci.yml`). Playwright browsers and `node_modules` are cached between runs.

## Documentation

See [WRITEUP.md](./WRITEUP.md) for trade-offs, spec ambiguities, and AI tool usage.

# Creditly monorepo

Separate `backend` and `frontend` packages so each can evolve, deploy, and scale independently while staying easy to run locally.

## Layout

- `backend` — Node.js, TypeScript, Express. Source under `src/` with a thin composition root (`index.ts`, `app.ts`) and feature-oriented wiring.
- `frontend` — Next.js App Router and TypeScript. UI, routing, and data-fetching live here; the API stays in the backend.

## Why this backend structure

- **`modules/`** — Route registration and HTTP surface per feature. Keeps `app.ts` small and makes it obvious where new endpoints are mounted.
- **`controllers/`** — Translate HTTP (params, body, status) to service calls. No business rules beyond validation and response shaping.
- **`services/`** — Use cases and orchestration. This is where domain logic should grow; controllers and repositories stay thin.
- **`repositories/`** — Persistence and data access. Starting with a repository per aggregate keeps SQL/ORM details out of services.
- **`integration/`** — Outbound HTTP or third-party SDKs. Isolates external systems from your core services so failures and retries are easier to reason about.
- **`event-bus/`** — Lightweight in-process pub/sub for cross-module reactions without tight coupling. Swap for a broker later if needed.
- **`middleware/`** — Cross-cutting HTTP concerns (errors, request IDs, auth).
- **`utils/`** and **`types/`** — Small shared helpers and shared TypeScript shapes.

The goal is **clear boundaries** without extra frameworks: Express stays the delivery mechanism; folders express responsibility so the codebase stays navigable as it grows.

## Why Next.js App Router here

Server Components and file-based routing fit document-style and marketing pages; client components (for example with React Query) fit interactive data and caching. React Query is used for **client-side fetching**, caching, and error states when talking to the REST API.

## Running locally

Terminal 1 — API:

```bash
cd backend
npm install
npm run dev
```

Default URL: `http://localhost:3001` (see `backend/.env.example`).

Terminal 2 — web:

```bash
cd frontend
npm install
npm run dev
```

Default URL: `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL` in `frontend/.env` to match the API origin (see `frontend/.env.example`).

## Scripts

| Location  | Command        | Purpose              |
| --------- | -------------- | -------------------- |
| `backend` | `npm run dev`  | API with reload      |
| `backend` | `npm run build` / `npm start` | Production build and run |
| `backend` | `npm run lint` / `npm run format` | ESLint / Prettier |
| `backend` | `npm run db:up` | Start local Postgres via Docker Compose |
| `backend` | `npm run db:push` | Apply `schema.prisma` to Postgres (`prisma db push`) |
| `backend` | `npm run db:generate` / `npm run db:validate` | Prisma Client / schema check |
| `frontend`| `npm run dev`  | Next dev server      |
| `frontend`| `npm run build` / `npm start` | Production         |
| `frontend`| `npm run lint` / `npm run format` | ESLint / Prettier |

## Database (Prisma and PostgreSQL)

The API uses Prisma with PostgreSQL. Configure `DATABASE_URL` in `backend/.env` (see `backend/.env.example`). With Docker available, you can start Postgres from `backend` with `npm run db:up` (uses `docker-compose.yml`). Then:

```bash
npm run db:push
```

`npm run build` runs `prisma generate` before the TypeScript compile.

### Why `db push` for local development, and migrations for production

`prisma db push` updates the database to match `schema.prisma` without writing migration files. That keeps iteration fast when the model is still moving and the database is disposable or personal: you avoid migration history, merge conflicts on SQL files, and drift between “what migrate thinks” and “what the DB actually has” during early design.

For **production** (and usually shared staging), prefer **versioned migrations** (`prisma migrate dev` in development, `prisma migrate deploy` in CI/CD). Migrations give repeatable, auditable schema changes, peer review of DDL, controlled rollout, and a clear upgrade path across environments. Use **`db push`** where losing or resetting the schema is acceptable; use **`migrate deploy`** where the database must evolve safely with the codebase.

## Authentication (backend)

### Endpoints

- `POST /auth/register` — body: `email`, `password`, `role` (`ADMIN` | `MANAGER` | `USER` | `BANKER`). Creates the user (password hashed with bcrypt). Returns `201` with `id`, `email`, `role`. No tokens.
- `POST /auth/login` — body: `email`, `password`. Validates credentials, returns JSON `{ accessToken, expiresIn }` (seconds). Sets an **HttpOnly** cookie (name from `REFRESH_TOKEN_COOKIE`, default `refreshToken`) containing the **raw** refresh token; `path` is `/auth` so it is sent to `/auth/*` only.
- `POST /auth/refresh` — no body; reads the refresh cookie, looks up **SHA-256** hash in `RefreshToken`, rejects if missing or expired. **Rotates** the refresh: deletes the old row, stores a new hash, sets a new cookie, returns `{ accessToken, expiresIn }`.

### Token flow

1. **Access token** — short-lived JWT (`ACCESS_TOKEN_EXPIRES_SECONDS`, default 900). Sent in `Authorization: Bearer <token>`. Keep it in memory on the client; do not store it in `localStorage` if you want to limit XSS impact.
2. **Refresh token** — long-lived opaque random string in an **HttpOnly** cookie (`REFRESH_TOKEN_EXPIRES_DAYS`, default 7). The API never stores the raw value: only **SHA-256** hashes are persisted. On refresh, the previous DB row is **deleted** and a new token is issued (rotation). Compromise of one refresh token invalidates that chain after use.
3. **`authenticateJWT` middleware** — verifies the JWT signature and expiry, checks `sub`, `email`, and `role`, then sets `req.user`. Use it on routes that require a logged-in user.

### Security choices

- **Bcrypt** for password storage; generic `401` on login failure to avoid email enumeration.
- **JWT** signed with `JWT_SECRET` (required); production should use a long random secret.
- **Refresh cookies**: `httpOnly`, `sameSite: lax`, `secure` when `NODE_ENV=production`. **CORS** uses `credentials: true` and a single `CORS_ORIGIN` so browsers can send cookies to the API.
- **Cleanup**: an in-process job runs **every 12 hours** and deletes refresh tokens with `expiresAt` in the past so the table does not grow forever.

## Environment

Each app loads its own env files and documents variables in `backend/.env.example` and `frontend/.env.example`. Real secrets stay out of git via each folder’s `.gitignore`.

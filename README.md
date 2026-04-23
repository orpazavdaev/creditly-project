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
- **`jobs/`** — In-process scheduled work (for example refresh-token cleanup).
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

### Request flow (why it is shaped this way)

1. **Register** creates identity only. Tokens are not returned so registration cannot be confused with a session: the client explicitly **logs in** when it wants a session, which keeps “account exists” and “session started” as two clear steps and avoids issuing tokens before you know the client can store them safely.
2. **Login** checks email and password, then issues two artifacts: a **JWT access token** (proof of session for APIs) and a **refresh token** (renewal channel). The access token is returned in JSON so SPAs can hold it in memory; the refresh token is **only** in an HttpOnly cookie so typical JavaScript cannot read it, which reduces exposure to XSS compared to putting refresh material in `localStorage`.
3. **Calling protected APIs** sends `Authorization: Bearer <accessToken>`. The middleware validates the JWT and attaches `req.user` (`id`, `email`, `role`). No database hit is required for every request, which keeps hot paths fast; role in the token must match what you trust at issuance time (today there is no “role changed mid-session” invalidation—add that later if needed).
4. **When the access token expires**, the client calls **`POST /auth/refresh`** with credentials mode so the **cookie** is sent. The server hashes the cookie value, finds the row, **deletes** it (rotation), inserts a new refresh hash, and returns a **new** access token. Rotation means a stolen refresh token stops working after the legitimate client refreshes once.
5. **Errors** surface as JSON via `HttpError` and the global error handler (`401` for auth, `409` for duplicate email, and so on).

### Token flow

1. **Access token** — short-lived JWT (`ACCESS_TOKEN_EXPIRES_SECONDS`, default 900). Sent in `Authorization: Bearer <token>`. Keep it in memory on the client; do not store it in `localStorage` if you want to limit XSS impact.
2. **Refresh token** — long-lived opaque random string in an **HttpOnly** cookie (`REFRESH_TOKEN_EXPIRES_DAYS`, default 7). The API never stores the raw value: only **SHA-256** hashes are persisted. On refresh, the previous DB row is **deleted** and a new token is issued (rotation). Compromise of one refresh token invalidates that chain after use.
3. **`authenticateJWT` middleware** — verifies the JWT signature and expiry, checks `sub`, `email`, and `role`, then sets `req.user`. Use it on routes that require a logged-in user.

### Security choices

- **Bcrypt** for password storage; generic `401` on login failure to avoid email enumeration.
- **JWT** signed with `JWT_SECRET` (required); production should use a long random secret.
- **Refresh cookies**: `httpOnly`, `sameSite: lax`, `secure` when `NODE_ENV=production`. **CORS** uses `credentials: true` and a single `CORS_ORIGIN` so browsers can send cookies to the API.
- **Cleanup**: an in-process job runs **every 12 hours** and deletes refresh tokens with `expiresAt` in the past so the table does not grow forever.

## Authorization (RBAC)

### Request flow

Protected routes use middleware **in order**: **`authenticateJWT`** first (validates the access token and sets `req.user`), then **`requireRole`** or **`requireRoles`** (checks `req.user.role` against allowed roles). If there is no `req.user`, the role guard responds with **`401`**. If the user is authenticated but the role is not allowed, the guard responds with **`403`**. That split makes “not logged in” and “logged in but not permitted” distinct for clients and observability.

### Helpers

- **`requireRoles(allowed[])`** — after authentication, allows the request if `req.user.role` is listed in `allowed`, **or** if the user is **`ADMIN`** (see below).
- **`requireRole(role)`** — convenience for a single allowed role; implemented as `requireRoles([role])`.

### Decisions

- **`ADMIN` full access** — any user with role `ADMIN` passes every `requireRole` / `requireRoles` check without needing to be listed explicitly. That matches “superuser” expectations and keeps policy rules short for endpoints where admins should always help or override (support, incident response). Non-admin users are still constrained by the explicit allow-list.
- **No resource ownership yet** — guards only inspect **role**, not whether the user owns the auction, account, or offer. Finer checks (“this manager only sees their accounts”) belong in services or repositories later and should not be implied by the current middleware.
- **Stub routes** — the table below wires RBAC to minimal handlers so you can verify **403/201** behavior before business logic exists.

### Protected routes (mounted in `app.ts`)

| Method | Path | Role rule (non-admin) | Notes |
| ------ | ---- | --------------------- | ----- |
| `POST` | `/auctions` | `MANAGER` only | Admins may create auctions too (`ADMIN` bypass). |
| `POST` | `/bank-offers` | `BANKER` only | Admins may submit offers too (`ADMIN` bypass). |
| `GET` | `/accounts` | `MANAGER` or `USER` | **`BANKER` is not allowed** on account routes by design (bank staff use offers, not the shared accounts list in this policy). Admins may list accounts (`ADMIN` bypass). |

## Events (backend + frontend)

Domain **events** are rows in the Prisma **`Event`** model: they tie an **`accountId`**, a **`userId`** (who triggered the activity), a **`type`**, **`metadata`** (JSON), and **`createdAt`**. They are intended as an **audit / activity timeline** for an account, not as a generic message bus (that remains separate under `event-bus/` if you use it).

### Backend: what was added

- **Routes** — `modules/events/event.routes.ts`, mounted at **`/events`** in `app.ts`.
- **`POST /events`** — Requires **`authenticateJWT`** (`Authorization: Bearer`). Body: **`accountId`** (string), **`type`** (string in **snake_case**), optional **`metadata`** (object; defaults to `{}`). The service checks that the **account exists** (`404` if not), maps **`type`** to the Prisma **`EventType`** enum, and persists **`userId`** from **`req.user.id`** (the JWT subject), not from the body, so callers cannot forge another user’s identity.
- **`GET /events?accountId=`** — Same auth middleware. **Requires** the **`accountId`** query string; returns **`404`** if the account does not exist. Response is **`{ events: [...] }`**, ordered **newest first**. Each event includes **`type` in snake_case** again for API consistency.
- **Type mapping** — `utils/event-type-api.ts` maps API strings to Prisma and back. Allowed **`type`** values: `document_uploaded`, `note_added`, `status_changed`, `auction_opened`, `offer_submitted`, `auction_closed`. Invalid or unknown types yield **`400`**.
- **Layers** — `EventRepository` (Prisma `findMany` / `create` / account existence), `EventService` (validation + mapping + `HttpError`s), `EventController` (wires HTTP, forwards errors to the global handler).

### Simulated actions (no file or note store)

- **`document_uploaded`** — The API **only creates an `Event`** (for example with `metadata: { simulated: true }`). There is **no** file upload pipeline, storage, or virus scan in this codebase yet.
- **`note_added`** — Same: **only** an event row, typically with **`metadata.note`** holding the text. There is **no** separate `Note` table or persistence beyond that JSON.

That keeps the contract stable when you later add real uploads or notes: you would still emit the same event types after the real work succeeds.

### Frontend: what was added

- **`EventsPanel`** (`frontend/src/components/EventsPanel.tsx`) on the **home** page, styled via `page.module.css` (`eventsSection`, inputs, list, and so on).
- The panel asks for an **account id** and a **JWT access token** (paste from **`POST /auth/login`**) so the browser can call protected routes without coupling the demo to the refresh cookie flow.
- **“Upload Document”** sends **`POST /events`** with **`type: "document_uploaded"`** and simulated metadata.
- **“Add Note”** uses a **textarea** and sends **`type: "note_added"`** with **`metadata: { note: "..." }`**.
- **React Query** — `useQuery` loads **`GET /events?accountId=...`** when both fields are filled; **`useMutation`** invalidates that query after a successful create so the list stays in sync with the database.

### In-process EventBus (domain event → side effects)

After an **`Event`** row is persisted, **`EventService`** publishes **`event.created`** on the shared **`appEventBus`** (`event-bus/app-event-bus.ts`) with a **`DomainEventCreatedPayload`** (`event-bus/domain-events.ts`: ids, Prisma type, API type string, timestamps, metadata).

**Why event-driven here:** HTTP stays thin (validate → write → respond) while **follow-up work** runs through subscribers without growing **`EventService`** with every downstream rule. The HTTP handler returns after the row exists; reactions can evolve independently (CRM stub today, real HTTP later).

**Where it is wired:** **`registerEventBusListeners`** runs once at process startup in **`index.ts`** (before `createApp`) and attaches:

- **`event-bus/listeners/business-logic.listener.ts`** — entry point only: it **`void`**-starts **`applyBusinessRulesOnEventCreated`** from **`services/domain-event-business.service.ts`** and logs async failures to **stderr**. That pattern keeps **`emit`** synchronous (no change to **`EventBus`**) while Prisma work runs **after** the request transaction conceptually, without blocking the response.
- **`event-bus/listeners/crm-integration.listener.ts`** — still a **stdout stub** for future outbound CRM.

**Business rules (in `domain-event-business.service.ts`):** all run **after** the new `Event` row is visible, so counts and reads include the event that triggered them.

1. **`document_uploaded`** — Updates the **`Account`**: **`status` → `READY_FOR_AUCTION`**, **`lastActivity` → now** (only for this event type, as specified).
2. **High activity** — Counts **`Event`** rows for that **`accountId`** with **`createdAt` ≥ now − 24h**; if **count > 3**, sets **`Account.isHighActivity`** to **`true`**, otherwise **`false`**. Runs on **every** domain event so the flag tracks the rolling window.
3. **`auction_closed`** — Loads **`AuctionOpportunity`** by **`accountId`** (1:1). If none, returns. Loads **`bankOffers`** ordered by **`totalInterestRate` ascending**, then **`createdAt` ascending**, so **equal rate → earliest submitted offer wins**. **No offers:** **`AuctionOpportunity.status` → `EXPIRED`**, **`closedAt` set**, **`winningOfferId` cleared** (no **`Account`** status change). **At least one offer:** **`status` → `CLOSED`**, **`winningOfferId`** set to the chosen offer, and **`Account.status` → `WON`** in the same transaction as the auction update.

**Why a service file instead of only the listener:** listeners stay tiny and testable; **`services/domain-event-business.service.ts`** holds Prisma and rule text in one place so you can unit-test rules or swap the listener transport later without duplicating logic.

**Why no queue yet:** everything runs **in-process** on the same Node thread. **`EventBus.emit`** wraps each **sync** handler in **`try/catch`**; async business work uses **`.catch`** on the returned promise so failures do not reject inside **`emit`**.

**Consistency note:** the client already received **`201`** before reactions finish. If a reaction fails, the audit row exists but downstream state may be stale—acceptable for this tier; production would add retries, outbox, or idempotent workers.

## Environment

Each app loads its own env files and documents variables in `backend/.env.example` and `frontend/.env.example`. Real secrets stay out of git via each folder’s `.gitignore`.

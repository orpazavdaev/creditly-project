# Creditly

Creditly is a monorepo for a lending workflow prototype: internal staff manage **accounts** and **auctions**, while **bankers** participate in **blind** rate auctions without receiving customer-identifying data through the public API. The stack is **Express + Prisma + PostgreSQL** (API) and **Next.js App Router** (web), with an in-process event bus for reactions after domain events are persisted.

---

## Monorepo layout

| Package | Role |
| -------- | ---- |
| `backend/` | REST API, auth, RBAC, Prisma, domain services, in-process event bus |
| `frontend/` | Next.js UI, React Query, role-aware navigation and pages |

Each package installs and runs independently. The browser talks to the API via `NEXT_PUBLIC_API_URL` with credentials enabled for refresh cookies.

---

## Architecture

The backend follows a **layered** structure so HTTP, use cases, and persistence stay separated:

- **`index.ts` / `app.ts`** — Process bootstrap: load env, register event-bus listeners once, create Express app, start jobs (for example refresh-token cleanup), listen on a port.
- **`modules/`** — Route factories: mount paths, stack middleware (`authenticateJWT`, `requireRole` / `requireRoles`), delegate to controllers.
- **`controllers/`** — Map HTTP (params, body, status codes) to service calls; validation of JSON bodies for auth and manual event creation uses **Zod** in services (`validation/schemas.ts`, `validation/parse-body.ts`).
- **`services/`** — Use cases and orchestration (accounts, auctions, offers, events, auth, CRM stub, domain rules on events).
- **`repositories/`** — Prisma access and query shapes; keeps SQL/ORM details out of services.
- **`mappers/`** — API-facing DTOs (for example stripping fields for banker responses).
- **`event-bus/`** — Lightweight **in-process** pub/sub (`EventBus`: `on` / `emit`). Used for reactions after a row is written, not as a replacement for HTTP.
- **`middleware/`** — Auth, errors, request context.
- **Outbound integrations** — `src/integration/crm-mock.ts` holds the **mock CRM** outbound call (random failure). `CrmService` orchestrates persistence of sync results and calls that mock from the event pipeline, not from HTTP controllers.
- **`jobs/`** — Scheduled in-process tasks.

The frontend uses the **App Router**, **React Query** for server state, a shared **`apiFetch`** helper, and **`AuthProvider`** for access tokens plus refresh via cookies.

---

## Database design

PostgreSQL is the system of record. Prisma models express the domain:

**Identity and org**

- **`User`** — `email` (unique), `passwordHash`, `role` (`ADMIN` \| `MANAGER` \| `USER` \| `BANKER`), optional `bankId`, `specialisation` (for bankers, aligned with product types).
- **`Bank`** — Lending institution; bankers belong to a bank.
- **`RefreshToken`** — Stores only a **hash** of the refresh token plus `userId` and `expiresAt` (see Token strategy).

**Accounts and access**

- **`Account`** — Customer-facing record: manager (`managerId`), contact fields (`costumerName`, `costumerEmail`, `costumerPhone`), `status` (`NEW` → `READY_FOR_AUCTION` → `AUCTION_OPEN` → `WON`), activity and CRM sync fields (`lastActivity`, `isHighActivity`, `syncStatus`, `failureReason`).
- **`AccountUser`** — Many-to-many **assignments** so a `USER` can collaborate on an account without being the manager.

**Audit timeline**

- **`Event`** — Append-only style log per account: `accountId`, `userId`, `type` (`EventType` enum), `metadata` (JSON), `createdAt`. Serves staff timelines and downstream automation.

**Auctions and offers**

- **`AuctionOpportunity`** — At most **one open auction per account** (`accountId` unique). Tracks `classification` (matches banker specialisation), `status` (`OPEN` \| `EXPIRED` \| `CLOSED`), `openedBy`, `openedAt`, `expiresAt`, `closedAt`, optional `winningOfferId`.
- **`BankOffer`** — A banker’s single bid: `totalInterestRate`, `bankId`, `bankerId`, link to auction. Uniqueness of “one offer per banker per auction” is enforced in the offer transaction path.

**Enums** (`UserRole`, `Specialisation`, `AccountStatus`, `SyncStatus`, `EventType`, `AuctionOpportunityStatus`) keep states explicit in the schema and in Prisma Client types.

---

## Role-based access control (RBAC)

**Roles**

- **`ADMIN`** — Full staff visibility where middleware allows it; **resource checks** still apply on account-scoped routes (see below).
- **`MANAGER`** — Owns accounts (`Account.managerId`); opens and closes auctions for those accounts.
- **`USER`** — Access only to **assigned** accounts (`AccountUser`).
- **`BANKER`** — Participates in auctions and offers; **must not** see account lists, account detail, or customer PII through staff APIs.

**HTTP layer**

- **`authenticateJWT`** — Validates the Bearer access JWT and sets `req.user` (`id`, `email`, `role`).
- **`requireRole` / `requireRoles`** — Enforces allowed roles. By default **`ADMIN` bypasses** the allow-list (`allowAdminBypass` defaults to true). Some routes **disable** that bypass so only real bankers hit banker-only surfaces (for example `GET /auctions` and offer routes).

**Resource-level rules (`AccountAccessService`)**

Staff routes that touch a specific account (`/events`, account auctions, auction close, and similar) call **`assertStaffCanAccessAccount`**: bankers are rejected with **403**; unknown or out-of-scope accounts return **404** (to avoid leaking existence). **`ADMIN`** passes; **`MANAGER`** must match `managerId`; **`USER`** must appear in `AccountUser`.

**Event creation**

- **`DOCUMENT_UPLOADED`** and **`NOTE_ADDED`** may be created only by **`ADMIN`** or **`USER`** (after access checks). **`MANAGER`** receives **403** for those types even on owned accounts, matching the product rule that uploads and free-form notes are not manager-authored in this prototype.

**Account listing**

- **`GET /accounts`** — **`AccountListService`** rejects **`BANKER`** with **403**; other roles receive scoped lists.

- **`GET /accounts/:id`** — Same staff roles as the list; **`AccountListService.getById`** runs **`assertStaffCanAccessAccount`** then returns one account plus **optional auction summary** (status, expiry, classification). Matches the assignment API surface and avoids loading the full list for the detail page.

Together, RBAC is **defense in depth**: route guards for coarse role boundaries, services for data scope and blind-auction behavior.

---

## Blind auction model

A **blind** auction here means bankers compete on **rate** and **timing** without the API disclosing **which customer** an auction belongs to.

**What bankers see**

- **Auction list** (`GET /auctions`) returns only **`OPEN`** opportunities whose **`classification`** is in the banker’s **`specialisation`** array (assignment: bankers see **open**, eligible auctions only). Rows include **`id`**, **`classification`**, **`status`**, **`openedAt`**, **`expiresAt`**, **`closedAt`** — no `accountId`, no customer contact fields (`banker-auction-list.mapper`).
- **Offer submission** persists internally with `accountId` for integrity, but the **HTTP response** maps the related event through **`mapBankerSubmitOfferResponse`**, which **omits `accountId`** from the `event` object returned to the client.

**Rules**

- Bankers must match auction **`classification`** against their **`specialisation`** array.
- **One offer per banker per auction**; duplicates yield **409**.
- Auction must be **`OPEN`** and not past **`expiresAt`** at submission time; expiration can be applied lazily when interacting with that auction.

**Closing and outcomes**

- Staff (**`MANAGER`** / **`ADMIN`**) close an auction via **`POST /auctions/:id/close`**, which records an **`AUCTION_CLOSED`** domain event; business logic then runs on the event pipeline.
- **Winner selection**: among offers, lowest **`totalInterestRate`** wins; ties break on **earliest `createdAt`** (repository `orderBy`).
- **No offers**: auction becomes **`EXPIRED`** (not **`CLOSED`** / no **`WON`** on the account). **With offers**: auction **`CLOSED`**, **`winningOfferId`** set, account **`WON`**.

The database still stores foreign keys linking offers to accounts; **blindness is enforced at the API and authorization layers**, not by erasing relational data.

---

## Event-driven design

Two related concepts coexist:

1. **Persisted `Event` rows** — The audit **timeline** per account. Created through **`EventService`** (and other flows that write events). **`userId` on the row always comes from the authenticated user**, never from an untrusted body field.

2. **In-process `EventBus`** — After insert, **`publishEventCreated`** emits **`event.created`** with a **`DomainEventCreatedPayload`** so subscribers can run **without** bloating the HTTP handler.

**Listeners** (registered in **`registerEventBusListeners`** before the app accepts traffic):

- **Domain event pipeline** — On **`event.created`**, runs **`DomainEventBusinessService.applyOnEventCreated`** (document → account readiness, rolling high-activity flag, auction close / expire / win selection) and then **`CrmService.handleAfterDomainEvent`** so CRM side effects do not race the same business step.
- **Winning offer** — When a winner is chosen, **`DomainEventBusinessService`** emits **`winning.offer.selected`**; a dedicated listener calls **`CrmService.handleWinningOfferSelected`**.

**CRM** in this repo is a **mock** with random failures to exercise **`Account.syncStatus`** / **`failureReason`**.

**Trade-off:** handlers run **after** the HTTP response path has committed the primary write; failures in subscribers are logged but do not roll back the `Event` row. See Assumptions and trade-offs.

---

## Token strategy

| Artifact | Transport | Lifetime | Storage server-side |
| -------- | ----------- | -------- | -------------------- |
| **Access token** | `Authorization: Bearer` | Short (default **900s** via `ACCESS_TOKEN_EXPIRES_SECONDS`) | Not stored; JWT signed with `JWT_SECRET` |
| **Refresh token** | **HttpOnly** cookie (name from `REFRESH_TOKEN_COOKIE`, default `refreshToken`, path **`/auth`**) | Long (default **7 days** via `REFRESH_TOKEN_EXPIRES_DAYS`) | **SHA-256 hash** only in **`RefreshToken`** |

**Login** returns `{ accessToken, expiresIn }` and sets the refresh cookie. **Refresh** reads the cookie, verifies the hash, **deletes the old row**, issues a **new** refresh (rotation), and returns a new access token. **Register** does not start a session (no tokens), so “identity exists” and “session started” stay distinct.

**Client guidance:** keep access tokens in **memory** where possible; avoid `localStorage` for refresh material because the cookie is already HttpOnly. **CORS** uses **`credentials: true`** and a configured **`CORS_ORIGIN`** so browsers send cookies only to the intended API origin.

Expired refresh rows are removed on a periodic **cleanup job** so the table does not grow without bound.

---

## Prisma and schema evolution (no committed migrations)

This repository ships **`prisma/schema.prisma`** and uses **`prisma db push`** (`npm run db:push`) to align a **development** database with the schema **without** generating SQL migration history.

**Why no `prisma/migrations` folder**

- Early-stage and demo-friendly: schema changes apply quickly, with less merge friction on migration files.
- Disposable local databases match the model in seconds.

**What you should do for production**

- Introduce **versioned migrations** (`prisma migrate dev` in development, **`prisma migrate deploy`** in CI/CD) once the schema stabilizes. Migrations give repeatable, reviewable DDL, auditable rollouts, and safe evolution on shared databases.

**Prisma 7 configuration**

- **`prisma.config.ts`** defines the datasource URL and wires **`prisma db seed`** to **`tsx prisma/seed.ts`**. Run **`npm run db:seed`** after push when you need deterministic demo data.

---

## Request validation (Zod)

`POST /auth/login`, `POST /auth/register`, and `POST /events` use **Zod** schemas (`backend/src/validation/schemas.ts`) parsed through **`parseBody`** in **AuthService** and **EventService**. Invalid JSON shapes return **400** with code **`invalid_body`** (and a short message from the first schema issue). Other routes keep checks in their services to avoid a second DTO layer everywhere.

---

## Assumptions and trade-offs

- **In-process event bus** — Simple and fast, but not durable: a crash after `emit` starts async work can drop side effects. Replacing with a queue or outbox would be the next step for hard reliability.
- **JWT claims** — `role` is fixed until refresh; revoking access for a compromised token before expiry may require a denylist or very short access TTL (not implemented here).
- **Blind auctions** — Privacy is enforced by **API design and RBAC**, not by removing relational integrity in the database.
- **Lazy auction expiration** — Some paths explicitly expire overdue auctions before reads/writes; there is no separate cron closing every auction at the exact second of `expiresAt`.
- **CRM** — Simulated random failures only; no real outbound integration or retry budget.
- **Document upload / notes** — Events can represent uploads and notes; there is no separate blob store or note table in this slice.
- **Error responses** — Non-HTTP errors are mapped to generic **500** responses so Prisma or stack traces are not leaked to clients (details stay in logs / stderr where applicable).
- **Monolith process** — API, listeners, and cleanup job share one Node process; horizontal scaling would require externalizing sessions, bus, and jobs.

---

## Getting started

**Database**

```bash
cd backend
npm install
npm run db:up
npm run db:push
npm run db:seed
npm run dev
```

Default API: `http://localhost:3001` (see `backend/.env.example` for `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, token TTLs).

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` in `frontend/.env` to the API origin (see `frontend/.env.example`).

---

## Scripts (reference)

| Location | Command | Purpose |
| -------- | ------- | ------- |
| `backend` | `npm run dev` | API with reload |
| `backend` | `npm run build` / `npm start` | Compile and run production |
| `backend` | `npm run test` | Vitest suite under `backend/tests/` |
| `backend` | `npm run lint` / `npm run format` | ESLint / Prettier |
| `backend` | `npm run db:up` | Local Postgres (Docker Compose) |
| `backend` | `npm run db:push` | Apply schema (`prisma db push`) |
| `backend` | `npm run db:seed` | Seed demo data |
| `frontend` | `npm run dev` | Next.js dev server |
| `frontend` | `npm run build` / `npm start` | Production build and run |

`npm run build` in the backend runs **`prisma generate`** before **`tsc`**.

---

## Environment

Secrets and deployment-specific values live in **`.env`** files, not in git. Copy **`backend/.env.example`** and **`frontend/.env.example`** and adjust for your machine or deployment.

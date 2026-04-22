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
| `frontend`| `npm run dev`  | Next dev server      |
| `frontend`| `npm run build` / `npm start` | Production         |
| `frontend`| `npm run lint` / `npm run format` | ESLint / Prettier |

## Environment

Each app loads its own env files and documents variables in `.env.example`. Real secrets stay out of git via each folder’s `.gitignore`.

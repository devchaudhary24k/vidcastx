# VidcastX

VidcastX is a B2B enterprise video hosting, streaming, and AI-processing platform built as a Turbo monorepo on pnpm workspaces. It ships an end-to-end stack — frontend, API, transcoding workers, storage, auth, queueing — wired together for production from day one.

The stack is:

- **TanStack Start** — type-safe React frontend (Vite + SSR), running on port `4000`
- **Elysia (Bun)** — high-performance REST API with auto-generated OpenAPI docs and Eden Treaty client typing
- **PostgreSQL + Drizzle ORM** — relational store with `pgvector` for embeddings
- **Better Auth** — sessions, organizations, OAuth (GitHub, Discord), and role-based access control
- **BullMQ + Redis** — background job queue shared between API and transcoder workers
- **FFmpeg transcoder worker** — VOD encoding pipeline producing HLS output
- **S3-compatible storage** — MinIO locally, AWS / Hetzner in production

Out of the box you get organization-scoped auth, multipart resumable uploads, a video pipeline with state machine, a typed API client, OpenTelemetry instrumentation, M2M JWTs for worker → API calls, and a shadcn/Tailwind v4 design system shared across apps.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Applications](#applications)
- [Packages](#packages)
- [Workers](#workers)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Database Migrations](#database-migrations)
- [Environment Variables](#environment-variables)
- [Architecture Highlights](#architecture-highlights)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **End-to-end type safety** from the database (Drizzle) through the API (Elysia + TypeBox) to the frontend (TanStack Router/Loader/Form). No `any`, no manual response typing.
- **Server-first frontend** — reads happen in route loaders / `beforeLoad`, mutations go straight from the client to the API. No client waterfalls, no flicker.
- **Resumable video uploads** via Uppy + S3 multipart, with chunked retries.
- **Video pipeline state machine**: `draft → uploaded → queued → dispatch → processing → ready → failed`, driven by BullMQ jobs.
- **Organizations & RBAC** out of the box: Owner / Admin / Member, scoped at the organization level via Better Auth.
- **OAuth providers**: GitHub and Discord pre-wired; add more by extending the Better Auth config in `packages/auth`.
- **Bearer-token + cookie session auth** with sessions stored in Redis.
- **M2M (machine-to-machine) JWT auth** for the transcoder worker → API status callbacks, rate-limited at the boundary.
- **Auto-generated OpenAPI docs** from Elysia route schemas — `apps/api` exposes `/openapi` in dev.
- **Eden Treaty** typed client for fully type-safe API calls from any TS workspace.
- **Soft-delete (trash) pattern** for videos, with prefixed nanoid IDs (`vid_xxx`, `org_xxx`) for cross-system traceability.
- **Cluster workers** in `apps/api` for multi-core utilization.
- **OpenTelemetry instrumentation** with named handler functions for clean trace spans.
- **shadcn/ui + Tailwind v4** design system in `packages/ui`, single source of truth for theme tokens (light + dark modes, dark by default).
- **Dockerized local infra**: Postgres, Redis, and MinIO via `docker compose up -d`.
- **Pre-commit hooks** (`husky` + `lint-staged`) and a strict ESLint / Prettier / `sherif` setup that fails the build on workspace drift.

---

## Tech Stack

**Frontend (`apps/app`)**

- TanStack Start (Vite + SSR), TanStack Router, TanStack Query, TanStack Form
- React 19
- Tailwind CSS v4 + shadcn/ui
- Zod (schema validation, single source of truth for forms + API contracts)
- Better Auth client SDK
- Uppy (S3 multipart resumable uploads)
- Zustand (local global state) and nuqs (URL-driven state)

**API (`apps/api`)**

- Elysia on Bun
- TypeBox + `drizzle-typebox` for request / response schemas
- Better Auth server SDK (mounted on `/api/auth`)
- `@elysiajs/openapi`, `@elysiajs/server-timing`, `@elysiajs/opentelemetry`
- `@elysiajs/bearer` + `jose` for JWT verification
- Auto-generated OpenAPI docs and Eden Treaty type export

**Database**

- PostgreSQL with `pgvector`
- Drizzle ORM + Drizzle Kit (migrations and Studio)

**Workers (`workers/transcoder`)**

- Node.js + FFmpeg (`libx264` / `h264_nvenc` / `h264_videotoolbox`)
- BullMQ consumer
- M2M JWT calls back into the API

**Shared Infra**

- TypeScript, ESLint, Prettier, sherif (workspace consistency)
- Turbo (build pipeline + remote cache)
- pnpm workspaces
- husky + lint-staged

---

## Repository Layout

```
vidcastx/
├── apps/
│   ├── app/        # TanStack Start frontend (port 4000) — the active creator studio
│   ├── api/        # Elysia REST API on Bun (port 4001)
│   └── studio/     # Drizzle Studio launcher
│
├── packages/
│   ├── analytics/  # Shared analytics client
│   ├── auth/       # Better Auth config shared by API and frontend
│   ├── database/   # Drizzle schemas, migrations, and DB client
│   ├── m2m/        # Machine-to-machine JWT helpers
│   ├── queue/      # BullMQ job definitions shared by API and workers
│   ├── redis/      # Shared ioredis client
│   ├── seo/        # SEO metadata helpers
│   ├── storage/    # S3 abstraction (MinIO / AWS / Hetzner)
│   └── ui/         # shadcn/Radix component library + theme tokens
│
├── workers/
│   └── transcoder/ # FFmpeg-based VOD encoding worker
│
├── tooling/        # Shared ESLint, Prettier, and TypeScript configs
│
├── archived/       # Code preserved for reference, NOT in the workspace
│   └── dashboard/  # Legacy Next.js 16 dashboard (replaced by apps/app)
│
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Applications

- **`apps/app`** — TanStack Start (Vite + SSR) frontend. The active creator studio. All new feature work lands here. Runs on **port 4000**. File-based routing under `src/routes/`, features under `src/features/<name>/`.
- **`apps/api`** — Elysia REST API on Bun. v1 routes live in `src/modules/v1/`, internal admin endpoints under `src/modules/internal/`. Cluster workers (`src/index.ts`) for multi-core utilization. Runs on **port 4001**.
- **`apps/studio`** — wrapper that launches `drizzle-kit studio` against the local database for browsing and editing rows.

---

## Packages

- **`@vidcastx/analytics`** — unified analytics client (PostHog wired up).
- **`@vidcastx/auth`** — Better Auth configuration shared between API and frontend. Drizzle adapter, GitHub + Discord OAuth, organization plugin, RBAC roles (Owner / Admin / Member).
- **`@vidcastx/database`** — Drizzle ORM schemas in `src/schema/` (`video-schema`, `auth-schema`, `analytics-schema`, `billing-schema`, …) plus the database client and generated migrations.
- **`@vidcastx/m2m`** — JWT helpers for machine-to-machine calls (transcoder → API).
- **`@vidcastx/queue`** — BullMQ queue + job type definitions, imported by both API (producer) and transcoder (consumer).
- **`@vidcastx/redis`** — shared `ioredis` client.
- **`@vidcastx/seo`** — SEO metadata + structured-data helpers.
- **`@vidcastx/storage`** — S3-compatible storage abstraction (works against MinIO locally and AWS / Hetzner in prod).
- **`@vidcastx/ui`** — shadcn/Radix component library and the **single source of truth** for theme tokens. Both apps import `@vidcastx/ui/globals.css`; never duplicate theme variables in app-level CSS.

---

## Workers

- **`workers/transcoder`** — long-running FFmpeg worker. Pulls jobs from the BullMQ `transcode` queue, runs HLS encoding (`libx264` by default; configurable to `h264_nvenc` for NVIDIA or `h264_videotoolbox` for macOS), and reports status back to `apps/api` via M2M-authenticated callbacks. Concurrency is configurable via `CONCURRENT_JOBS`.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20 (see `.nvmrc`)
- **Bun** (for `apps/api`) — `curl -fsSL https://bun.sh/install | bash`
- **pnpm** ≥ 10.30
- **Docker** + Docker Compose (for local Postgres, Redis, MinIO)
- **FFmpeg** on the host if you intend to run the transcoder worker locally

### 1. Clone and install

```bash
git clone https://github.com/<your-org>/vidcastx.git
cd vidcastx
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the secrets (OAuth client IDs, JWT secret, etc.). See [Environment Variables](#environment-variables) for what each block controls.

### 3. Start local infrastructure

```bash
docker compose up -d
```

This brings up:

- PostgreSQL on `:5432`
- Redis on `:6379`
- MinIO on `:9000` (S3 API) and `:9001` (web console)

### 4. Apply database migrations

```bash
pnpm db:migrate
```

### 5. Run the dev servers

```bash
pnpm dev
```

This runs everything in parallel via Turbo. Once it's up:

- Frontend: <http://localhost:4000>
- API: <http://localhost:4001>
- API OpenAPI docs: <http://localhost:4001/openapi>
- MinIO console: <http://localhost:9001>

You can also start subsets:

```bash
pnpm dev:app   # frontend + dependencies only
pnpm dev:api   # API + dependencies only
pnpm db:studio # Drizzle Studio against local Postgres
```

---

## Development Workflow

### Quality gates

```bash
pnpm check-types     # tsc --noEmit across the workspace
pnpm lint            # ESLint across the workspace
pnpm lint:fix        # auto-fix
pnpm format          # Prettier check
pnpm format:fix      # Prettier write
pnpm lint:ws         # sherif workspace consistency check
```

All four (`check-types`, `lint`, `format`, `lint:ws`) must pass before opening a PR. CI runs the same set.

### Where new code lands

- **New product capability?** Create a feature under `apps/app/src/features/<name>/`. See `.claude/rules/features.md` for the standard subdirectory layout.
- **New API endpoint?** Add it under `apps/api/src/modules/v1/<resource>/` and register the router in `apps/api/src/modules/v1/index.ts`.
- **New shared UI primitive?** Add it to `packages/ui` via `pnpm bump-ui`. Never one-off-copy a primitive into an app.
- **New env var?** Declare it in the relevant `env.ts` (validated via `@t3-oss/env-core` + Zod) and update `.env.example`.

### Conventions

- File names are `kebab-case`. React component exports stay `PascalCase`, the file itself is still kebab-case.
- Forms use **TanStack Form + Zod**. No manual `useState` form state, no `react-hook-form` for new code.
- The frontend has **no business logic** — it talks to the API over HTTP. Backend packages (`@vidcastx/database`, `@vidcastx/queue`, `@vidcastx/storage`, `@vidcastx/redis`) are forbidden imports inside `apps/app`.
- Reads go through route loaders / server functions; mutations go directly from the client to the API. No client waterfalls.

---

## Database Migrations

Drizzle Kit drives all schema work.

```bash
pnpm db:generate   # diff schema → generate migration SQL
pnpm db:migrate    # apply pending migrations
pnpm db:push       # push schema directly (LOCAL DEV ONLY — no migration file)
pnpm db:studio     # open Drizzle Studio
```

**Rules:**

- Schema files live under `packages/database/src/schema/`.
- Whenever you change a schema file, run `pnpm db:migrate -- --name="descriptive_name"` and **commit the generated migration file in the same commit as the schema change**. A future `git bisect` must always find a buildable, runnable tree.
- Never use `pnpm db:push` against anything but your own dev database.
- After pulling / merging upstream changes that touch schema files, regenerate migrations before continuing work on your branch.

---

## Environment Variables

Each app/package validates env vars at startup using [`@t3-oss/env-core`](https://env.t3.gg/) + Zod (see each `env.ts`). The single root `.env` is loaded via the `with-env` dotenv CLI wrapper. Required blocks:

### Infrastructure (used by Docker Compose)

- `DB_USER`, `DB_PASSWORD`, `DB_NAME` — Postgres
- `MINIO_USER`, `MINIO_PASSWORD` — MinIO

### Shared application config

- `DATABASE_URL` — Postgres connection string for Drizzle
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` — Redis (BullMQ + sessions)
- `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_FORCE_PATH_STYLE` — object storage

### API server (`apps/api`)

- `PORT` — defaults to `3001`
- `JWT_SECRET` — used for signing tokens

### Frontend app (`apps/app`)

- `VITE_API_URL` — base URL of the Elysia API (default `http://localhost:4001`)
- The frontend runs on **`:4000`** in development.

### Authentication (`packages/auth`)

- `BETTER_AUTH_SECRET` — session signing secret
- `BETTER_AUTH_URL` — base URL of the API where Better Auth handlers are mounted (default `http://localhost:4001`)
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — GitHub OAuth
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` — Discord OAuth

### Worker (`workers/transcoder`)

- `TRANSCODER_SECRET` — shared secret for M2M token issuance
- `TRANSCODER_ID` — worker identifier
- `API_URL` — base URL of the API (the worker calls back here)
- `HW_ENCODER` — `libx264` (CPU) | `h264_nvenc` (NVIDIA) | `h264_videotoolbox` (macOS)
- `CONCURRENT_JOBS` — number of concurrent transcoding jobs

> **Never read `process.env.*` directly in app code.** Always import from the workspace's `env.ts`. See `.claude/rules/env-safety.md` for the full rule set.

---

## Architecture Highlights

### Video pipeline

1. Client requests a multipart upload → API issues S3 presigned URLs.
2. Client uploads directly to S3 (Uppy with resumable chunks).
3. API enqueues a transcoding job onto the BullMQ `transcode` queue.
4. Transcoder worker picks up the job, runs FFmpeg, produces HLS output.
5. Worker calls the API back via an M2M-authenticated endpoint to update status.

States: `draft → uploaded → queued → dispatch → processing → ready → failed`.

### API (Elysia) conventions

- All routes have **TypeBox request and response schemas** (auto-generates OpenAPI docs).
- `drizzle-typebox` derives schemas from the database tables — single source of truth.
- All Elysia instances have a `name` property for logging and trace deduplication.
- Auth uses a `resolve`-based macro for type-safe `user` / `session` injection.
- Centralized error handling via the root `onError` hook; routes return `status()` rather than throwing.
- Eden Treaty type export: `export type App = typeof server` so any TS workspace can call the API with full inference.

### Frontend (TanStack Start) conventions

- File-based routing under `apps/app/src/routes/`.
- Reads via route `loader` / `beforeLoad` or `createServerFn()`. Mutations go straight from the client to the API — no app-server proxy hop.
- Forms: `@tanstack/react-form` + Zod, schemas in each feature's `validator/`.
- State: TanStack Query for server cache; Zustand for client global state; nuqs for URL-driven state.
- The **Tailwind v4 preflight** trap is documented in `.claude/rules/` — never re-import `tailwindcss` after `@vidcastx/ui/globals.css` or every border falls back to `currentColor`.

The full convention set lives in `.claude/rules/` (frontend, features, file conventions, type safety, error handling, env safety, dependencies, git workflow, commit discipline, pre-change verification).

---

## Deployment

Production deployments are not yet codified in this repo, but the recommended shape is:

- **`apps/app`** → any host that supports a Node-compatible runtime for TanStack Start's SSR build (Cloudflare Workers, Vercel, Render, Fly.io, or a containerized Node runtime).
- **`apps/api`** → a Bun-capable host (Render, Fly.io, Railway, or a self-managed Bun container). Cluster workers come for free; size by core count.
- **`workers/transcoder`** → a host with FFmpeg available (a GPU instance if you flip `HW_ENCODER` to `h264_nvenc`). Scale by adding more worker instances against the same Redis queue.
- **PostgreSQL** → managed Postgres (Neon, Supabase, RDS, etc.) with `pgvector` enabled.
- **Redis** → managed Redis (Upstash, Elasticache, etc.).
- **Object storage** → S3 (AWS) or Hetzner Object Storage. Flip `S3_FORCE_PATH_STYLE` to `false` for AWS.

A Dockerfile / k8s manifests will be added in a future milestone.

---

## Contributing

Internal project — see `.claude/rules/` for the full convention set, and `CLAUDE.md` for the high-level architecture overview. PRs targeting `dev` only; `main` is protected.

Before opening a PR:

1. `pnpm check-types && pnpm lint && pnpm format` all pass.
2. If you touched `packages/database/src/schema/`, the migration is committed alongside the schema change.
3. Commit messages follow Conventional Commits (see `.claude/rules/commit-discipline.md`).

---

## License

Proprietary — all rights reserved.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

VidcastX is a B2B enterprise video hosting, streaming, and AI-processing platform built as a Turbo monorepo using pnpm workspaces.

## Commands

All commands are run from the repository root unless noted.

### Development

```bash
pnpm dev                  # Run all apps in dev mode
pnpm dev:app              # Run apps/app and its dependencies only
pnpm dev:api              # Run apps/api and its dependencies only
```

### Build & Type Check

```bash
pnpm build                # Build all packages/apps
pnpm check-types          # TypeScript type checking across all workspaces
```

### Linting & Formatting

```bash
pnpm lint                 # Lint all packages
pnpm lint:fix             # Auto-fix lint issues
pnpm format               # Check formatting
pnpm format:fix           # Auto-fix formatting
pnpm lint:ws              # Check workspace consistency with sherif
```

### Database

```bash
pnpm db:generate          # Generate Drizzle migration files from schema changes
pnpm db:migrate           # Run pending migrations
pnpm db:push              # Push schema directly (dev only, no migration file)
pnpm db:studio            # Open Drizzle Studio
```

### Local Infrastructure

```bash
docker compose up -d      # Start PostgreSQL, Redis, MinIO locally
```

## Architecture

### Monorepo Layout

- **`apps/api`** — Elysia (Bun) REST API server, port `3001`. Routes live in `src/modules/v1/`. Uses cluster workers (`src/index.ts`) for multi-core utilization.
- **`apps/app`** — TanStack Start (Vite + SSR) frontend, port `4000`. The active creator studio — all new feature work lands here.
- **`archived/dashboard`** — Legacy Next.js 16 frontend. Lives in `archived/` and is **not** part of the pnpm workspace; preserved as a visual parity reference only. Do not start new features here.
- **`workers/transcoder`** — FFmpeg-based background video encoding worker.
- **`packages/database`** — Drizzle ORM schemas and migrations. All schema files are in `src/schema/`.
- **`packages/auth`** — Better-Auth configuration shared between API and the frontend apps.
- **`packages/queue`** — BullMQ job definitions shared between API and transcoder worker.
- **`packages/storage`** — AWS S3 abstraction layer.
- **`packages/redis`** — Shared ioredis client.
- **`packages/ui`** — Shadcn/Radix component library and the single source of truth for theme tokens.
- **`tooling/`** — Shared ESLint, Prettier, and TypeScript configurations.

### API Design (Elysia)

Routes use the `.group()` pattern for nested resources with guard middleware for auth. All v1 routes are registered in `apps/api/src/modules/v1/index.ts`. Internal admin endpoints are separate under `modules/internal/`. Bearer token auth is handled via `@elysiajs/bearer`. OpenAPI docs are auto-generated.

### Authentication

Better-Auth with Drizzle adapter, supporting GitHub and Discord OAuth. Sessions stored in Redis. JWT tokens use the `jose` library. Role-based access control: Owner, Admin, Member at the organization level.

### Database

Drizzle ORM on PostgreSQL (with pgvector for embeddings). Entity IDs use nanoid with type prefixes (e.g., `vid_xxx`, `org_xxx`). Soft delete (trash) pattern used for videos. Schema files map to domain areas: `video-schema.ts`, `auth-schema.ts`, `analytics-schema.ts`, `billing-schema.ts`, etc.

### Video Pipeline

1. Client requests multipart upload → API returns S3 presigned URLs
2. Client uploads directly to S3 (Uppy with resumable chunks)
3. API enqueues transcoding job (BullMQ → Redis)
4. Transcoder worker picks up job, runs FFmpeg, produces HLS output
5. Video status progresses: `draft → uploaded → queued → dispatch → processing → ready → failed`

### Frontend (apps/app — TanStack Start)

The active frontend lives in `apps/app`. The legacy Next.js app has been moved to `archived/dashboard` and is no longer part of the pnpm workspace — kept only as a visual parity reference.

- File-based routing under `apps/app/src/routes/`
- Reads via route `loader` / `beforeLoad` or `createServerFn()`; mutations go straight from the client to Elysia (no app-server hop)
- Forms: `@tanstack/react-form` + Zod, schemas in each feature's `validator/`
- Server cache: TanStack Query; global client state: zustand under each feature's `stores/`; URL state: nuqs
- File uploads: Uppy with S3 multipart
- shadcn theme tokens and the `border-border` base layer live in `packages/ui/src/styles/globals.css` — never re-import `tailwindcss` after it
- Full conventions live in `.claude/rules/frontend.md` and `.claude/rules/features.md`

### Environment Variables

Each app uses `@t3-oss/env-core` for Zod-validated environment variables defined in `env.ts`. Scripts requiring `.env` use the `with-env` dotenv CLI wrapper.

## Code Style Guidelines

From `.github/copilot-instructions.md`:

- Avoid deeply nested code — break into smaller functions
- Opening braces on the same line
- Catch specific errors, not generic ones
- Log error messages and stack traces

## API Best Practices (Elysia)

Recent improvements to `apps/api` aligned with Elysia skill best practices:

### Schema & Validation

- **TypeBox** (`t.*`) for all request/response schemas (auto-generates OpenAPI docs)
- `drizzle-typebox` derives schemas from database tables, single source of truth
- All routes have request AND response schemas with proper HTTP status codes
- Centralized error handling via `server.ts` `onError` hook

### Error Handling

- Guards return `status()` instead of throwing errors
- Validation errors return 400 with field-level messages
- Consistent error shape: `{ error: string }`
- Proper status codes: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 500 (server)

### Architecture & Organization

- All Elysia instances have `name` property for logging and deduplication
- Organization validation at v1 router level (shared middleware, not duplicated)
- Auth macro uses `resolve` pattern for type-safe user/session injection
- Named async functions for all handlers (better debugging + OTel spans)

### Plugins & Performance

- `@elysiajs/server-timing` for dev performance profiling
- `@elysiajs/openapi` with response schemas for auto-generated API docs
- OpenTelemetry instrumentation with named functions for better tracing
- Removed unused `@elysiajs/cron` from dependencies

### Security

- M2M (machine-to-machine) authentication via JWT + rate limiting
- `/internal/token` endpoint rate-limited to 10 requests/minute per IP
- Separate `/internal` controller for worker communication
- Status updates from transcoder validated and logged

### Type Safety (Eden Treaty)

- API exports `export type App = typeof server` for client type generation
- `apps/app` consumes the API via Eden Treaty for fully type-safe calls
- See `apps/api/EDEN_SETUP.md` for integration guide

## Workflow Orchestration

### 1. Plan-Mode Default

- Enter plan mode for any non-trivial task — 3+ steps or any architectural decision.
- If a plan starts going sideways, stop and re-plan instead of pushing through.
- Use plan mode for verification steps, not only for building.
- Write detailed specs upfront to reduce ambiguity downstream.

### 2. Subagents

- Offload research, exploration, and parallel analysis to subagents to keep the main context window clean.
- For complex problems, throw more compute at them via parallel subagents.
- One focused task per subagent.

### 3. Self-Improvement Loop

- After any correction from the user, update `tasks/lessons.md` with the pattern.
- Write rules for yourself that prevent the same mistake from happening again.
- Iterate on these lessons ruthlessly until the mistake rate drops.
- Review `tasks/lessons.md` at the start of every session for the relevant project.

### 4. Verification Before Done

- Never mark a task complete without proving it works.
- Diff behavior between `main` and your changes when relevant.
- Ask "would a staff engineer approve this?" before declaring done.
- Run tests, check logs, demonstrate correctness — don't infer it.

### 5. Demand Elegance (Balanced)

- For non-trivial changes, pause and ask "is there a more elegant way?"
- If a fix feels hacky, redo it with the framing "knowing everything I know now, implement the elegant solution."
- Skip this for simple, obvious fixes — don't over-engineer.
- Challenge your own work before presenting it.

### 6. Autonomous Bug Fixing

- When given a bug report, just fix it — don't ask for hand-holding.
- Point at logs, errors, and failing tests, then resolve them.
- Zero context switching should be required from the user.
- Go fix failing CI tests without being told how.

## Task Management

1. **Plan First** — write the plan to `tasks/todo.md` as checkable items.
2. **Verify the Plan** — check in with the user before starting implementation.
3. **Track Progress** — mark items complete as you go.
4. **Explain Changes** — high-level summary at each step.
5. **Document Results** — add the review to `tasks/todo.md`.
6. **Capture Lessons** — update `tasks/lessons.md` after every correction.

## Core Principles

- **Simplicity First** — make every change as simple as possible. Touch the minimum code needed.
- **No Laziness** — find root causes. No temporary fixes. Senior-engineer standards.
- **Minimal Impact** — changes should only touch what's necessary. Don't introduce regressions on the way to a fix.

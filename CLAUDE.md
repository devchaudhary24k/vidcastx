# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

VidcastX is a B2B enterprise video hosting, streaming, and AI-processing platform built as a Turbo monorepo using pnpm workspaces.

## Commands

All commands are run from the repository root unless noted.

### Development

```bash
pnpm dev                  # Run all apps in dev mode
pnpm dev:dashboard        # Run dashboard and its dependencies only
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

- **`apps/api`** — Elysia (Bun) REST API server. Routes live in `src/modules/v1/`. Uses cluster workers (`src/index.ts`) for multi-core utilization.
- **`apps/dashboard`** — Next.js 16 creator studio and admin panel.
- **`workers/transcoder`** — FFmpeg-based background video encoding worker.
- **`packages/database`** — Drizzle ORM schemas and migrations. All schema files are in `src/schema/`.
- **`packages/auth`** — Better-Auth configuration shared between API and dashboard.
- **`packages/queue`** — BullMQ job definitions shared between API and transcoder worker.
- **`packages/storage`** — AWS S3 abstraction layer.
- **`packages/redis`** — Shared ioredis client.
- **`packages/ui`** — Shadcn/Radix component library.
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

### Frontend Patterns (Dashboard)

- React Server Components with Next.js App Router
- TanStack React Query for data fetching/caching
- React Hook Form + TanStack React Form for forms
- TanStack React Store for global state
- Uppy for file uploads
- API calls go through a proxy defined in `apps/dashboard/src/utils/proxy.ts`

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
- Dashboard can use Eden Treaty for fully type-safe API calls
- See `apps/api/EDEN_SETUP.md` for integration guide

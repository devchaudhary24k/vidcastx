---
description: TanStack Start app conventions — server-first, typed, UI-only
paths:
  - "apps/app/**"
  - "packages/ui/**"
---

# Frontend Conventions (TanStack Start)

The frontend lives in `apps/app` and is built on **TanStack Start**. It is a UI/presentation layer — it must not carry business logic. All real logic lives in `apps/api` (Elysia).

## Boundary: frontend has no business logic

- **NEVER** put business logic in the frontend. Validation beyond UX, pricing math, permission decisions, transcoding rules, etc. live in the API.
- **NEVER** install backend-only packages in `apps/app`. This includes (non-exhaustive):
  - `@vidcastx/database` / Drizzle
  - `@vidcastx/queue` / BullMQ
  - `@vidcastx/storage` (S3 SDK)
  - `@vidcastx/redis`
  - `@vidcastx/auth` (server-side better-auth instance)
  - anything importing `bun`, `ioredis`, `pg`, `drizzle-orm`, etc.
- The app talks to the API over HTTP. If you need a server-side capability, add it to the API and expose it — don't shortcut by importing a backend package.

## Server-first rendering & data

- Prefer **server functions** (`createServerFn()`) for anything the server can do: auth checks, session loading, server-side redirects, caching-sensitive fetches, anything that needs secrets or the request headers.
- Prefer **route loaders** / `beforeLoad` over client `useEffect` fetching. The router gives you SSR + streaming for free — use it.
- Client-side `fetch` / TanStack Query is fine when:
  - It's a direct POST/PUT/DELETE mutation to the API — we don't want to add an app-server hop for writes
  - It's state that's cheap to fetch and changes often (search, live lists, polling)
- Rule of thumb: **reads go through server fns / loaders, mutations can go straight from the client to the API**. Don't hop through the app server just to proxy a POST.

## Data fetching & mutations

- Reads via TanStack Query (`useQuery`) or route loaders. Define query keys consistently (`["videos", { orgId }]`).
- Mutations via `useMutation`. Invalidate the right query keys on success — don't refetch the world.
- Calls to the Elysia API go through the typed client in `src/lib/api.ts` (Eden Treaty). Do not construct raw `fetch("/api/...")` URLs.

## Forms

- **Always** use [`@tanstack/react-form`](https://tanstack.com/form) with Zod validators. No `useState`-driven forms. No `react-hook-form` for new code.
- Schema lives in the feature's `validator/` directory and is the single source of truth for field types + error messages.
- Submit handlers call either a server function or a mutation — never inline `fetch` inside a form component.

## State

- **Local/UI state**: `useState` / `useReducer` — keep it in the component.
- **Global client state**: [`zustand`](https://github.com/pmndrs/zustand). Put stores under the feature's `stores/` directory.
- **URL-driven state** (filters, search, pagination, tabs, dialog open): [`nuqs`](https://nuqs.47ng.com/). If the state should survive a refresh or be shareable via link, it belongs in the URL, not in a store.
- **Server cache**: TanStack Query. Don't mirror server data into zustand.

## UI components

- All reusable UI primitives come from `@vidcastx/ui` (`packages/ui`). If a component is missing, add it to the UI package via `pnpm bump-ui` — don't create one-off copies in `apps/app`.
- Feature-specific composites (e.g. `VideoUploadForm`) live in the feature's `components/` directory. They may compose primitives from `@vidcastx/ui`.

## Environment variables

- Env vars MUST be validated in `apps/app/src/env.ts` using `@t3-oss/env-core` + Zod.
- If `env.ts` doesn't exist yet in a frontend package, create one before reading any env var.
- **NEVER** read `process.env.*` directly in app code — always `import { env } from "#app/env"`.
- Client-exposed vars must be prefixed `VITE_` so Vite bundles them.
- See `env-safety.md` for the full rules.

## File uploads

- File uploads use Uppy with S3 multipart (resumable chunks). Do not roll custom upload logic.

## Don't

- Don't call `process.env` directly
- Don't add a `"use client"` directive — that's a Next.js RSC pattern, TanStack Start doesn't use it
- Don't import from `next/*` — we are no longer on Next.js
- Don't bypass the typed API client with raw `fetch`
- Don't put logic in the frontend that belongs in the API

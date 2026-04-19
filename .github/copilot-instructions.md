# GitHub Copilot Instructions

VidcastX is a B2B enterprise video hosting, streaming, and AI-processing platform — a Turbo monorepo using pnpm workspaces.

## Where to look first

The canonical guidance for contributors and AI agents lives in:

- **[CLAUDE.md](../CLAUDE.md)** — stack, architecture, commands, workflow principles.
- **[.claude/rules/](../.claude/rules/)** — per-domain rules (tooling, API, frontend, database, typesafety, error-handling, env-safety, git-workflow, commit-discipline, features, shadcn, dependencies, etc).

Copilot Chat and PR review comments should treat those files as source of truth and cite them by filename when recommending changes.

## Stack at a glance

- **apps/api** — Elysia on Bun, port 4001. TypeBox schemas, Better-Auth, BullMQ dispatch.
- **apps/app** — TanStack Start (Vite + SSR), port 4000. File-based routes, TanStack Query/Form, zustand, nuqs.
- **workers/transcoder** — Node + FFmpeg, BullMQ consumer.
- **packages/database** — Drizzle ORM on Postgres (+ pgvector). Never `db:push`; always `db:migrate`.
- **packages/auth** — Better-Auth with Drizzle adapter.
- **packages/queue** — BullMQ job definitions.
- **packages/storage** — S3 abstraction (AWS SDK).
- **packages/redis** — Shared ioredis.
- **packages/ui** — shadcn/Radix components. **Never edit `src/components/**`\*\* — vendored upstream.
- **tooling/** — Shared ESLint 9 flat, Prettier 3, TypeScript configs.

## Tight rules (enforced by ESLint / TS / hooks)

- TypeScript: `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly`. No `any`, no `enum`, no `namespace`, no non-null assertions, no unchecked casts.
- ESLint: `strictTypeChecked` + `stylisticTypeChecked`. No `process.env.*` outside `env.ts`. No backend packages imported from `apps/app`. Zero-warning policy.
- Errors: catch specific types, log message + stack, never swallow.
- Env: always go through the workspace `env.ts` (Zod-validated via `@t3-oss/env-core`); never read `process.env.*` directly.
- Commits: Conventional Commits, one logical change per commit. No `Co-Authored-By: Copilot/Claude` trailer, no automated footers.
- DB: schema + generated migration must land in the same commit.

## Files not to touch

- `packages/ui/src/components/**` — vendored shadcn. Fix at the call site.
- `.env*` (except `.env.example`) — never read or write.
- `.husky/` and `.claude/hooks/` — gates, not feature code.
- `apps/app/src/routeTree.gen.ts` — generated.

## Before suggesting a change

1. Read the relevant rule under `.claude/rules/`.
2. Trace callers — especially when changing exported functions.
3. Prefer editing existing files over creating new ones.
4. Match feature structure in `.claude/rules/features.md` when adding frontend work.

---
description: Dependency management, installation, and package hygiene
---

# Dependency Management

## Never install without permission

- **Never run `pnpm add <pkg>`, `pnpm install <pkg>`, or any equivalent** without the user explicitly asking for it or approving it for the current task.
- If you think a new dependency is needed, **stop and ask** the user first. Explain:
  - What problem it solves
  - Why existing dependencies / native features don't already solve it
  - The rough size / maintenance status of the package

## Prefer what we already have

Before proposing a new dependency:

1. **Check `package.json`** (root and the specific workspace) — we may already have something that covers the use case.
2. **Check neighboring packages** in the monorepo — a utility often already lives in `packages/ui`, `packages/database`, `packages/storage`, etc.
3. **Check the platform** — modern Node/Bun/the browser often has a built-in that removes the need for a package:
   - `fetch` instead of `axios` / `node-fetch`
   - `crypto.randomUUID()` / `nanoid` (we already use nanoid with prefixes)
   - `structuredClone` instead of `lodash.clonedeep`
   - `Array.prototype.group`, `Object.groupBy`, etc.
   - `URLSearchParams` instead of `qs`
4. **Check the framework** — TanStack Start, Elysia, Drizzle, and Better Auth each cover a lot of ground. Don't add a package for something the framework already does.

## Workspace-correct installs

- Install into the workspace that actually uses the package, not the root:
  - ✓ `pnpm --filter @vidcastx/app add some-pkg`
  - ✗ `pnpm add some-pkg` at the repo root (unless it's genuinely a root-level dev tool)
- **`@vidcastx/app` (frontend) must not install backend packages.** See `frontend.md` for the list. No Drizzle, no BullMQ, no S3 SDK, no ioredis, no server-side better-auth instance in the frontend.

## Keeping things in sync

- After installing, run `pnpm lint:ws` (sherif) to verify workspace version consistency.
- Keep versions aligned across packages — don't let `react` drift to different versions in different workspaces.
- When removing the last consumer of a dependency, also remove it from `package.json`. Dead dependencies bloat installs and audits.

## Security

- **Never install a package from an untrusted source, a typo-squat, or a just-published one-star package.** If a name looks unfamiliar, verify the npm page, download count, and maintainer before suggesting it.
- If `pnpm audit` flags something critical, raise it — don't ignore.

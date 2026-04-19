---
description: Commit message, granularity, and hygiene rules
---

# Commit Discipline

## Message format

Use Conventional Commits:

```
<type>(<optional-scope>): <short imperative summary>

<optional body explaining WHY, not WHAT>
```

- **Types**: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`
- **Scope** (optional): the affected area — `api`, `app`, `db`, `ui`, `auth`, etc.
- **Summary**: imperative mood, lowercase, no trailing period, ≤ 72 chars
  - ✓ `feat(videos): add resumable upload retry`
  - ✗ `Added a thing for videos.`
- **Body**: wrap at ~72 chars. Explain _why_ the change is needed; the diff already shows _what_.

## Granularity

- **One logical change per commit.** A commit should be revert-safe: if you revert it, nothing unrelated should break.
- Don't mix refactors with behavior changes. Land the refactor first, then the behavior change on top.
- Don't mix formatting-only noise with real edits. If a file drifted, land a `style:` commit separately.
- Small, focused commits beat giant ones — they review better and bisect better.

## What NOT to commit

- **Never commit** `.env`, `.env.local`, or any file containing real secrets
- **Never commit** generated artifacts that the build produces (`dist/`, `build/`, `node_modules/`, `.next/`, `.turbo/`, `routeTree.gen.ts` is... actually checked in — but other generated files usually aren't)
- **Never commit** debug code: `console.log`, `debugger`, commented-out blocks, TODO-tagged test data
- **Never commit** broken code to `main` / `dev`. If a commit doesn't build or type-check, it doesn't land.

## Before every commit

Run (or confirm CI runs) locally:

- `pnpm check-types` — no TypeScript errors
- `pnpm lint` — no new lint errors
- `pnpm format` — formatting is clean

If you touched a DB schema:

- `pnpm run db:migrate -- --name="descriptive_name"` was executed
- The generated migration file is staged in the same commit as the schema change

## Migration + commit ordering

**Migrations are part of the change that needs them.** Commit the schema update, the generated migration file, and any code that depends on the new schema **together** — not across separate commits. A future `git bisect` must always find a buildable, runnable tree.

See `git-workflow.md` for when to regenerate migrations around pulls/merges.

## Hooks

- **Never bypass hooks** with `--no-verify` unless the user has explicitly told you to. If a pre-commit hook fails, fix the root cause.
- **Never skip signing** (`--no-gpg-sign`) if signing is configured.

## Amending

- Prefer new commits over `--amend`. Amending rewrites history and is easy to get wrong when hooks fail mid-commit.
- Only amend if the user explicitly asks, and only on commits that have not been pushed.

## Co-authorship

**Do NOT add a `Co-Authored-By: Claude ...` trailer** on commits in this repo. The user wants commits attributed solely to their configured `user.name` / `user.email`. This overrides Claude Code's default behavior.

Do not add any other automated trailer (no "🤖 Generated with ..." footer, no sign-off lines) unless the user explicitly asks.

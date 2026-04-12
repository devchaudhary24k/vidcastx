---
description: Branch hygiene, merging, and keeping your branch current
---

# Git Workflow

## Start every task from a fresh base

Before starting any new feature or bugfix:

1. `git fetch origin`
2. `git checkout dev` (or whatever the integration branch is)
3. `git pull --ff-only origin dev`
4. `git checkout -b feat/<short-name>` (or `fix/...`)

This ensures your branch is always up to date with the latest `dev` before you begin work. Starting from stale code is how merge conflicts balloon.

## Keeping a long-running branch current

While working on a feature that takes more than a day:

1. `git fetch origin`
2. `git merge origin/dev` into your branch (prefer merge over rebase on shared branches; rebase only on purely local branches)
3. Resolve any conflicts (see below)
4. **Regenerate migrations if the schema moved upstream** — run `pnpm run db:migrate -- --name="..."` if `packages/database/src/schema/` changed during the merge

## Resolving merge conflicts

- **Always ask the user** before making non-trivial resolution decisions. If the conflict involves two different pieces of real logic colliding, surface both sides and ask which intent to keep.
- Trivial conflicts (import ordering, formatting, unrelated neighboring edits) can be resolved without asking, but note them in the commit message.
- After resolving, re-run `pnpm check-types`, `pnpm lint`, and any relevant tests before continuing work on the branch.
- **Never** use `git checkout --theirs` / `--ours` globally to "make it go away." That discards work.

## Migrations around git operations

**This is a checklist you must run through every time:**

- **After pulling / fetching / merging**: if `packages/database/src/schema/` changed upstream, run `pnpm run db:migrate -- --name="..."` so your local DB matches the new schema.
- **Before committing**: if you changed schema files, you must have run `pnpm run db:migrate -- --name="..."` and staged the generated migration file in the same commit.
- **Before pushing**: confirm migrations are committed alongside schema changes — never push a schema change without its migration.

Concretely, whenever you think about "commit" or "pull/fetch," also think "migrations."

## Pushing

- Push to your own branch, not directly to `main` or `dev`.
- **Never force-push to `main` or `dev`.** On your own feature branch, force-push is acceptable but use `--force-with-lease`, never `--force`.
- Open a PR via `gh pr create` targeting the integration branch. Fill in a real description (see `commit-discipline.md`).

## Destructive git commands — always confirm

Do not run any of the following without explicit user confirmation:

- `git reset --hard`
- `git push --force` / `--force-with-lease`
- `git clean -fd`
- `git branch -D`
- `git checkout -- <file>` that would discard uncommitted work
- Deleting remote branches

If you encounter unfamiliar uncommitted changes, unknown branches, or odd local state, **investigate first**. It may be the user's in-progress work.

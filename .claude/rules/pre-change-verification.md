---
description: Read, trace, and understand before you edit
---

# Pre-Change Verification

The fastest way to break something is to edit code you haven't read or don't fully understand. Slow down at the start and you save time at the end.

## Before editing any file

- **Read the file first.** Never edit based on assumed contents, a stale memory, or what the name suggests. The Edit tool requires a prior read for this reason — don't work around it.
- Read enough surrounding context that you understand how the file is structured, not just the line you're changing.

## Before modifying a function

- **Trace all callers.** Grep for the function name across the repo and understand every site that calls it. Your change's blast radius is every caller.
- Check for callers in:
  - Other packages in the monorepo (`apps/api`, `apps/app`, `workers/*`, `packages/*`)
  - Test files
  - Generated code (e.g. `routeTree.gen.ts`)
  - String-based references (feature flags, telemetry events, i18n keys — things grep catches but static analysis misses)
- If a function is exported from a package's public surface, assume **external** callers exist and treat the signature as load-bearing.

## Before deleting any code

- **Verify it is not used** anywhere. Grep for:
  - The symbol name across the entire repo
  - Any string form of it (e.g. dynamic imports, feature flags, route keys)
  - Re-exports through barrel files
- If the code is exported from an `index.ts`, check whether anything outside the feature imports from that barrel.
- When in doubt, ask the user. Deleting looks cheap and is hard to reverse once the branch is merged.

## Before "fixing" a bug

- **Reproduce it first.** If you can't reproduce it, you cannot be confident you've fixed it — you've only made the symptom go away in your head.
- **Understand the root cause** before changing code. The first plausible explanation is often not the real one.
- Ask: _why_ does the code behave this way, _why_ wasn't it caught, and _why_ is the proposed fix the right layer to fix it?
- Guessing + trial-and-error is not debugging. If you're reaching for `try/catch` or `?.` to make an error "go away," stop and trace where the bad value actually came from.

## Before refactoring

- Know what you're refactoring toward and why. "It felt cleaner" is not a reason.
- Refactors should be behavior-preserving. Land the refactor in its own commit; don't bundle it with a feature or bugfix (see `commit-discipline.md`).
- If a refactor changes a public API (a feature's `index.ts` exports, a package's entry point), audit consumers the same way you would for a function change.

## Before running a destructive command

- Re-read `git-workflow.md` and `database.md`. Anything that could lose work or data needs explicit confirmation.
- If a command has `--force`, `--hard`, `rm -rf`, `DROP`, `DELETE`, or `TRUNCATE` in it, pause and confirm with the user.

## The mindset

> Measure twice, cut once.

Reading is cheap. Tracing is cheap. Asking is cheap. Re-doing a bad edit, reverting a broken commit, or restoring deleted data is expensive.

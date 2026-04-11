---
description: Pre-PR audit. Checks the branch is ready to push: type-check, lint, format, migration consistency, branch is up to date with base, and runs an independent review.
---

Run the full pre-PR audit. The user is about to push or open a PR. Walk through this checklist in order, stopping ONLY for blockers:

1. **Branch state**
   - `git status` — must be clean (no uncommitted changes). If dirty, STOP and tell the user.
   - `git rev-parse --abbrev-ref HEAD` — get current branch name. Must not be `main` or `dev`.
   - `git fetch origin --quiet`
   - `git log --oneline origin/main..HEAD` (or `origin/dev..HEAD` if branched from dev) — confirm there are commits to ship.

2. **Migration consistency**
   - `git diff origin/main...HEAD --name-only -- packages/database/src/schema/`
   - If any schema files changed, also confirm new files exist under the migrations directory in the same diff. If schema changed without a migration, BLOCK and tell the user to invoke `/migrate`.

3. **Quality gates** (run in parallel where possible)
   - `pnpm check-types`
   - `pnpm lint`
   - `pnpm format`
   - Capture pass/fail for each.

4. **Independent review**
   - Delegate to the `pr-reviewer` agent with: "Audit the current branch against its base. Report blockers and warnings."

5. **Final report** — single condensed summary:
   - Branch: name + commit count
   - Migrations: OK / missing
   - Type-check: pass/fail
   - Lint: pass/fail
   - Format: pass/fail
   - Reviewer findings: blocker count, warning count, top 3 items
   - **Verdict**: `SHIP IT` (everything green) or `BLOCKED: <one-line reason>`

Do NOT push, do NOT open the PR, do NOT commit. The user does those steps themselves after seeing the report.

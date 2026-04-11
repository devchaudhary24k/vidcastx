---
description: Run type-check, lint, and format check across the workspace. Reports any failures.
---

Run the workspace-wide quality gates and report results. Execute these in this exact order, capturing the output of each:

1. `pnpm check-types`
2. `pnpm lint`
3. `pnpm format`

After all three finish, summarize:

- Which (if any) failed
- For failures, the count and the first few error locations (file:line)
- One-line verdict at the end: `READY` if all three pass, `BLOCKED` if any fail

Do NOT attempt to fix errors automatically. Just report. If the user wants a fix, they'll ask.

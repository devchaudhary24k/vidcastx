---
description: Generate and apply a Drizzle migration with the given snake_case name. Wraps the migration-runner agent.
argument-hint: <snake_case_name>
---

The user wants to run a database migration. The desired migration name is: `$ARGUMENTS`.

Delegate to the `migration-runner` agent with this exact instruction:

> Generate and apply a Drizzle migration named `$ARGUMENTS`. Verify it covers all currently-staged or unstaged schema changes under `packages/database/src/schema/`, generate the SQL via `pnpm run db:migrate -- --name="$ARGUMENTS"`, sanity-check the SQL for destructive operations, and report back with the new file path and a summary of what it does.

If `$ARGUMENTS` is empty, ask the user for the migration name first (snake_case, descriptive, e.g. `add_video_captions_table`). Do not run with an empty or auto-generated name.

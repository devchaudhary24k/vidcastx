---
description: Drizzle ORM, migrations, and database safety
paths:
  - "packages/database/**"
  - "apps/api/**"
---

# Database Conventions

## Schema & IDs

- All schemas live in `packages/database/src/schema/` — one file per domain area
- Entity IDs use nanoid with a type prefix: `vid_xxx`, `org_xxx`, `usr_xxx`, etc.
- Soft delete (trash) pattern is used for videos — check for existing trash columns before adding `deletedAt`
- pgvector extension is available for embedding columns
- Always define cascade behavior explicitly on foreign keys

## Migrations

- After changing a schema, run:

  ```bash
  pnpm run db:migrate -- --name="name_of_migration"
  ```

  This generates AND applies the migration in a single named step.

- **NEVER** use `pnpm db:push`. It skips migration history and causes schema drift between environments. Always go through `db:migrate` so the migration file is committed.
- Migration names must be descriptive and snake_case: `add_video_captions_table`, `rename_user_avatar_column`, etc.
- Always generate a new migration after pulling/merging if schema files changed upstream (see `git-workflow.md`).

## Destructive Query Safety

- **NEVER** run `db.delete(table)` or `db.update(table).set(...)` without a `where` clause. Mass deletion/update of an entire table is almost never intentional and will wipe production data.
- The same rule applies to any `deleteMany` / `updateMany` equivalents — always bound them with `where`, `eq`, `and`, `inArray`, etc.
- If you truly need to truncate a table (tests, seed reset), say so explicitly in code AND in the PR description. Do not hide it inside a feature commit.
- Wrap any multi-step DB write in a transaction:

  ```ts
  await db.transaction(async (tx) => {
    await tx.insert(...)...;
    await tx.update(...)...;
  });
  ```

- Before running destructive queries in a script, dry-run a `select` with the same `where` clause first to confirm the row count.

## Query Shape

- Prefer explicit column selection via `db.select({ id: table.id, name: table.name })` over `select()` when you only need a few fields. Avoid fetching entire rows blindly.
- When loading relations, use Drizzle's `with` (relational queries) to batch. Watch out for N+1 patterns — never loop a list and issue one query per item.
- Index columns that appear in `where` / `order by` clauses of hot paths.

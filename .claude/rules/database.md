---
description: Drizzle ORM and database conventions
paths:
  - "packages/database/**"
  - "apps/api/**"
---

# Database Conventions

- All schemas live in `packages/database/src/schema/` — one file per domain area
- Entity IDs use nanoid with type prefix: `vid_xxx`, `org_xxx`, `usr_xxx`, etc.
- After changing a schema, run `pnpm db:generate` to create a migration file, then `pnpm db:migrate` to apply it
- Use `pnpm db:push` only in local dev when you don't need a migration history
- Soft delete (trash) pattern is used for videos — check for existing trash columns before adding `deletedAt`
- pgvector extension is available for embedding columns
- Always define cascade behavior explicitly on foreign keys

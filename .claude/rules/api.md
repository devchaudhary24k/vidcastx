---
description: Elysia API server conventions
paths:
  - "apps/api/**"
---

# API Conventions (Elysia)

- Routes are grouped under `apps/api/src/modules/v1/` and registered in `index.ts`
- Use `.group()` for nested resource routes
- Auth guard middleware is applied at the group level, not per-route
- Internal/admin endpoints go under `modules/internal/` — not under `v1/`
- Use Zod for all request/response schema validation
- Bearer token auth is provided by `@elysiajs/bearer`
- Environment variables are validated in `apps/api/src/env.ts` via `@t3-oss/env-core`
- Use `utils/try-catch.ts` for consistent error handling patterns

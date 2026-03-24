---
description: Next.js dashboard conventions
paths:
  - "apps/dashboard/**"
  - "packages/ui/**"
---

# Frontend Conventions (Next.js Dashboard)

- Use React Server Components by default; add `"use client"` only when needed (interactivity, hooks, browser APIs)
- Data fetching uses TanStack React Query — define query keys consistently
- Forms use React Hook Form or TanStack React Form
- Global UI state uses TanStack React Store
- All API calls go through the proxy defined in `apps/dashboard/src/utils/proxy.ts` — do not call the API directly from client components
- File uploads use Uppy with S3 multipart — do not roll custom upload logic
- UI components come from `packages/ui` (Shadcn/Radix) — add new components there via `pnpm bump-ui` rather than creating one-offs in the dashboard
- Environment variables are validated in the dashboard's `env.ts` — client-side vars must be prefixed `NEXT_PUBLIC_`

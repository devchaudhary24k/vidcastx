---
description: Feature-based folder structure for apps/app
paths:
  - "apps/app/src/features/**"
---

# Feature Structure

All user-facing functionality in `apps/app` is organized by **feature**, not by technical layer. A feature is a self-contained slice of product capability (e.g. `auth`, `videos`, `onboarding`, `billing`).

## Location

- All features live under `apps/app/src/features/<feature-name>/`
- Feature names are kebab-case: `video-upload`, `team-members`, not `videoUpload`
- If new code logically belongs to an existing feature, extend that feature — don't create a new one
- If it genuinely is a new capability, create a new feature directory

## Standard subdirectories

Every feature may contain any of the following subdirectories. Only create the ones you actually need — empty folders are noise.

```
features/<feature-name>/
├── index.ts         # barrel export (see below)
├── api/             # server functions, fetchers, mutation helpers
├── components/      # UI components for this feature (or subfolders if many)
├── constants/       # feature-scoped constants (enums, defaults, copy)
├── context/         # React context providers scoped to this feature
├── hooks/           # custom hooks for this feature
├── lib/             # feature-scoped helpers that don't fit elsewhere
├── stores/          # zustand stores scoped to this feature
├── types/           # TypeScript types/interfaces (prefer Zod-inferred types)
├── utils/           # pure utility functions
└── validator/       # Zod schemas — the source of truth for forms & API calls
```

Rules of thumb:

- `api/` holds everything that talks to the API (TanStack Query hooks, mutation helpers, server functions)
- `validator/` holds every Zod schema used by this feature; infer TS types from schemas rather than declaring them twice
- `components/` can nest further (`components/upload/`, `components/player/`) once there are too many files to scan at a glance

## Feature independence

- **Features must be independent.** A file inside `features/videos/` must not import from `features/onboarding/internal-thing`. If two features need shared code, promote that code:
  - Cross-feature UI primitive → `packages/ui`
  - Cross-feature hook/util → `apps/app/src/lib/` or `apps/app/src/utils/`
  - Cross-feature types → `apps/app/src/types/` or a shared package
- **All external access goes through `index.ts`.** Anything outside a feature (routes, other features, root files) may only import from `features/<name>` — never reach into `features/<name>/components/foo`. This makes refactors inside a feature safe.

## `index.ts` barrel

- `index.ts` is the **public API** of the feature. Export only what the outside world needs to consume.
- Internal helpers, subcomponents, and implementation details stay unexported.
- Example:

  ```ts
  // features/videos/index.ts
  export { VideoList } from "./components/video-list";
  export { VideoUploadForm } from "./components/video-upload-form";
  export { useVideoUpload } from "./hooks/use-video-upload";
  export type { Video } from "./types";
  ```

- Routes import like `import { VideoList } from "#app/features/videos"` — never like `import { VideoList } from "#app/features/videos/components/video-list"`.

## Scoping

- Everything under `features/<name>/` is **scoped to that feature**. A store, hook, or constant in `features/videos/stores/upload-store.ts` is for videos only.
- If you find yourself importing a feature's internal file from somewhere else, that's a signal the code should be promoted out of the feature.

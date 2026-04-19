---
description: File naming, location, and creation rules
---

# File Conventions

## Naming

- **File names**: always `kebab-case`.
  - ✓ `video-upload-form.tsx`, `use-video-upload.ts`, `auth-functions.ts`
  - ✗ `VideoUploadForm.tsx`, `useVideoUpload.ts`, `authFunctions.ts`
- **React component exports**: `PascalCase`.
  - ✓ `export function VideoUploadForm() { ... }`
  - The filename stays kebab-case even though the export is PascalCase.
- **Hooks**: file `use-xxx.ts`, export `useXxx`.
- **Zustand stores**: file `xxx-store.ts`, export `xxxStore` / `useXxxStore`.
- **Zod schemas**: file `xxx-schema.ts` (or grouped in `validator/`), export `XxxSchema` and `type Xxx = z.infer<typeof XxxSchema>`.
- **Types-only files**: `types.ts` inside a feature, or `xxx.types.ts` when split.
- **Constants**: `SCREAMING_SNAKE_CASE` for exported constants; filename stays kebab-case.
- Directories: kebab-case.

## Where to create new files

When you need to add a new file, walk this decision tree **in order**:

1. **Can I extend an existing feature?** If the change fits in `features/<name>/`, put it there. Add the file to the appropriate subdirectory (`components/`, `hooks/`, `api/`, etc.).
2. **Is it a new user-facing capability?** Create a new feature at `features/<new-name>/` (see `features.md`).
3. **Is it shared by many features?** Put it in `apps/app/src/lib/`, `apps/app/src/utils/`, or promote it to a package.
4. **Is it a reusable UI primitive?** It belongs in `packages/ui`, not `apps/app`.
5. **Is it a route?** Add it under `apps/app/src/routes/` following TanStack Router's file-based routing conventions.

## Hard boundaries

- **Never write source files outside `src/`.** Only config files (`vite.config.ts`, `tsconfig.json`, `package.json`, `.env.example`, etc.) live at the app root.
- **Never put feature code in `components/` at the app root** — that directory is reserved for genuinely global components (error boundaries, root layouts). Feature components belong in `features/<name>/components/`.
- **Never duplicate a component across features.** If two features need the same component, promote it to `packages/ui` or to shared app-level code.

## New file checklist

Before creating a file, confirm:

- [ ] I checked if an existing file can be extended instead
- [ ] The file lives inside the right feature (or is justifiably shared)
- [ ] The filename is kebab-case
- [ ] The export name matches the convention for that kind of file
- [ ] I'm not creating something that already exists elsewhere under a different name

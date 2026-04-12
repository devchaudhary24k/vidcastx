# archived/

Code that is no longer part of the active build but is preserved for reference.

This directory is **not** included in the pnpm workspace (`pnpm-workspace.yaml` only globs `apps/*`, `packages/*`, `tooling/*`, `workers/*`), so nothing here is installed, built, linted, or type-checked by `pnpm dev` / `turbo` runs.

## Contents

- **`dashboard/`** — the legacy Next.js 16 frontend. Replaced by `apps/app` (TanStack Start). Kept around as a visual parity reference while the migration finishes; do not start new feature work here.

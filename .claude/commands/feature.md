---
description: Scaffold a new feature directory under apps/app/src/features/ following features.md. Wraps the feature-scaffolder agent.
argument-hint: <kebab-case-name>
---

The user wants to create a new feature. Feature name: `$ARGUMENTS`.

Delegate to the `feature-scaffolder` agent with this exact instruction:

> Scaffold a new feature named `$ARGUMENTS` under `apps/app/src/features/`. Confirm the kebab-case form is correct, ask which optional subdirectories the user wants beyond the default minimal layout (`index.ts`, `components/`, `api/`), create them, and report the resulting tree.

If `$ARGUMENTS` is empty or not kebab-case, fix it (or ask the user) before delegating.

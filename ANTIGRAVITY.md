# Antigravity Instructions

This file serves as the core instruction set and context for **Antigravity**, derived from project skills and repository structure, ensuring AI-assisted development adheres strictly to VidcastX's architectural standards.

## 1. Monorepo & Build System (Turborepo)

- **Use `turbo run`**: Always use `turbo run <task>` in `package.json` scripts or CI. Do NOT use the interactive `turbo <task>` shorthand inside automated tasks.
- **Task Configurations**: Never put complex build logic in the root `package.json`. Place task-specific logic inside the individual package's `package.json` and declare dependencies inside `turbo.json`.
- **Package Configuration**: Use `turbo.json` files within individual packages (with `"extends": ["//"]`) for package-specific task overrides rather than cluttering the root `turbo.json`.
- **Avoid Global Dependencies Overreach**: Only put truly global variables (like universal environments) in `globalEnv`. Restrict file changes locally using `inputs`.

## 2. API Server (ElysiaJS)

- **Validation & OpenAPI**: Always use TypeBox (`t.*`) for both request and response validation schemas on all endpoints. This powers the OpenAPI UI.
- **Dependency Scope**: Understand Elysia's isolation scopes. Use inline callbacks (e.g., `({ body }) => ...`) to preserve type inference.
- **Error Handling**: Consistently return custom `{ error: string }` shapes with proper HTTP statuses on failures (using Elysia's `status` utility) rather than abruptly throwing unhandled errors.
- **Architecture**: Separate logic into Controllers, Services, and Models for cleaner business logic. Use guards for repeating auth/validation logic across `.group()` routes.

## 3. Frontend & UI (Next.js / React)

Adhere to the Vercel React Best Practices for high-performance frontend code:

- **Eliminate Waterfalls**: Start promises early, await them late. Use `Promise.all()` for independent requests. Use Suspense for streaming content.
- **Optimize Bundles**: Import components directly instead of through barrel files. Use dynamic imports (`next/dynamic`) for heavy components.
- **Server Components**: Keep serialization minimal between RSC and Client components. Hoist static IO (fonts, metadata, headers). Cache intelligently (`React.cache()`).
- **Rendering & State**: Defer state reads and memoize expensive subtrees. Limit rerenders by passing primitive props and maintaining flat derived states.

## 4. Workflows & Execution

Whenever you modify this codebase:

1. Observe the structured monorepo domains (e.g., `apps/dashboard` vs. `packages/ui` vs. `packages/database`).
2. Maintain strong module boundaries. Import dependencies using correct workspaces (e.g., `"@vidcastx/database": "workspace:*"`).
3. Check `CLAUDE.md` and `README.md` periodically for architectural reference points.

# Tooling (TypeScript / ESLint / Prettier / Husky)

This file documents the current shape of the monorepo's dev-tooling. Read it before touching any config under `tooling/`, `.husky/`, `.editorconfig`, `.lintstagedrc`, or per-package `eslint.config.js` / `tsconfig.json`.

## TypeScript

Base config: `tooling/typescript-config/base.json`. Inherited by `library.json`, `react-library.json`, `app-bundler.json`, `api-bun.json`.

**Strict flags on (do NOT relax without discussion):**

- `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, `useUnknownInCatchVariables`, `allowUnreachableCode: false`, `allowUnusedLabels: false`
- `verbatimModuleSyntax: true` — pairs with `@typescript-eslint/consistent-type-imports`. Inline `type` markers required.
- `erasableSyntaxOnly: true` — forbids `enum`, `namespace`, TS parameter-properties. Forward-compatible with Node native TS strip (`--experimental-strip-types`). **Do not add `enum`s or `namespace`s** — use `as const` objects or union types.
- `target: ES2023` + `lib: ES2023` — `findLast`, `toSorted`, `toReversed` are available natively. Use them.
- `incremental: true` + `tsBuildInfoFile: ".cache/tsbuildinfo"` — `.cache/` is gitignored.

**Flags explicitly OFF (reason):**

- `exactOptionalPropertyTypes: false` — incompatible with shadcn upstream component typings. Do not flip on.
- `noPropertyAccessFromIndexSignature: false` — would force bracket access in vendored shadcn `calendar.tsx` (react-day-picker) that we can't edit per `shadcn.md`. Monorepo imports `packages/ui` source directly, so the consumer's tsconfig applies. Do not flip on.

## ESLint

Flat config only (ESLint 9). Per-package config files at each workspace root; root `eslint.config.mjs` is the **fallback** for loose files outside workspaces (its `ignores` list excludes `apps/**`, `packages/**`, `workers/**`, `tooling/**`).

**ESLint binary lives at monorepo root** (`devDependency` on root `package.json`). lint-staged invokes it via `pnpm exec eslint`.

### Plugins wired

Base (`tooling/eslint-config/base.js`):

- `@eslint/js` recommended
- `typescript-eslint` — `strictTypeChecked` + `stylisticTypeChecked`
- `eslint-config-prettier` — turns off style rules that fight Prettier
- `eslint-plugin-turbo` — flags undeclared env vars
- `eslint-plugin-unused-imports` — **replaces** `@typescript-eslint/no-unused-vars`. Autofixes dead imports on `--fix`.
- `eslint-plugin-regexp` (recommended)
- `eslint-plugin-unicorn` (recommended, curated — see disable list in `base.js`)

React (`tooling/eslint-config/react-internal.js`):

- `eslint-plugin-react` + `react-hooks` + `eslint-plugin-jsx-a11y`

TanStack app (`tooling/eslint-config/tanstack-app.js`):

- `eslint-plugin-react-refresh` — Vite HMR boundary enforcement
- Route files under `src/routes/**` and integration files under `src/integrations/**` bypass `react-refresh/only-export-components` (prescribed TanStack patterns don't break HMR in practice).

Elysia API (`tooling/eslint-config/elysia-api.js`):

- Scopes `require-await: off` to `src/modules/**` only — Elysia handlers return `Promise<T>` by contract. Utilities outside modules still get the rule.

### Plugins installed but NOT wired

- `eslint-plugin-n` — Node-version compatibility checker. Skipped because `apps/api` runs on Bun, `workers/**` + `packages/**` run on Node. Applying globally would flag Bun APIs as non-Node. Wire per-package if ever needed.

### Notable disabled rules + reasons

- `unicorn/prevent-abbreviations` — `props`, `env`, `ref`, `db`, `api` are fine.
- `unicorn/no-null` — we distinguish null vs undefined deliberately.
- `unicorn/prefer-global-this` — breaks `typeof window === "undefined"` SSR guards.
- `unicorn/filename-case` — `file-conventions.md` already governs kebab-case.
- `@typescript-eslint/prefer-nullish-coalescing`, `prefer-optional-chain` — stylistic, not correctness.
- `@typescript-eslint/array-type` — off in `apps/app` only.

### Shadcn vendored overrides

`packages/ui/src/components/**` has per-file overrides in `packages/ui/eslint.config.js` relaxing unsafe-\*, a11y, and `unicorn/no-document-cookie`. **Do not edit files under that path** per `shadcn.md`. If a rule fires there, add it to the override list (not edit the component).

## Prettier

Config: `tooling/prettier/index.js`. Exposed as `@vidcastx/prettier`.

Key settings:

- `printWidth: 120`, `singleQuote: false`, `trailingComma: "all"`
- `endOfLine: "lf"` — normalized for cross-platform checkouts
- `@ianvs/prettier-plugin-sort-imports` with groups for `@vidcastx/*`, `#app/*` (app subpath aliases), relative imports
- `prettier-plugin-tailwindcss` — sorts Tailwind classes in `cn`, `cva`

## EditorConfig

`.editorconfig` at root. Covers non-Prettier-aware editors opening Dockerfiles, YAML, Makefiles. LF, UTF-8, 2-space indent, trim trailing whitespace, final newline.

## Husky + lint-staged

`.husky/`:

- `pre-commit` — runs `lint-staged` on staged files (eslint --fix + prettier --write, `--no-warn-ignored`).
- `pre-push` — runs both `pnpm check-types` AND `pnpm lint` (continues on first failure so user sees full picture).
- `post-merge` — auto `pnpm install` if lockfile/package.json changed; warns if DB schema changed (prompts `pnpm db:migrate`).
- `post-checkout` — same as post-merge for branch switches.
- `pre-rebase` — blocks rebase on `main`/`dev`/`master`/`develop`.

`.lintstagedrc`:

```jsonc
{
  "*.{ts,tsx,js,jsx,mjs,cjs}": ["pnpm exec eslint --fix --max-warnings 0 --no-warn-ignored"],
  "*.{ts,tsx,js,jsx,mjs,cjs,json,css,md,yml,yaml}": ["pnpm exec prettier --write"],
}
```

`pnpm exec` required — ESLint binary is at monorepo root, not per-workspace. `--no-warn-ignored` prevents lint-staged failing on files the root fallback explicitly ignores.

## What NOT to do

- Don't turn `exactOptionalPropertyTypes` or `noPropertyAccessFromIndexSignature` on — see reasons above.
- Don't edit `packages/ui/src/components/**` — vendored shadcn.
- Don't add `enum` or `namespace` — `erasableSyntaxOnly` will reject.
- Don't install tooling deps at per-workspace level if they're tooling-shared — add to `tooling/eslint-config` or root.
- Don't remove the root `eslint.config.mjs` — lint-staged needs it as fallback for stray files.
- Don't bypass hooks with `--no-verify` — if a hook fails, fix the root cause.
- Don't install a package anywhere without explicit user approval — see `dependencies.md`.

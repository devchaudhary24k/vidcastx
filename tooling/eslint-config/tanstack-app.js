import reactRefresh from "eslint-plugin-react-refresh";

import { config as baseConfig } from "./base.js";

/**
 * Config for apps/app (TanStack Start on Vite).
 *
 * Usage:
 *   import { config as vidcastxApp } from "@vidcastx/eslint-config/tanstack-app";
 *   export default [...vidcastxApp];
 *
 * Note: we do NOT compose with @tanstack/eslint-config — under ESLint 9 it
 * re-registers @typescript-eslint, causing a "Cannot redefine plugin" crash.
 * Our base already covers what tanstack's preset adds.
 *
 * @type {import("eslint").Linter.Config}
 */
export const config = [
  /* ─── Base (strict type-safety, hygiene, error-handling) ─ */
  ...baseConfig,

  /* ─── Vite HMR boundary (react-refresh) ────────────── */
  reactRefresh.configs.vite,

  /* ─── TanStack file-based routes ──────────────────── */
  {
    // Route files export `Route` (createFileRoute result) alongside the route
    // component — the prescribed TanStack Router pattern. HMR works in practice
    // via Vite + TanStack plugin; the rule's static analysis can't see that.
    files: ["src/routes/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },

  /* ─── Integration modules (not HMR-relevant) ──────── */
  {
    // TanStack Query / Router integration files export factory functions,
    // not components. HMR boundary enforcement doesn't apply.
    files: ["src/integrations/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },

  /* ─── Stylistic opinions we disagree with ──────────── */
  {
    rules: {
      "@typescript-eslint/array-type": "off",
    },
  },
];

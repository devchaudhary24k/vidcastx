import { config as baseConfig } from "./base.js";

/**
 * Additive rules for apps/app (TanStack Start).
 *
 * Designed to COMPOSE with @tanstack/eslint-config at the use-site. Tanstack's
 * preset stays primary; this adds our strict type-safety + hygiene rules on top.
 *
 * Usage:
 *   import { tanstackConfig } from "@tanstack/eslint-config";
 *   import { config as vidcastxApp } from "@vidcastx/eslint-config/tanstack-app";
 *   export default [...tanstackConfig, ...vidcastxApp];
 *
 * @type {import("eslint").Linter.Config}
 */
export const config = [
  /* ─── Base (strict type-safety, hygiene, error-handling) ─ */
  ...baseConfig,

  /* ─── Allow tanstack-suggested disables ─────────────── */
  {
    rules: {
      "import/no-cycle": "off",
      "import/order": "off",
      "sort-imports": "off",
      "@typescript-eslint/array-type": "off",
    },
  },
];

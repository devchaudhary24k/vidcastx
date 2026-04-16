// @ts-check
import { tanstackConfig } from "@tanstack/eslint-config";

import { config as vidcastxApp } from "@vidcastx/eslint-config/tanstack-app";

/**
 * Composition order matters:
 *   1. TanStack's shipped preset (authoritative — mirrors framework defaults)
 *   2. Our strict type-safety / error-handling / hygiene layer
 *   3. Local overrides last
 *
 * @type {import("eslint").Linter.Config}
 */
export default [
  /* ─── TanStack defaults ──────────────────────────────── */
  ...tanstackConfig,

  /* ─── Vidcastx strict layer ──────────────────────────── */
  ...vidcastxApp,

  /* ─── Local overrides ────────────────────────────────── */
  {
    rules: {
      "pnpm/json-enforce-catalog": "off",
    },
  },
  {
    ignores: [
      "eslint.config.js",
      "prettier.config.js",
      "src/routeTree.gen.ts",
      ".output/**",
      ".vinxi/**",
    ],
  },
];

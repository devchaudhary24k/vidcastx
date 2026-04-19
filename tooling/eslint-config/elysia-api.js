import globals from "globals";

import { config as baseConfig } from "./base.js";

/**
 * Config for apps/api (Elysia on Bun).
 *
 * @type {import("eslint").Linter.Config}
 */
export const config = [
  /* ─── Base ─────────────────────────────────────────── */
  ...baseConfig,

  /* ─── Environment: Node/Bun ────────────────────────── */
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  /* ─── Server-specific loosenings ───────────────────── */
  {
    // Scope require-await:off to route modules only — utilities still get linted.
    // Elysia handlers often define async functions that don't `await` but match
    // a route signature that demands Promise<T>. The runtime wraps them anyway.
    files: ["src/modules/**/*.ts"],
    rules: {
      "@typescript-eslint/require-await": "off",
    },
  },
];

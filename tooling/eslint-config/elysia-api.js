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
    rules: {
      // Elysia handlers often define async functions that don't `await` but
      // match a route signature that demands Promise<T>. The runtime wraps
      // them anyway — require-await is too aggressive here.
      "@typescript-eslint/require-await": "off",
    },
  },
];

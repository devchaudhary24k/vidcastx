import globals from "globals";

import { config as baseConfig } from "./base.js";

/**
 * Pure TS library config (Node/Bun, no browser).
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
];

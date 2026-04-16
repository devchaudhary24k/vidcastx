import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

import { config as baseConfig } from "./base.js";

/**
 * React internal library config — for reusable UI packages.
 *
 * @type {import("eslint").Linter.Config}
 */
export const config = [
  /* ─── Base ─────────────────────────────────────────── */
  ...baseConfig,

  /* ─── React ────────────────────────────────────────── */
  pluginReact.configs.flat.recommended,
  {
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
    settings: { react: { version: "detect" } },
  },

  /* ─── React Hooks ──────────────────────────────────── */
  {
    plugins: { "react-hooks": pluginReactHooks },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
];

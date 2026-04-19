// @ts-check
import { config as vidcastxApp } from "@vidcastx/eslint-config/tanstack-app";

/** @type {import("eslint").Linter.Config} */
export default [
  /* ─── Vidcastx strict layer (extends base tseslint strictTypeChecked) ─ */
  ...vidcastxApp,

  {
    ignores: ["eslint.config.js", "prettier.config.js", "src/routeTree.gen.ts", ".output/**", ".vinxi/**"],
  },
];

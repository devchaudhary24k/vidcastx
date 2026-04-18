import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import { globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

/**
 * Shared ESLint base config for the monorepo.
 *
 * Type-aware rules rely on the `projectService` parser option — consumers
 * should not need to wire this themselves; it is set below.
 *
 * @type {import("eslint").Linter.Config}
 */
export const config = [
  /* ─── Base recommended presets ─────────────────────── */
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintConfigPrettier,

  /* ─── Parser: type-aware across the workspace ──────── */
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.mjs", "eslint.config.js", "*.config.mjs", "*.config.js"],
        },
        tsconfigRootDir: process.cwd(),
      },
    },
  },

  /* ─── Turbo plugin ─────────────────────────────────── */
  {
    plugins: { turbo: turboPlugin },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },

  /* ─── Type Safety (error) ──────────────────────────── */
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowBoolean: true, allowNullish: true },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  /* ─── Preferences (off — stylistic, not correctness) ─ */
  {
    rules: {
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "off",
    },
  },

  /* ─── Error Handling ───────────────────────────────── */
  {
    rules: {
      "no-empty": ["error", { allowEmptyCatch: false }],
    },
  },

  /* ─── General Hygiene ──────────────────────────────── */
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      eqeqeq: ["error", "always"],
      "prefer-const": "error",
    },
  },

  /* ─── Ignores ──────────────────────────────────────── */
  globalIgnores(["dist/**", "build/**", ".turbo/**", "node_modules/**", "coverage/**"]),
];

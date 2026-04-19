import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import regexpPlugin from "eslint-plugin-regexp";
import turboPlugin from "eslint-plugin-turbo";
import unicornPlugin from "eslint-plugin-unicorn";
import unusedImports from "eslint-plugin-unused-imports";
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
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/method-signature-style": ["error", "property"],
      // Delegate to unused-imports — autofixes dead imports on --fix.
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  /* ─── Unused imports / vars (autofixable) ──────────── */
  {
    plugins: { "unused-imports": unusedImports },
    rules: {
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
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

  /* ─── process.env direct usage (env-safety.md) ─────── */
  {
    // Forbid `process.env.X` everywhere; validated env modules are exempt via
    // the files override further down the chain.
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.type='MemberExpression'][object.object.name='process'][object.property.name='env']",
          message:
            "Don't read process.env.X directly — import from the workspace env.ts (validated via @t3-oss/env-core). See .claude/rules/env-safety.md.",
        },
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message:
            "Don't read process.env directly — import from the workspace env.ts. See .claude/rules/env-safety.md.",
        },
      ],
    },
  },
  {
    // env.ts is the one place that's allowed to read process.env.
    files: ["**/env.ts", "**/env.mts", "**/env.cts", "**/env.js", "**/env.mjs", "**/env.cjs"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },

  /* ─── Regexp safety ────────────────────────────────── */
  regexpPlugin.configs["flat/recommended"],

  /* ─── Unicorn (curated) ────────────────────────────── */
  unicornPlugin.configs.recommended,
  {
    rules: {
      // Noisy, aesthetic, or conflicts with repo conventions.
      "unicorn/prevent-abbreviations": "off", // `props`, `env`, `ref`, `db`, `api` are fine
      "unicorn/no-null": "off", // null ≠ undefined; we distinguish intentionally
      "unicorn/no-array-reduce": "off", // reduce is fine when expressive
      "unicorn/no-useless-undefined": "off", // react-form/zod apis often want explicit undefined
      "unicorn/filename-case": "off", // file-conventions.md already governs kebab-case
      "unicorn/prefer-top-level-await": "off", // not every entrypoint supports top-level await
      "unicorn/no-nested-ternary": "off", // prettier handles this; rule disagrees with formatter
      // Catches genuine misuse of `await`-less async
      "unicorn/no-await-expression-member": "off", // `(await x).y` is fine and common
      "unicorn/no-process-exit": "off", // workers/scripts legitimately exit
      "unicorn/prefer-global-this": "off", // breaks `typeof window` SSR guards
    },
  },

  /* ─── Ignores ──────────────────────────────────────── */
  globalIgnores(["dist/**", "build/**", ".turbo/**", "node_modules/**", "coverage/**"]),
];

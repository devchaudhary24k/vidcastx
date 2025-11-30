import { config as baseConfig } from "@workspace/eslint-config/base";

/**
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  ...baseConfig,
  {
    ignores: ["apps/**", "packages/**", "tooling/**"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
      project: true,
    },
  },
];

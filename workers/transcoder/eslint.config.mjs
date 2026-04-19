import { config } from "@vidcastx/eslint-config/library";

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
];

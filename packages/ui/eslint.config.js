import { config } from "@vidcastx/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  // Vendored shadcn components — upstream code, not edited in this repo per .claude/rules/shadcn.md
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      eqeqeq: "off",
    },
  },
];

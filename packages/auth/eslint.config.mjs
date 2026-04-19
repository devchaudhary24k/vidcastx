import { config } from "@vidcastx/eslint-config/library";

/** @type {import("eslint").Linter.Config[]} */
export default [{ ignores: ["script/**"] }, ...config];

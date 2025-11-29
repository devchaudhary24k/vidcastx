import eslintPluginAstro from "eslint-plugin-astro";

/**
 * A custom ESLint configuration for libraries that use Astro.js.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  // add more generic rule sets here, such as:
  // js.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  ...eslintPluginAstro.configs["jsx-a11y-recommended"],
  {
    rules: {
      // override/add rules settings here, such as:
      // "astro/no-set-html-directive": "error"
    },
  },
];

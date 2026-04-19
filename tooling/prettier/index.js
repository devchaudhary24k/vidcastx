// Prettier configuration with explicit behavior for imports, Tailwind, and formatting.
const config = {
  // Plugins extend Prettier’s capabilities.
  // Sorts imports deterministically with advanced grouping.
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    // Automatically sorts Tailwind classes based on the official config.
    "prettier-plugin-tailwindcss",
  ],

  // Tells the Tailwind plugin which utility-wrapping functions to inspect.
  tailwindFunctions: ["cn", "cva"],

  // Import sorting rules. Each entry defines a group in evaluation order.
  importOrder: [
    // Type-only imports at the top.
    "<TYPES>",
    // Core React imports.
    "^(react/(.*)$)|^(react$)|^(react-native(.*)$)",
    // Next.js imports.
    "^(next/(.*)$)|^(next$)",
    // Expo-related imports.
    "^(expo(.*)$)|^(expo$)",
    // All third-party npm packages.
    "<THIRD_PARTY_MODULES>",
    "",
    // Type imports from internal workspace packages.
    "<TYPES>^@workspace",
    // Normal internal workspace imports.
    "^@vidcastx/(.*)$",
    "",
    // Type imports from app subpath aliases (e.g. #app/*).
    "<TYPES>^#",
    // App subpath aliases.
    "^#",
    "",
    // Type imports using local/relative pathing.
    "<TYPES>^[.|..|~]",
    // Imports from ~/ alias.
    "^~/",
    // Relative imports (parent directories).
    "^[../]",
    // Relative imports (same directory).
    "^[./]",
  ],

  // Visual and formatting rules.
  tabWidth: 2, // Two spaces per indentation level.
  semi: true, // Enforces semicolons.
  singleQuote: false, // Uses double quotes consistently.
  trailingComma: "all", // Trailing commas in all possible places.
  arrowParens: "always", // Always wrap arrow function params.
  bracketSpacing: true, // Controls spacing inside object literals.
  bracketSameLine: false, // Puts closing bracket on its own line.
  printWidth: 120, // Maximum line length before it wraps or reformats code
  endOfLine: "lf", // Enforce LF line endings — prevents CRLF churn on cross-platform checkouts.

  // Import sorting behavior.
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"], // Enables parsing for advanced syntax.
  importOrderTypeScriptVersion: "5.7.0", // Parser behavior aligned with modern TS (satisfies, const type params, etc).

  // File-specific overrides to handle template generators.
  overrides: [
    {
      files: "*.json.hbs",
      options: {
        parser: "json", // Treat .json.hbs as JSON before Handlebars processing.
      },
    },
    {
      files: "*.js.hbs",
      options: {
        parser: "babel", // Treat .js.hbs as JS for formatting.
      },
    },
  ],
};

export default config;

// PARBAUGHS ESLint config (flat config, eslint 9+)
//
// Goal 2 A5 Code-quality improvement (audit-spec-2026-05-19): wire ESLint
// to enforce cyclomatic complexity ≤ 15 + catch common JS pitfalls. The
// pre-commit lint gate (Hook 1, see CLAUDE.md) will run this on every
// commit once `npm run lint` is wired through Husky.
//
// Why ESLint at v9 / flat config: ECC plugin ecosystem assumes flat. Older
// .eslintrc syntax is in maintenance mode.

import globals from "globals";

// NOTE 2026-05-21: NOT spreading js.configs.recommended because it sets
// dozens of rules to "error" level (no-undef, no-unused-vars, etc.).
// The existing PARBAUGHS codebase has 465 such violations that all need
// fixing — that's its own ship. For now, every rule is "warn" so:
//   - lint runs see the signal
//   - pre-commit-lint.sh hook still passes (npm run lint exits 0 on warn-only)
//   - the codebase has time to be cleaned iteratively
//
// Once codebase is clean, promote rules to "error" + spread
// js.configs.recommended.
export default [
  {
    files: ["src/**/*.js", "scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",   // PARBAUGHS uses script-tag includes, not modules
      globals: {
        ...globals.browser,
        ...globals.node,
        // PARBAUGHS-specific runtime globals (added to <script> tags or to firebase.js)
        firebase: "readonly",
        db: "writable",
        auth: "writable",
        currentUser: "writable",
        currentProfile: "writable",
        pbLog: "readonly",
        pbWarn: "readonly",
        pbError: "readonly",
      },
    },
    rules: {
      // Cyclomatic complexity ceiling — matches industry-grade (Stripe/Linear ~15)
      "complexity": ["warn", { max: 15 }],

      // Catch common bugs (warn-only initially; promote to error once codebase clean)
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "off",  // Too noisy for vanilla-JS script-tag codebase right now
      "no-console": "off",
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-prototype-builtins": "off",
      "no-redeclare": "off",  // var-hoisted globals legitimately re-declared
      "no-cond-assign": "off",

      // Style hints (warn — not blocking, just signal)
      "no-var": "off",        // CLAUDE.md mandates `var` for vanilla JS compat
      "prefer-const": "off",
      "eqeqeq": ["warn", "always"],
    },
  },
  {
    // src/main.js is the Vite entry point — uses ES module syntax
    files: ["src/main.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["tests/**/*.js", "tests/e2e/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // Unit tests (tests/unit/*.test.js + helpers) use ESM imports per Vitest requirement.
    files: ["tests/unit/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // Ignore generated + vendor + state
    ignores: [
      "docs/reports/**",
      "dist/**",
      "node_modules/**",
      ".claude/state/**",
      "functions/lib/**",
      "scripts/cron/logs/**",
      "src/**/*.min.js",
    ],
  },
];

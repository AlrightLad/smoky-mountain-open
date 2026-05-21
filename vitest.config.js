// PARBAUGHS Vitest config (Goal 2 A11 Testing — unit framework)
//
// Why Vitest: fastest JS test runner for Vite-based projects (PARBAUGHS uses
// Vite), zero-config TypeScript, native ESM, coverage built-in via @vitest/coverage-v8.
//
// Test layout:
//   tests/unit/*.test.js  — pure-function unit tests
//   tests/unit/helpers/   — shared test helpers (eval-source.js etc.)
//
// Coverage target: 80% on `src/core/` pure-function modules per CLAUDE.md
// testing strategy. NOT targeting `src/pages/` — those are DOM/Firestore-bound
// and exercised by Playwright (`tests/e2e/`).

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
    environment: 'node',
    globals: false,
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      include: ['src/core/handicap.js', 'src/core/parcoins.js'],
      exclude: ['node_modules/**', 'tests/**', 'dist/**', '.claude/**'],
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'tests/unit/coverage',
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
});

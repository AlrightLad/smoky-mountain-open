# ADR-002 — Vanilla JS for app code; Vite for build pipeline only

**Status:** Accepted
**Date:** 2026-04-01 (extracted from CLAUDE.md)
**Deciders:** Founder

## Context

PARBAUGHS is a small-team labor-of-love app (~20 founding members). Standard React / Vue / Svelte stacks bring substantial weight: bundler complexity, hydration cost, framework learning curve for any future Founder-adjacent contributor.

## Decision

App code is **vanilla JavaScript** — `var` declarations, `<script>` tag inclusion (no ES module imports in src/pages/*.js), DOM manipulation via querySelector + innerHTML. Vite handles build (bundling + minification + asset hashing) but does NOT impose its module system on app code at runtime.

## Rationale

- **Option A: Vanilla JS + Vite build (chosen).** Zero framework runtime cost. Founder + agents can read any page in 30 seconds. Total app weight (875KB initial + 1124KB async per W1.S2 split) acceptable for the 20-member audience.
- **Option B: React + Vite.** Hydration cost, requires JSX tooling, more layers between agent and user-visible bug. Bundle would be larger.
- **Option C: Svelte.** Lighter than React but adds compilation step; agent debugging needs Svelte mental model.

## Consequences

- **No type safety** — JSDoc on hot paths; runtime validation at trust boundaries (zod schemas in Cloud Functions per W1.S2 / Cloud Function hardening ship).
- **Manual DOM updates** — engagement diff-only pattern (v8.19.0+) handles partial re-render without React-style virtual DOM.
- **No npm-published UI libraries** — the app uses only Firebase web SDK + html2canvas. Anything else gets written.
- Vite's `transformIndexHtml` plugin (vite.config.js) inlines `<script>` tags for CORE_FILES + immediate pages; deferred pages emit as separate async chunk (W1.S2 bundle split fix).

## Cross-reference

- `vite.config.js` — CORE_FILES + IMMEDIATE_PAGES + DEFERRED_PAGES
- `CLAUDE.md` — "var (not let/const) for current vanilla JS compat"
- `package.json` — devDependencies (no React/Vue/etc.)

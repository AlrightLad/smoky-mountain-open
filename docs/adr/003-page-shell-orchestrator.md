# ADR-003 — Page Shell orchestrator for HQ chrome (PB.pageShell)

**Status:** Accepted
**Date:** 2026-05-08 (v8.11.4 Page Shell refactor)
**Deciders:** Orchestration team (CTO + Engineer agents)

## Context

Pre-v8.11.4: every HQ page reimplemented its own chrome (banner, masthead, scope rail, content wrapper, footer). 20+ pages × inconsistent chrome = visual drift, hard-to-maintain breakpoint handling, near-impossible to refresh chrome globally.

## Decision

`PB.pageShell.render(rootEl, slotData)` at `src/core/page-shell.js` (295 lines). Pages provide slot data; the shell composes banner / masthead / scope / content / leftRail / rightRail / footer + dispatches by band (A/B/C/D viewport sizes).

Mobile bypass: pages render inline below `HQ_BREAKPOINT` (720px); shell is HQ-only.

## Rationale

- **Option A: Shared shell orchestrator (chosen).** One refactor refreshes all pages. Each page becomes thin slot-provider. Design-system token consumption centralized in shell.
- **Option B: Per-page chrome duplicated.** Status quo pre-v8.11.4 — drift confirmed.
- **Option C: Component framework (React-style).** Would force ADR-002 reversal.

## Consequences

- Pages get simpler: home.js drops chrome-rendering code, becomes pure slot composition.
- Shell has its OWN render-path stamping (`dataset.renderPath = "hq-shell"`) for observability.
- Fault-tolerant via caller try/catch: `_renderHQHome` wrapped, falls back to `_renderMobileHome` on shell error.
- 'hqHome' masthead variant (v8.15.1) adds editorial-newspaper treatment as first variant beyond default + bandA.

## Cross-reference

- `src/core/page-shell.js` — implementation
- `src/pages/home.js` line 199+ — first consumer
- `docs/CLUBHOUSE_SPEC-HQ.md` — design contract
- W1.S2 ship — Page Shell + HQ Home consumer + Wave 2 reveal moment substrate

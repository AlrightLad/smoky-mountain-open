# App Audit Findings — Architecture (A6)

**Authored:** 2026-05-20T23:55Z by Goal 2 audit.
**Dimension:** A6 — Architecture review.
**Score:** 95 / 100 — Grade A.
**Source:** `.claude/state/aggregates/architecture-review.json` (post-AMD-027 budget refit).

## Headline

**0 architectural concerns flagged** by `scripts/aggregate-architecture-review.py` against AMD-027 file-size budgets. This is the result of Founder-decided substrate engineering on 2026-05-19 (raising orchestration-tier file budgets from 800 to 1000/2500/3000 per module class).

## What the aggregator checks

1. File-size budgets per AMD-027 (src/core/router.js ≤ 3000, data.js ≤ 2500, others ≤ 1000; src/pages ≤ 800)
2. Orphan modules (declared but unused)
3. Cross-module circular imports (Python AST-equivalent for ES modules)
4. functions/index.js size (≤ 1000)
5. Manifest consistency (src/main.js + index.html + vite config)

## Open findings (Founder triage)

### Soft warnings (not blocking, not in the aggregator yet)

1. **src/core/router.js is at 97% of budget** (2,917 / 3,000). Next non-trivial feature WILL push over. Pre-emptively factor out:
   - The flow-rail logic → `src/core/flow-rail.js` (~400 lines)
   - The share-card builder → `src/core/share-card.js` (~150 lines, currently at 1109-1190)
   - The page-shell orchestration → already extracted to `src/core/page-shell.js`

2. **src/pages/ has 10 files over the default 800-line page rule** (covered in `app-audit-findings-code-quality.md`).

3. **functions/index.js holds 8 Cloud Functions in one file (860 lines).** Consider per-function modularization once one function grows past ~250 lines.

## Scope-cut

A6 captures **mechanical static checks only.** Not yet captured:
- Anti-pattern detection (god-object, leaky abstraction, eager singletons)
- Module-boundary discipline (which page imports from which core module)
- Layer violations (UI imports from page-shell internals, etc.)

These require domain-specific lint rules.

## Status

**GREEN** — architecture is healthy at the budget-compliance level. router.js sits at 97% of AMD-027 budget — pre-emptive refactor recommended within the next 2-3 ships.

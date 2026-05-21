# ADR-005 — Orchestration dashboards (docs/reports/*.html) gitignored; local-only

**Status:** Accepted
**Date:** 2026-05-14 (Founder directive)
**Deciders:** Founder

## Context

PARBAUGHS dashboards (dashboard.html, app-health.html, activity.html, etc.) under `docs/reports/` surface internal orchestration state: proposal text, telemetry, agent activity, escalations, dim-source paths, token spending. The repo is PUBLIC on GitHub. Committing dashboards would expose all of this to anyone with the repo URL.

## Decision

`docs/reports/*.html` is gitignored. The regen pipeline (post-commit hook + cron) writes these locally; they never push to GitHub. Only `app-health.html` + `main-flows.html` are exceptions (tracked) because they were committed earlier in repo history and pruning them isn't worth the BFG-rewrite cost.

The Founder views dashboards by opening `file:///C:/Users/Zach/smoky-mountain-open/docs/reports/index.html` locally.

## Rationale

- **Option A: Local-only dashboards (chosen).** Founder gets full surface; nothing exposed externally.
- **Option B: Auth-gated public dashboards.** Adds a server (currently GitHub Pages is static). Not aligned with zero-budget P4 OSS-first principle.
- **Option C: Make repo private.** Breaks open-collaboration ethos + GitHub free private repo size limits.

## Consequences

- The Founder's local-only view is the *only* dashboard view. No cross-device access (mobile dashboard not available).
- Pre-commit gate must auto-sync templates → docs/reports/ before smoke (because docs/reports is gitignored — templates are the only commit-visible source). This is wired in `.husky/pre-commit` (2026-05-21).
- Dashboard smoke runs against `docs/reports/*.html` (the local rendered files). Smoke validates the templates indirectly via the sync.
- Any new dashboard template author must add an explicit copy step OR rely on the post-commit regen pipeline to materialize `docs/reports/<name>.html`.

## Cross-reference

- `.gitignore` lines 96+ — dashboard report exclusion
- `.husky/pre-commit` — auto-sync templates → docs/reports before smoke
- `scripts/regen-*.py` — per-dashboard data-block swappers
- Founder directive 2026-05-14: "only I should have access to dashboard and it should all be local not shared for anyone else to see"

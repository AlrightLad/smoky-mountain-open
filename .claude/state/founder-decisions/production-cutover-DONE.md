# Production cutover — DONE

**Approved by:** Founder, 2026-06-09 ("production cutover Im approving").
**Status:** COMPLETE.

## What happened

Prod had drifted ~917 commits behind (stuck at v8.23.1) because main was frozen
and pushes were going to staging only. The Founder approved the cutover and
lifted the freeze.

- `.claude/hooks/push-protection.sh` main-freeze LIFTED (the smoke/lint/visual
  green-gate is retained — "checks pass" still enforced before any push).
- Prod brought current: origin/main is now live and current (v8.24.8 as of
  2026-06-09, verified serving on https://alrightlad.github.io/smoky-mountain-open/).
- The per-feature loop to prod is operational: Firestore rules via the Rules
  REST API (`scripts/seed-deploy-rules.mjs`), app code via main → GitHub Pages.

## Evidence

Multiple ships landed on prod after the cutover, including: server-enforced
member blocking, the Brass Tee-Tap reaction (v8.24.8), and the scrambleTeam
chronic-bug fix. Live version verified via Playwright against the production URL.

Logged in `.claude/state/founder-decisions/2026-06-09.ndjson` under id
`production-cutover`.

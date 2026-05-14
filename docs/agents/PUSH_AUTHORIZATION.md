
# AMD-018 — Self-governed push authorization

Authored 2026-05-14 per Founder directive: "DO NOT push commits"
caution accumulated across iterations is now structural waste — team
verification is mature enough that Founder gate adds latency, not
safety. Self-government is the correct evolution.

## What changes

"DO NOT push commits" rule REVOKED in favor of 10-gate (now 11-gate
per AMD-019) self-governed authorization.

## 11-gate criteria (ALL must pass for self-governed push)

1. **Round-trip sentinels PASS** — structural integrity
2. **Scroll-reachability smoke PASS** — last-item visibility on all
   scrollable surfaces (PROP-008 era)
3. **User-context capture verified** — channel:chrome real-Chrome
   rendering captured (PROP-007)
4. **Click-through user-journey PASS** — scroll, click, navigate
   verified (PROP-009)
5. **Click-every-interactive coverage PASS** — every interactive
   element on changed pages clicked + verified (PROP-013)
6. **Visual review per PROP-012** — Read tool diff, zero unflagged
   GAPs in design-review artifact
7. **Critic APPROVE** — technical correctness, data accuracy, tests
8. **Design-bot APPROVE** — visual + interaction quality (PROP-010)
9. **Working tree clean** — no uncommitted changes outside commit
10. **No deferred tech debt without rationale** — any deferral
    explicitly documented per AMD-015 propose-first
11. **Dashboard data freshness verified post-commit** (per AMD-019)
    — aggregates JSON mtime >= last commit timestamp; activity feed
    shows new entry for this commit; token attribution captured

## Exceptions — Founder pre-authorization required

Push is NOT self-governed for:

- Database schema changes (`firestore.rules`, `firestore.indexes.json`)
- Cloud Function deploys (`firebase deploy --only functions`)
- Auth provider changes
- Payment / ParCoin economy changes
- Breaking changes to member-facing data structures
- Any change to billing-relevant Firestore writes (cost impact)
- Production secrets / API key rotation
- Anything touching IT Glue-stored credentials

These exceptions REQUIRE explicit Founder sign-off before push or
deploy. They are material changes, not bug fixes or visual polish.

## Rollback discipline

Self-governed push requires self-monitored rollback capability:

- Every push tagged with version per Caddy Notes semver
- Rollback command documented in ship report
- If push surfaces a user-impact bug within 30 minutes:
  - Team detects via cron monitoring or user report
  - Auto-rollback via `git revert <sha>` + redeploy if applicable
  - Author post-mortem at `.claude/state/post-mortems/<date>.md`
  - Surface to Founder for AWARENESS, not permission

## Verification before any push

The team explicitly enumerates all 11 gates' status in the commit
message OR in a dedicated `.claude/state/push-decision-<sha>.md`
artifact. Any gate marked FAIL or unverified blocks the push.

## Honest delta

"DO NOT push commits" made sense early in this substrate:
- verification gaps were real
- Founder caught bugs before deploy
- training-wheels appropriate for an immature pipeline

It is now structural waste. The 11-gate stack (PROP-007 / PROP-008 /
PROP-009 / PROP-010 / PROP-012 / PROP-013 / AMD-019 + Critic +
design-bot) provides defense in depth without paid subscriptions.
Self-government is the correct evolution.

## Cross-references

- AMD-009 P1-P7 (senior engineering standard)
- AMD-016 (operational question test)
- AMD-017 (continuation discipline)
- AMD-019 (dashboard freshness per commit)
- PROP-006 (outcome-vs-task)
- PROP-007 (user-context verification gate)
- PROP-008 (browser-control install)
- PROP-009 (click-through user-journey)
- PROP-010 (design-bot ship-close gate)
- PROP-012 (mandatory visual review)
- PROP-013 (button coverage gate)

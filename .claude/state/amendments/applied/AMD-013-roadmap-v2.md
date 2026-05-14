---
id: AMD-013
title: ROADMAP v2 — Wave Plan Re-validation 2026-05-14 (W1.S1 split + W1.I2 re-scope + 5 new ships)
target_canonical_path: docs/agents/ROADMAP.md
source_draft_path: .claude/state/amendments/pending/AMD-013-roadmap-v2.md
scope_summary: Appends a "Roadmap Revision — 2026-05-14" section to ROADMAP.md capturing Founder-ratified findings from the wave-plan audit. Original Wave 1-4 ship list stays intact; the appendix layers the validated deltas (W1.S1 split, W1.I2 re-scope, W1.I3 vs W1.S5 sequencing, 5 newly-discovered ships added). No mass rewrite — most Wave 1-4 ships classified [a] still valid; only the actionable deltas land here.
type: append-to-existing
section_anchor: null
depends_on: ["AMD-009", "AMD-010", "AMD-011"]
authored_by: claude-code (orchestration team)
authored_at: 2026-05-14T04:35:00Z
bubble_of_record: null
files_affected:
  - docs/agents/ROADMAP.md (append section)
fallback_plan: "If append-to-existing produces malformed output, revert via git; the ROADMAP wave content is unchanged. No Plan B needed — append is mechanically simple."
rollback_strategy: "git revert <commit-sha>; restores ROADMAP.md to pre-append state; deferred markers + wave plan audit doc remain as orchestration-state artifacts."
round_trip_coverage: "Existing [main-flows+index] data block check + new [proposal-readiness] check already exercise the substrate; no new round-trip extension needed for ROADMAP.md (it's a governance doc, not a generator-driven data block)."
token_cost_estimate: "low ~2500 (author + apply), high ~3500 if Founder requests refinement. Range based on AMD-010 main-flows-v2 prior baseline (similar scope, append-style governance amendment)."
estimate_tokens_to_apply: 3000
status: pending
operating_status: ADVISORY — operates as guidance until Founder applies via amendments.html. Per the Founder ratification of the wave-plan audit 2026-05-14, the team operates against the validated plan immediately; the formal artifact lands when this amendment applies.
---

# Roadmap Revision — 2026-05-14 (Wave Plan Re-validation)

The orchestration team audited the Wave 1-4 ship plan against current
substrate state. Founder ratified the audit findings 2026-05-14.
This section appends the validated deltas to ROADMAP.md.

**Source documents:**
- Audit: `.claude/state/wave-validation/wave-plan-audit-2026-05-14.md`
- Founder ratification: in-conversation, 2026-05-14
- Closure protocol: AMD-011 Auto-Execute Protocol (applied 2026-05-14)

## Classification overview (per the 7-category scheme)

| Category | Count | Notes |
|---|---:|---|
| [a] Still valid as scoped | 14 W1 ships + all Wave 2/3/4 | proceed as planned |
| [b] Implicitly done | 1.5 ships | W1.S1 iter 1 (commit `2953d54`); W1.I2 smoke-automation portion done in v8.17.0 |
| [c] Needs re-scoping | 1 ship | W1.I2 — sibling-smoke-account-only remains |
| [d] Should be split | 1 ship | W1.S1 → S1.a done + S1.b Clubhouse codification pending |
| [e] Should be merged | 0 | none |
| [f] Should be deprioritized | 0 | none |
| [g] Newly discovered | 5 ships | enumerated below |

## Wave 1 ship-list deltas (binding)

### W1.S1 — SPLIT (Founder-ratified)

Original W1.S1 vision is broad Clubhouse-system codification
(`--cb-*` tokens + 6 new W2.S0 tokens + SVG icon library +
sunlight mode + AAA paths). Iter 1 shipped orchestration-dashboard
primitives only. Renumber:

- **W1.S1.a** — Orchestration dashboard primitives. **DONE**
  (commit `2953d54`). 3 spike-surfaced primitives shipped
  (`.pb-avatar`, `.pb-list/-row`, `.pb-trend-delta`).
- **W1.S1.b** — Broader Clubhouse design system codification.
  **PENDING.** Wave 2A `--cb-*` tokens, 6 new W2.S0 tokens, SVG
  icon library, sunlight mode, AAA contrast paths. Spec source:
  `docs/agents/ships/W1.S1.md` (the original ratified vision).
  Estimated cost: ~1-2M tokens (largest single ship in Wave 1).

### W1.I2 — RE-SCOPED

Original: "Smoke automation + sibling smoke account."

Smoke automation portion was substantially completed in v8.17.0
(per `CLAUDE.md` Testing Strategy section + AMD-012 framework
references). Only the sibling-smoke-account portion remains.

**Re-scoped:** W1.I2 is now sibling-smoke-account-only. Smoke
automation is **[b] implicitly done** and cited as such in the
ROADMAP. The v8.17.0 framework continues as the baseline that
AMD-012 governs.

### W1.I3 vs W1.S5 — SEQUENCING CONFIRMED

W1.I3 (Caddy Notes restructure) **lands before** W1.S5 (Spectator +
Caddy Notes verify). W1.S5's "Caddy Notes verify" subtask depends
on W1.I3's restructure being in place. No merge; sequential.

### Newly discovered ships (5) — ADDED TO PLAN

1. **Founder Review Queue implementation** — dashboard.html
   section + regen-dashboard.py aggregator for the AMD-007 P18.6
   "Newspaper" protocol. Surfaces ready/in-flight/deferred/
   completed states. Token estimate: ~400k. Critic gate per
   AMD-009.
2. **AMD-011 auto-execute scanner + cron implementation** —
   `scan-proposal-readiness.py` (core shipped 2026-05-14 commit
   `00ccc53`) + new 2-hour cron task + ship-close-commit trigger.
   Cron + dashboard extension remain. Token estimate: ~300k.
3. **W1.S1.b — Clubhouse design system codification** (see W1.S1
   split above). Token estimate: ~1-2M.
4. **AMD-012 framework extensions** — mobile-viewport simulation,
   push-notification verification, image-attachment assertion
   capabilities added to `tests/smoke/` as needed during first
   user-facing ships. Surfaces during execution rather than
   upfront. Token estimate: variable (~50-300k per extension).
5. **Main-flows v2 iter 2 — Phase 3 completion** —
   `lifecycle_phase` chip on each rail card (requires inventory
   schema field add) + click-to-detail flow view. Token estimate:
   ~200-300k.

## Wave 2-4 (no deltas)

All Wave 2 ships (S0-S5) + Wave 3 milestones (M1-M6) + Wave 4
ships (I1-I5, S1-S3) classified **[a] Still valid as scoped**.
Substrate work didn't touch their content. Their vision docs at
`docs/agents/ships/` remain authoritative.

## Operating posture post-revision

Per AMD-011 auto-execute protocol (applied 2026-05-14):

1. Approved proposals scanner runs every 2 hours (cron pending
   install) + at ship-close commits.
2. Ready proposals (8/8 AMD-009 criteria pass) auto-execute via
   AUTONOMOUS_FAILURE_RECOVERY v8.3.
3. Deferred proposals queue in `.claude/state/proposals/ship-
   readiness-deferred/` with enumerated gaps.
4. Wave 1 ship sequence executes continuously through validated
   plan; new ships (above) enter the queue when their pre-flight
   readiness criteria are met.

Per AMD-012 smoke-testing governance (pending Founder approval):
every user-facing Wave 1+ ship MUST author smoke-test coverage
per the 6 minimums + Critic-gate it before ship-close.

## Honest limitations (Principle 5)

- **HQ Wave 2A spec location uncertain.** ROADMAP references
  "Phase 2A design system spec" as DONE for mobile. The HQ
  portion's location is unconfirmed by the audit. If absent,
  W1.S2 onwards may need spec authoring before execution starts.
  W1.S1.b's vision at `docs/agents/ships/W1.S1.md` is the closest
  HQ-spec adjacent artifact.
- **Wave 2-4 received per-wave (not per-ship) treatment.**
  Substrate work didn't touch them; per-ship Wave 2-4 audit
  available on request.
- **AMD-012 not yet applied.** Pending Founder approval via
  amendments.html. Its discipline operates ADVISORY until
  applied — Critic still enforces AMD-009 P4 (test before
  declaring done) which subsumes the smoke gate.

## Cross-references

- AMD-009 SENIOR_ENGINEERING_STANDARD (the gate criteria)
- AMD-010 MAIN_FLOWS v2 (the 62-flow inventory + Taxonomy E)
- AMD-011 AUTO_EXECUTE_PROTOCOL (the execution path)
- AMD-012 SMOKE_TESTING_GOVERNANCE (the user-facing-ship gate;
  pending approval)
- `.claude/state/wave-validation/wave-plan-audit-2026-05-14.md`
  (the full evidence-cited audit)
- `docs/agents/ships/*.md` (the per-ship vision docs;
  authoritative source for individual ship scope)
- `.claude/state/main-flows-v2/flow-inventory.json` (the 62-flow
  inventory cross-referenced during audit)

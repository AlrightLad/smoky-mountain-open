---
id: AMD-026
title: Actionable Surfacing — P10 + 9th deliberation bubble
target_canonical_path: CLAUDE.md
source_draft_path: .claude/state/amendments/pending/AMD-026-actionable-surfacing.md
scope_summary: New operating principle P10 codifies that every visible error/warning/yellow/red state must answer WHAT is wrong, WHERE to find it, WHAT action closes it. Counts without destinations are violations. Dashboards must distinguish Founder-action-required state from cron-noise. Adds 9th deliberation bubble (Actionability). Quorum remains 3 of N (now 9). Retrofit ALL 10 dashboards before re-emitting verification packet.
type: new-principle + bubble-addition + dashboard-retrofit-mandate
section_anchor: null
depends_on:
  - AMD-007
  - AMD-017
  - AMD-024
authored_by: founder
authored_at: 2026-05-19T01:30:00Z
bubble_of_record: null
estimate_tokens_to_apply: 3000
rollback_strategy: Remove P10 from CLAUDE.md; remove 9th bubble from deliberation gate; revert any Actionability-driven UI changes on retrofitted dashboards back to count-only display. Existing 8-bubble quorum and pre-retrofit dashboards continue to function.
status: applied
operating_status: ACTIVE — Founder LOCKED 2026-05-19 alongside session 2 close direction. Binds all agents immediately. Retrofit precedes Founder Verification Packet re-emission.
---

# AMD-026 — Actionable Surfacing — P10 + 9th deliberation bubble

## Founder rationale (2026-05-19)

> "Every visible error/warning/yellow/red state must answer WHAT is wrong, WHERE
> to find it, WHAT action closes it. Counts without destinations are violations.
> Dashboards must distinguish Founder-action-required from cron-noise."

Pre-AMD-026 pattern: dashboards surface counts ("8 audit failures", "18 CRITICAL findings", "0 of 3"), banners ("ARCHITECTURE REVIEW · unknown"), and statuses ("watcher cycling", "GATE-FAIL") without making clear what closes them. The Founder must navigate to source files, parse logs, or ask the team — friction that AMD-026 eliminates.

## P10 — Actionable Surfacing (NEW principle)

### Statement

Every visible error / warning / yellow / red state must answer all three:

1. **WHAT** — what specifically is wrong (concrete, not "unknown" or a raw count)
2. **WHERE** — file path / line / aggregate JSON / command that produced the state
3. **WHAT ACTION** — the literal next step that closes the state (a command, a Founder decision, an agent task, or "no action — intentional empty state")

States lacking any of WHAT / WHERE / WHAT-ACTION are **P10 violations**. They block surface ship-close until remediated.

### Counts without destinations

A bare number ("8 failures", "18 CRITICAL", "32 in inbox") is NOT actionable per P10 unless paired with a destination:
- ✗ "8 audit failures" (count, no destination)
- ✓ "8 audit failures — see scripts/regen-all.sh output, click for details" (count + destination + action affordance)
- ✓ "8 audit failures — 7 closed session 2, 1 user-context-gate pending Founder run of `node scripts/visual-audit/founder-context-capture.mjs`" (count + status + action)

### Cron-noise vs Founder-action distinction

Dashboards must visually separate:
- **Founder-action-required state** — needs human decision or intervention. Surfaces prominently (banner color, position, weight).
- **Cron-noise state** — routine system activity (cron heartbeats, scheduled regen, post-commit drift). Suppressed or moved to a dedicated cron-health surface.

The activity feed bug (2026-05-19, 1722 cron telemetry events crowding out 619 ship commits) is the prototype violation P10 fixes.

### Empty states

Empty / zero / null states must be explicitly classified as one of:
- **Legitimate empty** — the underlying source IS empty (e.g., "0 pending recommendations" when the architecture-review aggregator returns 0). Render with P7-quality copy explaining WHY empty.
- **Loading** — data in transit. Render skeleton/spinner with timeout to error state.
- **Error** — data fetch failed. Render with error message + retry/refresh action.
- **Misconfigured** — surface NOT wired correctly. Render with "not yet wired — Phase X" + link to spec.

Silent fallback-to-zero in render code (e.g., `data.value || 0`) is a P10 violation. Replace with explicit empty-state classification.

## 9th deliberation bubble — Actionability

Added to the 8-bubble deliberation gate (now 9 bubbles, quorum still 3):

### 9. Actionability bubble

Adopt identity of senior product designer at Linear / Stripe / Vercel.
"Could a Founder, encountering this surface for the first time after 24h away, IMMEDIATELY answer:
  (a) what is wrong here that needs my attention
  (b) where to look for the truth behind it
  (c) what action closes it
without asking the team and without parsing JSON?"

Reject conditions:
- "count without destination" — bare number with no click-to-detail or path reference
- "cron-noise dressed as Founder state" — heartbeat events mixed with actionable events
- "unknown with no action" — "—" / "loading" / "0 of 3" without next-step copy
- "silent fallback to zero" — render code that masks missing data as legitimate zero

## Retrofit mandate

Per Founder LOCK: ALL 10 dashboards must pass P10 retrofit verification BEFORE the Founder Verification Packet is re-emitted for D49 approval.

Retrofit surfaces (per `.claude/state/dashboard-audit-2026-05-18/INVENTORY.md`):

1. `dashboard.html` — Founder Review Queue + system health + KPIs
2. `activity.html` — handoffs / commits / telemetry events
3. `amendments.html` — AMD-001..025
4. `design-system.html` — Clubhouse token reference (static — likely trivial retrofit)
5. `discussion-bubbles.html` — 8-bubble deliberation transcripts (now 9-bubble per AMD-026)
6. `escalations.html` — escalation tracking
7. `index.html` — directory listing
8. `main-flows.html` — flow graph (currently 8.9/10; P10 polish may push to 9.0+)
9. `proposals.html` — PROP shipped + deferred (intersects with 33-proposal triage work)
10. `token-usage.html` — token meter + Phase T6 pie chart

Per-surface retrofit checklist:
- [ ] Identify every count, banner, status indicator, and empty-state on the surface
- [ ] For each: verify it answers WHAT/WHERE/WHAT-ACTION
- [ ] Fix violations: add click-to-detail, add destination paths, replace bare counts with linked-counts
- [ ] Distinguish cron-noise from Founder-state visually (color / position / weight)
- [ ] V1 capture post-retrofit
- [ ] Update `.claude/state/dashboard-audit-2026-05-18/P10-RETROFIT-LOG.md` per surface

## CLAUDE.md update

Add to operating principles section:

```
### P10. Actionable Surfacing
Every visible error/warning/yellow/red state answers WHAT/WHERE/WHAT-ACTION.
Counts without destinations are violations. Dashboards distinguish
Founder-action-required from cron-noise. Silent fallback-to-zero in render
code is a bug. Empty states classified explicitly (legitimate / loading /
error / misconfigured). Source: AMD-026, applied 2026-05-19.
```

## 9-bubble deliberation gate update

Update CLAUDE.md and spec references from "8-bubble quorum 3" to "9-bubble quorum 3" everywhere (Engineering, Critic, Performance/Load, Data Integrity, Research Depth, Taste, Security, Data Truthfulness, **Actionability**).

## Founder Verification Packet gate

Per Founder LOCK 2026-05-19:

> "Founder Verification Packet: HARD HOLD. Do not re-emit asking for approval
> until ALL THREE true: (a) P10 retrofit verified across all 10 dashboards,
> (b) AgentShield zero CRITICAL on commit, (c) 33-proposal triage delivered
> to Founder."

Re-emit when those three green; Founder will verify the 5 traced values and write FOUNDER-APPROVED-{TS} to close.

## Status

Applied 2026-05-19 alongside session 2 close direction. CLAUDE.md update + retrofit dispatched.

---
name: parbaughs-critic-checklist
description: Critic's 12 rejection criteria + acceptance review. Brief rejection bounces back to Orchestrator (Ship Plan failures) or Engineer (implementation failures); not Founder unless Sanity Halt or CFR.
trigger: Ship Plan ratified — pre-engineering Critic review; or Engineer self-audit complete — implementation review
owner: Critic
tier: T1 (skill content drafted at Phase 1)
# >>> agentshield-instrumentation
# Added 2026-05-18 to satisfy AgentShield ECC 2.0 skill-health checks
# (observation-hooks, feedback-hooks, version, rollback). Wires the skill to
# the real PARBAUGHS telemetry substrate; no fake telemetry. See
# parbaughs-telemetry-emit and HANDOFF_PROTOCOL.md for the consuming systems.
version: 1.0.0
observation_hooks:
  on_invoke:
    event_type: skill.invocation.start
    emit_via: parbaughs-telemetry-emit
    target: .claude/state/telemetry/events/{utc_date}.ndjson
  on_complete:
    event_type: skill.invocation.end
    emit_via: parbaughs-telemetry-emit
    target: .claude/state/telemetry/events/{utc_date}.ndjson
feedback_hooks:
  channel: handoff-note
  scenario: subagent-return
  template: HANDOFF_NOTE_TEMPLATES.md
  target_dir: .claude/state/handoffs/subagent-returns/
rollback:
  previous_version: null
  procedure: |
    git revert the commit that introduced the skill update; APPROVAL sidecar
    travels with the skill so revert restores both. Skill changes never co-mingle
    with code commits, so revert is mechanically clean.
  rollback_safe: true
# <<< agentshield-instrumentation
---

# Skill: parbaughs-critic-checklist

Encodes the Critic workflow against `docs/agents/CRITIC.md` § "The 12 rejection criteria".

## When to invoke

- Ship Plan status advances to Ratified (Critic pre-engineering review)
- Engineer reports self-audit complete (Critic implementation review)
- Engineer challenges a rejection (review evidence; re-decide)

## When NOT to invoke

- Design spec contestation (Q32 Lock 2 — design bot output is authoritative; not Critic's argument to make)
- Inferred decision review (that's Founder retrospective)
- Engineer-Critic dispute outside graduated autonomy tier (escalate; don't re-litigate)

## The 12 rejection criteria (Ship Plan review)

For every Ship Plan, walk all 12. Each must have concrete evidence. Brief rejection bounces back to Orchestrator (not Engineer).

1. **Component-level specs present.** Every UI element named, sized, tokenized. No "a card" without dimensions + state list.
2. **All state coverage.** Empty, loading, error, permission-tiered (Author / Founder / Spectator) for every interactive surface.
3. **Design system spec compliance.** Tokens cited by name from Part 1 design spec. No new tokens introduced inside a per-page brief without amending Part 1 first.
4. **Architectural feasibility.** Brief acknowledges Vite-split vanilla JS + Firebase Blaze + GitHub Pages + Capacitor. No infrastructure-outside-stack assumptions.
5. **CTO Ruling / memory'd architectural decision respect.** Page shell slots, `leagueQuery`/`leagueDoc` wrappers (per `src/core/utils.js:18,34`), member visibility model, version triple bump cited.
6. **Concrete language.** No "modern," "clean," "delightful," "polished," "intuitive." Every adjective replaced with measurable specifics.
7. **Wave scope discipline.** Brief states wave + ship; cross-ship dependencies listed; no silent expansion.
8. **Accessibility.** Keyboard nav map, ARIA roles, AA contrast every color pair, `prefers-reduced-motion` fallback. AAA body contrast on outdoor-use mobile per CLUBHOUSE_SPEC § 6.
9. **Mobile / Clubhouse forward-compatibility.** HQ brief states mobile counterpart status; references mobile spec by ID if present.
10. **Brief rejection applies to completeness only.** Design choices not contestable (Q32 Lock 2).
11. **Token traceability.** Source references named tokens (`--cb-brass`, `--space-4`). Raw hex/px/ms rejected unless brief simultaneously amends the system spec.
12. **Cross-surface dependency declaration.** Shared-data ships declare consumers; cite actual count from grep (not memorized figure).

## Implementation review (post-engineering, per Correction 2)

Beyond the 12 criteria + acceptance:

1. Acceptance criteria — every criterion has concrete pass evidence
2. Smoke pass (new smokes + existing smokes; 4 browsers: chromium, firefox, webkit, webkit-mobile)
3. **Visual verification screenshots** — committed at `tests/visual-verify/<ship-id>/`. Per state, per page, per browser. Critic eyeballs each:
   - DOM present + non-zero size + non-transparent color
   - SVG presence + correct color resolution
   - Layout integrity (no overflow, clipping, z-index regression)
   - State coverage (empty / loading / populated / error / permission tiers)
   - Cross-browser parity (chromium-only success ≠ pass)
4. Token traceability — diff inspection, no raw values
5. Cross-surface non-regression — consumers updated
6. Version triple bump applied (utils.js APP_VERSION + package.json + sw.js CACHE_NAME)
7. Reduced motion handling on every animation
8. ARIA labels on every interactive non-native control
9. Inferred decisions logged in INFERRED_DECISIONS.md AND in ship's Inferred Decisions section

## Decision

- All pass → **Approve**. Ship advances to Shipped. Autonomous push authorized when gates green.
- Visual verification failure → **Reject** + raise Sanity Halt category 9 if pattern emerges
- Other failure → **Reject** with specific line references

## Bouncing rules

- Ship Plan failures bounce to **Orchestrator** (for amendment, then re-review)
- Implementation failures bounce to **Engineer** (with specific failures)
- Sanity Halt + CFR triggers escalate to **Founder** via Orchestrator
- Design spec gaps → design bot re-engagement, NOT Critic override

## Anti-patterns

- "90% there, ship it" — partial rejection is weaponized confusion; reject whole brief
- Proposing alternative implementations — that's Engineer's authority
- Arguing design choices — design bot is authoritative
- Lectures on pushback — gather evidence before re-deciding

## References

- `docs/agents/CRITIC.md` (canonical)
- `docs/agents/SANITY_HALT.md` (category 9 visual verification per Correction 2)
- PHASE_1_GOVERNANCE_CRITIQUE.md (drift surfaces resolved at Phase 1)

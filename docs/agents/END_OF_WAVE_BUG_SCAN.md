# End-of-Wave Bug Scan + Opportunistic Resolution

Two related disciplines that compound across waves to keep technical debt visible and shrinking.

## Why this exists

Per Founder directive (Vision authoring session, 2026-05-12): at the end of every wave, Critic systematically scans for bugs across all surfaces touched during the wave. Bugs identified get classified — fix in current wave, fold to next wave, capture to backlog. Then a separate opportunistic resolution pattern ensures backlog bugs get knocked out as future ships pass through the same surfaces.

The combined effect: bugs don't accumulate; quality compounds; technical debt has a visible reduction path rather than indefinite growth.

This is NOT the same as P3 backlog batching from PROTOCOLS.md P5 (which is reactive — bugs discovered during work). This is proactive — Critic actively scans for bugs at wave close.

---

## End-of-Wave Bug Scan

### When this happens

At every wave close, per INTER_WAVE_PROTOCOL.md minimum checklist. After ship-level retrospectives complete, before wave grade is finalized, before Founder ratifies the wave gate.

Scan run by Critic with Engineer assist. Orchestrator coordinates and routes findings.

### What gets scanned

All surfaces touched during the wave. "Touched" means:

- Any file modified by any ship in the wave
- Any feature exercised by any new smoke spec added during the wave
- Any page or component referenced in any Caddy Notes entry from the wave
- Cross-surface consumers per Criterion 12 (the 30-file member-data fanout)

For Wave 1 specifically: every HQ page that received any treatment during the wave. For Wave 2: every HQ page that went through design coherence pass. For Wave 3: every mobile screen and the Capacitor harness. For Wave 4: identity-affected code paths plus stats surfaces.

### Scan methodology

Critic performs:

1. **Visual scan** — Playwright screenshots across all 4 browsers for every page touched during the wave. Look for layout breakage, missing states, cross-browser divergence, token rendering misses
2. **Smoke breadth scan** — run full P8 suite (not just ship-specific smoke); identify any test that should have been added during the wave but wasn't
3. **Console error scan** — load each touched page in dev mode; capture any console errors or warnings; classify
4. **Accessibility scan** — keyboard navigation through each touched surface; ARIA review; contrast verification
5. **Cross-surface integration scan** — exercise flows that span multiple surfaces (e.g., log a round → see it in feed → tap to detail); identify any integration regressions
6. **Memory + governance vs codebase scan** — compare current codebase state to governance docs and Founder memory; flag drift introduced during the wave

### Severity tagging

Every bug found gets severity per PROTOCOLS.md P5:

- **P0** — production-affecting; interrupt sprint required
- **P1** — significant member impact; sprint or fast-follow before wave gate
- **P2** — degraded but functional; address before wave gate if effort is low, otherwise capture to backlog
- **P3** — minor; capture to backlog with opportunistic resolution flag

### Classification matrix

For each bug found:

| Severity | Effort to fix | Action |
|---|---|---|
| P0 | Any | Halt wave; immediate fix; Founder synchronous if production deployed |
| P1 | Low (< 1h) | Fix before wave gate |
| P1 | Medium-High | Fix before wave gate; may delay gate |
| P2 | Low (< 1h) | Fix before wave gate |
| P2 | Medium-High | Capture to backlog; opportunistic resolution flag |
| P3 | Any | Capture to backlog; opportunistic resolution flag |

### Output

Bug scan results committed to `docs/agents/lessons-learned/WAVE_N_BUG_SCAN.md` with:

- Total bugs found
- Severity breakdown
- Action breakdown (fixed in wave / captured to backlog)
- Any patterns surfaced (e.g., "5 P3 bugs all in handicap module — suggests handicap module needs dedicated coherence pass")

Cross-references to backlog items captured during scan: `docs/agents/backlog/BL-NNN.md` per item.

---

## Opportunistic Resolution

### When this happens

During every ship execution. Engineer reads backlog before scoping ship work. Bugs in backlog that share files or surfaces with the current ship are eligible for opportunistic resolution.

### The decision

For each backlog item that overlaps with current ship scope, Engineer evaluates:

**Include in ship scope when:**
- Backlog item affects a file the ship is already modifying
- Fix is small (Engineer judgment: < 2h additional work)
- Fix does not require additional design spec sections
- Fix does not introduce new architectural concerns
- Critic acceptance criteria can absorb the fix without expanding ship scope unreasonably

**Defer to remain in backlog when:**
- Fix requires architectural decisions outside current ship
- Fix would expand ship scope beyond original Vision
- Fix would benefit from dedicated review attention rather than being bundled
- Fix is itself complex enough to warrant its own ship

### Engineer protocol

At ship start, Engineer:

1. Reads `docs/agents/backlog/INDEX.md`
2. Greps backlog items for file paths matching current ship's planned modifications
3. Reads matching backlog item files
4. Evaluates each per the decision criteria above
5. Lists opportunistic resolution candidates in Ship Plan under "Backlog items absorbed"
6. Critic verifies absorption is reasonable (not scope creep masquerading as opportunism)

### Ship Plan amendment

When opportunistic resolution adds backlog items to ship scope, Ship Plan acceptance criteria expands to include:

- Backlog item BL-NNN resolved
- Test coverage added for the resolution
- Backlog item file moved to `closed/BL-NNN-<ship-id>-CLOSED.md`
- INDEX.md row removed

Caddy Notes entry for the ship references resolved backlog items if member-visible.

### Tracking

Each ship report includes "Backlog items absorbed" section listing which items closed during the ship. Over time, this creates a clear pattern:

- Ships that absorb many backlog items signal opportunistic work is happening
- Ships that absorb zero indicate the ship is tightly scoped (acceptable) OR opportunistic discipline is slipping (concern)

Wave grade Category 5 (member-visible regressions) gets a sub-bonus when opportunistic resolution closed P2/P3 items during the wave.

---

## Interactions with other governance

- **PROTOCOLS.md P5 (Rollback):** Bug scan findings at wave close that are severity P0/P1 may trigger P5 protocol. Found-at-scan, not found-in-production — but if production already deployed, same severity rules apply.
- **CRITICAL_FEATURE_REGISTRY.md:** Bug scan findings that surface CFR triggers (e.g., scan reveals a security risk vector that shipped in a previous ship) get escalated per P2 to Founder.
- **SANITY_HALT.md:** Bug scan findings that match Sanity Halt categories (e.g., scan reveals data loss vector) trigger P3 Sanity Halt protocol.
- **DEVELOPMENT_GRADING.md:** Bug scan severity counts feed into wave grade Category 5 (member-visible regressions). High P0/P1 count tanks the grade.
- **RETROSPECTIVE_REVIEW.md:** Bug scan happens as part of wave-close retrospective. Findings inform lessons-learned and skill/hook proposals.

## What this is NOT

- Not a sweep that fixes everything. Severity + effort gates ensure scope discipline.
- Not Founder-driven. Critic + Engineer run the scan; Founder reviews findings at wave gate ratification.
- Not a substitute for in-ship smoke coverage. Smoke catches regressions per ship; this catches what slips through at wave level.
- Not opportunistic-only. End-of-wave bug scan happens regardless of whether any opportunistic resolution happened during the wave.

## Audit cadence

- Bug scan runs every wave close (not per ship)
- Backlog reviewed at start of every ship for opportunistic resolution
- Bug-scan methodology itself reviewed at Build Roadmap → Launch transition

## Initial state

At Phase 1 commit: backlog has 11 BL-NNN items captured from prior memory (post-Part-B backlog). Opportunistic resolution begins at Ship 5+8 (first ship under new orchestration). First end-of-wave bug scan happens at Wave 1 close.

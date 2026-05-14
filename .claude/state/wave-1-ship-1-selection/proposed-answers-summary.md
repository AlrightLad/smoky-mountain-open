# W1.S1.b — Team-proposed answers Q1-Q7 (quick-reference summary)

Full rationale + alternatives + failure modes for each: see
`docs/agents/ships/W1.S1.b.md` lines 261-557.

This summary exists to streamline Agent 2 ratification. **Read full
source before refining any answer.**

---

## Q1 — Phase sequencing

**Proposed:** Sequence inherits the two-ship split (Q5). Within S1.b.1:
palette refinement → traceability tooling → vite-bundle config →
reduced-motion audit. Within S1.b.2: SVG inventory → SVG library +
theme-aware pattern → sunlight HQ spec + impl → AAA audit → AAA
remediation.

**Why this order:** Foundation depends on stable palette values
(palette first). Traceability tooling must be in place before
consumers adopt tokens. Visual treatments must be final before AAA
audit runs.

---

## Q2 — Token cost estimate

**Proposed:**
- S1.b.1 aggregate: **500-900k tokens**
- S1.b.2 aggregate: **900-1950k tokens**
- Total: **1.4-2.85M tokens** (refines AMD-013's "~1-2M upper bound")

**Methodology:** Prior-similar-ship comparison anchored on AMD-007
review queue (~400k), AMD-011 scanner (~300k), S1.a primitives
(~250k), main-flows v2 iter 2 (~200-300k), post-shutdown recovery
(~250-300k).

---

## Q3 — Fallback chain per AUTONOMOUS_FAILURE_RECOVERY v8.3

**Proposed:** Per-phase Plan A/B/C/abandon chain, all 9 phases
covered. Each phase's abandon trigger escalates as Category A. Full
chain: see `W1.S1.b.md` lines 344-407.

**Key invariant:** Every Plan A failure has a documented Plan B or C
degradation, not a stop. Abandons only fire on architectural /
taste-call escalations.

---

## Q4 — Smoke test coverage per AMD-012

**Proposed:**
- S1.b.1: **No AMD-012 smoke gate** (infrastructure-only, no
  member-visible surface change)
- S1.b.2: **AMD-012 smoke gate applies** with scenarios per phase
  (SVG icon library / sunlight mode / AAA audit)

**Cross-browser:** chromium + firefox (per Directive 1 minimum).
webkit + msedge deferred to W1.I2.

**Viewports:** 1920px desktop + 375px mobile per AMD-009 P4.

---

## Q5 — Single vs split ship determination

**Proposed:** **(b) Two-ship split** — S1.b.1 Foundation +
S1.b.2 Member-visible.

**Why audience-boundary not independence-boundary:** Audience boundary
aligns cleanly with AMD-012 smoke gate trigger and AMD-009 P3
coherent-scope discipline. (a) single ship risks AMD-009 P3
violation across 1.4-2.85M tokens. (c) per-deliverable split risks
debt compounding.

---

## Q6 — Refinement values for 4 placeholder tokens

**Proposed:** Plan A — OKLCH derivation per CLUBHOUSE_SPEC.md §1.1
methodology.

| Token | OKLCH | Hex ≈ |
|---|---|---|
| `--cb-ink-soft` | `oklch(30% 0.012 80)` | `#41382C` |
| `--cb-ink-faint` | `oklch(42% 0.012 80)` | `#5F5447` |
| `--cb-mute-soft` | `oklch(60% 0.012 80)` | `#948B7D` |
| `--cb-mute-faint` | `oklch(72% 0.011 80)` | `#B5AB9C` |

**Category A surfaced:** base.css existing values for `--cb-ink`
(`#14130F`) and `--cb-mute` (`#7A766B`) drift from CLUBHOUSE_SPEC.md
§1.2 (`#2A2620` and `#7A7166`). Team recommends **(ii) update base.css
to match spec**. **Founder ratification required** before S1.b.1.P1
ships.

---

## Q7 — `--cb-felt-soft` / `--cb-felt-deep` scope

**Proposed:** **(c) Add as Phase 2** (refinement-time addition).

Canonical values per CLUBHOUSE_SPEC.md §1.2:

| Token | OKLCH | Hex ≈ | Role |
|---|---|---|---|
| `--cb-felt-deep` | `oklch(20% 0.05 155)` | `#082619` | Elevated felt — pressed states |
| `--cb-felt-soft` | `oklch(40% 0.03 155)` | `#2A5847` | Muted felt — secondary text on chalk |

**Forward rule:** Only tokens with canonical values already defined
in CLUBHOUSE_SPEC.md §1.2 (or HQ peer doc) may be declared in
S1.b.1.P1. Anything else escalates as Category A vision.

---

## Category routing summary

| Q | Category | Default-operative if no ratification |
|---|---|---|
| Q1 sequencing | B | YES (team proposal operative) |
| Q2 cost estimate | B | YES |
| Q3 fallback chain | B | YES |
| Q4 smoke coverage | B | YES |
| Q5 split determination | B | YES |
| Q6 token values | B (with **Category A surface for base.css drift**) | YES for OKLCH values; NO for base.css update (Founder ratification needed) |
| Q7 felt-soft/felt-deep | B | YES |

**Net:** Agent 2 may refine all 7. Only Q6 has a sub-question that
requires explicit Founder ratification (base.css drift remediation
choice (i) vs (ii) vs (iii)).

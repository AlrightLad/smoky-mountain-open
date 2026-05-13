# Proposed METRIC_INTEGRITY_PROTOCOL.md

> **Status:** Draft authored 2026-05-13 by the orchestration team for Founder ratification.
> **Apply path:** When Founder ratifies, this moves to `docs/agents/METRIC_INTEGRITY_PROTOCOL.md` (Founder applies; governance hook blocks orchestration-team writes to `docs/agents/`).
> **Bubble of record:** `db-2026-05-13-006` (ratification + stress-test).
> **Trigger:** Founder Finding 5 directive — "AI agents should not lessen standards for sake of meeting metrics, they must be met naturally and followed, not taken advantage of and gamed."

---

## 1 — Why this protocol exists

Metrics on dashboards, in retrospectives, and in agent-self-reports create gradient. Anything that exists on a number can be optimized for the number rather than the underlying value the number was meant to track. PARBAUGHS already has metrics in place (token usage, ships closed, FIQ depth, proposal count, handoff count). Without an integrity guardrail, these become incentive structures the team can game — consciously or unconsciously.

This protocol locks three rules, one Critic discipline addition, and one Devil's-Advocate standing question. It is enforceable: dashboards add metadata declaring purpose / failure-mode / cross-check; Critic adds a pre-close audit; agents can be challenged at any point with "whose metric does this proposal flatter?"

---

## 2 — The three rules (every metric on every dashboard)

### Rule 1 — Every metric has a STATED PURPOSE

For every numeric or chart-rendered metric surfaced on any operational view, the metric's metadata MUST answer: **what decision does this number inform?**

If a metric has no decision-purpose, **remove it**. A metric that exists "because it's interesting" is a dashboard distractor. A metric that exists "because we have the data" inflates the surface without informing a decision.

**Test:** for each metric, complete the sentence "Founder will look at this number to decide ___." If the sentence trails off without a decision named, the metric fails Rule 1.

### Rule 2 — Every metric has a STATED FAILURE MODE

For every metric, the metadata MUST answer: **what would gaming this metric look like?**

This is not "could this metric be wrong?" — that's a data-integrity concern. This is "could an agent optimize for this number in a way that produces a higher number with lower underlying value?"

Examples (concrete failure modes for current PARBAUGHS metrics):

- **FIQ depth gamed** → shallow entries to inflate the count. ("Should we use blue or green for the button?") (F3 rubric addresses this.)
- **Ships closed gamed** → sub-task fragmentation. (A single coherent feature split into 5 micro-ships to inflate ship count.)
- **Vote tally gamed** → rubber-stamping. Pulling voting agents into a bubble who can be predicted to approve.
- **Token usage gamed (as productivity)** → padding output, generating long-but-low-signal artifacts to appear "productive."
- **Handoff count gamed** → manufacturing handoffs that aren't load-bearing, to populate `activity.html`.
- **Proposal count gamed** → low-value proposals to populate `proposals.html` (or to populate proactive-backlog.md).
- **Cycle-completion rate gamed** → narrow scope-of-cycle so completion is trivial.
- **Bubble approval rate gamed** → only opening bubbles for things that will obviously approve; routing controversial questions through other channels.

A metric without a stated failure mode is a metric that hasn't been thought through.

### Rule 3 — Every metric has a CROSS-CHECK signal

For every metric, the metadata MUST name another signal that, when divergent, suggests the metric is being gamed.

**Examples:**

- `ships_closed` cross-checked by `lines_changed_per_ship + test_coverage_delta_per_ship`. If ships count up but lines + coverage stay flat, investigate.
- `FIQ depth` cross-checked by `FIQ resolution rate` (Founder ratifies entries vs. defers them). High depth + high deferral rate = entries aren't decision-ready.
- `token usage` cross-checked by `recent ships shipped (Founder-visible value)`. High token, low ship → either real research being done or padding; Critic adjudicates.
- `vote tally` cross-checked by `votes_with_explicit_reasoning / total_votes`. If approve-count is high but reasoning-bearing-votes is low, rubber-stamping.
- `bubble approval rate` cross-checked by `bubble dissent rate (approved-with-dissent + rejected) / total bubbles`. A team that always approves 3-0-0 is signaling either alignment-too-easy or rubber-stamping.

When the cross-check diverges, the next Critic audit OR the next bubble OR the next retrospective surfaces the divergence as a finding.

---

## 3 — Critic pre-close audit (new discipline)

**When:** every ship cycle's retrospective component (per POST_PUSH_RETROSPECTIVE_P10_AMENDMENT.md), Critic adds a step.

**What:** Critic answers the question — **"Does the work product reflect honest progress, or metric optimization?"**

This is a binary attestation. Critic produces a sentence: "The work product reflects honest progress against acceptance criteria; no metric was gamed in the execution." If Critic cannot make that attestation cleanly, the ship doesn't close. A handoff is written for the next cycle to reconcile the integrity concern.

**Format in retrospective component 1:**

```markdown
### Metric integrity attestation (per METRIC_INTEGRITY_PROTOCOL § 3)

- **Critic's verdict:** [HONEST | CONCERN]
- **If CONCERN:** [specific metric, observed gaming pattern, evidence]
- **Handoff if CONCERN:** [Scenario 2 handoff to next-cycle Critic with the integrity question to reconcile]
```

**Why Critic specifically:** Critic is already the friction agent in the protocol. Adding the metric-integrity question to Critic's existing pre-close discipline is the natural attachment point. Engineer cannot self-attest on integrity — by construction, the question is "did the producer game the metric?"

### 3.1 Dashboard-consistency checkbox (added 2026-05-13 after Founder-caught divergence)

Any work that touches a dashboard or any surface displaying a number gets a 3-item dashboard-consistency check appended to Critic's pre-close audit:

```markdown
### Dashboard consistency check

- [ ] All counts displayed on dashboards verified against on-disk state
- [ ] Cross-dashboard consistency verified (same number everywhere)
- [ ] Round-trip test cross-dashboard section passed post-regen
```

**When this fires:** any ship that modifies `docs/reports/*.html`, any `scripts/regen-*.py`, or any state directory whose count surfaces on a dashboard (proposals, bubbles, handoffs, ship-progress, halts, FIQ).

**How a failure escalates:** if Critic cannot attest, the ship does not close. Two paths:
1. Fix the divergence in this cycle, re-run `regen-all.sh` (which gates on the test), re-attest.
2. Hand off to next cycle via Scenario 2 handoff with the divergence named.

**Why this is locked in:** Founder caught a banner-vs-page divergence by eye on 2026-05-13 (dashboard banner showed "5 proposals" while page showed 2). The Step 0 diagnostic in the prior fix-pass only checked data-block correctness, not rendered markup. Two bugs slipped (banner hardcoded; proposal schema drifted from §amendment.4). The new round-trip test sections + this Critic checklist together prevent the recurrence.

---

## 4 — Devil's-Advocate standing question (new bubble convention)

**When:** every discussion bubble that involves a metric (which is most of them — vote tallies, proposal approval, ship scope, anything with numbers attached).

**What:** Devil's-Advocate's standing question, asked at least once per bubble:

> **"Whose metrics does this proposal flatter?"**

The question is open-ended on purpose. Possible answers include:
- "It flatters Engineer's ships-closed count (this is a sub-task fragmentation pattern)."
- "It flatters dashboard's bubble-approval rate (we're pulling in a voter who will obviously approve)."
- "It flatters nobody — it's substantive." [the desired answer]

Devil's-Advocate is required to ask the question; the voters are required to engage with the answer before voting. A bubble that never asks the question fails the F5 pre-close audit.

---

## 5 — Standing exemptions

Three categories of metric exist as raw counts WITHOUT formal purpose/failure/cross-check metadata, because they exist for diagnostic visibility rather than incentive:

- `events_total` (telemetry count)
- `pause_durations_sec` (pause-and-resume mechanic — diagnostic)
- `bubbles_total` (count of all bubbles opened, not just approved)

These are NOT subject to Rules 1-3. They're inventory, not score. The dashboard should label them as such (suggested: prefix `_` per current snapshot convention).

---

## 6 — How to apply this protocol to an existing metric

For every metric currently on `dashboard.html`, fill out:

```yaml
metric: <name>
purpose: <what decision Founder uses this for>
failure_mode: <what gaming looks like>
cross_check: <signal that diverges when gamed>
exemption: <true if standing-exempt per § 5; else false>
```

Stored alongside the metric's data path. Suggested location: a sidecar file at `.claude/state/telemetry/metric-metadata.json` keyed by metric name. The dashboard regenerator (`scripts/regen-dashboard.py`) verifies that every metric in the data block has a corresponding metric-metadata entry, OR is on the standing-exempt list.

Failure to verify → dashboard regen fails. Metrics cannot ship without metadata.

---

## 7 — Cross-references

- `docs/agents/CRITIC.md` (Critic adds § 3 pre-close audit)
- `docs/agents/POST_PUSH_RETROSPECTIVE_P10_AMENDMENT.md` (Component 1 adds attestation row)
- `docs/agents/DECISION_BUBBLE_AGENTS.md` (Devil's-Advocate gets standing question per § 4)
- `docs/agents/REPORT_HTML_SPEC_v8.1_AMENDMENT.md` (dashboard.html surfaces metric-metadata sidecar)
- F3 FIQ-quality-rubric — depends on this protocol (rubric is the FIQ-depth-gamed failure-mode mitigation)
- F4 main-flows filter rule — depends on this protocol (filter sharpness is the main-flows-padding mitigation)

---

## 8 — Effective date

Protocol effective as of Founder ratification. Existing metrics on `dashboard.html` must have metadata authored before the next proactive cycle (or the cycle 1 outputs themselves count as the first bubble's filter exercise — F5 audit fires on cycle 1 retrospective component 1).

---

*Draft authored 2026-05-13 by orchestration-team during Wave Zero Dry-Run remediation pass F5. Awaiting Founder review + ratification + move to `docs/agents/METRIC_INTEGRITY_PROTOCOL.md`. The bubble that ratifies — `db-2026-05-13-006` — is itself a stress-test of the protocol's own anti-rubber-stamp rule.*

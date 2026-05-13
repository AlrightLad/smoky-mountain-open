# HALT_CRITERIA_v8_ADDENDUM.md

> **Status:** Governance v8 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Two new halt items (21, 22) to be appended to existing `HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md` at consolidation.

---

## Item 21 — Handoff Failure

**Trigger condition:** Any of the following:

**21a) Missing handoff at expected transition.** Agent transitions to next actor without writing required handoff note per HANDOFF_PROTOCOL.md.

**21b) Critically incomplete handoff content.** Handoff note missing required universal fields OR scenario-specific fields. Detected by Critic at receiving end OR at next cycle's pre-flight audit.

**21c) Receiving actor cannot resume.** Handoff note exists but resumer determines context is insufficient to safely proceed. Detected by resumer's verification step.

**21d) Stale handoff resumption.** Resumer attempts to resume from handoff but code state has drifted from handoff's `files_modified` list. Detected during Scenario 1 (cycle-to-cycle) or Scenario 9 (cross-ship) state verification.

**Halt action:**

1. Outgoing actor (if still active) writes corrected handoff note immediately
2. Receiving actor halts work — does NOT proceed with insufficient context
3. Log to journal: `[HALT-HANDOFF-FAILURE]` with handoff_id (or "missing") + failure subtype (21a/21b/21c/21d)
4. For 21a or 21b: outgoing actor's cycle outcome marked as INCOMPLETE
5. For 21c or 21d: FIQ entry created priority=high asking Founder to either:
   - Provide additional context to enable resume
   - Authorize starting over from clean state
   - Defer the affected work

**Resume condition:**

- 21a/21b: corrected handoff written → receiving actor reads + acknowledges → proceeds
- 21c/21d: Founder responds to FIQ → resumer applies Founder direction → proceeds

**Escalation:**

- Single occurrence: log + corrected via above
- 3+ handoff failures within a wave: governance amendment to strengthen handoff discipline
- Pattern of stale resumptions (21d) suggests cycle-to-cycle interval too long → tuning recommendation

**Examples:**

- Ship cycle exits at 90% budget without writing cycle-to-cycle handoff → next ship cycle has no resume context → 21a triggers
- Cycle-to-cycle handoff missing `last_atomic_unit_completed` field → 21b triggers
- Resumer reads handoff stating "code at scorecard.js:142 ready for execution" but file has been modified since → 21d triggers
- Founder responds to FIQ but founder-to-agent handoff doesn't capture all downstream impacts → next agent affected can't proceed → 21c triggers

---

## Item 22 — Telemetry Data Integrity Failure

**Trigger condition:** Any of the following:

**22a) 5+ telemetry emission failures in single cycle.** Per P17 failure-tolerance, single emission failures continue cycle; cumulative threshold halts.

**22b) Corrupted NDJSON event file.** Aggregation step detects malformed JSON lines that cannot be safely skipped (e.g., truncated mid-line, missing closing brace).

**22c) Aggregate vs. raw events divergence.** Periodic integrity check finds aggregates have different counts/totals than raw events for same window. Suggests aggregation logic broken OR events lost.

**22d) Cycle-history vs. cycles aggregate mismatch.** `cycle-history.json` shows cycles not present in `cycles.json` aggregate, or vice versa.

**22e) Report generation cannot read aggregates.** Generation step fails due to missing/corrupted aggregate files.

**Halt action:**

1. Cycle work pauses immediately
2. Log to journal: `[HALT-TELEMETRY-INTEGRITY]` with failure subtype + affected files
3. Telemetry aggregation halted (do not write more corrupted aggregates)
4. Reports flag "data integrity issue — last known good: {timestamp}"
5. FIQ entry created priority=high asking Founder to investigate

**Resume condition:**

- 22a: identify emission failure cause (often network/disk/permissions); fix + re-enable
- 22b: regenerate corrupted file from raw events; if unrecoverable, archive corrupted file + start fresh from event stream
- 22c: rebuild aggregates from raw events (idempotent operation)
- 22d: reconcile cycle-history with cycles aggregate via manual audit
- 22e: regenerate aggregates; verify file system permissions

**Escalation:**

- Single occurrence: investigate + resolve
- Pattern of telemetry failures (3+ in a wave): infrastructure review needed
- Catastrophic loss (multiple raw event files corrupted): governance amendment to add belt-and-suspenders telemetry redundancy

**Examples:**

- Cron worker exhausts disk during heavy cycle → emissions fail → cumulative 5 failures → 22a
- Cycle crashed mid-write of event file → final line truncated → 22b on next aggregation
- Aggregation script has off-by-one error producing wrong totals → 22c
- Manual edit of cycle-history.json without re-aggregating → 22d
- File permissions on `.claude/state/telemetry/aggregates/` changed → 22e

---

## Numbering reference

Existing halt items (locked through v7):
1. Pre-flight audit failure
2. State file corruption
3. Test failure cascade
4. Production deploy failure
5. Cost threshold breach
6. Security audit flag
7. Data integrity audit flag
8. Schema migration failure
9. Cross-wave dependency violation
10. Locked memory violation
11. Sanity halt
12. Critic veto on Engineer output
13. Rate-limit threshold (90% usage) — **FUNCTIONALLY A PAUSE, NOT A HALT.** See PAUSE_DISCIPLINE_v8.1_ADDENDUM.md. Named "halt criterion 13" for numbering stability across v1-v7 governance, but agents auto-resume on next cron after quota reset. Founder does NOT need to clear or restart.
14. Blocking Founder Question (v6)
15. Non-blocking Founder Question (CLARIFYING — not a halt) (v6)
16. Wellness halt (v6)
17. Rest cycle (v6) — **FUNCTIONALLY A PAUSE, NOT A HALT.** See PAUSE_DISCIPLINE_v8.1_ADDENDUM.md.
18. Cron Cost Overrun (v7)
19. Proactive Scope Violation (v7)
20. Cron Cycle Repeated Failure (v7)

New v8 halt items:
21. Handoff Failure (4 subtypes: 21a/21b/21c/21d)
22. Telemetry Data Integrity Failure (5 subtypes: 22a/22b/22c/22d/22e)

---

## Cross-references

- `HANDOFF_PROTOCOL.md` (handoff scenarios + discipline)
- `HANDOFF_NOTE_TEMPLATES.md` (per-scenario templates)
- `TELEMETRY_PROTOCOL.md` (telemetry capture spec)
- `PROTOCOLS_v8_ADDENDUM.md` P16 + P17
- `SESSION_JOURNAL_v8_ADDENDUM.md` (halt logging entry types)

---

*Document authored 2026-05-12. Apply to HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md at consolidation.*

# Validation 3 — Discussion Bubble Dry-Run

**Run:** 2026-05-13 (resume window after Python install)
**Outcome:** **PASS** — bubble closed cleanly with full schema, voters all contributed, tally matches messages, Scenario 8 handoff written, operational view regenerated.

---

## Setup

A discussion bubble was triggered for a real (not synthetic) governance question that arose during dry-run setup: where should dry-run artifacts live so the real-state paths get exercised without polluting them? The runbook's discussion-bubble-on-decision rule (P3e) required a bubble for the choice — V3 is exercised as a side-effect of the actual decision the dry-run needed.

Bubble file: `.claude/state/discussion-bubbles/db-2026-05-13-002.md`

Inviting agents:
- **Voters:** engineer, critic, data-integrity (3 voting roles)
- **Bubble-only:** devil-advocate

Synthetic? Only in the dry-run framing — the question and the decision are real and apply going forward. Live agents would face the same decision; recording the bubble formally means we have the convention written down.

## Execute

The bubble follows the canonical v8.1.1 schema:
- `id`, `topic`, `claim`, `summary`, `ship_id`, `opened_at`, `closed_at`
- `status` (one of: open, approved, approved-with-dissent, rejected, tied) — set to `approved`
- `decision` (the outcome)
- `vote_tally` ({approve: N, reject: N, abstain: N})
- `messages[]` (every voter's contribution + bubble-only inputs + open/decision messages)

Each message has: `author`, `role_in_bubble` (open / voting / bubble-only / contributing / decision), `timestamp`, `content`, and `vote` (for voting roles).

Closing message has `role_in_bubble: "decision"` and was written by `discussion-bubble-orchestrator`.

After closure, a Scenario 8 (discussion-bubble-to-caller) handoff was written at:
`.claude/state/handoffs/discussion-bubbles/20260513-113800-V3-storage-convention.md`

After that, `discussion-bubbles.html` and `activity.html` were regenerated via the data-block-swap pattern (`scripts/dry-run-regen-ops-views.py`). The regen reads live state and surgically replaces `<script id="report-data" type="application/json">` content; everything else in the HTML is preserved.

## Verify

| Verification | Expected | Observed | Result |
|---|---|---|---|
| Bubble state file written | `.claude/state/discussion-bubbles/db-2026-05-13-002.md` | written | ✓ |
| Full schema present | id, topic, claim, summary, status, decision, vote_tally, messages[] | all present | ✓ |
| Every voting agent has non-null `vote` | engineer / critic / data-integrity all voted | all 3 voted "approve" | ✓ |
| `vote_tally` matches sum of votes in `messages[]` (HALT 23.7 negative test) | tally must equal aggregation of `vote` fields | tally {approve:3, reject:0, abstain:0}; messages have 3 approve votes from voting roles; devil-advocate is bubble-only and not counted | ✓ |
| Closing message has `role_in_bubble: "decision"` | yes | yes — final message at 11:38:00Z by discussion-bubble-orchestrator | ✓ |
| Status is canonical | one of open/approved/approved-with-dissent/rejected/tied | `approved` | ✓ |
| `discussion-bubbles.html` regenerates with the new bubble visible | data block contains the new bubble id | yes — `db-2026-05-13-002` present in data block; only-bubble in regenerated view (no contamination from synthetic round-trip fixtures since real state was empty before this) | ✓ |
| Scenario 8 handoff (discussion-bubble-to-caller) written | `.claude/state/handoffs/discussion-bubbles/` | written; canonical token = `discussion-bubble-to-caller` | ✓ |
| Handoff visible in `activity.html` with correct scenario token | folder `discussion-bubbles` → canonical token `discussion-bubble-to-caller` via FOLDER_TO_SCENARIO | confirmed in regen output: scenarios = ['discussion-bubble-to-caller'] | ✓ |

## HALT 23.7 negative test (vote tally integrity)

The discussion bubble schema mandates that `vote_tally` integers must match the sum of `vote` fields in `messages[]` where `role_in_bubble == "voting"`. HALT 23.7 fires if they diverge.

Verification: 3 voting messages, each with `vote: "approve"`. Bubble-only messages (devil-advocate) and orchestrator open/decision messages are excluded from the tally. Tally `{approve: 3, reject: 0, abstain: 0}` matches. HALT 23.7 does NOT fire. Negative test passes.

## Disposition

PASS. Discussion bubble mechanics work end-to-end:
- Open → voters contribute → bubble-only adds counterpoint → close → Scenario 8 handoff → operational view regen.
- All schema fields present, tally integrity preserved, scenario-token folder-mapping correct.

## Side-product

The decision the bubble made (synthetic specs under `.claude/state/wave-zero-dry-run/synthetic-specs/`; audits under real `.claude/state/audits/` with W0.DR ship-ID + dry-run cycle suffix) is now the convention for V4-V12 and any future dry-run that exercises real-state paths.

## References

- Bubble state: `.claude/state/discussion-bubbles/db-2026-05-13-002.md`
- Scenario 8 handoff: `.claude/state/handoffs/discussion-bubbles/20260513-113800-V3-storage-convention.md`
- Regen tool: `scripts/dry-run-regen-ops-views.py`
- Operational view: `docs/reports/discussion-bubbles.html`, `docs/reports/activity.html`
- Schema spec: `docs/agents/REPORT_HTML_SPEC_v8.1_AMENDMENT.md` §amendment.10 (bubble chat metaphor) + §amendment.9 (scenario tokens)
- HALT 23.7 spec: `docs/agents/HALT_CRITERIA_v8.1_ADDENDUM.md` (vote tally integrity)

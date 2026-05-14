---
{
  "id": "PROP-004",
  "title": "Add `org-monthly` as 4th quota_type in PAUSE_DISCIPLINE schema",
  "lane": 2,
  "lane_label": "Bug Discovery",
  "created_at": "2026-05-13T15:05:00Z",
  "rationale": "PAUSE_DISCIPLINE_v8.1_ADDENDUM \u00a7 5 enumerates `quota_type` as 'weekly-tokens | daily-tokens | hourly-requests'. The prior session's failure was at the org-monthly cap, which is not in the enum. The discipline cannot pause for a quota it doesn't model. F1 finding (b) explicit: 'org-level monthly cap is a DIFFERENT quota than weekly-tokens.'",
  "scope": "Schema amendment: add `org-monthly` to the enum + document the reset boundary as configurable (Anthropic billing-cycle, not necessarily UTC midnight on the 1st). Update last-verify.json schema example. Update telemetry event schema (cycle.budget.checkpoint emits quota_type which now includes the new value).",
  "estimate": {
    "cost_tokens": 8000,
    "duration_minutes": 20,
    "risk": "low"
  },
  "files_affected": [
    "docs/agents/PAUSE_DISCIPLINE_v8.1_ADDENDUM.md \u00a7 5 (enum + example state file)",
    "docs/agents/TELEMETRY_PROTOCOL.md (cycle.budget.checkpoint + cycle.paused + cycle.resumed event schemas)",
    "scripts/aggregate-telemetry.py (handle the new quota_type in event aggregation \u2014 defensive: existing events keep working)",
    "scripts/cron/usage-snapshot-config.json (per PROP-003 \u2014 defines the org-monthly reset boundary)"
  ],
  "evidence_paths": [
    ".claude/state/wave-zero-dry-run/remediation/F1a-token-meter-gap-diagnostic.md",
    ".claude/state/discussion-bubbles/db-2026-05-13-003.md"
  ],
  "ship_target": "Post-Wave-Zero remediation ratification. Lightweight; could ship same-day as Founder applies the schema amendment.",
  "scope_files_affected": [
    "docs/agents/PAUSE_DISCIPLINE_v8.1_ADDENDUM.md \u00a7 5 (enum + example state file)",
    "docs/agents/TELEMETRY_PROTOCOL.md (cycle.budget.checkpoint + cycle.paused + cycle.resumed event schemas)",
    "scripts/aggregate-telemetry.py (handle the new quota_type in event aggregation \u2014 defensive: existing events keep working)",
    "scripts/cron/usage-snapshot-config.json (per PROP-003 \u2014 defines the org-monthly reset boundary)"
  ],
  "fallback_plan": {
    "plan_a": "Schema amendment: add 'org-monthly' to PAUSE_DISCIPLINE section 5 enum + TELEMETRY_PROTOCOL.md event examples. Defensive aggregator update (existing weekly-tokens events keep working).",
    "plan_b": "If PROP-003 sidecar config schema differs from PROP-004 assumption (reset boundary representation), align PROP-004 with what PROP-003 actually ships.",
    "plan_c": "Drop 'configurable reset boundary' feature; hardcode org-monthly as a string-only enum value; defer the reset-boundary logic to a follow-on amendment.",
    "abandon_criteria": "If PROP-003 fundamentally changes shape such that 'org-monthly' isn't a meaningful quota_type anymore, abandon PROP-004 and replace with a fresh proposal modeling whatever PROP-003 produces."
  },
  "rollback_strategy": "git revert <ship-closing-sha>; schema enum reverts cleanly; aggregate-telemetry.py defensive handling means rollback does not break existing events. Risk-of-rollback LOW (additive enum entry + defensive parser).",
  "cost_tokens": {
    "low": 30000,
    "high": 80000,
    "methodology": "Low end: schema amendment + aggregator update + one round-trip test extension. Original 8k estimate predated AMD-009; reflects raw amendment authoring without round-trip / test / governance amendment scope."
  },
  "bubble_voter_unanimity": {
    "bubble_id": "db-2026-05-13-003",
    "bubble_status": "approved-with-dissent",
    "vote_tally": {
      "approve": 2,
      "reject": 1,
      "abstain": 1
    },
    "dissent_note": "Shares bubble with PROP-003. Same dissent + same resolution rationale."
  },
  "cross_cutting_assessment": {
    "category": "cross-cutting: governance amendment + telemetry aggregator + depends_on PROP-003",
    "rationale": "PROP-004 amends PAUSE_DISCIPLINE schema (governance), updates aggregator (telemetry), and DEPENDS ON PROP-003 (per body: usage-snapshot-config.json defines the org-monthly reset boundary). Per AMD-009 P4, scanner WILL defer on (a) cross-cutting + (b) unshipped dependency on PROP-003. PROP-004 cannot auto-execute until PROP-003 is in shipped/."
  },
  "test_strategy_before_after": "BEFORE: cycle.budget.checkpoint events with quota_type='org-monthly' fail aggregator validation (unknown enum value). AFTER: aggregator parses + reports org-monthly events. Round-trip new [quota-type-enum] block enumerates valid quota_type values; emits warning if any event uses a value outside the enum.",
  "depends_on": [
    "PROP-003.b"
  ],
  "frontmatter_declares_auto_implement": {
    "value": false,
    "rationale": "PROP-004 depends_on PROP-003 (unshipped). Scanner correctly defers on P4 (cross-cutting + unshipped dep). Ships AFTER PROP-003 lands."
  },
  "depends_on_split_update": "Updated 2026-05-14 per Founder split directive: depends_on changed from PROP-003 to PROP-003.b. PROP-004 consumes integrated token data (AMD-014's reactivation + PROP-003.b's dashboards), not raw sidecar output.",
  "shipped_at": "2026-05-14T02:47:38-04:00",
  "shipped_in_commit": "7fdcf7e"
}
---

## Body

### What changes

PAUSE_DISCIPLINE § 5 schema (current):
```json
"quota_type": "weekly-tokens" | "daily-tokens" | "hourly-requests" | null
```

After amendment:
```json
"quota_type": "weekly-tokens" | "daily-tokens" | "hourly-requests" | "org-monthly" | null
```

PAUSE_DISCIPLINE § 2.1 quota reset windows (current):
- Weekly tokens (3.5M cap): resets Sunday 00:00 UTC
- Daily tokens: resets at start of next UTC day
- Hourly requests: resets at top of next UTC hour

After amendment, add:
- **Org-monthly:** resets at Anthropic's billing cycle boundary. **NOT necessarily UTC midnight on the 1st.** The boundary is account-specific — Founder configures it once in `scripts/cron/usage-snapshot-config.json`. Example: if billing cycle is "12th of each month at 14:00 UTC," that's what gets set.

### Devil's-Advocate stress-test absorbed (from db-003 point 3)

The reset boundary is configurable, not hardcoded. Founder checks the billing dashboard once at PROP-004 ship-time and configures. Future Anthropic billing changes require re-config; that's noted in PAUSE_DISCIPLINE § 2.1 amendment.

### Acceptance criteria

1. Enum amendment lands in PAUSE_DISCIPLINE § 5
2. `cycle.paused` + `cycle.resumed` event examples in TELEMETRY_PROTOCOL.md include an `org-monthly` example
3. `scripts/aggregate-telemetry.py` does NOT crash on existing `weekly-tokens` events AND processes new `org-monthly` events correctly
4. A test event with `quota_type: "org-monthly"` round-trips through the aggregator + dashboard regen without warnings

### Cross-references

- F1a diagnostic: `.claude/state/wave-zero-dry-run/remediation/F1a-token-meter-gap-diagnostic.md`
- Companion halt: `.claude/state/wave-zero-dry-run/remediation/proposed-halt-25.md`
- Companion sidecar: `.claude/state/proposals/pending/PROP-003-token-meter-wiring-sidecar.md`
- Bubble: `.claude/state/discussion-bubbles/db-2026-05-13-003.md`

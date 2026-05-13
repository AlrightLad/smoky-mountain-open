---
{
  "id": "PROP-004",
  "title": "Add `org-monthly` as 4th quota_type in PAUSE_DISCIPLINE schema",
  "lane": 2,
  "lane_label": "Bug Discovery",
  "created_at": "2026-05-13T15:05:00Z",
  "rationale": "PAUSE_DISCIPLINE_v8.1_ADDENDUM § 5 enumerates `quota_type` as 'weekly-tokens | daily-tokens | hourly-requests'. The prior session's failure was at the org-monthly cap, which is not in the enum. The discipline cannot pause for a quota it doesn't model. F1 finding (b) explicit: 'org-level monthly cap is a DIFFERENT quota than weekly-tokens.'",
  "scope": "Schema amendment: add `org-monthly` to the enum + document the reset boundary as configurable (Anthropic billing-cycle, not necessarily UTC midnight on the 1st). Update last-verify.json schema example. Update telemetry event schema (cycle.budget.checkpoint emits quota_type which now includes the new value).",
  "estimate": {
    "cost_tokens": 8000,
    "duration_minutes": 20,
    "risk": "low"
  },
  "files_affected": [
    "docs/agents/PAUSE_DISCIPLINE_v8.1_ADDENDUM.md § 5 (enum + example state file)",
    "docs/agents/TELEMETRY_PROTOCOL.md (cycle.budget.checkpoint + cycle.paused + cycle.resumed event schemas)",
    "scripts/aggregate-telemetry.py (handle the new quota_type in event aggregation — defensive: existing events keep working)",
    "scripts/cron/usage-snapshot-config.json (per PROP-003 — defines the org-monthly reset boundary)"
  ],
  "evidence_paths": [
    ".claude/state/wave-zero-dry-run/remediation/F1a-token-meter-gap-diagnostic.md",
    ".claude/state/discussion-bubbles/db-2026-05-13-003.md"
  ],
  "ship_target": "Post-Wave-Zero remediation ratification. Lightweight; could ship same-day as Founder applies the schema amendment."
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

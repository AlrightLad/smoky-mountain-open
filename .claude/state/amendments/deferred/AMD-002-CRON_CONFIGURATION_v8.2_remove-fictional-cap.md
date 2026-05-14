---
id: AMD-002
title: CRON_CONFIGURATION — Remove fictional 3.5M weekly alert threshold
target_canonical_path: docs/agents/CRON_CONFIGURATION.md
source_draft_path: .claude/state/wave-zero-dry-run/remediation/proposed-CRON_CONFIGURATION_v8.2_remove-fictional-cap.md
scope_summary: Single-line edit replacing hardcoded 4.5M / 3.5M alert thresholds at line 616 with a manual-quota-derived percentage (or telemetry-anomaly fallback when no paste exists).
type: edit-section
section_anchor: "For cron-specific thresholds"
depends_on: ["AMD-001"]
authored_by: claude-code
authored_at: 2026-05-13T22:00:00Z
bubble_of_record: null
estimate_tokens_to_apply: 500
rollback_strategy: git revert; the legacy 3.5M / 4.5M line is plain prose, safe to restore via revert.
status: pending
migrated_from_remediation: 2026-05-14T01:30:00Z
---

# CRON_CONFIGURATION — Remove fictional 3.5M weekly alert threshold

This draft surfaces a single line edit to CRON_CONFIGURATION.md.

Founder applies via direct edit (no `git mv` needed; this is an in-place
content change to one line).

## What changed

### Line 616 — Weekly token budget alert (REPHRASED)

**v8.1 (REMOVE):**
> - Weekly token budget alert: 3.5M/week expected, alert at 4.5M/week

This hardcoded 4.5M / 3.5M against a fictional cap. The thresholds are
guesses, not measurements.

**v8.2 (NEW):**
> - Weekly token budget alert: whatever the active Anthropic quota is per
>   the most recent `manual-quota-log.ndjson` entry. Alert fires at 90%
>   of the latest paste's `weekly-all` percentage (computed at threshold
>   evaluation, not pre-stored). If no manual paste exists or the latest
>   is > 24h stale, fall back to alerting on telemetry-event volume
>   anomalies (e.g., 2x prior week's daily peak) rather than against a
>   hardcoded number.

## Why this matters

Cron-level alerts that fire against fiction are noise, not signal. The
4.5M / 3.5M numbers had no relationship to Founder's actual Anthropic
quota. Replacing them with the manual-paste-derived percentage means:

1. When Founder has anchored quota recently, the alert is real.
2. When Founder hasn't, the alert falls back to a measurement-derived
   anomaly check rather than a fictional ceiling — no false confidence.
3. When PROP-003 ships, the manual-paste anchor gets replaced by real
   telemetry-derived numbers; the threshold logic is the same.

## Dependency

Same as PAUSE_DISCIPLINE v8.2: pending PROP-003 ship for real
telemetry-derived caps.

---

## Founder decision (defer — 2026-05-14T01:19:50Z)

E2E test: defer AMD-002 to verify apply-amendments.sh moves to deferred/ dir without modifying CRON_CONFIGURATION.md. Will be re-approved through real UI workflow once amendments.html ships.

---
{
  "id": "PROP-003.b",
  "title": "Token meter dashboard + telemetry integration (consumes quota-status.json)",
  "lane": 3,
  "lane_label": "Performance",
  "parent_proposal": "PROP-003",
  "split_rationale": "Per Founder directive 2026-05-14 Option A. PROP-003.b consumes PROP-003.a's quota-status.json + reflects real data in dashboards + flips _meter_status from 'wired-estimated' to 'wired-real'. Depends on .a (sidecar must produce data) and AMD-014 (governance flip).",
  "created_at": "2026-05-14T04:50:00Z",
  "rationale": "Once PROP-003.a produces quota-status.json on a cron schedule + AMD-014 governance applies, the dashboards + telemetry aggregators consume the real data. Replaces the operator-asserted session-summary fallback (commit 8b7e117) as the canonical real-data source for the token-usage dashboard.",
  "scope": "Update aggregate-telemetry.py + aggregate-token-usage.py to read .claude/state/quota-status.json when fresh. Update dashboard.html + token-usage.html data binding to surface real percentages. Flip _meter_status: 'wired-estimated' -> 'wired-real' when sidecar fresh.",
  "scope_files_affected": [
    "scripts/aggregate-telemetry.py (read quota-status.json; populate weekly_tokens / org_monthly_pct from real data when fresh)",
    "scripts/aggregate-token-usage.py (real-source path consumes quota-status.json; estimated fallback when stale)",
    "docs/reports/dashboard.html (meter widget surfaces real percentage when wired-real)",
    "docs/reports/token-usage.html (real column populated; operator-asserted estimate demoted to fallback panel)",
    "tests/round-trip-test.py ([meter-wiring] block: validate freshness gate + wired-real status transition)"
  ],
  "evidence_paths": [
    ".claude/state/proposals/approved/PROP-003.a-token-meter-sidecar-mechanics.md",
    ".claude/state/amendments/pending/AMD-014-pause-discipline-reactivation.md",
    ".claude/state/proposals/split-archived/PROP-003-original.md"
  ],
  "fallback_plan": {
    "plan_a": "When quota-status.json fresh: real data populates dashboards. When stale or absent: existing operator-asserted session-summary path stays as fallback (no regression).",
    "plan_b": "If quota-status.json schema differs from PROP-003.a actually-shipped output, align this ship's reader to the shipped schema. Adds ~50k tokens.",
    "plan_c": "If integration breaks downstream dashboards, scope-reduce to telemetry-only (no UI updates); ship UI integration as a follow-on.",
    "abandon_criteria": "PROP-003.a doesn't ship within reasonable time (>2 weeks) OR AMD-014 doesn't get Founder approval; PROP-003.b stays deferred indefinitely. Re-scope or abandon as separate decision."
  },
  "rollback_strategy": "git revert <ship-closing-sha>; aggregator falls back to operator-asserted estimate path automatically (defensive design). Risk-of-rollback LOW.",
  "cost_tokens": {
    "low": 80000,
    "high": 200000,
    "methodology": "Low end: aggregator updates + dashboard data-binding + 1 round-trip extension. High end: smoke tests for the dashboard real-vs-estimated distinction (AMD-012 binding for user-facing surface — dashboard.html is internal team-facing per AMD-012 scope so smoke is optional but recommended)."
  },
  "bubble_voter_unanimity": {
    "bubble_id": "db-2026-05-13-003",
    "bubble_status": "approved-with-dissent",
    "vote_tally": {
      "approve": 2,
      "reject": 1,
      "abstain": 1
    },
    "dissent_note": "Inherits db-003 lineage."
  },
  "cross_cutting_assessment": {
    "category": "single-stream: telemetry + dashboards (read-side only; no governance, no cron)",
    "rationale": "PROP-003.b's touch is read-side: consume quota-status.json + render. No new cron task. Governance change is AMD-014 (separate). Cleanly scoped to telemetry + dashboard via the data-block-swap pattern."
  },
  "test_strategy_before_after": "BEFORE: dashboard.html weekly_tokens shows operator-asserted estimate (4.2M); _meter_status='wired-estimated'. AFTER: when quota-status.json fresh, dashboard shows real percentages; _meter_status='wired-real'. Round-trip [meter-wiring] validates the freshness gate + status transition.",
  "depends_on": [
    "PROP-003.a",
    "AMD-014"
  ],
  "frontmatter_declares_auto_implement": {
    "value": true,
    "rationale": "PROP-003.b is AMD-009-compliant. Scanner WILL defer it on cross_cutting_dependency until BOTH dependencies ship: PROP-003.a (PROP scanner check) AND AMD-014 (governance amendment applied; check via .claude/state/amendments/applied/AMD-014-*.md presence)."
  },
  "ship_target": "Wave 1 — after PROP-003.a ships + AMD-014 applies via amendments.html.",
  "estimate": {
    "cost_tokens": 120000,
    "duration_minutes": 90,
    "risk": "low"
  }
}
---

## Body

### What this ship does (consumer side only)

1. **Telemetry aggregators read quota-status.json.** When fresh (<6h),
   weekly_tokens + org_monthly_pct populate from real meter data. When
   stale, fall back to the operator-asserted session-summary path
   (commit 8b7e117). The aggregator's _meter_status field flips
   accordingly: "wired-real" when real, "wired-estimated" when fallback.
2. **Dashboards reflect the real data.** dashboard.html token meter
   widget displays the real percentage with visual distinction (solid
   bar vs hatched-when-estimated). token-usage.html real column
   populates; existing operator-asserted estimate demotes to a fallback
   panel.
3. **Round-trip discipline.** New [meter-wiring] block validates the
   freshness gate + status transition logic.

### What this ship does NOT do

- NO new cron task (PROP-003.a owns the producer side)
- NO governance amendments (AMD-014 reactivates PAUSE_DISCIPLINE
  section 2.1 separately)
- NO smoke test required for member-facing surface (dashboard.html is
  team-facing per AMD-012 scope; AMD-012 still recommends smoke for
  dashboard.html if Founder authorizes the optional coverage)

### Acceptance criteria (binding per AMD-009 P3)

1. aggregate-telemetry.py reads quota-status.json when present + fresh;
   emits _meter_status="wired-real" in current-snapshot.json
2. aggregate-token-usage.py incorporates real-source events alongside
   estimated/manual columns; the operator-asserted session-summary
   path becomes a STALE-FALLBACK ONLY (not always-on as it is today)
3. dashboard.html token meter widget displays real percentage; visual
   distinction documented in design-system.html
4. token-usage.html real column non-zero when sidecar fresh; estimated
   column reflects fallback contribution honestly
5. tests/round-trip-test.py [meter-wiring] block enforces the
   freshness gate + status transition; passes
6. Smoke test (if AMD-012 authorizes for team-facing dashboards):
   dashboard renders at 1280px desktop + visual confirms real vs
   estimated distinction

### Cross-references

- Companion ship: PROP-003.a (the data producer; ships before this)
- Companion amendment: AMD-014 (PAUSE_DISCIPLINE section 2.1 reactivation; applies before this)
- Parent proposal (archived): .claude/state/proposals/split-archived/PROP-003-original.md
- Tonight's stopgap (commit 8b7e117): the operator-asserted session-summary path that this ship promotes to FALLBACK ONLY

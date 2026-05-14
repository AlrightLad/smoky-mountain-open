---
id: AMD-003
title: design-bot skill — Append DASHBOARD PR CHECKLIST (Phase 6 / DC-7)
target_canonical_path: .claude/skills/parbaughs-design-bot.md
source_draft_path: .claude/state/wave-zero-dry-run/remediation/proposed-parbaughs-design-bot-dashboard-checklist.md
scope_summary: Appends a 9-item DASHBOARD PR CHECKLIST section to the design-bot skill, codifying the canonical dashboard contract (no charts / shell import / .pb-* classes / form controls / 4 viewports / 30-line inline budget / protected layouts / round-trip / no fictional cap).
type: append-to-existing
section_anchor: "## POST-WORK audit checklist"
depends_on: []
authored_by: claude-code
authored_at: 2026-05-13T22:00:00Z
bubble_of_record: null
estimate_tokens_to_apply: 2000
rollback_strategy: git revert; the checklist block is additive and self-contained.
status: pending
hook_gate: skills/*.md require .APPROVAL.md sidecar bump; apply-amendments.sh disables/restores hook via "disableAllHooks: true" pattern per CLAUDE.md operational gotchas.
migrated_from_remediation: 2026-05-14T01:30:00Z
---

# Proposed: DASHBOARD PR CHECKLIST appended to design-bot skill

Add the following block to `.claude/skills/parbaughs-design-bot.md`
immediately after the existing "## POST-WORK audit checklist" section.

The block codifies the canonical dashboard contract established across
DC-1 through DC-9. Critic uses this as the gate for every future
dashboard PR.

---

## DASHBOARD PR CHECKLIST (Phase 6 / DC-7)

Critic MUST gate on this checklist for any PR that creates or modifies
a dashboard under `docs/reports/*.html`. No exceptions.

```
- [ ] No new charts. <canvas>, Chart.js, D3, chart.umd references absent
      from the dashboard HTML.
      EXCEPTIONS (carved out by directive):
        - token-usage.html SVG donut (pure SVG, not canvas)
        - main-flows.html SVG arrow overlay (functional documentation)
- [ ] Dashboard imports `_assets/dashboard-shell.css`. No other dashboard
      chrome import. Legacy `_assets/dashboard.css` removed unless the
      page is on the alias-sunset deferral list.
- [ ] Chrome uses canonical shell classes:
        .pb-page-header / .pb-page-nav / .pb-page-brand / .pb-page-nav-links
        .pb-page-main (or .pb-page-main.is-wide for main-flows)
        .pb-page-title-row / .pb-page-title / .pb-page-subtitle / .pb-page-meta
        .pb-section / .pb-section-title (no .section-header legacy)
        .pb-kpi-grid / .pb-kpi-card (no .metric / .status-tile / .summary-count)
        .pb-table / .pb-table-wrap (no .data-table)
        .pb-page-footer (no .report-footer)
- [ ] Form controls (if any) use .pb-select / .pb-input / .pb-textarea /
      .pb-filter-bar / .pb-filter-label, never native <select> + browser-
      default styling.
- [ ] Page renders cleanly at 4 viewports: 375 / 768 / 1280 / 1920px.
      Tables horizontal-scroll inside .pb-table-wrap, not text-wrap.
      KPI grid stacks 1 column at <600px, 2 columns at <1024px.
- [ ] Page-specific inline <style> block under 30 lines. Beyond budget,
      extract to its own _assets/*.css (e.g., proposals-page.css). The
      30-line budget excludes scoped data tokens (e.g., main-flows.html
      --col-* column-color tokens) which round-trip [theme] exempts.
- [ ] PROTECTED LAYOUTS not modified:
        discussion-bubbles.html .db-app 2-panel master/detail
        main-flows.html .mf-workspace + SVG arrows + flow rail + steps panel
        design-system.html showcase (swatches + type ladder + composition)
      HTML comments marking these protected sections preserved.
- [ ] Round-trip test passes:
        [theme] no raw hex in <style> blocks
        [no-charts] no canvas/Chart.js/D3 references
        [protected-layouts] sentinels for the three protected pages
        [pause-discipline] no fictional 3.5M / weekly_budget_cap / budget_pct
        Plus all other existing checks (nav, transcript, lifecycle, etc.)
- [ ] If this is a NEW dashboard, it's listed in:
        - scripts/inject-page-nav.py (NAV_LINKS + TARGETS)
        - scripts/regen-all.{ps1,sh} (if it needs regen)
        - tests/round-trip-test.py [theme] + [no-charts] scope
        - .claude/state/design-system/alias-sunset.md (alias-ref baseline)
        - scripts/visual-audit/capture-dashboards.mjs PAGES array
- [ ] No fictional cap constants added (per Phase 6.6). Pause discipline
      stays op-count-based until PROP-003 ships real metering.
```

Any unchecked item returns the work to the implementing agent. Critic
does NOT advance the ship to close on a dashboard PR until every box
is checked.

---

## How to apply

1. Copy the block above into `.claude/skills/parbaughs-design-bot.md`
   after the existing POST-WORK audit checklist (before AUDIT FAILURE).
2. Bump the `.APPROVAL.md` sidecar's version timestamp.
3. Round-trip + visual audit unchanged (this is a Critic-side protocol
   amendment; no code or HTML changes).

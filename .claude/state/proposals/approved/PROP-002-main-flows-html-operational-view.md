---
{
  "id": "PROP-002",
  "title": "main-flows.html — 4th operational view (generator-driven from MAIN_FLOWS.md)",
  "lane": 4,
  "lane_label": "Design System Extension",
  "created_at": "2026-05-13T13:50:00Z",
  "rationale": "Founder's referent (Dave Janowiak's 'main flows' pattern) is visual + browseable, not only a markdown doc. MAIN_FLOWS.md will be authored as F4 deliverable; this proposal converts it into a Founder-facing operational view so the artifact is consulted (not just read once). Binding caveats from db-2026-05-13-005: single source of truth is MAIN_FLOWS.md; HTML is generator-driven; non-overlapping purpose with dashboard.html.",
  "scope": "Author scripts/regen-main-flows.py (parses MAIN_FLOWS.md → data block) + docs/reports/main-flows.html (template w/ hero / per-flow drill-in / served-by ship badges / last-amended timestamp). Add main-flows.html to docs/reports/index.html. Add hourly regen to heartbeat cycle's operational-view-regen activity.",
  "estimate": {
    "cost_tokens": 35000,
    "duration_minutes": 75,
    "risk": "low"
  },
  "files_affected": [
    "scripts/regen-main-flows.py",
    "docs/reports/main-flows.html",
    "docs/reports/index.html",
    "docs/agents/PROTOCOLS_v8.1_ADDENDUM.md (P18 operational view list — add 4th view)"
  ],
  "evidence_paths": [
    ".claude/state/discussion-bubbles/db-2026-05-13-004.md",
    ".claude/state/discussion-bubbles/db-2026-05-13-005.md",
    ".claude/state/wave-zero-dry-run/remediation/proposed-MAIN_FLOWS.md"
  ],
  "ship_target": "Proactive cycle 2 (next Monday 01:00 UTC after Founder ratifies cycle 1)",
  "binding_conditions_from_db_005": [
    "Single source of truth: MAIN_FLOWS.md. HTML is generator-driven from the doc; no hand-authored HTML content.",
    "Non-overlapping purpose with dashboard.html stated in the proposal body. main-flows.html answers 'what does the product DO for members'; dashboard.html answers 'what's the orchestration team's operational state.' If overlap appears at implementation, kill main-flows.html instead of duplicating.",
    "F5 metric-integrity check at PROP review: 'whose metrics does this view flatter?' If the answer is 'orchestration team productivity,' reject.",
    "Token-budget delta estimated: +4-6k tokens per heartbeat cycle for the 4th regen surface."
  ]
}
---

## Promotion note — 2026-05-13T19:35:00Z

**Promoted from pending/ to approved/ by Founder directive (URGENT dashboard fix-pass).** Cycle-2 deferral was overridden because Founder needs main-flows visible NOW. Implementation completed in the same fix-pass:
- `docs/reports/main-flows.html` (built)
- `scripts/regen-main-flows.py` (built; parses proposed-MAIN_FLOWS.md → 8 flows: MF-01 through MF-08)
- Single-source-of-truth + non-overlapping-with-dashboard caveats from db-2026-05-13-005 honored: regen reads from doc, not hand-authored content; banner visibly states "NOT a roadmap" per db-004 binding caveats.

Implementation hash: post-regen sha256 first-16 = `6c7e6852ecba41ae`. Source doc: `.claude/state/wave-zero-dry-run/remediation/proposed-MAIN_FLOWS.md` (will switch to `docs/agents/MAIN_FLOWS.md` automatically after Founder ratifies via `pick_source()` in regen-main-flows.py).

## Body

### Why this is a proposal, not cycle-1 work

FIRST_PROACTIVE_CYCLE_KICKOFF.md scopes cycle 1 to the EXISTING 3 operational views. Adding a 4th is "inventing a new operational view" which is a Vision-level decision, NOT a proactive-cycle scope. Per the kickoff doc: "NOT permission to invent new operational views. Adding a 'fourth view' is a Vision-level decision, not a proactive cycle scope."

Therefore this proposal:
- Files in `pending/` so cycle 2 (or a Vision-level decision before then) can consider it.
- Does NOT execute in cycle 1.
- Carries the binding caveats from db-005 forward.

### Implementation sketch (for cycle-2 budget evaluation)

The HTML is rendered ONCE by the generator from MAIN_FLOWS.md, with the same `<script id="report-data" type="application/json">` data-block-swap pattern as the 3 existing operational views. P18 operational view discipline applies.

Data shape:
```json
{
  "flows": [
    {
      "id": "MF-01",
      "name": "Log a round",
      "primary_user_goal": "...",
      "screens": ["..."],
      "edge_cases": ["..."],
      "served_by_ships": ["W1.S4", "W1.S2", "W1.S1"],
      "served_by_primary": "W1.S4",
      "status_served": "..."
    },
    ...
  ],
  "last_amended": "<ISO-8601>",
  "doc_source": "docs/agents/MAIN_FLOWS.md"
}
```

UX sketch:
- **Hero band:** all 8 flows visible at a glance (MF-01 through MF-08), one per row, primary user goal as the label.
- **Drill-in:** click a row → expand panel showing screens-in-order, edge cases, served-by ships (linked to ROADMAP).
- **Footer:** last-amended timestamp + link to source MAIN_FLOWS.md.

No charts. No metrics. This is an informational reference view, not a dashboard.

### Cross-references

- Parent doc (single source of truth): `.claude/state/wave-zero-dry-run/remediation/proposed-MAIN_FLOWS.md` (will move to `docs/agents/MAIN_FLOWS.md` on Founder ratification)
- Bubble of record: `.claude/state/discussion-bubbles/db-2026-05-13-005.md`
- F5 metric-integrity cross-check: `.claude/state/wave-zero-dry-run/remediation/proposed-METRIC_INTEGRITY_PROTOCOL.md` (forthcoming)
- P18 operational view discipline: `docs/agents/PROTOCOLS_v8.1_ADDENDUM.md` (the operational-view list needs amending if PROP-002 ratifies)

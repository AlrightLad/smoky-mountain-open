# REPORT_TEMPLATES — v8.1 amendment

Clarifies the markdown-template stance on operational views.

Status: **RATIFIED** governance v8.1
Cross-refs: REPORT_TEMPLATES.md (v8 base), REPORT_HTML_SPEC_v8.1_AMENDMENT.md, PROTOCOLS_v8.1_ADDENDUM.md P18

---

## §amendment.1 — Operational views do not have markdown templates

The three operational views introduced in v8.1 are **HTML-only**:

| View | Markdown equivalent |
|---|---|
| discussion-bubbles.html | Browse `.claude/state/discussion-bubbles/*.md` directly |
| activity.html | Browse `.claude/state/handoffs/**/*.md` directly |
| proposals.html | Browse `.claude/state/proposals/pending/*.md` directly |

Rationale: the source-of-truth for each view is already markdown, one file per entity. Aggregating into a single markdown report would duplicate content and create staleness drift between the report and the state files. The HTML view exists because it adds value (filter, sort, group, interactive decision capture) that flat markdown cannot.

For grep/sed/CLI consumption, browse the state directory directly:

```bash
# All discussion bubble decisions in Wave 1
grep -l 'wave: W1' .claude/state/discussion-bubbles/*.md

# All handoffs from engineer to critic
grep -l 'from_agent: engineer' .claude/state/handoffs/agent-to-agent/*.md \
  | xargs grep -l 'to_agent: critic'

# All Lane 4 pending proposals
grep -l 'lane: 4' .claude/state/proposals/pending/*.md
```

The skill `parbaughs-report-generate` MUST NOT produce markdown summary files for these three views. If a Founder request specifically needs an aggregated markdown digest (e.g., "give me all discussion bubbles from Wave 1 as one document"), generate it on-demand using a one-off concatenation; do not introduce a recurring markdown view.

---

## §amendment.2 — State-store frontmatter requirements

Operational views depend on consistent frontmatter in state files. The originating skills (parbaughs-discussion-bubble-write, parbaughs-handoff-note, parbaughs-proactive-proposal) MUST emit frontmatter matching the schemas in REPORT_HTML_SPEC_v8.1_AMENDMENT.md.

If those skills drift from the schema, halt 23.2 triggers when parbaughs-report-generate next runs.

**Discussion Bubble file template:**

```markdown
---
id: discussion-bubble-20260512-0945-w1s3-scoring-validation
claim: Should live-round scoring validate hole par at write time?
ship: W1.S3
wave: W1
opened_at: 2026-05-12T09:45:00Z
closed_at: 2026-05-12T10:18:00Z
orchestrator: discussion-bubble-orchestrator
outcome: approved
dissent: false
halt_triggered: false
vote_tally:
  support: 4
  oppose: 0
  abstain: 1
votes:
  - agent: engineer
    vote: support
    rationale: Write-time validation catches the v8.3.2 Honey Run hole 10 class of bug at source.
  - agent: critic
    vote: support
    rationale: Aligns with P5 validator strictness precedent.
---

## Decision

Validate hole par at write time against masters config. Reject writes with par mismatch and surface to user as recoverable error.

## Context

(longer prose explanation)
```

**Handoff note template:** Per HANDOFF_NOTE_TEMPLATES.md (v8); no change in v8.1.

**Proposal file template:**

```markdown
---
id: PROP-008-css-token-cleanup
title: Consolidate --el-0 through --el-4 + --ease-standard tokens
lane: 4
lane_label: Design System Extension
created_at: 2026-05-12T01:14:00Z
estimate:
  cost_tokens: 14000
  duration_minutes: 25
  risk: low
files_affected:
  - src/styles/base.css
  - src/styles/components.css
  - src/styles/utilities.css
evidence_paths:
  - .claude/state/proactive-research/008-token-audit-grep-results.md
ship_target: W1.S4 or defer to next ship
---

## Rationale

v8.9.0 left --el-0..4 and --ease-standard defined-but-unconsumed...

## Scope

Audit references for --el-* and --ease-standard across src/...
```

---

## §amendment.3 — Time-windowed reports unchanged

Daily, weekly, ship, wave, quarterly, and dashboard report templates remain as specified in REPORT_TEMPLATES.md (v8). No changes in v8.1 to those templates.

Future amendments to time-windowed templates will continue to land in `REPORT_TEMPLATES_v<X>_AMENDMENT.md` files.

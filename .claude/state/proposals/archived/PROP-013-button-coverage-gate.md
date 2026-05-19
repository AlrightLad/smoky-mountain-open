---
{
  "id": "PROP-013",
  "title": "Button coverage gate (click-every-interactive per page)",
  "lane": 1,
  "lane_label": "Substrate Discipline",
  "ship_target": "Substrate",
  "created_at": "2026-05-14T22:25:00Z",
  "rationale": "Founder addendum 2026-05-14 'BUTTON COVERAGE IS MANDATORY': page audit ≠ button audit. Visual inspection misses buttons that look correct but fail when clicked. Every interactive element must be enumerated → clicked → verified. PROP-009 click-through audit covered scroll + nav + state changes; PROP-013 extends to per-element click coverage as a separate gate (Gate 5 in AMD-018 11-gate stack).",
  "scope": "Three deliverables: (1) scripts/visual-audit/enumerate-interactives.mjs (ALREADY AUTHORED commit 6c49883) — enumerates every <button>, <a>, <input>, onclick handler, role=button, cursor:pointer, <details><summary>, <select> on a page. Outputs JSON inventory. (2) scripts/visual-audit/click-every-interactive.mjs (ALREADY AUTHORED commit 6c49883) — reads enumeration, clicks each element via Playwright, captures before/after DOM size delta + JS errors. Skips anchors with non-fragment href (would navigate away). (3) FORMAL proposal codifies Gate 5 in AMD-018's 11-gate self-governed push criteria: every user-facing page modification must have click-every-interactive output for the page committed as evidence.",
  "estimate": {
    "cost_tokens": 3000,
    "duration_minutes": 8,
    "risk": "low"
  },
  "files_affected": [
    "scripts/visual-audit/enumerate-interactives.mjs (already exists)",
    "scripts/visual-audit/click-every-interactive.mjs (already exists)",
    ".claude/state/proposals/pending/PROP-013-button-coverage-gate.md (this file)",
    "tests/round-trip-test.py — new [button-coverage] block at apply-time (warns when changed user-facing page lacks recent click-every output)"
  ],
  "fallback_plan": "Plan A (chosen): codify scripts + Gate 5 as PROP-013. Plan B: defer formal proposal; keep scripts but treat as optional polish. Plan C (rejected): roll into PROP-009; dilutes both gates. Per Founder safety note + AMD-009 P5: button-failure class of bug warrants dedicated gate, not bundled.",
  "rollback_strategy": "git revert; scripts remain but are not enforced. Gate 5 of AMD-018 reverts from 'required' to 'recommended'.",
  "round_trip_coverage": "New [button-coverage] block at apply-time. Pattern: when a docs/reports/*.html or src/pages/*.js modifies, expect a corresponding .claude/state/app-audit-2026-05-14/<page>-click-results.json with mtime >= file mtime. Warning (not failure) if missing; ship-close Critic + design-bot enforce as hard gate.",
  "depends_on": ["PROP-009", "PROP-010", "PROP-012", "AMD-018"],
  "authored_by": "claude-code",
  "bubble_of_record": null,
  "estimate_tokens_to_apply": 1500,
  "status": "pending",
  "operating_status": "ACTIVE — scripts already in use this session for iter 15+16 dashboard pages. Formal codification + Gate 5 enforcement land at apply-time."
}
---

# PROP-013 — Button coverage gate

Authored 2026-05-14 per Founder addendum "BUTTON COVERAGE IS
MANDATORY". Scripts already operating; this proposal codifies them
as a formal gate.

## Why this proposal

Per Founder direct observation: "The audit is incomplete unless EVERY
interactive element gets clicked." PROP-009 click-through user-journey
audit covers scroll + click-sample + navigation. PROP-013 extends to
EXHAUSTIVE per-element click coverage.

Sampling is not testing. Class of bug missed by sample-only: any
button that silently fails, navigates wrong, opens broken modal, or
handles missing data poorly.

## What changes

### Already in place (scripts shipped iter 16 commit 6c49883):

- **enumerate-interactives.mjs** — given a URL, enumerates ALL
  interactive elements:
  - `<button>` elements
  - `<a>` tags (links)
  - `<input type="button|submit|reset|checkbox|radio">`
  - Elements with `onclick` handlers
  - Elements with `role="button"`
  - Elements with `cursor:pointer` in computed style
  - `<details><summary>` (collapsible)
  - `<select>` triggers
  - Outputs structured list with selector + text + type + location

- **click-every-interactive.mjs** — given enumeration:
  - Clicks each element one at a time via Playwright
  - Captures DOM size delta (before/after) as coarse state-change signal
  - Captures JS errors emitted during click
  - Skips anchors with non-fragment href (would navigate away from
    page under test)
  - Logs result: clicked / navigation-skipped / errored

### New (this proposal):

- **Gate 5 in AMD-018** — "Click-every-interactive coverage PASS" —
  becomes hard ship-close gate
- **Round-trip [button-coverage] block** at apply-time — warns when
  user-facing page modified without recent click-every output
- **Critic protocol** explicitly verifies click-every output exists
  for each changed user-facing page

## What this catches that PROP-009 doesn't

| Pattern | PROP-009 catches? | PROP-013 catches? |
|---|---|---|
| Scroll behavior wrong | ✓ | ✓ |
| Wheel-scroll doesn't reach bottom | ✓ | ✓ |
| Click selected flow lights up grid | ✓ (sample) | ✓ (exhaustive) |
| Random button on edge of page silently fails | ✗ | ✓ |
| `onclick` handler throws on missing data | ✗ | ✓ |
| Icon button (no text) opens broken modal | ✗ | ✓ |
| Filter chip that doesn't change list state | ✗ | ✓ |
| `<details>` summary that doesn't expand | ✗ | ✓ |

## Coverage examples this session

Iter 15 click-every output (main-flows.html):
`.claude/state/app-audit-2026-05-14/main-flows-{interactives,click-results}.json`

The click-every output for main-flows.html ran successfully + caught
0 errors after iter-11/12/13 fixes. Demonstrates the protocol works
end-to-end.

## Apply-time deliverables

1. Move PROP-013 from approved/ to applied/
2. Add round-trip `[button-coverage]` block
3. Update CRITIC.md per Gate 5 enforcement (governance-protection
   bypass justified by this proposal)
4. Document in CLAUDE.md: "Every user-facing page modification must
   have click-every-interactive output for the page committed as
   evidence before ship-close."

## Anti-patterns this proposal rules out

- "Tested by clicking the main button" — sample, not coverage
- "All structurally present per sentinel" — DOM-presence is not
  click-behavior
- "Visual review caught X" — visual review catches appearance,
  not interaction
- "PROP-009 covered the user journey" — PROP-009 is sample-based;
  PROP-013 is exhaustive

## Operating status

Scripts operating since iter 16. Formal codification + Gate 5
enforcement land at apply-time. Critic + design-bot already
reference click-every output in their ship-close gate per current
session's commits.

---

## Archive metadata

```
archived_at: 2026-05-19T03:00:00Z
archived_by: founder-blanket-approval-2026-05-19
obsoleted_by: SHIPPED — scripts/visual-audit/enumerate-interactives.mjs + scripts/visual-audit/click-every-interactive.mjs on disk; AMD-018 11-gate stack incorporates Gate 5 click-every coverage; used in session 2 button audits. Triage source: .claude/state/task-queue/founder/proposal-triage-2026-05-19.md Batch B row 7.
```

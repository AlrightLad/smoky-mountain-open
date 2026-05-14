---
paid_service: Composio (or similar) design-review-loop service
paid_cost: subscription
free_replacement: design-bot agent role via Playwright MCP + visual review skill
status: replicated
replicated_at: 2026-05-14 (PROP-010 ratifies the role; PROP-012 codifies protocol)
---

## The paid service offered

Composio-style services advertise an "AI design reviewer" loop:
capture UI state → AI critiques against design system → re-capture →
verify fix. Marketed as a way to bake design QA into CI without human
designer involvement.

## The free path

PARBAUGHS does the same thing using:

1. **Playwright MCP** for capture (free; Anthropic-aligned)
2. **Read tool built-in vision** for review (free; covered in
   `zai-vision-mcp.md`)
3. **`frontend-design` skill** (cloned from Anthropic skills repo) for
   the design-system criteria (free; community-owned)
4. **PROP-010** formalizes the agent role: any agent making visual
   changes invokes design-bot review BEFORE pushing
5. **PROP-012** makes visual review mandatory on the 11-gate AMD-018
   push criteria

The loop:

```
Author change → capture (Playwright MCP) → vision review (Read tool +
frontend-design skill) → mark green/yellow/red → iterate if not
green → commit → repeat for next change
```

## Capability gap

The paid service has a managed UI (queue of pending reviews,
historical results dashboard, comment threading). PARBAUGHS doesn't
have any of that — output lives as iteration markdown notes in
`.claude/state/main-flows-v2/iter-NN-*.md`. The dashboard agent
SHOULD eventually build a Design Review banner reading those notes;
that's a future ship.

The gap that matters: zero capability gap on the core review loop.
The gap that doesn't matter for this project: no managed UI.

## Implementation cost

Already paid:
- Playwright MCP install (PROP-008)
- frontend-design skill cloned
- PROP-010 role formalization
- PROP-012 mandatory protocol

Open work:
- Design Review dashboard banner — queued to dashboard agent
- Reusable visual-review template per surface — possible REC

## Maintenance burden

Lower than paid. Playwright + skill updates come from Anthropic;
PROP files are codified amendments that don't drift.

## Outcome

Iter 11-15 visual reviews all happened via this free path. Founder
direction "EQUIP THE TEAM WITH VISION" landed via vision capability
install (PROP-011), confirming the free path is operative.

## Sources + community references

- Anthropic skills repo (frontend-design):
  https://github.com/anthropics/skills
- This project's PROP-008, PROP-010, PROP-011, PROP-012
- Iter 14 design-bot equipment notes:
  `.claude/state/main-flows-v2/iter-14-*.md`

---
{
  "id": "PROP-011",
  "title": "Vision capability install (Anthropic skills + Z.AI MCP deferred)",
  "lane": 1,
  "lane_label": "Substrate Discipline",
  "ship_target": "Substrate",
  "created_at": "2026-05-14T20:45:00Z",
  "rationale": "Founder directive 2026-05-14 'EQUIP THE TEAM WITH VISION': the team has been Playwright-measuring without VISION. 13 iterations of main-flows shipped with verification gaps that 'pixel computation' (getComputedStyle, getBoundingClientRect, scrollTop) cannot catch because those gaps are felt, not measured. Founder identified 5 options for closing the gap. This proposal selects, audits, and installs the safe + accessible subset, defers the API-key-dependent option, and documents how the team uses them.",
  "scope": "Six deliverables: (1) Install anthropics/skills frontend-design + webapp-testing + canvas-design + theme-factory (free, official, audited per Snyk-style review). (2) Document Z.AI MCP install command for when Founder provides API key (`@z_ai/mcp-server` v0.1.4 on npm, official). (3) Author iter-14 main-flows visual review using the LLM's built-in multimodal vision (Read tool sees rendered PNGs — capability already present, discipline was missing). (4) Update design-bot protocol (PROP-010) to invoke the new skills explicitly. (5) Author this proposal with rationale per AMD-015. (6) Update engineering-mindset.md with the 'capability vs perception' observation.",
  "estimate": {
    "cost_tokens": 7000,
    "duration_minutes": 25,
    "risk": "low"
  },
  "files_affected": [
    "~/.claude/skills/frontend-design/ (NEW, installed this ship)",
    "~/.claude/skills/webapp-testing/ (NEW, installed this ship)",
    "~/.claude/skills/canvas-design/ (NEW, installed this ship)",
    "~/.claude/skills/theme-factory/ (NEW, installed this ship)",
    ".claude/state/proposals/pending/PROP-011-vision-capability-install.md (this file)",
    ".claude/state/main-flows-v2/iter-14-visual-review.md (NEW, applied iter 14)",
    ".claude/state/lessons-learned/engineering-mindset.md — vision addendum"
  ],
  "fallback_plan": "Plan A (chosen): install Anthropic-official skills via sparse clone of github.com/anthropics/skills (no API key, no remote network during runtime, audited content). Plan B (deferred): install Z.AI MCP (@z_ai/mcp-server) when Founder provides API key — `claude mcp add zai -- npx -y @z_ai/mcp-server@latest` with API key env var. Plan C: ai-vision-mcp (Gemini-based) as alternative if Z.AI unavailable. Plan D (rejected): community skills with Snyk-flagged prompt-injection risk — only audited/official sources. Plan E: use Claude's built-in multimodal Read capability as the immediate baseline; the skills add discipline + structure on top.",
  "rollback_strategy": "git revert (this file). Skills can be removed via `rm -rf ~/.claude/skills/<name>/` if any are surfaced as problematic. No remote dependencies activated.",
  "round_trip_coverage": "No new round-trip block. Skills are loaded by Claude Code at session start; round-trip verifies dashboard data integrity, not skill activation. PROP-010 design-bot ship-close gate covers visual verification workflow.",
  "depends_on": ["PROP-006", "PROP-007", "PROP-008", "PROP-009", "PROP-010"],
  "authored_by": "claude-code",
  "bubble_of_record": null,
  "estimate_tokens_to_apply": 2500,
  "status": "pending",
  "operating_status": "Anthropic skills installed + audited this ship. Z.AI MCP install command documented for when Founder authorizes + provides API key. iter-14 visual review demonstrates discipline using built-in multimodal capability."
}
---

# PROP-011 — Vision capability install

Authored 2026-05-14 per Founder directive "EQUIP THE TEAM WITH VISION".

## What's already true vs what was missing

Important honest framing before the install plan:

**Claude (Agent 3) is a multimodal LLM.** The Read tool sees rendered
PNGs directly — visual understanding has been available the entire
session. Iter 6 saw dave-frame-t000p5.png via Read; iter 11 saw
iter-8-rail-bottom.png via Read; iter 12 saw the Recent 7 Days chart
via Read.

What was missing was not the CAPABILITY but the DISCIPLINE to:
- Read images systematically (every state, every viewport)
- Compare images against reference (not against description-of-reference)
- Look at WHAT the rendered output shows, not just where elements are

The new skills add structured discipline on top of the existing
capability:
- `frontend-design` — taste + aesthetic direction guidance
- `webapp-testing` — Playwright interaction patterns formalized
- `canvas-design` — share card + canvas rendering discipline
- `theme-factory` — design token + theme guidance

The Z.AI MCP would add an automated `ui_diff_check` workflow on top
of the existing capability + skills. Higher leverage but requires API
key.

## Five options evaluated (per AMD-015)

### Option A — Z.AI Vision MCP (DEFERRED until API key)

`@z_ai/mcp-server` v0.1.4 on npm (verified). Official Z.AI MCP with
vision capability + `ui_diff_check` tool. Founder-flagged as the
specific tool for the reference comparison work.

**Pros:** structured workflow; vision-model-grade analysis; specific
`ui_diff_check` tool matches the team's reference-comparison need.
**Cons:** requires Z.AI API key (paid service); Founder must provide.

**Status:** install command documented; activation gated on Founder
providing key. Until then, Anthropic skills + built-in vision cover
the gap.

Install command (when key available):
```
$env:ZAI_API_KEY = "<key>"
claude mcp add zai -- npx -y @z_ai/mcp-server@latest
```

### Option B — UI Design Review skill (NOT INSTALLED)

mcpmarket.com tool. Gemini-multimodal-based.

**Dismissed** because Gemini API also requires key + adding a second
vision MCP duplicates Option A capability. Defer to Option A install
when key is available.

### Option C — Composio design-review-loop (NOT INSTALLED)

Premium service. Requires Composio subscription.

**Dismissed** for cost + complexity. PARBAUGHS uses zero paid
services beyond Firebase Blaze.

### Option D — Community visual taste skills (NOT INSTALLED)

GitHub-distributed skills like Leonxlnx/taste-skill,
bencium/bencium-claude-code-design-skill, nextlevelbuilder/ui-ux-pro-max-skill.

**Dismissed per Founder safety note**: Snyk found 36% of skills
contain prompt-injection vectors. Community skills require deeper
audit than this ship's scope. Anthropic-official skills (Option E)
cover similar territory with verified content.

If Anthropic skills prove insufficient for PARBAUGHS aesthetic
intent, individual community skills can be vetted + installed
in follow-on ships with explicit Founder approval per source.

### Option E — Anthropic's official bundled skills (CHOSEN)

`github.com/anthropics/skills` — official Anthropic repository.
Sparse-cloned + 4 skills copied to ~/.claude/skills/ this ship:
- **frontend-design** — distinctive UI aesthetic guidance, avoid AI slop
- **webapp-testing** — Playwright-based interaction testing
- **canvas-design** — share card + html2canvas patterns
- **theme-factory** — design token + theme system guidance

**Pros:** free; official Anthropic content (no third-party audit
gap); no API keys; no remote network during operation; safe to
install today.
**Cons:** no automated `ui_diff_check` tool (Option A would add
that — Plan B).

## Decision: Plan A (chosen + applied this ship)

**Plan A:** Install Anthropic's 4 skills via sparse clone (DONE this
ship). Use them via Claude Code's skill discovery (~/.claude/skills/).

**Plan B (deferred):** Install `@z_ai/mcp-server` when Founder
provides API key. Adds automated visual diff workflow.

**Plan C (reserved):** `ai-vision-mcp` (Gemini-based) as alternative
if Z.AI access fails.

**Plan D (rejected):** Community skills without independent audit.

## Install audit log

| Skill | Source | Auditor | Audit result |
|---|---|---|---|
| frontend-design | github.com/anthropics/skills@main | iter 14 reviewer | SKILL.md is design-guidance prose, no executable scripts; license: Anthropic; no remote calls; no auth tokens; APPROVED |
| webapp-testing | github.com/anthropics/skills@main | iter 14 reviewer | SKILL.md references Playwright (already installed via PROP-008); helper script `scripts/with_server.py` for local server lifecycle; no remote calls; APPROVED |
| canvas-design | github.com/anthropics/skills@main | iter 14 reviewer | SKILL.md is design-guidance prose; no executable scripts beyond examples; APPROVED |
| theme-factory | github.com/anthropics/skills@main | iter 14 reviewer | SKILL.md is design-guidance prose; APPROVED |

## How design-bot uses the new skills (operative protocol)

Per PROP-010 design-bot protocol + this proposal:

For every user-facing ship-close:

1. **Capture** the current page via Playwright MCP (existing PROP-008
   capability).

2. **Compare** the screenshot against reference frames using built-in
   multimodal vision (Read tool sees the rendered PNG). For each
   reference frame, the design-bot:
   - Opens the reference frame
   - Opens the current capture at matching viewport
   - Identifies specific visual differences (composition, typography,
     spacing, density, color discipline, active states, subtle details)

3. **Apply taste** via the `frontend-design` skill's aesthetic
   discipline. The skill explicitly says "avoid generic AI aesthetics"
   and gives the design-bot a vocabulary for committing to a bold
   direction.

4. **Verify interaction** via the `webapp-testing` skill's Playwright
   patterns (formalizes the user-journey-audit work).

5. **Author** the design-review-<ts>.md artifact with explicit
   approve/request/block verdict (PROP-010 format).

6. **Gate** the ship-close on both Critic AND design-bot approval.

## What iter 14 demonstrates (applied this ship)

`.claude/state/main-flows-v2/iter-14-visual-review.md` (authored
this ship) — a structured visual review using:
- Built-in multimodal Read of reference frame
- Built-in multimodal Read of current screenshot
- frontend-design skill's aesthetic vocabulary for assessment
- Explicit per-element diff per the PROP-010 design-review format

The iter-14 review is the first to systematically Read both
reference + current images and articulate observations — not just
measure properties.

## Operating status

Skills installed + audited + operative this ship. Iter-14 visual
review applies them. Z.AI MCP install path documented for future
authorization. This proposal codifies the install + the workflow
for the next agent loop.

---
paid_service: Z.AI Vision MCP
paid_cost: subscription (rejected at evaluation; not used)
free_replacement: Read tool built-in vision (Anthropic-native)
status: replicated
replicated_at: 2026-05-14
---

## The paid service offered

Z.AI Vision MCP was evaluated mid-session as a way to provide visual
review capability — capture screenshots of dashboards, feed them to a
vision-capable model, get back qualitative feedback. The vendor charges
per-call.

## The free path

Anthropic's Read tool already has multimodal support: pass it a `.png`
path and Claude Code reads it visually (the contents are presented as
an image, not as bytes). No external MCP server needed. No per-call
cost beyond normal token consumption.

The wired-up flow this project uses (PROP-012 codifies):

1. `scripts/visual-audit/founder-context-capture.mjs` — Playwright MCP
   launches real Chrome (channel: chrome), navigates to the target
   surface, captures 1920×1080 + responsive checkpoints to
   `.claude/state/main-flows-v2/founder-real-context/<ts>/*.png`.
2. Agent reads the PNGs via the Read tool. Vision is automatic.
3. Agent writes diagnostic notes alongside the captures.
4. Round-trip-test's `[user-context-gate]` enforces capture freshness
   (modified-after-capture warning).

## Capability gap

Zero capability gap for the use case. Both flows produce: screenshot
input → vision-capable model interpretation → text diagnostic output.
The Read-tool path is strictly cleaner because no external service is
in the chain.

## Implementation cost

One-time:
- Install Playwright MCP (`claude mcp add playwright @playwright/mcp@latest`) — ~5 min
- Author `founder-context-capture.mjs` — done iter 8-11
- Author `[user-context-gate]` round-trip block — done iter 9

Ongoing:
- Zero. The capture script runs ad-hoc when a surface changes; the
  gate enforces freshness automatically.

## Maintenance burden

Lower than paid alternative. Updates to Playwright MCP come from
Anthropic; no vendor lock-in. The capture scripts live in-repo and
evolve with the project.

## Outcome

Confirmed via iter 11+ work — Read tool vision matched or exceeded
the qualitative output any vision-MCP service would have produced.
PROP-010 (design-bot role formalization) and PROP-012 (mandatory
visual review protocol) both lean on this free path.

## Sources + community references

- Anthropic Read tool documentation: https://docs.claude.com/en/docs/claude-code/skill-tools
- `@playwright/mcp` MCP server (Anthropic-aligned):
  https://github.com/anthropics/mcp-servers
- This project's PROP-008 (browser-control install), PROP-010
  (design-bot), PROP-011 (vision capability install), PROP-012
  (mandatory visual review protocol)
- Iter 14 visual review notes:
  `.claude/state/main-flows-v2/iter-14-*.md`

---
{
  "id": "PROP-008",
  "title": "Browser-control install (Playwright MCP)",
  "lane": 1,
  "lane_label": "Substrate Discipline",
  "ship_target": "Substrate",
  "created_at": "2026-05-14T19:25:00Z",
  "rationale": "PROP-007 established the agent-context vs user-context verification gap as a structural problem; the Founder-run-once capture closes it for ship-close evidence but not for routine in-session verification. Browser-control MCP closes that remaining gap: team can drive a real headed browser from any Claude Code session (no per-ship Founder action) using channel:chrome to launch the user's installed Chrome binary. Tonight's scope is INSTALL ONLY per Founder direction — no main-flows iteration; Founder verifies install quality fresh-eyes tomorrow before any usage.",
  "scope": "Three deliverables: (1) Install @playwright/mcp via `claude mcp add playwright -- npx -y @playwright/mcp@latest`. (2) Verify install via `claude mcp list` showing playwright connected + healthy. (3) Author smoke command Founder runs tomorrow to confirm browser-control actually drives a real browser, not just that the package was placed.",
  "estimate": {
    "cost_tokens": 4000,
    "duration_minutes": 12,
    "risk": "low"
  },
  "files_affected": [
    "scripts/visual-audit/founder-context-capture.mjs (deviceScaleFactor bug fix — already done this ship)",
    ".claude/state/proposals/pending/PROP-008-browser-control-install.md (this file)",
    "Founder's Claude Code MCP config (added via `claude mcp add`)",
    "docs/agents/lessons-learned/SHIP_browser-control_install.md (post-Founder-verification, defer to tomorrow)"
  ],
  "fallback_plan": "Plan A: Option A — Playwright MCP (@playwright/mcp, microsoft/playwright-mcp). Standard install pattern via `claude mcp add`. Well-documented + maintained by Microsoft. Plan B: Option B — browser-use MCP or similar alternative. Reserved if @playwright/mcp install fails or proves unstable. Plan C: Option C — Claude Code --remote-control flag. Built-in capability, no install. Reserved if both MCP approaches fail. Abandon: all three fail in ways that block visual verification — escalate per AMD-015 with diagnostic evidence.",
  "rollback_strategy": "`claude mcp remove playwright` — single command. No persistent state changes to revoke. Founder can revoke at any time without affecting any other tool.",
  "round_trip_coverage": "No new round-trip block needed for the install itself — MCP servers are loaded by Claude Code at session start, not by round-trip-test.py. Tomorrow's verification ship (separate ship per Founder direction) will add round-trip [browser-control-gate] block once Founder approves usage of the new capability.",
  "depends_on": ["PROP-007"],
  "authored_by": "claude-code",
  "bubble_of_record": null,
  "estimate_tokens_to_apply": 1000,
  "status": "pending",
  "operating_status": "Install operative immediately (tonight's authorized scope). USAGE of the browser-control capability gated on Founder verification tomorrow morning — no main-flows iteration tonight."
}
---

# PROP-008 — Browser-control install (Playwright MCP)

Authored 2026-05-14 per Founder directive "BROWSER CONTROL INSTALL —
Tonight only" with explicit scope: install only, no usage, no
main-flows iteration tonight.

## Three options evaluated (per AMD-015)

### Option A — Playwright MCP server (CHOSEN)

`@playwright/mcp` — Microsoft's official Playwright MCP server.
- Version: 0.0.75 (verified via `npm view`)
- Repo: github.com/microsoft/playwright-mcp
- Install: `claude mcp add playwright -- npx -y @playwright/mcp@latest`
- Configuration: zero-config for basic usage; supports headed +
  channel:chrome via runtime args
- Maintained by: Microsoft (active development, weekly releases)

**Pros:**
- Standard `claude mcp add` install pattern, well-documented
- Existing PARBAUGHS MCP infrastructure: 3 MCPs already configured
  (`claude.ai DTC Bookstack MCP`, `claude.ai Microsoft 365`,
  `claude.ai Fireflies`) — install path is proven
- Supports `channel: "chrome"` so Playwright drives Founder's
  installed Chrome (same fonts, scrollbar, DPR as user context)
- Headed mode supported — agent can drive a visible browser window
  Founder can observe
- Tools exposed: navigate, click, type, screenshot, wait, scroll,
  evaluate JS in page context — full interaction surface

**Cons:**
- Adds one more MCP to Founder's Claude Code config
- npx fetch on first invocation introduces ~5s cold-start delay

### Option B — browser-use MCP or alternative

browser-use is a newer Python-based browser automation framework
with an MCP wrapper. Less mature than Playwright MCP. No clear
advantage over @playwright/mcp for PARBAUGHS use cases (visual
verification of static HTML reports).

**Dismissed** because Plan A is sufficient and more proven.

### Option C — Claude Code --remote-control flag

Built-in capability. Founder runs Claude Code with --remote-control;
agent attaches via separate session.

**Pros:** zero install; literally drives Founder's existing browser
context.

**Cons:** Founder must keep an active --remote-control session
during ALL agent work that needs visual verification. This is the
highest ongoing cognitive cost — every ship that needs a browser
check requires Founder to be present.

**Dismissed for routine verification** but kept as Plan C in the
fallback chain for high-fidelity verification of the most critical
surfaces (e.g. App Store submission gates).

## Decision: Plan A = Option A (Playwright MCP)

Plan A: install `@playwright/mcp` via `claude mcp add`.

Rationale:
- Existing MCP infrastructure proves the install pattern works
- channel:chrome bridges most of the agent/user context gap
- Founder cognitive cost: one install command tonight + one smoke
  command tomorrow = ~2 minutes total
- Reversible: `claude mcp remove playwright` if anything goes
  wrong
- No conflicts with the founder-context-capture.mjs Option C
  pattern (PROP-007) — both can coexist, complementary

Plan B (browser-use MCP) reserved if @playwright/mcp install fails
or proves unstable over the next 1-2 weeks of use.

Plan C (Claude Code --remote-control) reserved for critical-path
verification where channel:chrome fidelity proves insufficient.

## Install steps

Single command for Founder (already executed in this ship if
agent-context environment supports it; otherwise Founder runs
tomorrow morning after verifying tonight's scope):

```
claude mcp add playwright -- npx -y @playwright/mcp@latest
```

This:
1. Adds a stdio MCP server entry named "playwright" to Claude
   Code's user-level MCP config
2. The server runs via `npx -y @playwright/mcp@latest` (auto-
   fetches the package on first invocation)
3. Claude Code spawns the server on session start; tools become
   available via the MCP system

## Verification command for Founder (tomorrow)

Single smoke command:

```
claude mcp list
```

Expected output line: `playwright: <command> - ✓ Connected`

This confirms:
- MCP server is registered in Claude Code config
- Server can be spawned without error
- Health-check probe succeeds (handshake works)

It does NOT confirm the server can drive a real browser — that
requires invoking a tool. The deeper smoke is via Claude Code
session:

```
claude --dangerously-skip-permissions
> /mcp
```

Lists available MCP servers + their tool inventory. If
playwright shows tools like `browser_navigate`, `browser_click`,
`browser_screenshot`, the install is functionally complete.

The DEEPEST smoke is invoking a tool against a known URL — but
that requires either Founder to type a prompt or a script that
spawns `claude` with a prompt. Reserved for tomorrow's
verification ship.

## Security scope

PARBAUGHS use case is LOCAL + READ-ONLY:
- `file://` URLs from the repo
- `localhost` URLs from dev server (if any)
- Captured screenshots saved to `.claude/state/` (already in
  `.gitignore` for routine telemetry, but capture dirs are
  committed deliberately as evidence)
- NO authentication tokens passed to the browser-control surface
- NO interactions with PARBAUGHS production (no firebase.com URLs,
  no GitHub Pages URLs except for the read-only static pages)

If team's usage drifts to remote URLs, that's a scope expansion
that needs separate Founder ratification.

## How Founder revokes access

```
claude mcp remove playwright
```

Single command. Removes the server from MCP config. Future Claude
sessions won't load it. No further usage possible without explicit
re-install.

## Out-of-scope tonight (per Founder direction)

- No main-flows iteration using the new capability
- No iteration 11 of main-flows
- No other Phase C / Wave 1 work touching user-facing surfaces
- No declaration that the verification gap is "closed" — that's
  Founder's call after tomorrow's smoke

## Operating status

Install operates immediately tonight. USAGE gated on Founder
fresh-eyes verification tomorrow morning. This proposal codifies
both the install + the gate for the next agent loop.

---

## Archive metadata

```
archived_at: 2026-05-19T03:00:00Z
archived_by: founder-blanket-approval-2026-05-19
obsoleted_by: SHIPPED — @playwright/mcp installed; playwright MCP server in ~/.claude.json; mcp__playwright__* tools available in session. Triage source: .claude/state/task-queue/founder/proposal-triage-2026-05-19.md Batch B row 3.
```

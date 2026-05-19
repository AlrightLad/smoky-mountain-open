# ECC GAP-FILL hooks — activation steps for Founder

**Status:** Founder LOCKED approval 2026-05-19. Activation steps below require Founder execution (slash commands + env vars).

## Approved install list (4 hooks)

1. `pre:mcp-health-check` + `post:mcp-health-check` (paired) — MCP server health probe
2. `post:edit:design-quality-check` — generic-AI-template pattern detector (warn-only)
3. `post:edit:console-warn` — console.log detector on edited files (warn-only)
4. `stop:cost-tracker` — Anthropic cost summation at Stop (async, writes `~/.claude/metrics/costs.jsonl`)

## Disable list (4 + 2 cascading)

- `pre:edit-write:gateguard-fact-force`
- `pre:bash:dispatcher`
- `pre:config-protection`
- `stop:format-typecheck`
- `post:edit:accumulator` (cascading from format-typecheck disable)
- `stop:check-console-log` (cascading — replaced by `post:edit:console-warn`)

## Step-by-step

### 1. Confirm ECC plugin loaded

```
/plugin list
```

Expect to see `everything-claude-code` or `ecc` in the active plugin list. If absent:

```
/plugin enable ecc
```

(Plugin path: `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/`)

### 2. Apply disable env vars

Edit `.claude/settings.local.json` and add to the top-level `env` section (create if missing):

```json
{
  "env": {
    "ECC_DISABLE_GATEGUARD_FACT_FORCE": "1",
    "ECC_DISABLE_BASH_DISPATCHER": "1",
    "ECC_DISABLE_CONFIG_PROTECTION": "1",
    "ECC_DISABLE_FORMAT_TYPECHECK": "1",
    "ECC_DISABLE_EDIT_ACCUMULATOR": "1",
    "ECC_DISABLE_CHECK_CONSOLE_LOG": "1"
  }
}
```

**Note:** Verify env-var names by reading `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/hooks/run-with-flags.js`. ECC honors a runtime profile env (`ECC_HOOK_PROFILE`: minimal/standard/strict) — minimal mode auto-disables most hooks. Per-hook disables are an alternative.

### 3. Restart Claude Code OR run `/reload-plugins`

Settings + plugin changes typically require restart to take effect.

### 4. Compatibility test (in the new session)

#### 4.1 — pre:mcp-health-check

Trigger any MCP tool call (e.g., a Playwright navigation). Expect `pre:mcp-health-check` to fire — visible in stderr or hook logs.

If the MCP server is healthy: pass-through.
If the MCP server is unhealthy: tool call BLOCKED with clear error.

#### 4.2 — post:edit:design-quality-check

Edit a frontend file (`.html`, `.css`, `.jsx`, etc.). Expect a warn-only checklist to stderr if generic patterns detected.

Test fixture: edit `templates/dashboards/test-fixture.html` adding `<div class="grid-cols-3 bg-gradient-to-r text-center">`. Expect warning. Remove fixture after.

#### 4.3 — post:edit:console-warn

Edit a `.js` file and add `console.log("test");`. Expect a stderr warning with line number.

#### 4.4 — stop:cost-tracker

End the session normally. Inspect `~/.claude/metrics/costs.jsonl` for a new row appended with token + cost summation.

### 5. Update coexistence-policy.md

Once all 4 hooks fire as expected, update the "Surface ownership" table in `.claude/state/phase-0/coexistence-policy.md` marking the GAP-FILL hooks as ACTIVE.

### 6. Commit the activation

```
git add .claude/settings.local.json .claude/state/phase-0/coexistence-policy.md
git commit -m "[ecc-compat] activated 4 GAP-FILL hooks + disabled 6 confirmed-conflict hooks per Founder direction"
```

## Founder approval marker

When all 4 hooks fire as expected without blocking PARBAUGHS workflows, append below:

```
FOUNDER-ECC-ACTIVATION-CONFIRMED-{TIMESTAMP}
```

If any hook misbehaves (false-positive blocking, perf regression > 500ms per call, etc.), document in `.claude/state/task-queue/founder/ecc-hook-issue-{name}.md` for triage.

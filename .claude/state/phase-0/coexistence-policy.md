# Phase 0 — coexistence policy — 2026-05-18

## Surface ownership

| Surface | Owner | Rationale |
|---|---|---|
| Security scanning (primary) | **AgentShield via `npx ecc-agentshield scan`** | Founder's P8 directive: AgentShield is primary. npx invocation works without plugin load — robust. |
| Security scanning (supplementary) | trufflehog OR gitleaks pre-commit (Phase F task) | Spec requires supplementary scanner for app-code commits. |
| Methodology — brainstorm/plan/execute | **Superpowers** | Single source of truth for the methodology spine. ECC's plan-orchestrate, multi-plan, prp-plan are specialized variants — not the spine. |
| Methodology — TDD | **Superpowers `test-driven-development`** | ECC's `tdd-workflow` and framework-specific TDD (django-tdd, etc.) are not used because PARBAUGHS doesn't use those frameworks. |
| Methodology — code review | **Superpowers `requesting-code-review` + `receiving-code-review`** | Self-driven review pattern. ECC's `/code-review` slash command and `code-reviewer` agent are alternative entry points; both acceptable but methodology guidance comes from Superpowers. |
| Methodology — systematic debugging | **Superpowers `systematic-debugging`** | ECC's `agent-introspection-debugging` is for meta-debugging the agent itself. |
| Methodology — verification before completion | **Superpowers `verification-before-completion`** | Aligns with PARBAUGHS V1 vision-verify and P9 data truthfulness. |
| Methodology — writing skills | **Superpowers `writing-skills`** | ECC's `skill-comply`, `skill-scout`, `skill-stocktake` are auditing tools, not authoring. |
| Methodology — git worktrees | **Superpowers `using-git-worktrees`** | n/a in ECC. |
| Methodology — parallel agents | **Superpowers `dispatching-parallel-agents`** | Pattern-driven, not tool-driven. |
| Browser control (low-level CDP) | **superpowers-chrome `browsing` skill** | When plugin activates; primary mechanism per spec V2. |
| Browser control (high-level Playwright) | **Playwright MCP (already loaded)** | Authorized in V2. Covers the same use case from a different angle. |
| Token / cost tracking | **PARBAUGHS Phase T deliverable** | Founder-spec'd; takes patterns from ECC's `ecc_dashboard.py` per spec line 326. |
| Pre-commit hooks | **PARBAUGHS .claude/hooks/** | Existing PARBAUGHS hooks (pre-commit-lint, pre-commit-version-sync, gate-protected, gate-assertions, skill-approval-gate, etc.) are PARBAUGHS-specific and take precedence on conflicts. |
| Continuous-learning observers | **ECC hooks — opt-in via env var only** | ECC's observe-runner, governance-capture, ecc-metrics-bridge, ecc-context-monitor write telemetry. PARBAUGHS already has its own telemetry pipeline (`.claude/state/telemetry/`). Will leave ECC observers in default-off state until shown to add unique value. |
| Format + typecheck on Stop | **PARBAUGHS hooks** | ECC's `stop:format-typecheck` runs Biome+tsc on every JS/TS edit; PARBAUGHS uses ESLint via pre-commit-lint. PARBAUGHS hook is fast (no project tsc setup); ECC's would add 300s timeout on every Stop. Disable ECC's. |
| Gateguard fact-force (blocks first Edit per file) | **DISABLE in ECC** | This hook (`pre:edit-write:gateguard-fact-force`) is incompatible with PARBAUGHS's rapid-iteration workflow. The agent already does investigation before editing per PARBAUGHS guidance; the hard block adds friction without value here. |
| Bash dispatcher (preflight on every Bash) | **DISABLE in ECC** | Overlaps PARBAUGHS's pre-commit-lint.sh + push-protection.sh + governance-protection.sh. Stacking the dispatchers creates duplicate work and conflicting verdicts. |
| Config protection (blocks lint/format config edits) | **DISABLE in ECC** | PARBAUGHS edits its own .claude/settings.local.json frequently; ECC's blanket block prevents normal config tuning. |
| Session start | **Both fire — investigate at next session** | Superpowers' SessionStart loads context. ECC's loads previous context and detects package manager. Should be additive; verify no race condition. |

## 2026-05-19 update — Founder LOCKED 4 GAP-FILL hooks for install

Per Founder decision 2026-05-19 (responding to `task-queue/founder/hook-comparison-decision.md`):

### APPROVED for install (alongside PARBAUGHS hooks 1-5, no replacement):

1. **`pre:mcp-health-check`** + **`post:mcp-health-check`** (paired)
   - Path: `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/hooks/mcp-health-check.js`
   - Probes MCP server reachability; prevents calls to dead MCPs
   - Cached 2-min TTL; ~100ms first call, near-zero subsequent

2. **`post:edit:design-quality-check`**
   - Path: `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/hooks/design-quality-check.js`
   - Pattern-matches frontend files for generic-AI-template signals
   - Warn-only; aligns with P7 ≥9.5 quality bar (early feedback)

3. **`post:edit:console-warn`**
   - Path: `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/hooks/post-edit-console-warn.js`
   - Warns on console.log in edited .js/.jsx/.ts/.tsx files
   - Warn-only; supplements PARBAUGHS pre-commit lint gate

4. **`stop:cost-tracker`**
   - Path: `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/hooks/cost-tracker.js`
   - Async cost summation at Stop; writes `~/.claude/metrics/costs.jsonl`
   - Cross-project signal; PARBAUGHS Phase T owns dashboard surface

### DISABLE (CONFLICT with PARBAUGHS workflow):

- `pre:edit-write:gateguard-fact-force` — blocks first edit per file
- `pre:bash:dispatcher` — overlaps PARBAUGHS pre-commit-lint + push-protection + governance-protection
- `pre:config-protection` — PARBAUGHS edits settings.local.json frequently
- `stop:format-typecheck` — 300s timeout vs PARBAUGHS fast ESLint

### Secondary disables (cascading from above):

- `post:edit:accumulator` — orphaned without `stop:format-typecheck`
- `stop:check-console-log` — redundant with `post:edit:console-warn` (5.3 enabled)

## Activation steps for Founder

ECC plugin hooks fire from the plugin's own `hooks.json` when the plugin is loaded. Since PARBAUGHS substrate may not currently have ECC fully loaded (session 1 install staged but plugin activation pending), Founder should:

1. Run `/plugin list` to confirm ECC is in the active list. If not present:
2. Run `/plugin enable ecc` (or restart Claude Code session). At session start, ECC's hooks.json will register all 28 hooks.
3. **Disable the 6 confirmed-disable hooks via env vars in `.claude/settings.local.json` `env` section:**
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
   (Confirm env-var names match ECC's actual disable mechanism by reading `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/hooks/run-with-flags.js`.)

4. Compatibility test:
   - Run any tool that touches an MCP server (e.g., a Playwright call) → expect `pre:mcp-health-check` to fire
   - Edit a frontend `.css` or `.html` file → expect `post:edit:design-quality-check` to fire if pattern matches
   - Edit a `.js` with `console.log` → expect `post:edit:console-warn` to fire
   - End a session (or natural Stop) → expect `stop:cost-tracker` to write to `~/.claude/metrics/costs.jsonl`

5. Update this file's "Surface ownership" table below with the now-active GAP-FILL hooks.

## ACTIVATED 2026-05-19 — 4 GAP-FILL hooks live, 6 ECC hooks disabled

Per Founder blanket-approval `task-queue/founder/ecc-gap-fill-activation-steps.md` (LOCKED 2026-05-19) and Engineer execution.

### Hooks wired directly in `.claude/settings.local.json`

The 4 GAP-FILL hooks are wired as direct `command` entries so they fire regardless of ECC plugin load state:

| Event | Matcher | Hook | Script path |
|---|---|---|---|
| `PreToolUse` | `mcp__.*` | `pre:mcp-health-check` | `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/hooks/mcp-health-check.js` |
| `PostToolUse` | `Edit\|Write\|MultiEdit` | `post:edit:design-quality-check` | `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/hooks/design-quality-check.js` |
| `PostToolUse` | `Edit\|Write\|MultiEdit` | `post:edit:console-warn` | `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/hooks/post-edit-console-warn.js` |
| `PostToolUseFailure` | `mcp__.*` | `post:mcp-health-check` | `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/hooks/mcp-health-check.js` |
| `Stop` | (all) | `stop:cost-tracker` | `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/hooks/cost-tracker.js` |

### Env vars set to disable conflicting ECC hooks

The activation packet drafted per-hook env var names (`ECC_DISABLE_GATEGUARD_FACT_FORCE`, etc.); ECC actually honors a **single CSV env var `ECC_DISABLED_HOOKS`** (verified by reading `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/lib/hook-flags.js`). The drafted env var names would have been no-ops. Corrected env vars in `.claude/settings.local.json` `env` block:

```json
{
  "ECC_HOOK_PROFILE": "minimal",
  "ECC_DISABLED_HOOKS": "pre:edit-write:gateguard-fact-force,pre:bash:dispatcher,pre:config-protection,stop:format-typecheck,post:edit:accumulator,stop:check-console-log"
}
```

`ECC_HOOK_PROFILE=minimal` additionally constrains ECC plugin-registered hooks to only fire those tagged with `minimal` (covers `post:ecc-metrics-bridge`, `stop:session-end`, `stop:evaluate-session`, `session:end:marker`, `stop:cost-tracker`).

### Smoke test results (2026-05-19, simulated stdin)

| Hook | Result | Evidence |
|---|---|---|
| `pre:mcp-health-check` | Pass — no false block | stderr: `[MCPHealthCheck] No MCP config found for claude_ai_Fireflies; skipping preflight probe`; exit 0 |
| `post:edit:design-quality-check` | Pass — detects 6 generic patterns | stderr: lists all 6 heuristic signals on a Tailwind-ish HTML fixture; exit 0 |
| `post:edit:console-warn` | Pass — detects 2 console.log lines | stderr: `[Hook] WARNING: console.log found in ...` with line numbers; exit 0 |
| `stop:cost-tracker` | Pass — writes `~/.claude/metrics/costs.jsonl` | First row appended (zero tokens — synthetic empty transcript path); production payload will include real tokens |

Note: actual hook firing via Claude Code's hooks.PostToolUse will only take effect after a Claude Code session restart (settings.local.json hook registration). Direct script invocation in the activation session confirmed the scripts are functional and won't introduce blocks.

### PARBAUGHS guarantees still intact

- All 5 PARBAUGHS hooks 1-5 (`pre-commit-lint`, `post-edit-syntax`, `gate-assertions`, `gate-protected`, `pre-commit-version-sync`) continue to fire from `.claude/settings.json` `hooks` block (unchanged this activation).
- AMD-018 11-gate intact; nothing was added that touches the gated surfaces.
- ECC `pre:bash:dispatcher`, `pre:config-protection`, `pre:edit-write:gateguard-fact-force` all in `ECC_DISABLED_HOOKS` and cannot block PARBAUGHS Bash + Edit flows.

### Founder follow-up

- If ECC plugin is not yet enabled in this Claude Code session (verify with `/plugin list`), the env-based disable list takes effect once ECC's hooks.json starts firing. The 4 direct-wired GAP-FILL hooks are independent of ECC plugin enablement — they fire from settings.local.json hooks block on next session restart.
- Recommend `/plugin enable ecc@ecc` if plugin not active (or restart Claude Code), then re-verify with `/plugin list`.

## Concrete coexistence actions (legacy — superseded by 2026-05-19 activation above)

These were the actions defined pre-activation:

1. Verify ECC hooks fire by triggering a test edit; check for any errors or unexpected blocks. **Done — see smoke test results above.**
2. If `pre:edit-write:gateguard-fact-force` fires on first edit, disable. **Done via `ECC_DISABLED_HOOKS` env var.**
3. If `pre:bash:dispatcher` overlaps with PARBAUGHS pre-commit work, disable. **Done via `ECC_DISABLED_HOOKS` env var.**
4. If `stop:format-typecheck` adds unwanted latency, disable. **Done via `ECC_DISABLED_HOOKS` env var.**

## When to surface to Founder per spec STOP RULE 2

If after applying these coexistence actions, ECC hooks still:
- Cause incorrect blocks on edits the agent is authorized to make
- Generate consistent false-positive verdicts that block valid work
- Conflict with PARBAUGHS commit/push gates in a way that breaks the AMD-018 11-gate

Then surface to Founder per spec STOP RULE 2: "5+ documented attempts on single sub-issue without progress → surface, continue other phases." Founder picks: Superpowers-only / ECC-only-via-npx / different config.

## What stays untouched (PARBAUGHS guarantees)

These are owned by PARBAUGHS substrate, not displaced by Superpowers or ECC:

- **AMD-018** — 11-gate push exception list (Cloud Functions, Firestore rules, auth providers, payment economy, IT Glue, secrets).
- **AMD-022** — inter-agent task queue infrastructure (.claude/state/task-queue/).
- **AMD-023** — approval pipeline reliability (downloads-watcher).
- **AMD-024** — architecture / AI Engineer agent role definition.
- **Test accounts**: smoke@parbaughs.test in smoke-test-league.
- **Caddy Notes discipline**: member-visible release notes.
- **Repo scripts**: templates/dashboards/, scaffold-from-templates.sh, verify-approval-pipeline.sh, regen-*.py.
- **PARBAUGHS skills with `parbaughs-` prefix** — domain-specific to the golf league platform; no plugin can replace these.

## Open questions to validate at next session activation

1. Does `/reload-plugins` (vs. restart) pick up manually-staged plugins?
2. Does ECC's installed-via-manual-edit path register hooks correctly?
3. Does ECC's `CLAUDE_PLUGIN_ROOT` discovery resolve to the manually-staged path (`~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/`)? The hooks.json scripts have fallback discovery logic that should cover this — investigate at first activation.

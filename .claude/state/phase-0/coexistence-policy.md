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

## Concrete coexistence actions

These actions are to be applied when ECC plugin first activates (next session start or `/reload-plugins`):

1. Verify ECC hooks fire by triggering a test edit; check for any errors or unexpected blocks.
2. If `pre:edit-write:gateguard-fact-force` fires on first edit, disable by adding to `.claude/settings.local.json`:
   ```json
   "hooks": {
     "PreToolUse": [
       {
         "matcher": "Edit|Write|MultiEdit",
         "hooks": [
           { "type": "command", "command": "echo SKIP_GATEGUARD_FACT_FORCE && exit 0" }
         ]
       }
     ]
   }
   ```
   (Or use ECC's documented disable env var if one exists — investigate at activation.)
3. If `pre:bash:dispatcher` overlaps with PARBAUGHS pre-commit work, the agent will accept ECC's dispatcher output as additive context but rely on PARBAUGHS hooks for actual decisions.
4. If `stop:format-typecheck` adds unwanted latency, disable similarly or via ECC's runtime flag if available.

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

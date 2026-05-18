# Phase 0.4 — collision report — 2026-05-18

Enumerated agent/skill/command/hook namespaces across:
- Superpowers (claude-plugins-official, v5.1.0) — active this session
- superpowers-chrome (obra/superpowers-marketplace, v2.1.0) — staged, awaiting /reload-plugins
- ECC (affaan-m/everything-claude-code, v2.0.0-rc.1) — staged, awaiting /reload-plugins
- PARBAUGHS substrate (.claude/skills/, .claude/hooks/)
- User-level (~/.claude/skills/)

## Skills

| Plugin / source | Count | Naming convention |
|---|---|---|
| Superpowers | 14 | bare names (brainstorming, executing-plans, …) |
| superpowers-chrome | 1 | bare name (browsing) |
| ECC | 232 | mixed (some bare names like `tdd-workflow`, some prefixed `springboot-tdd`) |
| PARBAUGHS .claude/skills/ | 29 (incl. .APPROVAL.md) | `parbaughs-*` prefix mostly; `continuation-discipline` bare |
| User ~/.claude/skills/ | 7 | mixed (canvas-design, dream, frontend-design, theme-factory, webapp-testing, anthropic-skills-checkout, continuation-discipline) |

**Hard collisions (same exact name):**

1. **`continuation-discipline`** — exists in:
   - `.claude/skills/continuation-discipline/SKILL.md`
   - `~/.claude/skills/continuation-discipline/SKILL.md`
   - Pre-existing collision before Phase 0. PARBAUGHS substrate added it; user-level shows it for the `dream` Stop hook. Both are PARBAUGHS-authored variants. No Superpowers or ECC conflict here.
   - Resolution: keep both (user-level is the Stop-hook-checked version; project-level is the documentation). No action needed.

**Soft overlaps (semantic conflict, not name conflict):**

| Domain | Superpowers offering | ECC offering | Resolution |
|---|---|---|---|
| Brainstorming / requirements | `brainstorming` | (no direct match) | Use Superpowers |
| Plan writing | `writing-plans` | `plan-orchestrate`, `multi-plan`, `prp-plan` | Use Superpowers' `writing-plans` (methodology-anchored); ECC's plan variants are for specialized workflows |
| Plan execution | `executing-plans` | `multi-execute` | Use Superpowers' `executing-plans` |
| TDD | `test-driven-development` | `tdd-workflow`, `django-tdd`, `laravel-tdd`, `springboot-tdd`, `quarkus-tdd` | Superpowers' `test-driven-development` for general TDD; ECC's framework-specific TDD for app code (PARBAUGHS doesn't use those frameworks) |
| Code review | `requesting-code-review` / `receiving-code-review` | `code-review` (command), `code-reviewer` agent, `flutter-dart-code-review`, `plankton-code-quality`, `security-review` | Superpowers for self-driven code review; ECC's `security-review` skill is supplementary to AgentShield |
| Debugging | `systematic-debugging` | `agent-introspection-debugging` | Superpowers for systematic bugs; ECC for agent-meta-debugging |
| Verification | `verification-before-completion` | (no direct match) | Use Superpowers |
| Skills development | `writing-skills` | `skill-comply`, `skill-scout`, `skill-stocktake` | Superpowers for authoring; ECC's skill-* for compliance auditing |
| Git worktrees | `using-git-worktrees` | (no direct match) | Use Superpowers |
| Parallel agents | `dispatching-parallel-agents` | (covered by general subagent pattern) | Use Superpowers |
| Branch finishing | `finishing-a-development-branch` | (no direct match) | Use Superpowers |
| Code review (receiving) | `receiving-code-review` | (no direct match) | Use Superpowers |
| Browser control | (none — chrome plugin provides) | `browser-qa` | Superpowers-chrome for low-level CDP control; Playwright MCP (V2-authorized) for high-level page automation |

## Agents

| Plugin / source | Count | Notable |
|---|---|---|
| Superpowers | 0 (no agents/ dir) | Skills-only |
| superpowers-chrome | 1 (`browser-user`) | CDP browser control |
| ECC | 60+ | Heavy specialization (a11y-architect, architect, code-architect, code-explorer, code-reviewer, code-simplifier, e2e-runner, gan-evaluator/generator/planner, etc.) |
| PARBAUGHS .claude/agents/ | 0 (no dir) | n/a |

**No hard agent name collisions.** ECC's `code-reviewer` is a new addition since PARBAUGHS has no agents directory. ECC agents become available via Agent tool subagent_type once plugin loads.

## Slash commands

| Plugin / source | Count | Notable |
|---|---|---|
| Superpowers | 0 (no commands/ dir) | Triggers skills via Skill tool |
| ECC | 75 | `/code-review`, `/security-scan`, `/cost-report`, `/plan`, `/plan-prd`, `/feature-dev`, etc. |
| PARBAUGHS .claude/commands/ | 0 (no dir) | n/a |

**Risk:** ECC's `/plan` could conflict with Superpowers' `writing-plans` skill (Superpowers documented its own `/plan`-equivalent via Skill, but `/plan` as a literal slash command goes to ECC).

**Resolution:** when Founder types `/plan`, that's ECC's command. When agent needs to author a plan, agent invokes Skill tool with `superpowers:writing-plans`. Different surfaces.

## Hooks (highest-risk area)

| Source | Hooks file | Hooks count | Severity |
|---|---|---|---|
| Superpowers | `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/hooks/hooks.json` | 1 (SessionStart only) | Lightweight |
| ECC | `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/hooks/hooks.json` | 30+ across PreToolUse, PreCompact, SessionStart, PostToolUse, PostToolUseFailure, Stop, SessionEnd | Heavy / invasive |
| PARBAUGHS .claude/hooks/ | 11 shell scripts | 11 (gate-assertions, gate-protected, governance-protection, post-edit-syntax, pre-commit-lint, pre-commit-version-sync, push-protection, schema-mutation-alarm, secrets-scanner, skill-approval-gate) | Surgical / PARBAUGHS-specific |

**Specific concerns when ECC plugin activates:**

1. **ECC `pre:edit-write:gateguard-fact-force`** — blocks first Edit/Write/MultiEdit per file and demands investigation (importers, data schemas, user instruction). This will obstruct PARBAUGHS rapid-iteration workflow.
2. **ECC `pre:bash:dispatcher`** — runs preflight quality/tmux/push/GateGuard on every Bash call. Overlaps with PARBAUGHS `pre-commit-lint.sh` + `gate-assertions.sh`.
3. **ECC `pre:config-protection`** — blocks lint/format config edits. Could conflict with PARBAUGHS settings.local.json edits during normal config tuning.
4. **ECC `stop:format-typecheck`** (timeout 300s) — runs Biome/Prettier + tsc on every JS/TS file edited per response. PARBAUGHS uses ESLint via `pre-commit-lint.sh`, not Biome.
5. **ECC observers (continuous learning, governance-capture, session-activity-tracker, ecc-metrics-bridge, ecc-context-monitor, cost-tracker)** — write to `.claude/state/` paths. Could overlap with PARBAUGHS telemetry or, worse, write to the same files.

## Compatibility verdict tree (per spec line 94-100)

- **GREEN:** would require zero collisions. ❌ Not met — `continuation-discipline` overlap exists, plus the structural hook concerns.
- **RED:** would require irreconcilable conflict (hooks duplicate-fire blocking work, wrong skill triggers consistently, startup errors). ❌ Not yet observed — ECC isn't active this session yet.
- **YELLOW:** minor collisions, agent resolves with documented preference order. ✅ This is the correct verdict.

## Verdict: YELLOW

See `.claude/state/phase-0/compatibility-verdict.md` and `.claude/state/phase-0/coexistence-policy.md`.

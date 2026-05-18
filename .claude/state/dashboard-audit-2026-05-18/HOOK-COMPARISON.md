# ECC vs PARBAUGHS — Hook head-to-head comparison
**Date:** 2026-05-18
**Session:** 2 (Dashboard completion /goal, Phase B parallel ship)
**Author:** Claude Code (Engineer/QA)
**Founder decision locked:** "ECC vs PARBAUGHS hooks: HEAD-TO-HEAD COMPARISON ship — run IN PARALLEL with Phase B. PARBAUGHS hooks 1-5 stay binding throughout. No replacement."

---

## 1. Executive summary

| Bucket | PARBAUGHS | ECC | Notes |
|---|---|---|---|
| **PreToolUse hooks** | 3 (lint gate, syntax check, gate-assertions) + 5 extended (gate-protected, version-sync, schema-mutation, governance, skill-approval, secrets) | 8 | ECC adds Bash dispatcher, doc-file-warning, suggest-compact, observe-runner, governance-capture, config-protection, mcp-health-check, gateguard-fact-force |
| **PostToolUse hooks** | 1 (post-edit-syntax) + 1 (secrets-scanner secondary fire) | 9 | ECC adds bash dispatcher post, quality-gate, design-quality-check, post-edit-accumulator, post-edit-console-warn, governance-capture, session-activity-tracker, observe-runner, ecc-metrics-bridge, ecc-context-monitor |
| **PostToolUseFailure** | 0 | 1 (mcp-health-check failure path) | ECC unique surface |
| **PreCompact** | 0 | 1 (pre-compact state save) | ECC unique surface |
| **SessionStart** | 0 (Superpowers handles) | 1 | Coexists, additive |
| **Stop** | 0 (Husky pre-commit + Claude hooks handle gate) | 6 | ECC adds format-typecheck, check-console-log, session-end, evaluate-session, cost-tracker, desktop-notify |
| **SessionEnd** | 0 | 1 | ECC marker only |
| **Git-layer (Husky)** | 1 (`.husky/pre-commit` running lint-staged + version-sync) | 0 | PARBAUGHS-only safety belt |
| **TOTAL** | **11** | **28** | |

PARBAUGHS hooks 1-5 (in the project CLAUDE.md numbering) are: pre-commit-lint, post-edit-syntax, gate-assertions, gate-protected, pre-commit-version-sync. Hooks 6-11 in the actual `.claude/hooks/` directory extend the substrate (secrets-scanner, schema-mutation-alarm, governance-protection, skill-approval-gate, push-protection).

---

## 2. PARBAUGHS hook inventory (11 hooks)

| # | Hook (file) | Event | Matcher / Trigger | What it does | What it protects | Overhead | Failure mode |
|---|---|---|---|---|---|---|---|
| 1 | `pre-commit-lint.sh` | PreToolUse: Bash | Any `git commit` in command | Runs `npm run lint`; blocks commit on non-zero exit | ESLint quality gate | ~2-5s per commit | Exit 2 → blocks commit |
| 2 | `post-edit-syntax.sh` | PostToolUse: Edit/Write/MultiEdit | `*.js` under src/, tests/, scripts/ | Acorn (ecmaVersion 2022) parse; warns on stderr | Catches syntax errors immediately after edit | <100ms | Exit 0 (warn-only stderr) — intentional; exit 2 disrupts session post-edit |
| 3 | `gate-assertions.sh` | PreToolUse: Edit/Write | `tests/e2e/helpers/assertions.js` (HARDCODED) | Blocks all edits to this file unconditionally | Prevents IGNORE_PATTERNS regression (v7.8.0 mask-bug repeat) | <50ms | Exit 2 → blocks; Founder handshake required |
| 4 | `gate-protected.sh` | PreToolUse: Edit/Write | `.env*`, `scripts/.service-account.json`, `firestore.rules`, `payments/`, `auth/`, `scripts/create-smoke-account.js` | Blocks edits to secrets, rules, payment/auth code | AMD-018 gates 1-6; secrets handling | <50ms | Exit 2 → blocks until Founder approves |
| 5 | `pre-commit-version-sync.sh` | PreToolUse: Bash | Any `git commit` | Verifies APP_VERSION in `src/core/utils.js` matches `package.json` `version` | Version drift between bundled JS + package metadata | <100ms | Exit 2 → blocks commit on mismatch |
| 6 | `secrets-scanner.sh` | PostToolUse: Edit/Write | Any file write | Pattern-matches credentials / API keys / PII | P8 secrets prevention (warn-on-suspicion) | <200ms | Warn-only (stderr) — true-positive in docs needs acknowledgment |
| 7 | `schema-mutation-alarm.sh` | PostToolUse: Edit/Write | `*.js` in `src/` | Detects non-additive Firestore field operations | Criterion 12 cross-surface data integrity | <100ms | Warn-only — Engineer + Critic do real audit |
| 8 | `governance-protection.sh` | PreToolUse: Edit/Write | `docs/agents/*` | Blocks writes unless `CLAUDE_PARBAUGHS_GOVERNANCE_EDIT=1` | Governance docs protected from drift | <50ms | Exit 2 → blocks; bypass via env var |
| 9 | `skill-approval-gate.sh` | PreToolUse: Edit/Write | `.claude/skills/*.md` | Requires sibling `<name>.APPROVAL.md` token | New skill installation requires Founder approval | <100ms | Exit 2 → blocks unless token exists |
| 10 | `push-protection.sh` | PreToolUse: Bash | Any `git push` | Reads `.claude/state/last-verify.json`; blocks on red smoke/lint/visual within 24h | AMD-018 gate 8 (force-push) + verify-before-ship | <100ms | Exit 2 → blocks on red verify state |
| 11 | `.husky/pre-commit` (git layer) | Git pre-commit hook | `git commit` (any path) | Runs lint-staged + version-sync via Husky | Belt-and-suspenders behind hooks 1+5 | ~2-5s | Non-zero → blocks; bypass via `--no-verify` (Husky only; Claude Code hooks still fire) |

**Note:** Hook IDs in PARBAUGHS CLAUDE.md (1-5) match the numbered comments in hook headers (Hook 1, Hook 2, etc.). Hooks 6-11 are the extended set added in later phases (Phase 1 critical-path-blocker extensions, governance phase, push-protection ship).

---

## 3. ECC hook inventory (28 hooks)

Source: `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/hooks/hooks.json`
All hooks resolve script paths via `plugin-hook-bootstrap.js` and run through `run-with-flags.js` honoring `ECC_HOOK_PROFILE` env (minimal / standard / strict).

### 3.1 PreToolUse (8)

| # | ID | Matcher | What it does | What it protects | Overhead | Failure mode |
|---|---|---|---|---|---|---|
| 1 | `pre:bash:dispatcher` | Bash | Consolidated preflight: quality, tmux, push, GateGuard checks via `pre-bash-dispatcher.js` | Pre-bash workflow guards | ~50-200ms | Exit 2 → blocks Bash |
| 2 | `pre:write:doc-file-warning` | Write | Warns about ad-hoc `NOTES/TODO/SCRATCH/TEMP/DRAFT/BRAINSTORM/SPIKE/DEBUG/WIP.md` outside `docs/`, `.claude/`, `.github/` | Stops doc clutter from impulse files | <50ms | Exit 0 (warn-only) |
| 3 | `pre:edit-write:suggest-compact` | Edit\|Write | Suggests manual context compaction at logical intervals | Strategic compaction over auto-compact | <50ms | Exit 0 (suggestion-only) |
| 4 | `pre:observe:continuous-learning` | * | Records tool intent to telemetry for continuous learning | Continuous-learning signals | <10ms async | Async, never blocks |
| 5 | `pre:governance-capture` | Bash\|Write\|Edit\|MultiEdit | Captures governance events (secrets, policy violations, approval requests) — opt-in via `ECC_GOVERNANCE_CAPTURE=1` | Audit trail for compliance | <50ms (off by default) | Exit 0 unless env set |
| 6 | `pre:config-protection` | Write\|Edit\|MultiEdit | Blocks modifications to .eslintrc, .prettierrc, biome.json, tsconfig.json, etc. | Steers agent to fix code, not weaken configs | <30ms | Exit 2 → blocks |
| 7 | `pre:mcp-health-check` | * | Probes MCP server reachability before MCP tool execution | Prevents calls to dead MCP servers | <100ms (cached 2min TTL) | Exit 2 if server unhealthy |
| 8 | `pre:edit-write:gateguard-fact-force` | Edit\|Write\|MultiEdit | Blocks first Edit/Write/MultiEdit per file; demands importers + data schemas + user instruction quote | Forces investigation before mutation | ~50ms | Exit 2 → blocks first edit |

### 3.2 PreCompact (1)

| # | ID | Matcher | What it does |
|---|---|---|---|
| 9 | `pre:compact` | * | Saves session state to disk before compaction; survives context loss |

### 3.3 SessionStart (1)

| # | ID | Matcher | What it does |
|---|---|---|---|
| 10 | `session:start` | * | Loads bounded prior context, detects package manager on new session |

### 3.4 PostToolUse (9)

| # | ID | Matcher | What it does | Overhead |
|---|---|---|---|---|
| 11 | `post:bash:dispatcher` | Bash | Postflight: logging, PR detection, build notifications | <100ms async |
| 12 | `post:quality-gate` | Edit\|Write\|MultiEdit | Runs Biome/Prettier on edited files (skipped for JS/TS when Biome owns format) | 200ms-2s async |
| 13 | `post:edit:design-quality-check` | Edit\|Write\|MultiEdit | Pattern-matches frontend files for generic AI-template signals ("Get Started", `grid-cols-3`, `bg-gradient-to-*`, `font-sans`, `text-center`) | <100ms |
| 14 | `post:edit:accumulator` | Edit\|Write\|MultiEdit | Records edited JS/TS file paths for batch format+typecheck at Stop | <20ms |
| 15 | `post:edit:console-warn` | Edit | Scans edited .js/.jsx/.ts/.tsx for `console.log`; warns with line numbers | <100ms |
| 16 | `post:governance-capture` | Bash\|Write\|Edit\|MultiEdit | Captures governance events from tool outputs (opt-in via env var) | Off by default |
| 17 | `post:session-activity-tracker` | * | Records per-session tool calls + file activity for ECC2 metrics | <50ms |
| 18 | `post:observe:continuous-learning` | * | Records tool results for continuous learning | <10ms async |
| 19 | `post:ecc-metrics-bridge` | * | Maintains running session metrics aggregate for statusline + context monitor | <50ms |
| 20 | `post:ecc-context-monitor` | * | Injects agent warnings on context exhaustion, high cost, scope creep, tool loops | <100ms |

(Count note: PostToolUse row 11-20 = 10 entries in hooks.json; counted as 9 distinct hooks treating dispatcher entries as one stream. PrototypeBased actual entries = 10; the executive summary table reads "9" because `post:governance-capture` is off by default. Strict count: 10 PostToolUse entries.)

### 3.5 PostToolUseFailure (1)

| # | ID | Matcher | What it does |
|---|---|---|---|
| 21 | `post:mcp-health-check` (failure path) | * | Tracks failed MCP calls, marks server unhealthy, attempts reconnect, re-probes |

### 3.6 Stop (6)

| # | ID | Matcher | What it does | Timeout |
|---|---|---|---|---|
| 22 | `stop:format-typecheck` | * | Batch formats + typechecks all JS/TS edited this response via the accumulator | 300s |
| 23 | `stop:check-console-log` | * | Scans modified files for `console.log` | 30s |
| 24 | `stop:session-end` | * | Persists session state after each response | 30s async |
| 25 | `stop:evaluate-session` | * | Evaluates session for extractable patterns | 30s async |
| 26 | `stop:cost-tracker` | * | Reads transcript JSONL, sums token usage, appends to `~/.claude/metrics/costs.jsonl` | 30s async |
| 27 | `stop:desktop-notify` | * | Sends desktop notification with task summary (macOS/WSL only) | 30s async |

### 3.7 SessionEnd (1)

| # | ID | Matcher | What it does |
|---|---|---|---|
| 28 | `session:end:marker` | * | Session end lifecycle marker (non-blocking) |

**Confirmed count: 28 ECC hooks** (8 PreToolUse + 1 PreCompact + 1 SessionStart + 10 PostToolUse + 1 PostToolUseFailure + 6 Stop + 1 SessionEnd).
**Disagreement with prior agent count of 9 PostToolUse:** I count 10 PostToolUse entries (post:bash:dispatcher, post:quality-gate, post:edit:design-quality-check, post:edit:accumulator, post:edit:console-warn, post:governance-capture, post:session-activity-tracker, post:observe:continuous-learning, post:ecc-metrics-bridge, post:ecc-context-monitor). Total 28 still holds because PostToolUseFailure was counted separately by prior agent. Net effect on recommendations: zero.

---

## 4. Coexistence categorization

| ECC Hook | Verdict | Reasoning |
|---|---|---|
| `pre:bash:dispatcher` | **OVERLAP — DISABLE** | Duplicates pre-commit-lint, version-sync, push-protection. Stacking creates duplicate work and conflicting verdicts (coexistence-policy line 24). |
| `pre:write:doc-file-warning` | **IRRELEVANT** | PARBAUGHS doesn't suffer from ad-hoc doc spam; all docs go under `docs/` or `.claude/state/`. Leaving on costs nothing but adds no value. Default = on, harmless. |
| `pre:edit-write:suggest-compact` | **IRRELEVANT** | Compaction is Founder-controlled via `/compact`. Suggestion is noise. Default = on, harmless. |
| `pre:observe:continuous-learning` | **OPT-IN ONLY** | PARBAUGHS has its own telemetry pipeline (`.claude/state/telemetry/`). Per coexistence-policy line 21: leave off by default until shown unique. |
| `pre:governance-capture` | **OPT-IN ONLY** | Off by default (`ECC_GOVERNANCE_CAPTURE=1`); no conflict. |
| `pre:config-protection` | **CONFLICT — DISABLE** | Blocks edits to `.eslintrc`, `.prettierrc`, `tsconfig.json`. PARBAUGHS edits `.claude/settings.local.json` frequently for hook bypass and Vite config when needed. Coexistence-policy line 25 explicit disable. |
| `pre:mcp-health-check` | **GAP-FILL — RECOMMEND** | PARBAUGHS has no MCP health probe. With Playwright MCP + Bookstack + Fireflies + Microsoft 365 in use, a 401/403/429 from any of them blocks the agent silently. This catches it. |
| `pre:edit-write:gateguard-fact-force` | **CONFLICT — DISABLE** | Blocks first Edit per file demanding manual investigation quote. Coexistence-policy line 23 explicit: incompatible with PARBAUGHS rapid-iteration; agent already investigates per substrate guidance. |
| `pre:compact` | **OVERLAP — leave on** | PARBAUGHS has no PreCompact equivalent. State save before compaction is value-add and non-blocking. |
| `session:start` (ECC) | **OVERLAP — leave on additive** | Superpowers also fires SessionStart. Coexistence-policy line 26: both fire, investigate. Should be additive. |
| `post:bash:dispatcher` | **OVERLAP — leave on async** | Async + non-blocking; just logs PR/build state. Doesn't conflict with PARBAUGHS bash gates which fire pre-, not post-. |
| `post:quality-gate` | **OVERLAP — DISABLE on JS/TS** | Runs Biome/Prettier; PARBAUGHS uses ESLint via pre-commit-lint. ECC's hook is no-op on JS/TS without Biome detected, but if Biome ever lands it'll double-format. Verdict: leave on default (no-op path active) but explicitly disable Biome on JS/TS in coexistence config. |
| `post:edit:design-quality-check` | **GAP-FILL — RECOMMEND** | PARBAUGHS spec line 326 mentions "industry-leader-comparable design (Linear/Vercel/Stripe)". Generic-template-drift catcher is a free win toward P7 ≥9.5/10 design score. |
| `post:edit:accumulator` | **DEPENDENCY of stop:format-typecheck** | Records files; harmless on its own. If we disable `stop:format-typecheck`, the accumulator becomes orphaned write traffic — DISABLE both together. |
| `post:edit:console-warn` | **GAP-FILL — RECOMMEND** | PARBAUGHS has no console.log scanner. Per CLAUDE.md code-review checklist: "No console.log or debug statements." This warns inline at edit time. |
| `post:governance-capture` | **OPT-IN ONLY** | Off by default; no conflict. |
| `post:session-activity-tracker` | **OVERLAP — DISABLE** | Writes ECC2 metrics. PARBAUGHS has `.claude/state/telemetry/`. Double-write. Leave off. |
| `post:observe:continuous-learning` | **OPT-IN ONLY** | Off by default. |
| `post:ecc-metrics-bridge` | **OVERLAP — DISABLE** | Statusline aggregate. PARBAUGHS does its own token meter via `scripts/regen-*.py`. |
| `post:ecc-context-monitor` | **OVERLAP — leave on as observation** | Injects warnings on context exhaustion, high cost, tool loops. Useful as third-eye next to PARBAUGHS dashboards. Non-blocking. Leave on. |
| `post:mcp-health-check` (failure) | **GAP-FILL — RECOMMEND (paired with PreToolUse)** | Failure path is integral to the MCP health-check recommendation. Without it, the unhealthy-server cache never updates. |
| `stop:format-typecheck` | **CONFLICT — DISABLE** | Runs Biome+tsc on every JS/TS edit at Stop. PARBAUGHS uses ESLint (faster, no tsc setup). 300s timeout per Stop is unacceptable overhead. Coexistence-policy line 22 explicit disable. |
| `stop:check-console-log` | **OVERLAP with post:edit:console-warn — DISABLE** | If we accept the post-edit console-warn (cheaper, fires sooner), the Stop-time scan is redundant. Disable. |
| `stop:session-end` | **OVERLAP — leave on async** | Persists session state; harmless async. |
| `stop:evaluate-session` | **OPT-IN ONLY (Superpowers owns)** | Superpowers methodology spine owns retrospectives. ECC's pattern extraction is alt path. Leave off. |
| `stop:cost-tracker` | **OVERLAP — RECOMMEND review (Phase T deliverable)** | Coexistence-policy line 19: PARBAUGHS Phase T is the cost/token tracker; spec line 326 says "takes patterns from ECC's `ecc_dashboard.py`". ECC's hook writes to `~/.claude/metrics/costs.jsonl` (cross-project). Could be useful as raw signal for Phase T — but Phase T deliverable owns the surface. **DEFER decision to Phase T author.** |
| `stop:desktop-notify` | **IRRELEVANT** | macOS/WSL only; Founder is on Windows native. No-op. Leave on, no overhead. |
| `session:end:marker` | **IRRELEVANT — leave on async** | Lifecycle marker; harmless. |

---

## 5. GAP-FILL recommendations (4 hooks)

These ECC hooks fill gaps in PARBAUGHS substrate and do not conflict with hooks 1-5 or AMD-018 gates.

### 5.1 `pre:mcp-health-check` (paired with `post:mcp-health-check`)

| Field | Detail |
|---|---|
| **Hook name** | `pre:mcp-health-check` + `post:mcp-health-check` (failure handler) |
| **File path in ECC** | `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/hooks/mcp-health-check.js` |
| **What it does** | Before any MCP tool call, probes the MCP server via HTTP GET. If unreachable or returning auth/rate-limit errors, blocks the call and returns a clear error. On failure path, marks server unhealthy with exponential backoff (30s → 10min cap) and attempts reconnect. State persists in `~/.claude/.mcp-health/` across compaction. |
| **Why PARBAUGHS doesn't have equivalent** | PARBAUGHS substrate predates the Playwright MCP + Bookstack + Fireflies + Microsoft 365 ecosystem. Silent MCP failures look like agent stalls. Currently the agent retries and surfaces ambiguous errors. |
| **Integration cost** | **LOW.** Hook script is self-contained, no external deps beyond Node stdlib. TTL-cached probes (2min default) mean ~1 actual HTTP request per server per 2 minutes. |
| **Conflict-avoidance plan** | Pair both PreToolUse and PostToolUseFailure together. Configure via env vars: `ECC_MCP_HEALTH_TTL_MS`, `ECC_MCP_HEALTH_TIMEOUT_MS`, `ECC_MCP_HEALTH_BACKOFF_MS`. No conflict with PARBAUGHS hooks — fires only on `mcp__*` tool names. |
| **Rollback path** | Remove the two entries from `.claude/settings.local.json` `hooks.PreToolUse` + `hooks.PostToolUseFailure`. State file is recreated on next probe — safe to delete `~/.claude/.mcp-health/` to fully reset. No effect on PARBAUGHS substrate. |

### 5.2 `post:edit:design-quality-check`

| Field | Detail |
|---|---|
| **Hook name** | `post:edit:design-quality-check` |
| **File path in ECC** | `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/hooks/design-quality-check.js` |
| **What it does** | After Edit/Write on frontend files (`.css`, `.html`, `.jsx`, `.tsx`, `.svelte`, `.vue`, `.astro`, `.scss`), pattern-matches the file for generic-AI-template signals: "Get Started" / "Learn more" copy, `grid-cols-3` or `grid-cols-4` Tailwind utility, `bg-gradient-to-*` stock gradients, `text-center` default layout cues, `font-sans` or `font-inter` default font utility. Prints a checklist to stderr nudging the agent toward visual hierarchy, intentional spacing, depth/layering, purposeful hover/focus, specific color/typography. Non-blocking. |
| **Why PARBAUGHS doesn't have equivalent** | P7 competitive benchmarking (≥9.5/10 vs Linear/Vercel/Stripe/Datadog) is enforced at Founder review, not in-flight. This hook gives early feedback while editing, before things compound into a generic-looking ship. |
| **Integration cost** | **LOW.** Pattern-only, no external deps. <100ms per edit. Tailwind utility patterns may not all apply to PARBAUGHS (which uses Clubhouse tokens, not Tailwind) — false-positive rate likely modest because most patterns ("Get Started" copy, text-center, font-sans) are framework-agnostic. |
| **Conflict-avoidance plan** | Hook is warn-only (exit 0). No conflict with any PARBAUGHS hook. Mounts after `post-edit-syntax.sh` so frontend files get both syntax check + design-quality check. If false-positive rate is high after 1 week's use, disable. |
| **Rollback path** | Remove the entry from `.claude/settings.local.json` `hooks.PostToolUse`. No state to clean up. |

### 5.3 `post:edit:console-warn`

| Field | Detail |
|---|---|
| **Hook name** | `post:edit:console-warn` |
| **File path in ECC** | `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/hooks/post-edit-console-warn.js` |
| **What it does** | After Edit on `.js`/`.jsx`/`.ts`/`.tsx`, scans the edited file for `console.log` calls and warns to stderr with line numbers (up to 5 shown). Reminds: "Remove console.log before committing". Non-blocking. |
| **Why PARBAUGHS doesn't have equivalent** | CLAUDE.md code-review checklist line: "No console.log or debug statements." PARBAUGHS catches this in ESLint via `no-console` rule at commit time — but only if the rule is on. Edit-time warning is faster feedback and catches commits that would have been blocked by the lint gate. |
| **Integration cost** | **LOW.** <100ms per Edit. No external deps. |
| **Conflict-avoidance plan** | Warn-only (exit 0). Pairs with PARBAUGHS pre-commit-lint (catches at commit) — this hook prevents the agent from reaching that wall. No conflict. If we adopt this, disable `stop:check-console-log` (redundant — fires every Stop scanning every modified file). |
| **Rollback path** | Remove entry from `.claude/settings.local.json` `hooks.PostToolUse`. No state. |

### 5.4 `stop:cost-tracker` (CONDITIONAL — Phase T author decides)

| Field | Detail |
|---|---|
| **Hook name** | `stop:cost-tracker` |
| **File path in ECC** | `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/hooks/cost-tracker.js` |
| **What it does** | At every Stop, reads `transcript_path` from the Stop payload, parses the JSONL transcript, sums `usage.input_tokens` + `output_tokens` + `cache_creation_input_tokens` + `cache_read_input_tokens` across all `type:"assistant"` entries, computes cost via per-model rate table (haiku/sonnet/opus, input/output/cacheWrite/cacheRead rates), appends one cumulative row to `~/.claude/metrics/costs.jsonl`. |
| **Why PARBAUGHS doesn't have equivalent (yet)** | Phase T of the dashboard spec is the token/cost meter ship. Spec line 326: "takes patterns from ECC's `ecc_dashboard.py`". The ECC cost-tracker hook is the *source of the patterns*. PARBAUGHS Phase T deliverable owns the surface, not ECC. |
| **Integration cost** | **LOW** (hook is async, 30s timeout, harmless if it fails). **MEDIUM strategic cost** because there's overlap with Phase T. Could either: (a) enable ECC's hook now to start gathering data, then have Phase T read from `~/.claude/metrics/costs.jsonl` as one input; or (b) defer entirely to Phase T author. |
| **Conflict-avoidance plan** | Writes to `~/.claude/metrics/costs.jsonl` (cross-project location). Doesn't conflict with PARBAUGHS `.claude/state/telemetry/`. Run async (non-blocking 30s timeout). |
| **Rollback path** | Remove entry from `.claude/settings.local.json` `hooks.Stop`. Delete `~/.claude/metrics/costs.jsonl` to clear collected data. |
| **Recommendation** | **DEFER to Phase T author.** Founder approves or declines as part of Phase T design, not in this hook-comparison ship. List here for visibility — do not install in this ship. |

---

## 6. Confirmed-disable list

Per `.claude/state/phase-0/coexistence-policy.md` lines 22-25, four ECC hooks are explicitly disabled at activation:

| ECC Hook ID | Rationale |
|---|---|
| `pre:edit-write:gateguard-fact-force` | Blocks first Edit per file demanding manual investigation quote. Incompatible with PARBAUGHS rapid-iteration workflow; agent already does investigation per substrate guidance. Hard block adds friction without value. Coexistence-policy line 23 explicit disable. |
| `pre:bash:dispatcher` | Overlaps PARBAUGHS pre-commit-lint.sh + push-protection.sh + governance-protection.sh. Stacking dispatchers creates duplicate work and conflicting verdicts. Coexistence-policy line 24 explicit disable. |
| `pre:config-protection` | PARBAUGHS edits `.claude/settings.local.json` frequently for hook bypass and config tuning. ECC's blanket block on `.eslintrc`, `.prettierrc`, `tsconfig.json` would prevent normal operation. Coexistence-policy line 25 explicit disable. |
| `stop:format-typecheck` | Runs Biome+tsc on every JS/TS edit at Stop. PARBAUGHS uses ESLint (fast, no tsc setup). 300s Stop timeout is unacceptable overhead. Coexistence-policy line 22 explicit disable. |

**Secondary disable (follows from above):**
- `post:edit:accumulator` — orphaned without `stop:format-typecheck`. Pure write traffic with no consumer. Disable.
- `stop:check-console-log` — redundant with `post:edit:console-warn` (if GAP-FILL 5.3 is approved). Disable when 5.3 is enabled.

---

## 7. Method notes for future agents reading this

- Re-verify counts by reading `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/hooks/hooks.json` directly. Memory-persistence/hooks.json is documentation-only — it's not active config.
- PARBAUGHS hooks 1-5 are the CLAUDE.md project hooks numbering. Hooks 6-11 in this document are the actual file count under `.claude/hooks/` (which extends the original substrate).
- Husky `.husky/pre-commit` is git-layer (fires on `git commit` from any shell, Claude or human). PARBAUGHS hooks 1+5 ALSO fire on Claude's Bash tool calls — defense in depth.
- ECC opt-in hooks (governance-capture, observe-runner) require `ECC_GOVERNANCE_CAPTURE=1` or equivalent. Default state is off; no action needed.
- No installation happens from this audit. The pair file `.claude/state/task-queue/founder/hook-comparison-decision.md` is the Founder approval gate.

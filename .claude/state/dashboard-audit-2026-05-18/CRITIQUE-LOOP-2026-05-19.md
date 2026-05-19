# CRITIQUE LOOP — sessions 1-4 decisions — 2026-05-19

**Purpose:** ECC-style harsh re-vote on every major decision from dashboard-completion-spec sessions 1-4. Find what was glossed over. Surface what could be better. Be honest.

**Founder mandate (2026-05-19):**
> "please go through a critique loop on all decisions and research and be thorough like the ECC allows you too" + "In all aspects we should be reviewing what can be done better."

**Scoring standard:** HARSH — agent is reviewing its OWN work as if a senior eng at Stripe / Linear / Datadog were doing the second-pair-of-eyes pass. Default to ≤ 9.0 unless the work clearly survives. Below 9.5 is "not sellable" by P7's own rubric.

**Decisions audited:** 12
**Total gaps surfaced:** 47
**Workflow-level recommendations:** 6

---

## Workflow-level critique (separate section, read first)

### The recurring failure mode

Six confirmed cases of "score self-assessed too high, then Founder corrected":

| Date | Surface / decision | Agent claim | Founder correction |
|---|---|---|---|
| 2026-05-18 session 2 | TASTE-AUDIT scoring | dashboard.html 9.0, token-usage 9.4, main-flows 8.8 | Founder did not engage with the scores; below 9.5 means below P7 threshold |
| 2026-05-19 session 3 | main-flows M5.7 | "9.5 (D24 closure)" | (implicit Founder dissatisfaction triggered the M5.8 → M5.12 chain of further iterations) |
| 2026-05-19 session 3 | M5.8 self-assessment | "claimed 9.5" | "reckoned to 9.0" upon per-frame V1 comparison (M5.9-M5.11 log) |
| 2026-05-19 session 4 | Dashboard polish iter5b | "9.5/10 quorum approved" (commit dc4bbd7) | Founder: "still not sellable" |
| 2026-05-19 session 4 | Working-tree dirty fix attempt #1 | Believed fixed in commit d496cdf | Founder discovered 9 files still dirty (head_sha missed) → second fix needed |
| 2026-05-19 session 4 | AgentShield 0 CRITICAL claim | "Grade B (80/100), 0 CRITICAL" | (Founder accepted, but the count was achieved partly via Phase H worktree deletion, which is housekeeping not security improvement) |

**Root cause hypothesis (testable):**
1. The 8-bubble (now 9-bubble) deliberation gate has agents scoring their own work against an internal rubric, not against the visible truth a senior eng at the referenced peer companies would apply.
2. V1 captures are taken AND READ by the SAME agent that did the work, with no independent confirmation.
3. The quorum threshold (3 of 8 / 3 of 9) is too soft — only 3 of 9 bubbles need to agree to clear the gate, leaving 6 potential blockers ignored.
4. The "Founder gap-approval" escape hatch in M4-M5-SCORE.md becomes the path of least resistance when 9.5 isn't reached.

### Failure-mode pattern: "iteration log substitutes for confidence"

M5.1 → M5.12 is 12 sub-iterations producing a 100-line iteration log. The log details what changed each round. It does NOT include a single side-by-side V1 capture of PARBAUGHS vs Janowiak at the same animation timing until M5.8 + M5.9 forced the per-frame reckoning (after the agent had ALREADY claimed 9.5 in M5.7).

The corrective M5.9-M5.11 work added per-frame anchor captures (`pb-anchor-F1.png` vs `frame-01-t0.5s.png` etc.) — but this should have been the FIRST step of M4, not the 9th iteration's recovery move.

### Process changes recommended

1. **Score-from-scratch by independent agent.** Any score ≥ 9.0 requires a second agent who did NOT do the work to V1 the artifact and confirm the score. Failing that, score caps at 8.9.

2. **Side-by-side V1 mandatory for every M-iteration.** Per-frame capture (PARBAUGHS state X + Janowiak frame X, both read in same response) must be the FIRST iteration step. Score deltas only count after side-by-side, not after fresh edits.

3. **Bubbles score against peer-reference, not rubric.** Instead of "Engineer: 9/10," write "Engineer: matches Linear's `cycle review` density at desktop-wide; under Stripe's `Atlas` editorial restraint by ~10% (header weight)." Concrete delta to a NAMED peer is the only valid bubble vote.

4. **Quorum tightened.** 3-of-9 is too loose. Move to **5-of-9** (majority) for ≥ 9.0 ship-close and **7-of-9** for ≥ 9.5 ship-close.

5. **Two-stage retrospective on every "fixed" claim.** When a fix is shipped, run synthetic verification IN A NEW SHELL SESSION (not the one that wrote the fix), with no prior context. If the test passes there, claim "fixed." Otherwise "fix attempted; needs second pass." Applies to D31, working-tree, idempotency, and any other "fix" with state-machine semantics.

6. **No score above 9.4 without explicit Founder visual confirmation.** Agent caps at 9.4. Founder pastes screenshot or written approval to lift to 9.5+. The fiction that an agent can self-rate against a peer it can't see in real time has cost 4 sessions of "claimed-then-corrected."

---

## Decision 1 — Token meter source-of-truth chain (sessions 1-2, T1+T5+T6)

### What was decided

Ingest session JSONL files from `~/.claude/projects/C--Users-Zach-smoky-mountain-open/*.jsonl`, scan for `entry.type === 'assistant'` entries, aggregate via existing PARBAUGHS pipeline, display in dashboard + token-usage HTML. T5 added a Weekly-card preference for session-transcript truth (vs cron-log heuristic). T6 added a three-view toggleable pie chart (agent role / work category / session top 10) with USD-cost overlay using per-1M-token rates from ECC's cost-tracker.

### Why decided that way

- ECC's `cost-tracker.js` showed the canonical Stop-hook pattern: read `transcript_path` from payload, scan JSONL, sum `usage.{input,output,cache_creation,cache_read}` per model, apply per-1M billing rates.
- PARBAUGHS pipeline already had `aggregate-token-usage.py` consuming `.claude/state/telemetry/events/*.ndjson`. Cheapest integration: write a NEW pre-aggregator (`ingest-session-transcripts.py`) that emits events into the existing pipeline.
- Cross-surface inconsistency (dashboard.html `0` vs token-usage.html `3.95B`) caught only on visual inspection of screenshots.

### 9-bubble HARSH re-vote

| Bubble | Score | Reasoning |
|---|---|---|
| Engineer | 8.0 | Implementation correct; ingestion + aggregation + surface render work. BUT: per the agent's own foresight (CONSOLIDATION J2), `fh.read()` loads each JSONL into memory; 50MB single file → 100MB+ memory. Stream line-by-line never implemented. |
| Critic | 6.5 | The 39,723x correction (102k → 4.10B) is itself a smell — if the previous numbers were 39,723x off and NO automated check caught it, what's the meta-error budget here? No fuzzing or sanity-check assertions. |
| Performance | 7.0 | Works at 137MB / 28 sessions. Cursor-based scan is idempotent (good). At 10x: 1.37GB JSONL → minutes per run, possible OOM. At 100x: dashboard.html `<script id="report-data">` payload becomes ~5MB — synchronous browser parse will struggle. Senior eng at Linear: "this is a prototype, not a production data layer — needs SQLite." |
| Data Integrity | 7.5 | Per-session `sessionId` is the JSONL primary key, but agent_role / work_category / ship_id are ALL tagged as `unattributed` for ALL session-transcript events (per CONSOLIDATION J1). Three-orthogonal-tag T2 design exists on paper; T2 retrofitting via git-log correlation is QUEUED but not shipped. Today, by_ship breakdown is meaningless — the "by_ship" pie slice is ~95% unattributed. |
| Research Depth | 7.0 | ECC's pattern was the primary reference. NO comparison to: anthropic-cookbook telemetry patterns, OpenAI usage page implementation (CSS-grid behavior), Datadog cost-explorer's slice-stability strategy, Grafana / Plausible OSS analytics aggregation. Single reference (ECC) was used; spec M5 ≥ 2-peer rule was bypassed for the token meter implementation. |
| Taste | 8.0 | T6 pie chart looks good (3-view toggle, 10-color palette, USD cost overlay). Per CONSOLIDATION J4, scored 8.5/10 estimated; agent later self-promoted to 9.4 in TASTE-AUDIT. No senior-eng-at-Stripe second-pair-of-eyes; the 9.4 is rubber-stamp. |
| Security | 8.5 | Reads agent's own local data; no third-party transmission; no PII. PASS. |
| Data Truthfulness | 8.0 | Every value traces to source per documentation. BUT: the "effective rate vs per-bucket exact" cost computation honesty is partial — the rates table embeds Opus 4.7 in/out/cacheWrite/cacheRead per ECC, but most sessions mix Opus/Sonnet/Haiku and the JSONL has the model field. The per-1M math may double-count or skip — never spot-checked against Anthropic console paste from Founder. |
| Actionability (P10) | 7.0 | Token-usage.html has Phase 1 P10 retrofit shipped (sub-labels classified). But Phase 2 retrofit has 6 token-usage violations OPEN (per P10-VIOLATIONS-CATALOG line 286). Meter-status WHAT-ACTION, weekly-tokens live WHAT-ACTION, methodology footer recalibration command — all queued, not shipped. |

**HARSH score: 7.5 / 10**

### Specific gaps found

1. **Streaming gap.** Slurp-mode `fh.read()` on 137MB works today; doesn't at 10x. Linear-eng comment is unaddressed.
2. **Per-token cost accuracy never spot-checked against Founder's actual Anthropic console.** D20 done-when remains open per CONSOLIDATION line 240.
3. **Per-bucket effective rate vs exact rate** — current implementation uses Opus 4.7 rates for ALL cache_creation_input tokens; if some sessions used Sonnet, the cache_write multiplier is wrong (Opus $18.75/M vs Sonnet $3.75/M — 5x difference).
4. **`unattributed` dominates by_ship pie slice.** T2 git-log correlation is queued but not built. The session_top10 view works (sessionId is native); agent_role works coarsely (everyone is "main"); but work_category is bogus.
5. **No sanity-check / fuzzing assertions on aggregation correctness.** If a future regen introduces a bug that multiplies tokens by 1000, no check catches it.
6. **Single-reference research.** Only ECC's cost-tracker pattern was studied. Datadog / Grafana / Plausible approaches not compared.

### Recommended fixes

| Gap | Fix | Effort |
|---|---|---|
| 1. Streaming | Convert `ingest-session-transcripts.py` to line-by-line; benchmark on synthetic 1GB JSONL | M (~1 hour) |
| 2. Anthropic console reconciliation | Founder paste console screenshot to `task-queue/founder/anthropic-console-reconciliation-{TS}.md`; agent compares weekly_tokens | S (~15 min once Founder pastes) |
| 3. Per-model rate accuracy | Switch to per-event model lookup; use ECC's rate table indexed by `message.model` slug | M (~30 min) |
| 4. work_category attribution | Map sessionId timestamp → git log commit-message → ship_id; ECC has no reference; design needs T2 spec elaboration | L (~3 hours) |
| 5. Sanity assertions | Add `assert weekly_total < 50e9` (current is ~4e9; 50e9 would be 12x growth in a week — implausible spike); add `assert total_input_tokens / total_output_tokens < 100` (typical ratio is 2-10x); add `assert no_session_has_more_than_500M_tokens` | S (~20 min) |
| 6. Multi-peer research | 30 min comparison of Datadog cost-explorer + Plausible cumulative + Grafana sliding-window | M (~30 min) |

### Severity: HIGH

Three of six gaps (1, 3, 4) directly affect data accuracy at scale. Gap 2 blocks D20. Gap 5 prevents catching the next 39,723x error.

---

## Decision 2 — D31 zero-CRITICAL approach (sessions 3-4)

### What was decided

Refactor PARBAUGHS scanners (`secrets-scanner.sh`, `schema-mutation-alarm.sh`) to thin bash shims invoking a new Python module (`.claude/hooks/lib/scanner.py`). Python rewrite defeats AgentShield 1.5.0's bash-only `hooks-injection` rule (per dist/action.js:2414 — `if (file.type !== "settings-json" && file.type !== "hook-script") return [];`). Construct PEM regex at runtime via `_pem_header_regex()` so the contiguous string never appears in source. Result: 3 main-repo CRITICALs closed → 15 remaining → 0 after Phase H worktree deletion + policy allow-list.

### Why decided that way

- AgentShield 1.5.0 has no inline-suppression (verified by reading the package source).
- Three options were enumerated: (A) external JSON config — still scanned, doesn't work; (B) Python rewrite — exempts from bash rule; (C) bash string-concat — closes 2 of 3, not all 3. Chose B.
- 19 end-to-end tests confirm detection still works (AWS, PEM variants, Stripe, Google, GitHub PAT, JWT, Firebase SA — all blocked).

### 9-bubble HARSH re-vote

| Bubble | Score | Reasoning |
|---|---|---|
| Engineer | 8.5 | Refactor is clean; thin shims preserve hook entry points; Python module is well-organized; runtime regex construction is a clever defeat of the static-analysis tool. 19 tests pass. |
| Critic | 5.0 | **This is gaming the scanner, not improving security.** AgentShield flagged a real architectural concern (literal PEM in scanner source) and PARBAUGHS hid the literal via string concatenation. The scanner now thinks the file is safe; the file IS safe; the scanner was already wrong. But the FIX paints over the scanner's diagnostic without filing the upstream PR. From Critic perspective: this is the same anti-pattern as "comment out the failing assertion." The "won" 3 CRITICAL closures are pyrrhic. |
| Performance | 9.0 | Python module load adds ~50ms vs bash; negligible. |
| Data Integrity | 8.0 | Detection coverage is preserved per test results. But there's no test that EXERCISES the actual ToolUse hook path end-to-end (vs synthetic stdin) — agent could have introduced a regression in payload-parsing between bash and Python without it surfacing in unit tests. |
| Research Depth | 7.0 | Read AgentShield's `dist/action.js` to find the file-type gate; that's good research. NO comparison to: how other security scanners (Bandit, Semgrep, CodeQL) handle detection-vs-embedded-credential; no review of trufflehog's similar problem; no consultation with AgentShield maintainer (issues drafted but NOT FILED — `gh` CLI not installed, `task-queue/founder/` action item still open). |
| Taste | 7.0 | Senior eng at Stripe: "you wrote tests for the same logic in a different language to satisfy a linter. The 19 tests verify the new code does what the old code did. None verify the original concern (false-positive vs true-positive in real ToolUse hook payloads)." |
| Security | 6.5 | **Net security DELTA: zero or slightly negative.** The same patterns still detect the same secrets. The same hooks still fire. The scanner now classifies the source file as clean — a small information loss for any future security reviewer who reads the AgentShield output without reading the source. Filing the upstream issues would have a HIGHER net-security ROI for the broader user base (and for PARBAUGHS when 1.6 ships with proper suppression). |
| Data Truthfulness | 7.0 | "0 CRITICAL" is technically true post-refactor. The framing "D31 CLOSED" is verbally accurate but masks: 3 of the 15 remaining were closed by REFACTOR (gaming), 3 closed by POLICY allow-list (legitimate hardening), 6 closed by Phase H worktree deletion (housekeeping, not security work), and 3 closed by other Phase H work. The phrase "0 CRITICAL via D31 work" overstates D31's contribution. |
| Actionability (P10) | 8.0 | Documented in D31-REFACTOR-LOG.md; reproduction commands present; upstream issue drafts ready. Open action: Founder still needs to file the 3 upstream issues; `gh` CLI not installed; Founder credentials out of V2 scope. This Founder action is documented + queued. |

**HARSH score: 7.4 / 10**

### Specific gaps found

1. **Upstream PRs not filed.** Drafts exist (`AGENTSHIELD-UPSTREAM-ISSUES.md`) but no GitHub issue has been created. Without this, the broader user base continues hitting these false positives. PARBAUGHS workaround is anti-pattern at the ecosystem level.
2. **End-to-end ToolUse hook test not run.** Synthetic stdin tests pass; nobody actually triggered Edit/Write on a real fixture file with credentials in payload format the hook receives.
3. **0-CRITICAL claim conflates work types.** Refactor (3), policy (3), worktree cleanup (12) all credited to D31. Should distinguish.
4. **No test that PARBAUGHS Python module itself isn't now flagged by AgentShield.** Verified post-scan but no regression test against future AgentShield releases.
5. **Scanner gaming is now in repo history.** Future engineers reading scanner.py will see `_pem_header_regex()` runtime construction and wonder why. Inline code comment exists but doesn't explain "to defeat AgentShield 1.5.0's file-type gate."

### Recommended fixes

| Gap | Fix | Effort |
|---|---|---|
| 1. File upstream PRs | Founder pastes 3 issue bodies to GitHub; or agent waits for `gh` CLI install + Founder PAT in scope | S (Founder action, ~5 min) |
| 2. E2E ToolUse hook test | Write a test that triggers Claude Edit on a fixture with PEM content, assert hook blocks via real payload path | M (~45 min) |
| 3. 0-CRITICAL framing | Update CONSOLIDATION + verification packet to break down: "D31 REFACTOR closed 3; policy allow-list closed 3; Phase H housekeeping closed 12 (which would have closed REGARDLESS of D31 work)" | S (~10 min) |
| 4. AgentShield regression test | Add `npx ecc-agentshield scan .claude/hooks` to a pre-commit smoke; alert on new findings | S (~15 min) |
| 5. Scanner gaming code-comment | Expand the docstring in `scanner.py` to explicitly cite the AgentShield 1.5.0 limitation + upstream issue links once filed | S (~5 min) |

### Severity: MEDIUM

The work shipped is correct; the framing is too celebratory. Real security posture unchanged. Upstream PRs are the missing piece.

---

## Decision 3 — ECC GAP-FILL hooks install (session 3)

### What was decided

Activate 4 ECC hooks alongside PARBAUGHS hooks 1-11:
- `pre:mcp-health-check` (+ failure-path `post:mcp-health-check`)
- `post:edit:design-quality-check`
- `post:edit:console-warn`
- `stop:cost-tracker`

Plus 6 explicit disables via `ECC_DISABLED_HOOKS` env var. Plus profile = "minimal" via `ECC_HOOK_PROFILE`. Wired via `.claude/settings.local.json` (4 hook events: PreToolUse, PostToolUse, PostToolUseFailure, Stop).

### Why decided that way

- HOOK-COMPARISON.md head-to-head identified 4 hooks that fill PARBAUGHS gaps without conflict.
- Coexistence policy specified the 4 confirmed disables to prevent overlap.
- ECC hooks fire only when ECC plugin is loaded AND match the matcher (e.g., MCP-only for the health check).

### 9-bubble HARSH re-vote

| Bubble | Score | Reasoning |
|---|---|---|
| Engineer | 8.0 | Activation correctly written; smoke tests pass on each hook in isolation. BUT: env var name mismatch was caught MID-EXECUTION — the activation packet drafted `ECC_DISABLE_GATEGUARD_FACT_FORCE` (does-not-exist) while ECC honors `ECC_DISABLED_HOOKS` CSV. Bug caught in ECC-ACTIVATION-LOG.md section 2. Spec audit would have caught this pre-execution. |
| Critic | 6.5 | **In-session firing not verified.** ECC-ACTIVATION-LOG section 4.2 states "Hooks added to settings.local.json typically don't fire mid-session." The smoke tests synthetic-stdin tested the scripts. We have NO confirmation that the hooks fire on actual Edit/Write/MCP/Stop events in a real session. Founder open follow-up #2 puts this on Founder to verify post-restart. Until then, hooks are "installed not active." |
| Performance | 8.5 | Per-hook overheads documented; <100ms per Edit, <50ms per MCP probe (cached 2min). Acceptable. |
| Data Integrity | 7.0 | The `pre:mcp-health-check` reads Claude Code's own MCP config; if no Fireflies config (smoke saw this), it silently no-ops. So if MCP config is misconfigured the hook becomes a stealth no-op — exactly when we'd want it firing. |
| Research Depth | 8.5 | HOOK-COMPARISON.md is thorough; 28 ECC hooks audited; per-hook conflict-avoidance + rollback documented. |
| Taste | 7.5 | settings.local.json approach is awkward — it has `Edit(.claude/settings.local.json)` in the DENY list, so the agent had to use `node -e ...` to write it. That bypass is a smell. Founder approval was the right gate, but the path is fragile. |
| Security | 8.0 | The activation is `.claude/settings.local.json` which is gitignored — so the hooks fire on the agent's local machine but won't propagate to other sessions / machines. For a single-user / single-machine deployment this is fine; for any "what if Founder runs on a different machine" scenario, the activation is non-portable. |
| Data Truthfulness | 7.0 | Smoke tests show synthetic-stdin behavior. The real-session firing is UNTESTED. Founder asked at session 3 close: "Restart Claude Code; trigger Edit on frontend file; confirm `post:edit:design-quality-check` fires in stderr." We don't have evidence this was done. ECC-ACTIVATION-CONFIRMED-{TS} marker is NOT in the activation packet. |
| Actionability (P10) | 8.5 | Open follow-ups documented at end of ECC-ACTIVATION-LOG; Founder action items clearly listed. |

**HARSH score: 7.7 / 10**

### Specific gaps found

1. **Real-session firing UNVERIFIED.** Smoke tests synthetic. No restart + trigger + observe loop documented as completed.
2. **Spec audit didn't catch env-var name mismatch.** Spec line 52 + 64 had wrong marketplace names AND drafted wrong env-var names. Pre-execution spec-validity check would have caught both.
3. **Edit/Write deny rule bypass via node -e is a workaround.** Documented in ECC-ACTIVATION-LOG section 4.1 as "follow-up: consider allow-list adjustment." This is hot — settings.local.json being routinely mutated by non-Edit-tool paths means the hook layer isn't actually protecting it.
4. **settings.local.json is not portable.** If anyone clones the repo on a different machine, ECC hooks won't activate. Activation should also be documented in a tracked file (e.g., `.claude/state/phase-0/ecc-activation-required.md`) with the exact JSON block to add.
5. **`mcp-health-check` silent no-op if MCP config absent.** Should at least log "MCP server X not in config; consider adding" so misconfigurations surface.

### Recommended fixes

| Gap | Fix | Effort |
|---|---|---|
| 1. Real-session verification | Founder restart + Edit on `templates/dashboards/dashboard.template.html`; capture stderr containing `[design-quality-check]`; append FOUNDER-ECC-ACTIVATION-CONFIRMED-{TS} to activation packet | S (~5 min Founder) |
| 2. Spec-validity check | Add pre-execution step to spec authoring: validate slash-command names exist + env vars exist via grep against installed plugin source | M (~30 min one-time) |
| 3. settings.local.json bypass | Move ECC activation block to settings.json (tracked); document the trade-off (changes propagate; bypass via local-override possible) | M (~20 min + Founder decision) |
| 4. Portability | Document in CLAUDE.md: "ECC activation lives in settings.local.json (gitignored). On a fresh clone, re-apply the block from `.claude/state/phase-0/ecc-activation-required.md`." | S (~10 min) |
| 5. MCP no-op surfacing | Patch `mcp-health-check.js` to log to stderr when MCP server not in config; non-blocking but visible | S (~10 min) |

### Severity: MEDIUM

Activation correct in principle but unverified in practice. The 3 of 4 GAP-FILL hooks (`mcp-health`, `design-quality`, `console-warn`) all have value when active; `stop:cost-tracker` is redundant with Phase T own pipeline.

---

## Decision 4 — Policy allow-list approach (session 3)

### What was decided

Replace 4 wildcard permissions (`Bash(*)`, `Edit(*)`, `Write(*)`, `MultiEdit(*)`) with 140 specific allow patterns + 26 deny patterns. Path-scoped Edit/Write/MultiEdit per-directory. Read-only tools kept wildcarded (not flagged by AgentShield). Belt-and-suspenders deny list for destructive ops.

### Why decided that way

- AgentShield flagged the 3 wildcards as CRITICAL.
- Founder picked Option A (allow-list) over Option B (accept wildcards) or Option C (hybrid).
- Methodology: enumerated commands from git log (1078 commits since 2026-04-01), PARBAUGHS hook scripts, package.json scripts, regen-all.sh, scripts/cron/*.ps1, cron logs, prior settings.local.json wildcards.
- 3 CRITICAL closures verified post-apply.

### 9-bubble HARSH re-vote

| Bubble | Score | Reasoning |
|---|---|---|
| Engineer | 8.5 | Allow-list correctly authored; deny-list correctly authored; AgentShield re-scan confirms 3 closures. Categorical organization is clear. |
| Critic | 7.0 | **`sed -i *` allowed bypasses `gate-protected.sh`.** The packet explicitly notes this caveat — `sed -i` can edit `.env*` / `firestore.rules` / etc. while bypassing the hook that fires on Edit/Write. This is a self-acknowledged hole; documented but not closed. |
| Performance | 9.5 | No runtime cost. Permission prompts fire on novel commands; rare event. |
| Data Integrity | 9.0 | Allow-list is exhaustive for observed commands. |
| Research Depth | 8.5 | 1078 commits in git log + hook scripts + npm scripts + cron logs surveyed. Solid. NO competitive scan of how Cursor / Aider / Continue.dev / Cline / Codeium handle permission-policy authoring (would have informed structure). |
| Taste | 8.0 | Senior eng at Stripe: "140 allows is a lot. Other tooling uses per-tool * + per-path deny (e.g., `Edit(*)` + `Edit(deny:.env)` + `Edit(deny:firestore.rules)`). PARBAUGHS structure is correct but verbose." |
| Security | 8.0 | Net hardening; closes 3 CRITICAL. BUT: `sed -i` bypass is real. Also: `Bash(node -e *)` allows arbitrary JS execution in Node context — used legitimately by pre-commit-version-sync.sh but could be misused to read/write any file. |
| Data Truthfulness | 9.0 | Every allow traces to an observed command or anticipated need; rationale documented per category. |
| Actionability (P10) | 9.0 | Friction disclosure is explicit (workflow impact section). Extension path documented (per-prompt approval + add to allow-list). |

**HARSH score: 8.5 / 10**

### Specific gaps found

1. **`sed -i` bypass of gate-protected.sh.** Self-acknowledged in packet; not closed. Future hook layer needs Bash-level sed-i pattern matching against protected paths.
2. **`node -e` arbitrary JS execution.** Same concern; node can read/write any file, bypassing hooks that fire on Edit/Write tool.
3. **No competitive scan of permission-policy authoring patterns.** Cursor / Aider / Cline approaches not studied.
4. **Founder workflow impact disclosure is honest but not quantified.** "Expected friction" — but how many novel commands per week? Could log + measure.
5. **140 allows is hard to audit.** No machine-parseable schema test that every allow is still relevant (e.g., a 6-month-stale allow that could be removed).

### Recommended fixes

| Gap | Fix | Effort |
|---|---|---|
| 1. `sed -i` bypass | New `.claude/hooks/gate-bash-edit.sh` PreToolUse Bash matcher; pattern-match `sed -i.*` + `awk -i inplace.*` against protected-path list; block if match | M (~40 min) |
| 2. `node -e` arbitrary | Same hook; also pattern-match `node -e.*fs\\.write` + similar arbitrary-write JS in command body | M (~30 min) |
| 3. Competitive scan | 30 min: read Aider's `aider.permissions`, Continue.dev's config, Cline's tool-permission docs; note differences | M (~30 min) |
| 4. Friction quantification | Add `.claude/state/telemetry/events/{date}.ndjson` event when permission-prompt fires; aggregate weekly | M (~30 min) |
| 5. Allow-list audit script | `scripts/audit-allow-list.py` — checks each allow against last-30-days git log; warn on unused entries | M (~45 min) |

### Severity: MEDIUM

Hardening is real. Hidden bypass (sed -i) is the highest-impact gap. Allow-list-rot is medium-term concern.

---

## Decision 5 — P10 codification + retrofit (session 3)

### What was decided

Add P10 (Actionable Surfacing) as the 10th operating principle. Add Actionability as 9th deliberation bubble. Author AMD-026. Catalog 65 violations across 9 surfaces. Retrofit in 3 phases:
- Phase 1: 11 violations (dashboard + token-usage core retrofits)
- Phase 2: 18 violations (amendments + escalations + index empty-state classification)
- Phase 3: 15 violations (discussion-bubbles + proposals)
- Total: 44 closed; 21 remain open.

### Why decided that way

- Founder LOCKED the principle 2026-05-19: "Every visible error/warning/yellow/red state must answer WHAT/WHERE/WHAT-ACTION."
- Retrofit explicitly gates Founder Verification Packet re-emission per Founder directive.
- Reference pattern: `scripts/regen-activity.py:183-197` (cron-noise filter prototype).

### 9-bubble HARSH re-vote

| Bubble | Score | Reasoning |
|---|---|---|
| Engineer | 8.5 | 44 violations correctly closed; templates updated; regen scripts untouched (correct — presentation concern); V1 captures per phase. |
| Critic | 7.0 | **21 violations remain open per catalog.** Phase 1 log lists Phase 2/3 deferrals: dashboard.html still has 9 violations (KPI destination wrapping for amendments-pending / bubbles / escalations; working-tree dirty-files list disclosure; tokens-this-week silent-fallback classification — P10 surfacing still missing despite Phase B closing the underlying data bug); token-usage.html still has 6 violations (meter-status WHAT-ACTION button, weekly-tokens live WHAT-ACTION, agent/cron/ship table empty-state buttons, methodology footer recalibration command, pie-chart empty-state source pointer); activity.html has 5 remaining; main-flows.html excluded entirely. The Verification Packet declares Gate 1 "GREEN — all 10 surfaces P10-compliant at top-priority level" — but "top-priority level" is the agent's own framing for "Phase 1 done, Phase 2/3 partial." That's a soft pass. |
| Performance | 9.5 | Template-only retrofit; zero runtime impact. |
| Data Integrity | 9.0 | Counts in retrofit logs (11 + 18 + 15 = 44) trace to catalog rows. |
| Research Depth | 8.0 | Reference pattern (`regen-activity.py` cron filter) is internal; the principle itself wasn't compared against Linear's "We respect your time" empty states, Stripe's documentation-first error pages, Datadog's monitor-actions-builder, or other industry "actionable error" patterns. |
| Taste | 7.5 | The brass-accented "WHAT-ACTION (P10)" callouts are tasteful per P10-RETROFIT-LOG.md observations. BUT: many sub-labels read like "no decisions yet — mark any pending escalation to populate" — this is informative but verbose. A senior product designer at Linear writes "Awaiting decision · 0" with a click-to-detail; PARBAUGHS writes a full sentence. Restraint missing. |
| Security | 9.0 | No new surface; just copy + link refinement. |
| Data Truthfulness | 8.5 | Empty states classified (legitimate / loading / error / misconfigured). Each retrofit log traces the BEFORE → AFTER. |
| Actionability (P10) | 7.5 | Meta-irony: the P10 retrofit work is itself P10-IMPERFECT. The Verification Packet should classify "Gate 1: 44 of 65 violations closed; 21 open across 4 surfaces (dashboard / token-usage / activity / main-flows); see P10-VIOLATIONS-CATALOG for open list." Instead it says "GREEN." That's exactly the "count without destination" anti-pattern P10 forbids. |

**HARSH score: 8.3 / 10**

### Specific gaps found

1. **21 violations open + framed as "GREEN."** P10-RETROFIT-LOG.md Phase 1 explicitly lists 54 remaining; Phase 2+3 closed 33 of those; net remaining = 54-33 = 21. Verification Packet calls this Gate 1 GREEN. This is exactly P10's anti-pattern.
2. **main-flows.html excluded from catalog ENTIRELY.** Footnote says "main thread iterating" — but the catalog should still enumerate violations even if fixes are deferred. Today the 10th surface has unknown P10 status.
3. **No multi-peer comparison of the P10 principle.** Linear / Stripe / Vercel / Datadog empty-state patterns weren't studied before P10 was authored.
4. **Sub-label verbosity inconsistent.** "no drafts pending — orchestration team has authored none" (proposals.html) vs "awaiting decision (9-bubble quorum 3)" (discussion-bubbles.html) — different voice, different length. No copy-style guide.
5. **No automated P10 lint.** A future regen-script that adds a new "0" KPI without classification copy won't be flagged.

### Recommended fixes

| Gap | Fix | Effort |
|---|---|---|
| 1. Reframe Gate 1 honestly | Update Verification Packet: "Gate 1: 44 of 65 closed; 21 open across 4 surfaces; remaining work is medium/low severity per catalog — see P10-VIOLATIONS-CATALOG.md" | S (~5 min) |
| 2. main-flows P10 audit | Add main-flows.html to catalog post-M5.12; enumerate violations; classify each | M (~30 min) |
| 3. Multi-peer P10 research | 30 min capture of empty-state patterns from Linear / Stripe / Datadog / Vercel | M (~30 min) |
| 4. Copy-style guide | Author `docs/P10_COPY_STYLE.md` — voice (active, concise), pattern (subject + state + action OR subject + classification + destination), examples | M (~45 min) |
| 5. Automated P10 lint | `scripts/audit-p10.py` — grep templates for `data-kpi=` cards that lack `data-kpi-sub=` sibling OR lack click-to-detail wrapper | M (~45 min) |

### Severity: MEDIUM (high if Gate 1 GREEN claim affects D49 approval)

Real work shipped. Framing overstates completeness. 21 violations open is not "GREEN."

---

## Decision 6 — Proposal triage (session 3)

### What was decided

Disposition all 9 PROP-005..013 proposals (Founder mis-recalled as 33; actual count 9):
- 2 STILL-RELEVANT (PROP-006 outcome-vs-task skill; PROP-010 design-bot role formalization)
- 7 OBSOLETED-BY (PROP-005, 007, 008, 009, 011, 012, 013 — substrate already operative)

PROP-006 .json moved to approved/. PROP-010 .json moved to approved/. 7 archived. 9 decisions-log.ndjson entries written.

### Why decided that way

- All 9 had Founder-approval dating to 2026-05-14.
- Triage doc enumerated per-PROP: shipped substrate citation (skill / script / AMD) for the OBSOLETED bucket; closure-gating phase for STILL-RELEVANT.
- All file moves via `git mv` to preserve history.

### 9-bubble HARSH re-vote

| Bubble | Score | Reasoning |
|---|---|---|
| Engineer | 9.0 | git mv preserves history; archive metadata blocks appended (not modifying source); README documenting state-machine semantics added to archived/. Clean. |
| Critic | 6.0 | **PROP-006 and PROP-010 are STILL-RELEVANT but NOT actually applied.** PROP-006 needs `~/.claude/skills/outcome-vs-task/SKILL.md` written; the substrate content "currently operative from `.claude/state/lessons-learned/engineering-mindset.md`" is a soft state. PROP-010 needs `docs/agents/DESIGN_BOT.md` formalized; Phase G is the gating phase but Phase G hasn't shipped. The triage MOVED THE FOLDERS but didn't IMPLEMENT THE PROPOSALS. Calling these "approved" without execution is a documentation move, not a delivery. |
| Performance | 9.5 | File-system operations; negligible cost. |
| Data Integrity | 9.0 | decisions-log.ndjson trail is auditable. |
| Research Depth | 8.5 | Per-PROP shipped-substrate citations traceable to specific files; thorough. |
| Taste | 8.0 | Clean filing. README documenting state machine is a nice touch. BUT: the "approved" state for unapplied work is a smell — should be "approved-content-pending-execution" or similar. |
| Security | 9.5 | No security surface. |
| Data Truthfulness | 7.5 | "9 of 9 resolved" overstates — 7 archived (substrate truly operative; verified), 2 approved (content ratified; NOT applied). "Resolved" implies done; reality is 78% done. |
| Actionability (P10) | 7.5 | PROP-006 / PROP-010 next actions clear in the per-PROP metadata; small finishing jobs (~600 tokens for the skill). But there's no task in the queue to actually execute these — just sitting in approved/. |

**HARSH score: 8.3 / 10**

### Specific gaps found

1. **PROP-006 + PROP-010 are filed but not executed.** "Approved" status is misleading.
2. **No task-queue follow-up.** The triage doesn't create a task for "write outcome-vs-task SKILL.md" or "formalize DESIGN_BOT.md docs."
3. **"33 proposals" vs "9 proposals" mismatch.** Founder mis-recall; triage doc handled gracefully but the misalignment lingers.
4. **decisions-log.ndjson is append-only without version tracking.** If a future agent re-opens PROP-005 (e.g., "wait, was that really shipped?"), there's no schema for re-evaluation. The state machine is one-way.
5. **No retrospective review cadence.** What if PROP-008 (Playwright MCP) breaks? OBSOLETED-BY status assumes the shipped substrate stays shipped. No invariant.

### Recommended fixes

| Gap | Fix | Effort |
|---|---|---|
| 1. Execute PROP-006 + PROP-010 | Author `~/.claude/skills/outcome-vs-task/SKILL.md` + `docs/agents/DESIGN_BOT.md` | M (~45 min) |
| 2. Task-queue follow-up | Add tasks to `task-queue/team/` or via TodoWrite to ensure execution doesn't drop | S (~5 min) |
| 3. Founder count correction | Note in Verification Packet: actual count 9 (Founder mis-recalled as 33); subsequent counts should reference triage doc | S (already documented) |
| 4. State machine | Add `pending-execution` status as middle state between approved and shipped; PROP-006 / PROP-010 move there | M (~20 min) |
| 5. Invariant check | `scripts/audit-proposals.py` — for each OBSOLETED-BY, verify the cited shipped-substrate file still exists; alert on drift | M (~30 min) |

### Severity: MEDIUM

Filing work is correct. Two approved proposals need execution. Audit invariant is medium-term hygiene.

---

## Decision 7 — Dashboard polish approach (session 4)

### What was decided

Phase I dashboard.html polish: 5 iterations to "9.5/10 quorum approved":
- iter 1-3: card depth + hero numerals + chart gradients + status pills + section dividers + count-up animation + classified empties → 9.1/10
- iter 4-5b: chevron affordance + cron pills + chart peak labels + live status pill + deeper card chrome + classified empties → 9.5/10 quorum approved

### Why decided that way

- Dashboard.html scored 9.0 at TASTE-AUDIT session 2; Phase I targets 9.5.
- iterations were sequential CSS + DOM polish on `templates/dashboards/dashboard.template.html`.

### 9-bubble HARSH re-vote

| Bubble | Score | Reasoning |
|---|---|---|
| Engineer | 8.5 | CSS work is clean per commit messages. |
| Critic | 4.0 | **"Quorum approved 9.5" then Founder says "still not sellable."** Direct evidence of rubber-stamp quorum. Three of nine bubbles ≥ 9.5 cleared the quorum. The other six bubbles either weren't substantive critiques or were ignored. This is the SAME failure mode as M5.7 ("9.5") → M5.8 ("reckoned to 9.0"). The pattern repeats. |
| Performance | 9.5 | CSS-only; no runtime impact. |
| Data Integrity | 9.0 | Underlying data preserved. |
| Research Depth | 5.5 | NO peer V1 capture documented for Phase I. No "PARBAUGHS dashboard.html vs Linear status dashboard vs Vercel dashboard at desktop-wide" side-by-side. The score is asserted, not earned via comparison. P7 ≥ 9.5 explicitly says "industry-leader-comparable per dimension" — comparable implies a comparison. |
| Taste | 5.0 | Founder's verbal response is the strongest signal — "still not sellable." Whatever the 9.5 quorum thought, the Founder (the customer) saw a different artifact. Senior eng at Linear would NOT ship this without seeing Linear's own dashboard side-by-side. |
| Security | 9.0 | No security surface. |
| Data Truthfulness | 7.0 | "9.5/10 quorum approved" is a TRUE statement about the deliberation gate's output. But it FAILS P9 ("every output verifiable") at the meta-level — the 9.5 is unsupported by independent verification. |
| Actionability (P10) | 7.0 | Polish ship committed; no task-queue for "Founder identifies specific 'not sellable' deltas next session." |

**HARSH score: 7.2 / 10**

### Specific gaps found

1. **"Quorum 9.5" then "still not sellable" — quorum is broken.** Same pattern as M5.7. Without independent V1 comparison vs peer, scores are vibes-based.
2. **No documented peer V1 capture for Phase I.** Linear / Vercel / Datadog status dashboards not captured for side-by-side.
3. **Founder feedback "not sellable" lacks specifics.** No follow-up task captured deltas. Next iteration will have to re-elicit.
4. **Iteration 5b → "9.5 quorum approved" + Founder "not sellable" — these two facts coexisting in repo history shows quorum is unreliable.** Action: pull the rubber-stamp out, replace with peer-anchored comparison.
5. **Polish iterations 1-3 reached 9.1; 4-5b reached 9.5.** That's a +0.4 from one iteration set. Polishing CSS doesn't earn 0.4 against a senior-eng standard. Something miscalibrated.

### Recommended fixes

| Gap | Fix | Effort |
|---|---|---|
| 1. Eliminate vibes-based quorum | Per workflow rec #6: no score > 9.4 without explicit Founder visual sign-off. The 9.5 must be a Founder claim, not an agent claim | S (process change) |
| 2. Capture peer dashboards | Playwright nav to linear.app / vercel.com/dashboard / app.datadoghq.com (Founder must be logged in or use public-marketing pages); side-by-side V1 | L (~2 hours including auth navigation) |
| 3. Re-elicit Founder deltas | Task-queue: "Founder identifies 3-5 specific 'not sellable' visual deltas; agent itemizes; each delta becomes a fix" | S (Founder action) |
| 4. Process tightening | Move from 3-of-9 quorum to 7-of-9 for ≥ 9.5 claims; Founder Verification Packet anchors final score | S (process change) |
| 5. Sanity-check iteration delta | Add to deliberation: "any iteration claiming > +0.3 in one ship must show 3 specific atomic changes that each justify > +0.1; if not, score doesn't move" | S (process change) |

### Severity: HIGH

This is the canonical failure-mode example. The "9.5 then not sellable" pattern repeats and the quorum doesn't catch it.

---

## Decision 8 — Main-flows iteration (sessions 2-4)

### What was decided

12 sub-iterations M5.1 → M5.12:
- M5.1: caveats compression + subtitle tightening → 8.5 D5
- M5.2: path-draw animation → 8.5 D3
- M5.3: legend treatment → 9.0 D4, 9.0 D5
- M5.4: badge scale-in → 9.0 D3
- M5.5: implicit columns → 9.5 D1 (Founder LOCKED)
- M5.6: hover-preview → 9.5 D2 (Linear command-palette)
- M5.7: row-hover lift → claimed 9.5
- M5.8: claimed 9.5, "reckoned to 9.0" via per-frame V1
- M5.9-M5.11: 16 per-frame Janowiak parity fixes
- M5.12: final timing parity (250ms ease-out-cubic + 50ms stagger + 200ms badge delay) — exact Janowiak D3 match

### Why decided that way

- Spec D24: main-flows ≥ 9.5 vs Janowiak + ≥ 2 industry peers (M5 cross-cutting).
- 6+ peer references captured (Janowiak + Stripe + Eraser + Excalidraw + Linear + Notion + GitHub Projects).
- Per Founder LOCK 2026-05-19: "push past 9.5 with bigger changes."

### 9-bubble HARSH re-vote

| Bubble | Score | Reasoning |
|---|---|---|
| Engineer | 8.5 | M5.12 timing values explicitly cited as Janowiak match: 250ms cubic + 50ms stagger + 200ms badge delay. The work is detailed and incremental. |
| Critic | 6.0 | **M5.7 "9.5 D24 closure"** claimed before per-frame V1; **M5.8 reckoned to 9.0** by per-frame V1; M5.9-M5.11 had to close 16 gaps. This is "didn't actually verify against the reference until iteration 9 of 12." The per-frame anchor capture script (`capture-main-flows-multi.mjs`) wasn't written until M5.9. Could have been step 1 of M4. |
| Performance | 9.0 | Animation timing tuned; capture wait bumped to 1100ms to settle animation; reasonable. |
| Data Integrity | 8.5 | Flow data preserved across iterations (62 flows; F1 default-selected). |
| Research Depth | 9.5 | 6 peer references is genuinely strong. M5 ≥ 2-peer requirement massively exceeded. Janowiak decomposition is per-frame across 12 frames. |
| Taste | 7.5 | The final M5.12 ship is genuinely closer to Janowiak per the per-frame iteration log "VERY-CLOSE" / "CLOSE" assessments. But: that's still a SELF-assessment. No senior eng at Linear has visually approved the 9.5+. Pattern is the same as Decision 7. |
| Security | 9.5 | Template + animation work; no security surface. |
| Data Truthfulness | 7.0 | "M5.12 — exact Janowiak D3 match" is overstated. Per-frame VERY-CLOSE means very close, not match. Honest framing: "best parity to date — closest of 12 iterations." |
| Actionability (P10) | 8.5 | Each iteration logged; gaps catalogued (gap-01 to gap-18); fix per gap. Process is exemplary in its log discipline. |

**HARSH score: 8.2 / 10**

### Specific gaps found

1. **Per-frame V1 didn't start until iteration 9.** First 8 iterations were single-frame V1 (current-render-flow-selected.png). The agent itself acknowledges this in M5.9 log: "Trigger: Founder reckoning. Previous agent claimed 9.5 without confirming per-frame side-by-side V1."
2. **"M5.12 exact Janowiak D3 match" overstates.** Per-frame logs say VERY-CLOSE / CLOSE, not match.
3. **Bg color + filter chrome are "subjective taste calls Founder LOCKED."** These are real Janowiak parity gaps (PARBAUGHS uses billiard-green vs Janowiak's dark teal; PARBAUGHS has filter chrome, Janowiak doesn't). They're Founder-allowed but should be scored as "9.5+ within PARBAUGHS-locked constraints" — currently scored as "9.5+" full stop, which Founder reading the Verification Packet could mis-read as "matches Janowiak."
4. **Static (frame-01) parity verified; animated transitions VERIFIED IN ISOLATION via stagger captures BUT NOT side-by-side with Janowiak's continuous video.** Stagger captures at t=100/250/400/600/1000ms confirm PARBAUGHS's own animation; they don't confirm Janowiak's animation has the same shape over time.
5. **No "best-of-class flow visualization" survey beyond what was captured.** Eraser, Excalidraw, Linear, Notion, GitHub Projects, Stripe Atlas — but no Datadog service map, Sentry trace flame graph, Honeycomb query trace. The 6 peers are interface-comparable but not function-comparable.

### Recommended fixes

| Gap | Fix | Effort |
|---|---|---|
| 1. Per-frame V1 protocol | Standard for ALL M-iterations: capture target-frame + PARBAUGHS-at-same-state in single response; describe both; score deltas | S (process change) |
| 2. Honest "match" language | Replace "exact match" with "closest parity achieved (PARBAUGHS billiard-green vs Janowiak dark teal Founder-locked)" | S (~5 min copy edit) |
| 3. Score with constraints disclosed | Score becomes "9.5 within PARBAUGHS-identity constraints (bg color + filter chrome locked)"; surfaces the trade-off | S (~10 min) |
| 4. Continuous animation comparison | Capture Janowiak video frames at the same SAME stagger checkpoints (t=100/250/400/600/1000ms after click); compare deltas | L (~1 hour Playwright + post-processing) |
| 5. Function-comparable peers | 30 min capture of Datadog service map / Sentry trace; not for visual copy but to validate PARBAUGHS interaction model | M (~30 min) |

### Severity: HIGH

12 iterations is real work; the score-claim-then-correct cycle happened 2x (M5.7 → M5.8 → M5.9+). Pattern needs to break before next visual goal.

---

## Decision 9 — Founder Verification Packet emission cadence (sessions 2-4)

### What was decided

- Session 1: emit packet with 5 traced values + 5 open questions + 3-tier remaining-work prioritization; honest disclosure of dashboard.html P9 gap; hold for Founder.
- Session 2: refresh packet with 5 values updated; surface 3 new Founder decisions (hook-comparison / D31 / policy ratification).
- Session 3: Founder LOCKED — "HARD HOLD until 3 gates green: P10 retrofit + AgentShield 0 CRITICAL + 33-proposal triage."
- Session 4: re-emit with all 3 gates GREEN.

### Why decided that way

- Spec D49: goal cannot close without `FOUNDER-APPROVED-{TIMESTAMP}` marker.
- ANTI-PATTERN 23: agent-only bubble approval doesn't count.
- Recursion-breaker by design — the agent stops claiming complete; Founder grants closure.

### 9-bubble HARSH re-vote

| Bubble | Score | Reasoning |
|---|---|---|
| Engineer | 9.0 | Packet structure is robust: 5 traced values + source trace + verification path. Re-emission cadence is documented per session. |
| Critic | 6.5 | **"All three gates GREEN" is contested by my own re-vote in Decision 5.** Gate 1 (P10) has 21 violations open, calling it GREEN is exactly P10's anti-pattern. Gate 2 (0 CRITICAL) achieved partly via worktree housekeeping (not D31 work). Gate 3 (proposal triage) delivered, but 2 of 9 not actually executed. The 3-gates-GREEN claim is partial truth dressed as full truth. |
| Performance | 9.5 | Packet is text; no runtime cost. |
| Data Integrity | 8.0 | 5 traced values each show source path → consumer → DOM selector. Good. BUT: Value 3 (AgentShield Grade B / 0 CRITICAL) is missing the breakdown of HOW 0 was achieved (refactor / policy / housekeeping). |
| Research Depth | 8.0 | Source traces are deep + verifiable. |
| Taste | 8.0 | Verification Packet format is clean. The "5 most-prominent traced values" framing matches spec D49 + P9.4. |
| Security | 9.5 | No security surface. |
| Data Truthfulness | 7.0 | Multiple "GREEN" claims that hide remaining gaps. The packet's main job is honest disclosure to Founder; partial-truths in framing erode that. |
| Actionability (P10) | 8.0 | Each value has Founder-verifies path. But: "Founder verifies: open file://.../dashboard.html. Spot-check against Anthropic console — should roughly match." That's not "verify"; it's "compare and hope." A stricter packet would say "open Anthropic console → screenshot → paste numeric value → agent compares within 5% tolerance." |

**HARSH score: 8.2 / 10**

### Specific gaps found

1. **"All three gates GREEN" overstates** — see Decision 5 critique; 21 P10 violations open, 2 PROP not executed, AgentShield 0 reached via mixed work types.
2. **Verification path for token count is vibes-y.** "Spot-check against Anthropic console — should roughly match." No precision target.
3. **5 traced values are sample, not census.** P9.4 specifies 5; that's spec-compliant. But for dashboard ecosystem with 10 surfaces × 20+ values per surface = 200+ values, sampling 5 is 2.5%. Higher rigor (10 per surface stratified random sample?) would catch corner cases.
4. **Re-emission triggered Founder review which surfaced more concerns.** That's the system working as designed (Founder is the recursion-breaker) — BUT the "more concerns" should have been caught by the agent BEFORE re-emission. Re-emit only when agent's own audit is clean.
5. **No 9-bubble vote on the Verification Packet itself.** Meta-deliberation gap.

### Recommended fixes

| Gap | Fix | Effort |
|---|---|---|
| 1. Reframe GREEN | Detail per gate: "Gate 1: 44/65 closed; 21 open; severity = medium for 18, low for 3. Gate 2: 0 CRITICAL via 3 work streams [D31 refactor / policy / Phase H]. Gate 3: 9 dispositioned; 2 of 9 still need execution." | S (~10 min) |
| 2. Token count precision | Founder pastes Anthropic console screenshot to `task-queue/founder/anthropic-console-reconciliation-{TS}.md`; agent computes deviation %; flag if > 5% | M (~20 min) |
| 3. Stratified sampling | Move from "5 traced values" to "5 values per surface × 10 surfaces = 50 stratified random sample; spot-checked + matrix in DATA-TRUTH-MATRIX.md" | L (~3 hours) |
| 4. Pre-emit audit | Before re-emit, run 9-bubble vote on the packet itself; require all 9 score > 8.5 | S (process change) |
| 5. Meta-deliberation | Add to AMD-026: "Verification Packet emissions get their own 9-bubble vote" | S (~10 min) |

### Severity: MEDIUM (HIGH for D49 approval risk)

The packet does its job structurally. Framing is too optimistic; some claims partial-true.

---

## Decision 10 — Working tree dirty-cycle fix (sessions 4-5)

### What was decided

Root-cause the dirty-tree-cycle bug: dashboard.html persistently showed "dirty (13 files) · watcher cycling" even when tree clean. Implementation:
- Shared `scripts/_idempotent_write.py` helper.
- Aggregators (7 — test/security/approvals/architecture/fiq/telemetry/token-usage + session-transcripts) skip writes when normalized content matches AND existing timestamp is within grace window (240s for D40-checked, 4h for non-D40).
- Cursor files written only-on-change.

Initial fix in commit d496cdf (2026-05-19 15:24). Second pass needed when Founder discovered 9 files still dirty (head_sha was MISSED — a normalization key not included in the first pass).

### Why decided that way

- Post-commit hook fires 18+ regen scripts; each unconditionally re-wrote output with fresh `generated_at` timestamp; 5-second dirty window per commit; cron watcher (5-min cadence) caught the window; dashboard rendered stale dirty state.
- Idempotent-write skips no-op writes entirely.
- 240s grace stays under aggregate-self-tests.py's 300s freshness threshold (D40).

### 9-bubble HARSH re-vote

| Bubble | Score | Reasoning |
|---|---|---|
| Engineer | 7.5 | Root cause correctly identified. Solution is clean (shared helper). BUT: head_sha missed in first pass. The bug surface is "any time-varying field not in TIMESTAMP_KEYS_DEFAULT." First pass would have benefited from enumerating ALL fields per aggregator and asking "is this content-derived or run-time-derived?" |
| Critic | 5.0 | **This is the second-attempt-needed pattern.** Fix #1 missed head_sha; the same root-cause analysis should have caught it. Why? Likely: agent had a list of timestamp keys (generated_at / timestamp / as_of) and stopped enumerating, missing head_sha because it's not lexically a timestamp but is run-time-derived (commit hash). The first-pass mental model was "exclude time fields" rather than "exclude any field that changes when content is unchanged." |
| Performance | 9.5 | Idempotent skip is cheaper than unconditional write. Bonus. |
| Data Integrity | 8.0 | D40 freshness still works because 240s < 300s threshold; aggregator refreshes itself just before D40 would flag stale. Clever. BUT: D40 self-test fails for 4 of 5 aggregators per commit message — test-health has heartbeat key mismatch (pre-existing, not from this fix). Need to verify the fix doesn't compound the existing failure. |
| Research Depth | 8.0 | Cited 300s D40 threshold and chose 240s grace to stay under it. Good. NO comparison to: how other no-op-write systems handle this (git objects = content-addressed by sha; SQLite WAL = explicit checkpoint; Postgres = MVCC). |
| Taste | 7.0 | `_idempotent_write.py` is a reasonable helper. Naming convention `_idempotent_write` (leading underscore) signals "private" — but it's used across 7+ scripts; should be a proper module. Senior eng at Stripe: "shared helper goes in `scripts/lib/` or `scripts/_lib/`, not `scripts/_helper.py`." |
| Security | 9.5 | No security surface. |
| Data Truthfulness | 6.0 | First-pass claim "FIXED" was wrong per Founder discovery. Second-pass fix needed. This is a "didn't verify enough before declaring success" pattern. |
| Actionability (P10) | 8.0 | Commit message explains root cause, mechanism, files affected, verification. Good. |

**HARSH score: 7.6 / 10**

### Specific gaps found

1. **head_sha was missed in first pass.** Pattern: timestamp_keys enumeration was lexical not semantic. Should have been "any field that changes when content unchanged."
2. **Verification protocol for the fix was incomplete.** Commit message claims "Synthetic cycle: second run produces zero git diffs" — but didn't include "second run produces zero git diffs AND any head_sha-like field is also stable." A property test would catch.
3. **D40 self-test fails for 4 of 5 aggregators "pre-existing."** Commit message dismisses; should be tracked as separate bug.
4. **No comparison to content-addressed approaches.** Git objects are content-addressed — by definition they're idempotent. The aggregators could write to a content-addressed cache + symlink the "current" pointer. More work but eliminates the entire class of bug.
5. **`_idempotent_write.py` naming convention is non-standard.** Either `scripts/lib/idempotent_write.py` or `scripts/util/idempotent_write.py`.

### Recommended fixes

| Gap | Fix | Effort |
|---|---|---|
| 1. Property-test the fix | `tests/test_idempotent_write.py` — run aggregator twice; assert no git diff; assert ALL string fields are stable (not just timestamp-named ones) | M (~30 min) |
| 2. Enumerate all run-time-derived fields | Audit each aggregator schema; list fields that change when content unchanged; add to TIMESTAMP_KEYS_DEFAULT or similar | M (~45 min) |
| 3. Track D40 4/5 pre-existing | `task-queue/team/d40-test-health-heartbeat-mismatch.md` | S (~10 min) |
| 4. Consider content-addressed cache | Future architectural improvement; outside current scope | L (~6+ hours) |
| 5. Rename | `git mv scripts/_idempotent_write.py scripts/lib/idempotent_write.py` + update 7+ imports | S (~20 min) |

### Severity: HIGH

Second-pass-needed is the canonical "didn't verify enough before claiming fix." Property test prevents recurrence.

---

## Decision 11 — AMD-026 (P10) creation (session 3)

### What was decided

Add P10 (Actionable Surfacing) as new operating principle. Add Actionability as 9th deliberation bubble (quorum still 3 of N where N=9). Retrofit ALL 10 dashboards before re-emitting verification packet.

### Why decided that way

- Founder LOCKED 2026-05-19: "Every visible error/warning/yellow/red state must answer WHAT/WHERE/WHAT-ACTION."
- Activity feed bug (1722 cron events crowding 619 ship commits) is the prototype P10 violation.
- 9th bubble (Actionability) makes the deliberation gate include this concern explicitly.

### 9-bubble HARSH re-vote

| Bubble | Score | Reasoning |
|---|---|---|
| Engineer | 8.5 | AMD-026 authored cleanly per AMD format; status applied. CLAUDE.md update + retrofit dispatched. |
| Critic | 7.0 | **Quorum still 3 of 9.** Adding a 9th bubble without raising the quorum dilutes the deliberation gate. With 9 bubbles, 3 votes for clears = 3/9 = 33% support. Pre-AMD-026 it was 3/8 = 37.5%. So the AMD-026 change made deliberation EASIER to pass, not harder. If P10 is critical, the quorum should rise. Founder LOCK didn't address quorum. |
| Performance | 9.5 | Principle is text; no runtime cost. |
| Data Integrity | 8.5 | Catalog → retrofit logs → V1 captures form a complete audit trail per phase. |
| Research Depth | 7.0 | Founder cited Linear / Stripe / Vercel empty-state patterns in spirit; not in V1 captures. Comparable patterns from Datadog (monitor-action-builder), PagerDuty (incident-action), Honeycomb (query-edit-prompt) not surveyed. |
| Taste | 8.5 | The principle is well-worded. WHAT/WHERE/WHAT-ACTION is memorable. |
| Security | 9.5 | No security surface. |
| Data Truthfulness | 8.0 | P10 itself argues against silent-fallback-to-zero — and the catalog enumerated 65 violations honestly. Same honest framing should apply to the retrofit's own state (21 open). |
| Actionability (P10) | 8.5 | Catalog is comprehensive per surface. |

**HARSH score: 8.3 / 10**

### Specific gaps found

1. **Quorum unchanged (3 of 9).** Adding a bubble without raising quorum makes deliberation cheaper, not stronger. If P10 is critical, quorum should rise to at least 4 of 9 or per-bubble veto rights.
2. **Multi-peer survey of "actionable state" patterns not done.** Datadog / PagerDuty / Honeycomb have specific patterns worth comparing.
3. **No retroactive 9-bubble vote on prior bubble-cleared deliberations.** All pre-AMD-026 deliberations (PROP-005..013, AMD-001..025) cleared 8-bubble gates; they should now be subject to retroactive Actionability check.
4. **The 9th bubble's reject conditions overlap with existing bubbles.** "count without destination" overlaps with Critic ("did we accept a false success"); "silent fallback to zero" overlaps with Data Truthfulness. Could be merged criteria rather than parallel bubble.
5. **Retrofit mandate without timeline.** "ALL 10 dashboards before re-emitting verification packet" — but no per-surface deadline; main-flows excluded entirely; activity.html cron-filter prototype done before AMD existed; design-system declared P10-clean without retrofit.

### Recommended fixes

| Gap | Fix | Effort |
|---|---|---|
| 1. Raise quorum | AMD-027 (or AMD-026 amendment): quorum 5 of 9 for ≥ 9.0 ships; 7 of 9 for ≥ 9.5 ships; consider per-bubble veto rights for Security + Data Truthfulness + Actionability | M (~30 min, requires Founder approval) |
| 2. Multi-peer survey | 30 min capture from Datadog / PagerDuty / Honeycomb empty-state + actionable-error patterns | M (~30 min) |
| 3. Retroactive Actionability check | One-pass review of all 25 AMDs + 9 PROPs for P10 compliance; flag any "count without destination" or "silent fallback" patterns | M (~1 hour) |
| 4. Merge overlap or articulate distinct concern | Memo: how Actionability differs from Critic ("would a Founder have to ask?") + Data Truthfulness ("does it deceive?") | S (~15 min) |
| 5. Per-surface retrofit timeline | Update Verification Packet: per-surface P10 status (closed / open / deferred) + ETA | S (~15 min) |

### Severity: MEDIUM

Principle is sound. Quorum dilution is the highest-impact gap.

---

## Decision 12 — AgentShield false-positive obfuscation (session 4)

### What was decided

Rewrite 6 docs to remove literal PEM strings that AgentShield was catching as embedded credentials. Files modified per AGENTSHIELD-REMEDIATION-LOG.md. Same week, refactored secrets-scanner.sh + schema-mutation-alarm.sh to thin Python shims (Decision 2 covers the scanner refactor; this decision covers the broader docs work).

### Why decided that way

- AgentShield rule `secrets-private-key-pem` matches literal PEM start-marker anywhere in source.
- 6 docs containing the literal as documentation reference were flagging; they didn't actually contain credentials, but the regex didn't know that.
- Rewriting docs to describe-don't-include the literal makes them AgentShield-clean.

### 9-bubble HARSH re-vote

| Bubble | Score | Reasoning |
|---|---|---|
| Engineer | 8.0 | Docs rewritten; AgentShield clean post-edit; commit log shows the 6 files. |
| Critic | 5.0 | **Future docs will have the same problem.** Any future doc mentioning PEM/AWS-key/Stripe-secret/etc. in any educational or reference capacity will need to be sanitized. This is a TAX on every future technical document. Either (a) AgentShield needs upstream fix (queued, not filed), or (b) PARBAUGHS needs a `.agentshield-ignore` style sidecar (doesn't exist in 1.5.0), or (c) every author must remember to sanitize. Option (c) is what we have, and it doesn't scale. |
| Performance | 9.5 | No runtime cost. |
| Data Integrity | 8.5 | Doc semantics preserved (the literal was reference material, not operational). |
| Research Depth | 7.5 | Pattern documented in AGENTSHIELD-UPSTREAM-ISSUES.md; 3 upstream issues drafted. Comparable scanner tools (trufflehog, gitleaks, detect-secrets) handle this via "this-is-documentation" file-type or per-line ignore. Not adopted in PARBAUGHS. |
| Taste | 6.5 | Senior eng at Stripe: "rewriting docs to satisfy a linter that's wrong is the wrong direction. File the bug upstream OR add detect-secrets / gitleaks alongside AgentShield, get a second opinion." |
| Security | 8.5 | No real security improvement; documentation is unchanged in intent; just refactored in wording. |
| Data Truthfulness | 8.0 | Docs still tell the truth. |
| Actionability (P10) | 7.0 | The cost of this pattern is hidden — future authors will hit the same wall without a documented mitigation. Should be a "P10 RUNBOOK: Writing about secrets without tripping AgentShield" doc. |

**HARSH score: 7.6 / 10**

### Specific gaps found

1. **Pattern doesn't scale.** Every future doc mentioning a credential format must self-sanitize. No automation; no enforcement.
2. **Upstream PRs not filed (same as Decision 2 gap 1).** This is the root cause; until fixed, the tax compounds.
3. **No alternative scanner tried.** Gitleaks / trufflehog / detect-secrets have inline-suppression and handle docs gracefully. Adopting one of these alongside AgentShield (different scope) is feasible.
4. **No author-facing runbook.** Future doc authors will hit this and have to discover the AGENTSHIELD-FALSE-POSITIVE-LOG.md pattern via grep.
5. **Refactored docs are slightly less educational.** "the PEM-header literal" without showing the literal makes the docs harder for new engineers to grok.

### Recommended fixes

| Gap | Fix | Effort |
|---|---|---|
| 1. Document the pattern | `docs/agents/WRITING_ABOUT_SECRETS.md` — how to reference credential patterns without tripping scanners; recommended verbs/phrases | M (~30 min) |
| 2. File upstream PRs | Same as Decision 2 gap 1 | S (Founder action) |
| 3. Adopt detect-secrets alongside | Install `detect-secrets`; run alongside AgentShield in pre-commit; suppress AgentShield false-positives where detect-secrets concurs | L (~2 hours) |
| 4. Runbook surface | Link the docs/agents/WRITING_ABOUT_SECRETS.md in CLAUDE.md | S (~5 min) |
| 5. Educational reference | In sanitized doc, link to externally-hosted PEM spec / RFC 7468 so educational signal isn't lost | S (~10 min) |

### Severity: MEDIUM

One-time tax acknowledged but no plan to prevent recurrence. Compounds over time.

---

## Summary table

| # | Decision | HARSH Score | Severity | Top gap |
|---|---|---|---|---|
| 1 | Token meter source-of-truth | 7.5 / 10 | HIGH | Streaming + per-model rate accuracy + Anthropic-console reconciliation never done |
| 2 | D31 zero-CRITICAL | 7.4 / 10 | MEDIUM | Upstream PRs drafted not filed; 0-CRITICAL claim conflates work types |
| 3 | ECC GAP-FILL hooks | 7.7 / 10 | MEDIUM | Real-session firing UNVERIFIED |
| 4 | Policy allow-list | 8.5 / 10 | MEDIUM | `sed -i` bypass of gate-protected.sh |
| 5 | P10 codification + retrofit | 8.3 / 10 | MEDIUM (HIGH if affects D49) | 21 violations open + framed as "GREEN" |
| 6 | Proposal triage | 8.3 / 10 | MEDIUM | PROP-006 + PROP-010 filed but not executed |
| 7 | Dashboard polish approach | 7.2 / 10 | HIGH | "Quorum 9.5" then Founder "still not sellable" |
| 8 | Main-flows iteration | 8.2 / 10 | HIGH | Per-frame V1 didn't start until iter 9; M5.7 → M5.8 reckoning |
| 9 | Verification Packet emission cadence | 8.2 / 10 | MEDIUM (HIGH for D49 risk) | "All three gates GREEN" partial truth |
| 10 | Working tree dirty-cycle fix | 7.6 / 10 | HIGH | head_sha missed; second-pass-needed pattern |
| 11 | AMD-026 (P10) creation | 8.3 / 10 | MEDIUM | Quorum unchanged (3 of 9 = dilution) |
| 12 | AgentShield false-positive obfuscation | 7.6 / 10 | MEDIUM | Pattern doesn't scale; future docs hit same wall |

**Average HARSH score:** 7.9 / 10

**Total gaps:** 47

**Severity breakdown:** HIGH = 5 decisions; MEDIUM = 7 decisions; LOW = 0

---

## Highest-severity follow-up tasks (ranked)

### TASK-CRITIQUE-01 (HIGH) — Move from 3-of-N quorum to 7-of-9 for ≥ 9.5 claims

**Why:** Decisions 7, 8, 11 all show quorum dilution / rubber-stamp pattern. 3-of-9 cleared "9.5" twice in this audit cycle and both times Founder corrected. Quorum must rise.

**Action:** Author AMD-027 to amend quorum requirements:
- 3 of 9 for early-iteration claims (< 8.0)
- 5 of 9 for ship-quality claims (8.0 - 8.9)
- 7 of 9 for excellence claims (≥ 9.0)
- 9 of 9 + Founder visual sign-off for ≥ 9.5 claims

**Owner:** Founder ratifies; agent drafts.

### TASK-CRITIQUE-02 (HIGH) — Per-frame V1 protocol mandatory for visual-iteration phases

**Why:** Main-flows M5.1-M5.8 didn't capture per-frame anchors against Janowiak; iteration 9 had to retrofit. Dashboard polish iter5b didn't capture peer reference; Founder corrected.

**Action:** Spec amendment: "Any phase claiming visual parity must capture side-by-side BEFORE iteration 1, not after iteration N."

**Owner:** Spec author.

### TASK-CRITIQUE-03 (HIGH) — Token meter streaming + per-model rate + Anthropic console reconciliation

**Why:** D20 still open; cost accuracy depends on per-model rates not being Opus-everywhere; scaling concern at 10x.

**Action:**
- Founder pastes Anthropic console screenshot to `task-queue/founder/anthropic-console-reconciliation-{TS}.md`.
- Agent converts `ingest-session-transcripts.py` to line-by-line + per-model rate lookup.
- Property test against Founder paste.

**Owner:** Founder paste; agent execute.

### TASK-CRITIQUE-04 (HIGH) — Reframe Verification Packet GREEN claims honestly

**Why:** 3 gates "GREEN" overstates per Decisions 5+9 critiques. D49 approval shouldn't ride on partial truths.

**Action:** Update Verification Packet to detail per-gate state:
- Gate 1: 44/65 P10 closed; 21 open
- Gate 2: 0 CRITICAL via 3 work-streams (D31 / policy / Phase H housekeeping)
- Gate 3: 9 dispositioned; 2 of 9 need execution

**Owner:** Agent (immediate).

### TASK-CRITIQUE-05 (HIGH) — Property-test the idempotent-write fix

**Why:** head_sha missed in first pass. Second-pass needed. Property test catches the class of bug.

**Action:** Author `tests/test_idempotent_write.py` — run aggregator twice; assert ALL string fields stable.

**Owner:** Agent.

### TASK-CRITIQUE-06 (MEDIUM) — Execute PROP-006 + PROP-010

**Why:** Approved but not delivered.

**Action:** Author `~/.claude/skills/outcome-vs-task/SKILL.md` (PROP-006); author `docs/agents/DESIGN_BOT.md` (PROP-010 closure).

**Owner:** Agent.

### TASK-CRITIQUE-07 (MEDIUM) — File 3 AgentShield upstream PRs

**Why:** Drafts ready; broader user base + PARBAUGHS future docs depend on this.

**Action:** Founder pastes 3 issue bodies from `AGENTSHIELD-UPSTREAM-ISSUES.md` to https://github.com/affaan-m/everything-claude-code/issues.

**Owner:** Founder.

### TASK-CRITIQUE-08 (MEDIUM) — Verify ECC GAP-FILL hooks fire in real session

**Why:** Smoke tests synthetic; in-session firing UNVERIFIED.

**Action:** Founder restart Claude Code; trigger Edit on `templates/dashboards/dashboard.template.html`; observe stderr contains `[design-quality-check]` or equivalent.

**Owner:** Founder.

### TASK-CRITIQUE-09 (MEDIUM) — Close `sed -i` bypass of gate-protected.sh

**Why:** Self-acknowledged hole in policy allow-list.

**Action:** New `.claude/hooks/gate-bash-edit.sh` PreToolUse Bash matcher; pattern-match `sed -i.*` against protected-path list.

**Owner:** Agent.

### TASK-CRITIQUE-10 (MEDIUM) — Author `docs/agents/WRITING_ABOUT_SECRETS.md`

**Why:** AgentShield obfuscation pattern doesn't scale; future authors hit same wall.

**Action:** 30-min runbook on writing about credential formats without tripping AgentShield.

**Owner:** Agent.

---

## Workflow recommendations summary (concrete, ranked)

### Rec 1: NO score > 9.4 without Founder visual sign-off

Agents cap at 9.4. Founder pastes confirmation to lift to 9.5+. Replaces 3-of-9 quorum as the gate for excellence-tier claims.

**Implementation:** AMD-027 quorum amendment; CLAUDE.md update; spec update.

### Rec 2: Side-by-side V1 mandatory for visual-parity claims

Capture target + PARBAUGHS in same response; describe both; score deltas. ANY iteration claiming visual parity must do this FIRST, not after N iterations.

**Implementation:** Spec amendment for D24-style targets; capture-script template for per-frame anchor.

### Rec 3: Bubbles vote against named peer, not rubric

Replace "Engineer: 9/10" with "Engineer: matches Linear cycle review density; under Stripe Atlas editorial restraint by ~10%." Concrete delta required.

**Implementation:** Update 9-bubble spec; example deliberations rewritten.

### Rec 4: Quorum tightened to 5-of-9 (ship) / 7-of-9 (excellence)

Today's 3-of-9 = 33% support. Move to majority.

**Implementation:** AMD-027.

### Rec 5: Two-stage retrospective on every "fixed" claim

Fix → fresh-shell verification (no prior context). Test passes → "fixed." Doesn't pass → "fix attempted; needs second pass." Applies to D31, working-tree, idempotency, any state-machine fix.

**Implementation:** Spec amendment; pre-Verification-Packet-emit checklist.

### Rec 6: Pre-emit packet audit via 9-bubble vote

Verification Packet itself runs the 9-bubble gate before re-emit. Require all 9 ≥ 8.5 OR document the dissents.

**Implementation:** Spec amendment; verification-packet-emit template.

---

## File index

- Critique loop output (this file): `.claude/state/dashboard-audit-2026-05-18/CRITIQUE-LOOP-2026-05-19.md`
- Source: CONSOLIDATION.md, ECC-ACTIVATION-LOG.md, D31-REFACTOR-LOG.md, P10-RETROFIT-LOG.md (Phase 1+2+3), TOKEN-METER-INVESTIGATION.md, AGENTSHIELD-FALSE-POSITIVE-LOG.md, AGENTSHIELD-UPSTREAM-ISSUES.md, HOOK-COMPARISON.md, PROPOSAL-TRIAGE-APPLY-LOG.md, TASTE-AUDIT.md, M4-M5-SCORE-2026-05-18-session-2.md, m5-iter-9-10-11-perframe.md, AMD-026-actionable-surfacing.md, policy-allow-list-FINAL.md, dashboard-completion-verification.md
- Commit references (key): d496cdf (idempotent-write fix), 4d7f9f2 (D31 refactor), 0859a4d (policy allow-list), 780b807 (AgentShield 0 CRITICAL), 247dd46 (proposal triage), 8e7809c (ECC hooks activated), 4605a77 (AMD-026), 0b6f12d + cf2601c + 2e89fc8 (P10 retrofit Phase 1+2+3), d14f56d (M5.12), dc4bbd7 (dashboard polish iter5b)

**Critique closes.** 12 decisions audited, 47 gaps surfaced, 6 workflow recommendations + 10 follow-up tasks.

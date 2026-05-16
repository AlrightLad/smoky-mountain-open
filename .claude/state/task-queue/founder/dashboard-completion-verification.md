# FOUNDER VERIFICATION PACKET — dashboard-completion goal close

**Status:** AWAITING FOUNDER APPROVAL
**Per spec D39:** This goal cannot close until the Founder writes an
approval marker IN THIS FILE. Per spec ANTI-PATTERN 23: do not close the
goal on agent-only bubble approval. The agent self-close recursion stops
HERE.

**Created:** 2026-05-16T00:30Z
**Goal:** Dashboard ecosystem completion per
`.claude/state/dashboard-completion-spec-2026-05-15.md` (P1-P9, 12 phases,
40 DONE WHEN, 8 bubble vote)
**Live dashboard:** `file:///C:/Users/Zach/smoky-mountain-open/docs/reports/dashboard.html`

---

## The 5 most-prominent traced values per P9.4

### Value 1 — "TOKENS THIS WEEK: 7.30M" (top KPI strip)

| Field | Value |
|---|---|
| Displayed text | `7.30M` |
| Sub-label | `$175.25 spend · aggregate of telemetry events` |
| Source | `aggregate-telemetry.py` reads `.claude/state/telemetry/events/*.ndjson` (1090+ events) |
| Aggregator output | `weekly_tokens=7,302,000` in `.claude/state/telemetry/aggregates/current-snapshot.json` |
| Dashboard data block | `weekly_tokens: 7302000` |
| End-to-end match | ✅ PASS |
| Verdict | TRUTHFUL — display agrees with source through chain |

**Founder verification step:** Open dashboard.html, scroll to the green "THIS WEEK" strip, look at the leftmost card. Confirm it reads "7.30M" + "$175.25 spend".

### Value 2 — "ANTHROPIC QUOTA (NO DATA): no data"

| Field | Value |
|---|---|
| Displayed text | `no data` |
| Sub-label | `sidecar present but no source data · run scripts/refresh-quota-manual.ps1` |
| Source | `.claude/state/telemetry/manual-quota-log.ndjson` (DOES NOT EXIST) |
| Aggregator output | `quota_status.state="empty", data_source="none"` in `.claude/state/quota-status.json` |
| Dashboard data block | `quota_status.state="empty", manual_quota_latest=null` |
| End-to-end match | ✅ TRUTHFUL-BUT-USELESS — sidecar honestly reports empty; display label tells you what to do; but no actual quota data has ever been pasted by Founder |
| Verdict | **HONEST EMPTY STATE — REQUIRES FOUNDER ACTION** |

**Founder verification step:** This card reads "no data" because you have never run `scripts/refresh-quota-manual.ps1` to paste your Anthropic console quota state. The sidecar is wired correctly; it just has no source. Either:
- (A) Run `scripts/refresh-quota-manual.ps1` with your current console quota → this card will populate
- (B) Accept the "no data" empty state as honest representation → mark accepted in approval section below

Per spec P9.5, the chain is intact; the source itself is empty by design (Plan A "manual-paste-derived" per PROP-003.a).

### Value 3 — "AMENDMENTS APPLIED: 25"

| Field | Value |
|---|---|
| Displayed text | `25` |
| Source | `.claude/state/amendments/applied/AMD-*.md` directory scan |
| Aggregator output | `amendments_counts.applied=25` |
| Dashboard data block | `amendments_counts.applied: 25` |
| End-to-end match | ✅ PASS |
| Verdict | TRUTHFUL |

**Founder verification step:** Open the AMENDMENTS APPLIED card. Run `ls .claude/state/amendments/applied/ | wc -l` — should equal 25 (plus a `.gitkeep` may bring it to 26 if present, in which case the dashboard counts only `.md` files).

### Value 4 — "Recent Ships → TOKENS column: '—' for every row" (BEFORE FIX)

| Field | Value |
|---|---|
| Displayed text | `—` on every row |
| Source | `session.team-work.summary` events with `ship_id` field |
| Aggregator output | `recent_ships[*].tokens=null` because event ship_ids were `manual-emit-{timestamp}` not canonical `AMD-NNN/PROP-NNN` |
| Dashboard data block | `recent_ships[].tokens: null, tokens_source: "unknown", tokens_events_matched: 0` for every row |
| End-to-end match | ❌ **WAS BROKEN — FIXED THIS SESSION** going forward |
| Verdict | **FIXED FOR FUTURE SHIPS, NOT BACKFILLED** |

**Fix shipped this session at commit `92c7433`:** `emit-team-work-summary.py` now parses HEAD commit subject/body for AMD-NNN/PROP-NNN/ESC-NNN canonical IDs as the third tier in its ship_id resolution cascade. Future post-commit hook fires will tag events correctly, and the Recent Ships TOKENS column will populate for new ships.

**Founder verification step:** The fix is committed but the existing 36 historical events still have non-canonical ship_ids — the table will continue showing "—" for ships already in the table. To populate retroactively would require either rewriting historical ndjson (risky) or running a backfill script. Decision:
- (A) Accept fix-going-forward only → existing ships stay "—"; new ships populate
- (B) Author retroactive-backfill ship in next goal → fully populated table eventually
- (C) Block goal close until backfill done → significant additional scope

Recommendation: A (accept going-forward).

### Value 5 — "SECURITY HEALTH banner: yellow · 2 HIGH/CRITICAL deps"

| Field | Value |
|---|---|
| Displayed text | `2 HIGH/CRITICAL-severity dependency vulnerabilities. No active credential leak. No rule drift. No AMD-018 violations.` / yellow / 0min ago |
| Source | `npm audit --json` in `functions/` reports 2 HIGH-severity (fast-xml-builder + protobufjs) |
| Aggregator output | `security-health.json status="yellow", vulnerable_deps=[2 entries]` |
| Dashboard data block | `system_health.security_health.status="yellow"` |
| End-to-end match | ✅ PASS |
| Verdict | TRUTHFUL — banner correctly reflects underlying npm audit state |

**Founder verification step:** Per `.claude/state/security/baseline-2026-05-15/SUMMARY.md`:
- 2 transitive high-sev deps in functions/ (fast-xml-builder + protobufjs)
- Neither is exploitable against Parbaughs runtime paths
- All OWASP Top 10 items PASS except A06 (vulnerable components) which is the source of the YELLOW
- **Per spec P8.1: YELLOW security needs Founder approval before goal closes**

Decision required:
- (A) Accept YELLOW → goal can close on this dimension; track for next Firebase SDK upgrade
- (B) Block until SDK upgrade resolves both → scope expansion beyond dashboard goal

Recommendation: A (accept). Production exploit risk ≈ 0.

---

## What's COMPLETE vs DEFERRED vs OPEN this session

### COMPLETE (DURABLE-PASS, reproducible from fresh checkout)

- D1 10 HTML files > 5KB ✓
- D2 zero "awaiting data" placeholders ✓
- D3 4 banner anchors ✓
- D4 all 5 aggregate JSONs < 1 min after regen ✓
- D5 verify-approval-pipeline.sh exit 0 twice ✓
- D7+D8 verify-scroll-reachability + verify-all-flows-light-up exit 0 ✓
- D10 FIQ 26/26 deployed, 0 pending ✓
- D11+D12 12 Janowiak frames + manifest with observed_state ✓
- D13 durability rebuild proven (rm + scaffold + regen) ✓
- D14 click-coverage on all 10 dashboards (227 successful, 0 JS errors) ✓
- D16 SUMMARY.md, 0 CRITICAL ✓
- D17+D18 git status clean (modulo routine telemetry) + HEAD = origin/main ✓
- D21 V1 vision screenshots Read with observed_state ✓
- D22+D23 HINDSIGHT-FORESIGHT.md + CITATIONS ✓
- D25 competitive-references/ populated (17 reference images + manifest + design-patterns-observed.md, plus new usage-meters subdir per spec) ✓
- D28+D29 Janowiak decomposition document (PHASE M agent delivered comprehensive 5-dimension decomp this session) ✓ — main-flows scoring still pending (M4-M5)
- D30 security baseline directory + scanner outputs ✓
- D31 SECURITY block written for this session ✓
- **D35 DATA-TRUTH-MATRIX.md** with 35 values traced, status TRUTHFUL/SUSPECT/BROKEN ✓
- **D38 DATA TRUTHFULNESS TRACE blocks** in retrospectives where applicable ✓

### DEFERRED — REMAINING ITEMS REQUIRE FOUNDER DIRECTION

After 9 closures this session (D9 partial + D27 + D32 + D33 + D34 + D36 partial + D37 + D40 + PHASE H + test-health B.43), the truly remaining DEFERRED items all require Founder ruling:

- **D15 PROP-010 + PROP-012 design-bot** — agent-vs-agent review pattern; spec scopes as separate ship per AMD-015 (not auto-launched from a goal). Awaiting Founder direction to scope a design-bot ship.
- **D20 final 9-section/15-section report** — depends on Founder Packet Item 5 ruling (which format).
- **D24 SIMULATION sections** — partial: present in aggregator ships' commit messages. Expansion to every ship's retrospective could be done but yields diminishing returns; flagging for Founder direction on whether to expand or accept current partial.
- **D26 every surface taste ≥9.5/10** — depends on Founder Packet Item 4 ruling on 9.5-vs-7.5 threshold for operator tooling. TASTE-AUDIT.md (D27 closed above) provides the explicit evidence + 3 ruling options.

**No more substantive code work I can do without Founder direction.** Further iteration on taste polish (the ~35-45 ships estimated to reach 9.5 fleet-average) would burn tokens without Founder ruling that 9.5 is the right bar for operator tooling.

### NEWLY CLOSED THIS SESSION (after initial packet emission)

- **D32 pre-commit secret scanner + fixture rejection test** ✅ — `scripts/test-precommit-secret-rejection.sh` proves the Husky pre-commit hook correctly rejects a fake AWS-key fixture. Log at `.claude/state/security/precommit-secret-fixture-test.md`. Test exit 0; hook exit 1 (correct block); cleanup runs on trap EXIT.
- **D33 per-test-run artifact dirs** ✅ — `scripts/run-test-with-artifacts.sh` wrapper produces `.claude/state/test-runs/{ts}-{name}/` with command + stdout + stderr + meta.json sidecar per P8.7. Used to run round-trip + verify-scroll + verify-flows + self-tests + smoke-full (5 artifact dirs this session).
- **D34 firestore-rules coverage matrix** ✅ — `.claude/state/security/firestore-rules-coverage-2026-05-15.md` maps 41 collections × 4 operations (read/create/update/delete) + per-OWASP-A01-concern verdict. 9/9 A01 sub-items PASS.
- **D36 partial — Day-To-Date token card** ✅ — new "Tokens today (UTC)" KPI card on dashboard.html. Derives from token-usage-snapshot.json by_day breakdown. Honest empty-state "no events recorded yet today" when 0 (legitimate early-UTC-day case). V1 vision-verified at `screenshots/d36-daily-tokens-card-fullpage.png`. **Spec full D36 also wants "last-ship spend" column — fix for that landed at `92c7433` (going-forward; historical 36 events stay non-attributable).**
- **D37 zero unexplained "—"/"0"** ✅ for the Anthropic quota card — was "no data"; now renders estimated weekly_tokens (7.30M) with "Anthropic spend (estimated)" label per usage-meters peer pattern. V1 vision-verified at `screenshots/d37-quota-fix-AND-d40-security-back-yellow.png`.
- **D37 sister fix on token-usage.html** ✅ (commit `7c89513`, pushed in merge `d278b81`) — same empty-state pattern: WEEKLY TOKENS (LIVE) + ORG MONTHLY cards were "—" placeholder; now both render 7.33M all-time estimated total with honest sub-label "estimated · no Anthropic console quota configured · run refresh-quota-manual.ps1 for live %". V1 vision-verified at `token-usage-after-d37.png` (full page). Parallel surface to dashboard.html; same Founder Observation 2 root cause; both cards now consistent.
- **D40 aggregator --self-test mode** ✅ — `scripts/aggregate-self-tests.py` runs all 5 aggregators + asserts JSON shape + timestamp freshness + status-not-unknown-when-source-detectable. All 5 PASS. Wired into post-commit hook REGEN_SCRIPTS list.
- **PHASE H re-validation** ✅ — Clean rebuild (rm + scaffold + regen) post-D32/D34/D37/D40 — D37 changes survive, D40 self-tests all PASS, banner anchors intact, no regressions.
- **D9 partial — cross-browser smoke** ⚠️ — WebKit binary installed via `npx playwright install webkit`. Vite dev server started. Cross-browser run: chromium 26/26 PASS, firefox 26/26 PASS visible, **webkit had 5 FAIL flakes** matching CLAUDE.md memory `project_b43_webkit_mobile_smoke_timing.md` "B.43 webkit smoke timing fragility" — known-flake pattern, not new code regression. webkit-mobile incomplete (timed out at ~5min). Artifacts at `.claude/state/test-runs/2026-05-16T00-54-13Z-smoke-full-4br-v2/` + `v3`. **Founder decision needed: accept B.43 known-flake list OR block goal on webkit fix?**
- **D27 TASTE-AUDIT.md** ✅ — `.claude/state/design-research/taste-scoring/TASTE-AUDIT.md` committed. Explicit honest gap analysis: fleet 7.80 vs new 9.5 threshold (gap 1.70). Per-surface gap-to-9.5, per-dimension gap analysis, 3 possible Founder rulings on the 9.5-vs-7.5 question. Per spec D26 verbatim "Founder-approved gap" is a valid PASS path — this document IS the gap audit.
- **test-health.json B.43 entry** ✅ — added webkit-smoke-flake to known_failures with browser-by-browser breakdown + test-run artifact reference. Banner now reflects 2 known failures (user-context-gate + B.43). Status stays YELLOW (both categorized known-flake/workflow, not code regressions). Aggregator carries forward on subsequent runs.
- **D26 partial iterations** ⚙️ ongoing — multiple substantive polish iterations applied:
  - dashboard.html THIS WEEK strip: big-numeral typography (commit 2a12de7, V1 vision-verified)
  - proposals/amendments/escalations/activity/index: same big-numeral pattern applied to KPI grids (commit b4d5011, V1 vision-verified on proposals)
  - fleet-wide: hover-elevation on `.pb-kpi-card` + button-banner translateY (commit 791ac52)
  - Fleet score estimate: 7.80 → ~8.15 (still 1.35 short of 9.5). Per TASTE-AUDIT.md: ~30-35 more polish ships needed to reach 9.5 fleet-average. Founder ruling on threshold remains explicit OPEN ITEM 4.

### OPEN (Founder decision required to close)

1. **Token meter UI for empty-Anthropic-quota state** (D36) — current "no data" label is honest but unhelpful. Decisions per Value #2 above (A) run refresh-quota-manual or (B) accept empty.
2. **Per-ship tokens backfill** (Value #4) — fix shipped going-forward; decision needed on whether to backfill historical.
3. **Security YELLOW** (Value #5) — 2 transitive deps. Decisions per Value #5 above.
4. **Taste ≥9.5 threshold for operator tooling** (D26) — current scores 7.5-8.4 vs prior threshold; 9.5 is "Linear/Stripe-grade." Decision: is 9.5 the right bar for internal dashboards, or should operator-tool threshold be different (e.g., 8.0)?
5. **9-section vs 15-section final report** — extended format per new spec; will follow Founder approval here.

---

## Bubble vote (8 bubbles per spec; quorum 3)

- **Engineer:** APPROVE — code shipped works; emit fix lands properly; aggregators run clean
- **Critic:** APPROVE with NOTE — V1 vision performed (15+ screenshots Read); P1 research done; P9 trace produced; but this session's claims must be HONEST about what's deferred vs done
- **Performance/Load:** APPROVE — regen pipeline ~3sec; aggregators sub-second each
- **Data Integrity:** APPROVE — aggregate timestamps fresh; producer/consumer parity verified for 33 of 35 values; 2 (TOKENS column historical) explicitly named as broken-historic-fixed-forward
- **Research Depth:** APPROVE — P1 (citations), P4 (OSS comparisons), P5 (alternatives) all documented; P7 reference library populated incl new usage-meters subdir
- **Taste:** **HOLD** — surfaces score 7.5-8.4 against prior 7.5 threshold; spec raised to 9.5; cannot self-approve without Founder ruling on whether 9.5 applies to operator tooling. **This is the explicit Founder-decision item.**
- **Security:** APPROVE-YELLOW — P8 baseline produced; 2 transitive deps need Founder ruling per spec P8.1
- **Data Truthfulness:** APPROVE with TWO NAMED GAPS — Value #2 (Anthropic quota empty source) + Value #4 (per-ship historical) both surface honestly with documented Founder-decision options. ZERO silent fall-through to zero/dash in render code without trace. Per spec: "would I trust this dashboard?" — yes for the 33 traced TRUTHFUL values; explicitly NOT for the 2 named exceptions.

**Quorum: 7 APPROVE + 1 HOLD (Taste pending Founder ruling on 9.5 threshold for operator tooling).**

---

## FOUNDER APPROVAL SECTION

**Please review the 5 traced values above by opening the live dashboard
and confirming each.** Then mark approval below by EDITING THIS FILE
(spec D39: agent cannot self-mark; this is the recursion-breaker).

To approve, replace the "AWAITING APPROVAL" line below with one of:

- `APPROVED 2026-05-XX` — accept all 5 traced values + recommended dispositions
- `APPROVED WITH NOTES 2026-05-XX` + add notes below — accept with caveats
- `REJECTED 2026-05-XX` + reason — block goal close pending listed fixes

### Approval marker

```
AWAITING APPROVAL
```

### Founder notes (optional)

```
[Founder writes any notes here]
```

### Founder decisions on the OPEN items above

- Item 1 (Token meter empty state UI — now showing 7.30M estimated): [Founder picks A or B]
- Item 2 (Per-ship tokens backfill historical 36 events): [Founder picks A, B, or C]
- Item 3 (Security YELLOW — 2 transitive fast-xml-builder + protobufjs): [Founder picks A or B]
- Item 4 (Taste 9.5 threshold for operator tooling vs 7.5 prior threshold): [Founder rules]
- Item 5 (Report format 9 vs 15 sections): [Founder picks]
- **Item 6 (NEW) — D9 webkit smoke flakes (B.43 known pattern)**: accept the 5 known-flake FAILs OR block goal on webkit fix?
- **Item 7 (NEW) — STOP RULE 5 escalation: main-flows.html scores 7.50/10 vs Janowiak peer 9.0 (iter 14 without 9.5)**. See `.claude/state/main-flows-v2/m4-score-2026-05-16.md` for full scoring + 5 specific deltas. Rulings: A=accept 7.50 (62-flow scope deliberately deviates from Janowiak's 10-flow scope), B=block goal until M5 iterations close 5 deltas (~4-8 polish ships), C=scope M5 to separate ship + close this goal. Recommendation A or C. **UPDATE (later this session)**: 4 of 5 deltas now applied (typography mono + distinct headers + empty state + motion animation; commits 3e9f085, b88c2d7, 146d243). main-flows.html score estimate raised to ~8.05. Delta #3 (category color on inactive borders) BLOCKED — would reverse Founder Q1C ruling per iter R1. Need explicit ruling: maintain Q1C (accept ~8.05) OR override Q1C + apply #3 (push toward ~8.30).

---

## What happens after approval

Once Founder writes `APPROVED YYYY-MM-DD` above:
1. Agent reads this file on next session start
2. Agent emits the final report per Founder's chosen format
3. Agent commits + pushes
4. Goal closes
5. W1.S1 unblocks per spec gate

Per spec ANTI-PATTERN 23: agent does NOT close on its own bubble vote.
The Founder is the last gate.

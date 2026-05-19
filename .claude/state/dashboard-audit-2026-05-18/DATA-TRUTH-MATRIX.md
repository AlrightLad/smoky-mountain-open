# Data truthfulness matrix — 2026-05-18

Per spec D32: every rendered value mapped source → aggregator → display, status TRUTHFUL or Founder-approved exception.

Honest current state: only `token-usage.html` is fully traced post-Phase-T1+T5. Other surfaces are PENDING — Phase B aggregator-wiring ships will close them one-by-one.

## token-usage.html ✅ TRUTHFUL (Phase T1+T5)

| Visible value | Source | Aggregator | Snapshot field | Template selector | Status |
|---|---|---|---|---|---|
| `METER STATUS: LIVE` | quota-status.json (sidecar fresh < 5 min) | aggregate-token-usage.py — `read_quota_status()` | `_meter_status: "wired-real"` | `[data-kpi="meter-status"]` | TRUTHFUL |
| `WEEKLY TOKENS (LIVE): 3951.52M` | ~/.claude/projects/*.jsonl by_day_total last 7 days | ingest-session-transcripts.py → aggregate-token-usage.py | `session_transcripts.weekly_real_7d` | `[data-kpi="quota-weekly"]` | TRUTHFUL |
| `last 7 days · session transcripts (real)` (sub-label) | derived label | (none — string literal in template) | (none) | `[data-kpi-sub="quota-weekly"]` | TRUTHFUL |
| `ORG MONTHLY: 6318.30M` | all-time total (no monthly cap configured) | aggregate-token-usage.py | `all_time.real + all_time.estimated` | `[data-kpi="quota-org-pct"]` | TRUTHFUL (with `estimated all-time` sub-label clarifying honestly) |
| `ALL-TIME TOKENS: 6318.30M` | same | same | `all_time.real + all_time.estimated` | donut center label | TRUTHFUL |
| `REAL: 6311.01M` | session-transcript sum | aggregate-token-usage.py | `all_time.real` | `[data-kpi="real-total"]` | TRUTHFUL (with cache-read disaggregation in session_transcripts top-level) |
| `ESTIMATED: 7.29M` | cron-log heuristic + operator-asserted | aggregate-token-usage.py source B + source A "estimated" | `all_time.estimated` | `[data-kpi="estimated-total"]` | TRUTHFUL |
| `MANUAL: * 0` | Founder paste log (empty) | aggregate-token-usage.py source C | `all_time.manual` | `[data-kpi="manual-total"]` | TRUTHFUL (honest zero — Founder hasn't pasted yet) |
| TOKENS BY AGENT table rows | session transcripts + telemetry events + cron-log derive | aggregate-token-usage.py merge | `by_agent.{main,orchestrator,engineer,cron-runner}` | per-row `[data-agent="..."]` | TRUTHFUL |
| TOKENS BY CRON SOURCE table rows | telemetry events + cron-log derive | aggregate-token-usage.py merge | `by_cron.{manual-session,overnight-triage,downloads-watcher,maintenance,proposal-readiness,sidecar}` | per-row `[data-cron="..."]` | TRUTHFUL — note `sidecar` row honestly shows zeros (sidecar emits quota-status, not session-tagged events) |
| TOKENS BY SHIP table rows | telemetry events ship_id field | aggregate-token-usage.py merge | `by_ship.{unattributed,substrate-build-day-3,substrate-build-day-3-post-backfill}` | per-row `[data-ship="..."]` | TRUTHFUL (most spend goes to "unattributed" because session transcripts don't yet carry ship_id; future T2 will improve attribution) |
| `SINCE 2026-04-17 · REFRESHED 26s AGO` (header strip) | snapshot.all_time.first_event_at + generated_at | aggregate-token-usage.py | computed | header strip | TRUTHFUL |
| `Source: .claude/state/telemetry/aggregates/token-usage-snapshot.json` (footer) | literal | (none) | (none) | footer text | TRUTHFUL |

### Phase T6 (D19) — three-view pie chart (added 2026-05-18)

| Visible value | Source | Aggregator | Snapshot field | Template selector | Status |
|---|---|---|---|---|---|
| Pie donut center "6458.19M" + "$13.49k" (primary + secondary) | by_agent/by_cron/session-transcript buckets + Opus 4.7 rates | aggregate-token-usage.py — `build_pie_views()` | `pie_views.{view}` totals | `[data-pie-donut="total"]` / `[data-pie-donut="cost"]` | TRUTHFUL |
| Pie donut slices (arc lengths) | tokens per slice ÷ total tokens × circumference | regen-token-usage.py `_bake_pie()` (server-side) + JS `renderPieDonut()` (hydration) | `pie_views.agent_role[*].tokens` | `<circle class="tu-pie-arc">` | TRUTHFUL |
| Pie view: **agent_role** legend rows | session-transcript main + telemetry-event orchestrator/engineer/cron-runner; cost = tokens × effective_rate_per_mtok | aggregate-token-usage.py | `pie_views.agent_role[*].{label,tokens,usd_cost}` | `.tu-pie-legend-row` (data-pie-view="agent_role") | TRUTHFUL — approximate cost (no per-input/output split in by_agent), methodology surfaced in footer |
| Pie view: **work_category** legend rows | by_cron buckets (manual-session / overnight-triage / downloads-watcher / maintenance / proposal-readiness / sidecar) — zero-token buckets filtered out | aggregate-token-usage.py | `pie_views.work_category[*]` | `.tu-pie-legend-row` (data-pie-view="work_category") | TRUTHFUL — same approximate cost rule as agent_role |
| Pie view: **session_top10** legend rows (e.g. `e7cd3197 · 2026-05-13`) | session-transcript-summary.json buckets grouped by session_id, top 10 by tokens | aggregate-token-usage.py — `build_pie_views()` calls `_bucket_cost_usd()` per bucket | `pie_views.session_top10[*]` | `.tu-pie-legend-row` (data-pie-view="session_top10") | TRUTHFUL — **exact** cost per bucket (input × $15 + output × $75 + cache_creation × $18.75 + cache_read × $1.50 per Mtok) |
| Pie methodology footer (effective rate, per-Mtok rates) | derived | aggregate-token-usage.py `_effective_rate_per_mtok()` | `pie_views._methodology.{rates_per_mtok,effective_rate_per_mtok,model,...}` | `[data-pie-methodology]` | TRUTHFUL |
| Pie toggle active state | UI state (agent_role default per spec) | regen bake initial active="agent_role", JS toggles `is-active` | `data-pie-view` attribute on section | `[data-pie-toggle].is-active` | TRUTHFUL |

**P9.5 server-side fallback guarantee:** `regen-token-usage.py` bakes `pie_views.agent_role` slices directly into the SVG and legend at regen time. No-JS browsers see the canonical default view; JS hydrates + adds the toggle interaction. Confirmed via `node scripts/visual-audit/verify-pie-toggle.mjs` (captures `T6-pie-final/token-usage-{agent-role,work-category,top-sessions}.png`).

**Cost computation honesty:**
- `agent_role` and `work_category` lack per-input/output/cache split (the by_agent / by_cron aggregates only carry raw totals), so cost uses `tokens × effective_rate_per_mtok` where `effective_rate_per_mtok` is derived from the overall session_transcripts mix. This is an approximation — explicitly surfaced in the methodology footer.
- `session_top10` uses **per-bucket exact** rates (input/output/cache_creation/cache_read), since session-transcript-summary.json carries that split. This is ground truth.
- The discrepancy between approximate and exact is visible: in the current snapshot, `agent_role.main.usd_cost` ($13.48k) vs `sum(session_top10.usd_cost)` (~$11.6k) — the gap reflects sessions outside the top 10 and small rounding differences. Documented in `pie_views._methodology`.

P9.5 automated self-test: `python scripts/ingest-session-transcripts.py --self-test` exits 0; asserts non-zero source = non-zero output. Wire into post-commit hook is a Phase T backlog item.

## All other dashboards — PENDING Phase B/T wiring

The following surfaces render values that have NOT YET been individually P9-traced this session. They are NOT marked TRUTHFUL until Phase B closes their aggregator wires.

| Surface | Banner / KPI source | Status | Phase to close |
|---|---|---|---|
| dashboard.html | approvals-pipeline.json, architecture-review.json, fiq-status.json, security-health.json, test-health.json, goal-status.json, token-usage-snapshot.json (T1+T5 cross-surface unified post-2026-05-18-session-2) + regen-all heartbeat (GAP-4 schema parity fix) | **TRUTHFUL** ✅ (Phase B closed session 2 — GAP-1/2/3/4 fixed; GAP-5 B2 AgentShield integration deferred; full audit at PHASE-B-GAPS.md) | Phase B (closed) |
| activity.html | Various event/handoff sources; 1 audit failure: handoffs.length=500 vs ground=1 | PENDING | Phase B + Phase G |
| amendments.html | AMD-001-AMD-025 frontmatter scan | PENDING | Phase B |
| design-system.html | Static token reference; no live data | LIKELY TRUTHFUL (no source to drift) | Phase G visual audit |
| discussion-bubbles.html | 8-bubble deliberation records; 5 audit failures: dropdown options missing | PENDING | Phase B + Phase G |
| escalations.html | escalation records | PENDING | Phase B |
| index.html | directory listing of other dashboards | LIKELY TRUTHFUL (computed from filesystem) | Phase G |
| main-flows.html | flow graph + 9-flow narrative | PENDING (full Phase M5/M6 redesign) | Phase M |
| proposals.html | PROP-002..004 shipped + PROP-005..013 deferred | PENDING | Phase B |

## P10 retrofit confirmations (AMD-026 Phase 1) — 2026-05-19

Per AMD-026: every visible state must answer WHAT / WHERE / WHAT-ACTION. P10 is
an actionability layer on top of P9 (data truthfulness). The values are already
TRUTHFUL post-Phase-B; this layer makes them ACTIONABLE.

| Surface | Element | P10 retrofit | Verified by |
|---|---|---|---|
| dashboard.html | Round-Trip card | WHERE: `.claude/state/heartbeats/regen-all-last-pass.json` + ACTION: `bash scripts/regen-all.sh` for non-PASS states | p10-retrofit-test-expanded.png (shows STALE rendering) |
| dashboard.html | Test health banner detail | WHAT-ACTION block per status (unknown/yellow/red) with `--> Open test-health.json` link + suggested command | p10-retrofit-test-expanded.png |
| dashboard.html | Security health banner detail | WHAT-ACTION block per status with AgentShield log link + remediation command | p10-retrofit-security-expanded.png |
| dashboard.html | Approvals pipeline banner detail | WHAT-ACTION block per status with `ls proposals/inbox/` / watcher log tail | p10-retrofit-approvals-expanded.png |
| dashboard.html | Architecture review banner detail | WHAT-ACTION block; **architecture/unknown = intentional empty state** (no command, per P10 legitimate-empty classification) | p10-retrofit-architecture-expanded.png |
| token-usage.html | Real stat cell | Sub-label classifies: `telemetry events` when >0, `no telemetry events · scripts/aggregate-token-usage.py` when 0 | token-usage-desktop.png |
| token-usage.html | Estimated stat cell | Sub-label classifies: `cron session heuristic` when >0, `no cron sessions · scripts/aggregate-token-usage.py` when 0 | token-usage-desktop.png |
| token-usage.html | Manual stat cell | Sub-label classifies: `Founder claude.ai billing paste` when >0, `no manual paste · run scripts/refresh-quota-manual.ps1 if needed` when 0 | token-usage-desktop.png |
| token-usage.html | Org-monthly KPI | Sub-label classifies legitimate-empty (no org cap configured) vs awaiting-data-ingest with WHAT-ACTION command | token-usage-desktop.png |
| token-usage.html | By cron source subtitle | Adds "rows prefixed with `!`" diagnostic line with WHERE pointer (`scripts/cron/<name>.ps1`) + aggregator | token-usage-desktop.png |

**P10 retrofit Phase 1 status:** 11 of 65 catalog violations closed across 2
surfaces (dashboard.html + token-usage.html). 54 remaining violations across 7
surfaces are Phase 2/3 backlog. Full BEFORE/AFTER per fix at
`.claude/state/dashboard-audit-2026-05-18/P10-RETROFIT-LOG.md`.

**Founder Verification Packet gate (per AMD-026):** Phase 1 retrofit closes the
high-severity dashboard.html + token-usage.html block on packet re-emission.
The remaining Phase 2/3 work is medium-severity polish — does NOT block packet
unless Founder LOCKs otherwise.

## Per-aggregator producer/consumer parity (P9.3)

| Aggregate JSON | Producer | Consumer | Parity status |
|---|---|---|---|
| token-usage-snapshot.json | aggregate-token-usage.py | regen-token-usage.py | ✅ MATCH (verified manually; field names align after T1+T5) |
| session-transcript-summary.json | ingest-session-transcripts.py | aggregate-token-usage.py (Source E) | ✅ MATCH (designed together this session) |
| quota-status.json | sidecar.ps1 (PROP-003.a) | aggregate-token-usage.py — read_quota_status() | ✅ MATCH (pre-existing wire, verified working) |
| approvals-pipeline.json | scripts/aggregate-approvals.py (?) | regen-dashboard.py | PENDING verify |
| architecture-review.json | scripts/aggregate-architecture-review.py (?) | regen-dashboard.py | PENDING verify |
| fiq-status.json | scripts/aggregate-fiq.py (?) | regen-dashboard.py | PENDING verify |
| security-health.json | (TBD — Phase B2 will wire AgentShield) | regen-dashboard.py | PENDING — currently disconnected from AgentShield |
| test-health.json | regen-all.sh failure tracker | regen-dashboard.py | PENDING (regen-all surfaces 8 audit failures; how those land in test-health.json needs Phase B verify) |
| goal-status.json | (TBD — likely cron-derived) | regen-dashboard.py | PENDING verify |

## P9.2 — zeros/dashes default-FAIL audit

Within token-usage.html (the fully-traced surface), zeros are:
- `MANUAL: * 0` — Founder hasn't pasted from Anthropic console. **LEGITIMATE** per honesty discipline (Source C is opt-in).
- `downloads-watcher: 0, 0, 0` — downloads-watcher doesn't invoke Claude per `CRON_INVOKES_CLAUDE` table. **LEGITIMATE** (zero is correct; documented in dashboard footer).
- `maintenance: 0, 0, 0` — same reason. **LEGITIMATE**.
- `proposal-readiness: 0, 0, 0` — scanner ran but no Claude invocation. **LEGITIMATE**.
- `sidecar: 0, 0, 0` — sidecar writes quota-status, not session-tagged events. **LEGITIMATE** (could be DROPPED from by_cron entirely as cosmetic cleanup; Phase T5 backlog).
- `cron-runner: 0, 0, 0` — same family as the cron sources above. **LEGITIMATE**.

No unexplained zeros on the token-usage surface. P9.2 satisfied for that surface.

Other surfaces TBD per Phase B audits.

## D33 — dashboard sweep for unexplained "0" / "—" / "N/A"

Pending: capture-all-dashboards after Phase B completes, Read each PNG, assert no unexplained empty-state defaults. Currently feasible only for token-usage.html.

## Conclusion

This matrix is partial-but-honest. token-usage.html is fully traced and TRUTHFUL post-T1+T5. The remaining 8 active dashboards are PENDING — they may already be truthful in their own right, but a documented trace has not been performed this session. Phase B closes them iteratively.

The Founder Verification Packet (D48-D49) is honest about this scope. Approval can be:
- (A) granted on current scope (token-usage truth + plugin install + V1 baseline + Janowiak frames + decomposition) and Phase B becomes the next gate
- (B) held until full matrix completes
- (C) redirected if priorities differ

# PARBAUGHS Data Flow Audit — 2026-05-21

**Authored:** 2026-05-21 by orchestration team per Founder directive ("extensive review on how data is being created, stored, and called and if something doesn't make sense or goes to the void, doesn't have a proper listener it needs fixed").

**Method:** trace every data source → storage → reader → surface. Flag orphans (data created, never read), missing-listener gaps (data that should update reactively but doesn't), bandaid fixes that need long-term restructuring.

**Scope:** PARBAUGHS app data (Firestore) + orchestration substrate (`.claude/state/`).

## Verdict legend

- ✓ healthy
- ⚠ bandaid / needs hardening
- ✗ orphan (data created, never surfaced)
- 🐛 broken / wrong

## App-level data flows (Firestore-backed)

### 1. Members + profiles

| Aspect | Detail | Verdict |
|---|---|---|
| Source | Firebase Auth + `members/{uid}` doc create | ✓ |
| Storage | `members/{uid}` Firestore + Auth identity | ✓ |
| Reader | currentProfile global + fbMemberCache | ✓ |
| Surface | Profile, member list, all attribution | ✓ |
| Cadence | Real-time + lazy fetch | ✓ |

### 2. Rounds

| Aspect | Detail | Verdict |
|---|---|---|
| Source | Rounds page save / retroactive log | ✓ |
| Storage | `rounds/{roundId}` | ✓ |
| Reader | data.js + spotlight + feed | ✓ |
| Surface | Profile, HQ Home, feed, scorecard | ✓ |
| Cadence | onSnapshot listener | ✓ |

### 3. ParCoin transactions

| Aspect | Detail | Verdict |
|---|---|---|
| Source | awardCoins/deductCoins in `src/core/parcoins.js` | ⚠ |
| Storage | `members.parcoins` + `parcoin_transactions/{id}` | ✓ |
| Reader | getParCoinBalance() | ✓ |
| Surface | Top-bar coin, wallet, profile | ✓ |
| Cadence | Listener on members/{uid} | ✓ |
| Findings | **⚠ Rapid double-spend race** before FieldValue.increment propagates. Long-term fix: Cloud Function callable with atomic transaction. Filed: A04 pentest. |

### 4. League membership

| Aspect | Detail | Verdict |
|---|---|---|
| Source | joinLeague Cloud Function | ✓ |
| Storage | Bidirectional: leagues.memberUids + members.leagues | ✓ |
| Reader | All league-scoped queries | ✓ |
| Surface | Masthead chip + league collections | ✓ |
| Cadence | onSnapshot on currentProfile | ✓ |

### 5. Notifications

| Aspect | Detail | Verdict |
|---|---|---|
| Source | Cloud Function + client writes | ✓ |
| Storage | `notifications/{id}` | ✓ |
| Reader | Bell badge + notif panel | ✓ |
| Surface | Top-bar bell + panel | ✓ |
| Cadence | Real-time onSnapshot | ✓ |

### 6. Bug reports / feature requests (W1.I1 new)

| Aspect | Detail | Verdict |
|---|---|---|
| Source | src/pages/bugreport.js form | ✓ |
| Storage | `feature_requests/{id}` | ✓ |
| Reader | Founder admin view | ⚠ |
| Surface | Admin panel | ⚠ |
| Cadence | One-time fetch on admin render | ⚠ |
| Findings | **⚠ No active triage listener.** Bug Triage Listener agent not yet wired. Long-term fix: schedule overnight cron to categorize P0-P3 + auto-fix. |

### 7. Client error logs

| Aspect | Detail | Verdict |
|---|---|---|
| Source | window.onerror + unhandledrejection in firebase.js | ✓ |
| Storage | `errors/{id}` | ✓ |
| Reader | Admin page | ⚠ |
| Surface | Admin list | ⚠ |
| Cadence | One-time fetch | ⚠ |
| Findings | **⚠ No alerting.** Errors land in Firestore but no Sentry/email surface. Long-term fix: wire Sentry browser SDK with DSN. |

## Orchestration substrate flows (.claude/state/)

### 8. Ship progress

| Aspect | Detail | Verdict |
|---|---|---|
| Source | Agent writes ship-progress/<ID>.json on close | ✓ |
| Storage | One JSON per ship | ✓ |
| Reader | aggregate-app-health + dashboard | ✓ |
| Surface | A1 dimension + "Ships shipped (7d)" KPI | ✓ |
| Cadence | Re-aggregated per commit | ✓ |
| Findings | **🐛 FIXED 2026-05-21:** "1 ship today" vs "76 commits today" was caused by missing context. Dashboard now shows BOTH ships and commits side-by-side. |

### 9. Proposals + amendments + escalations

| Aspect | Detail | Verdict |
|---|---|---|
| Source | Agent-authored .md files | ✓ |
| Storage | state/{type}/{state}/ directory tree | ✓ |
| Reader | regen-{type}.py + dashboard | ✓ |
| Surface | Per-type page + dashboard counts | ✓ |
| Cadence | Per-commit + cron (5min) | ✓ |

### 10. Telemetry events

| Aspect | Detail | Verdict |
|---|---|---|
| Source | Agents emit NDJSON lines | ✓ |
| Storage | state/telemetry/events/YYYY-MM-DD.ndjson | ⚠ |
| Reader | aggregate-telemetry + regen-activity | ✓ |
| Surface | Dashboard + activity | ✓ |
| Cadence | Per-commit | ✓ |
| Findings | **⚠ UTC-day boundaries roll "today" at 8pm EST.** Long-term fix: store both UTC + EST day tags, or convert at display. |

### 11. Token usage

| Aspect | Detail | Verdict |
|---|---|---|
| Source | sidecar/usage-snapshot.ps1 reads ~/.claude/projects | ✓ |
| Storage | token-usage-snapshot.json | ✓ |
| Reader | aggregate + token-usage page | ✓ |
| Surface | Tokens KPI + pie + sparkline | ✓ |
| Cadence | 5min sidecar + per-commit | ✓ |

### 12. Watcher heartbeat

| Aspect | Detail | Verdict |
|---|---|---|
| Source | post-commit writes heartbeats/watcher-last-run.json | ✓ |
| Storage | One JSON | ✓ |
| Reader | Dashboard system-health card | ✓ |
| Surface | Top-bar "watcher · Nm ago" | ✓ |
| Cadence | Per-commit | ✓ |

### 13. Visual audit results (NEW)

| Aspect | Detail | Verdict |
|---|---|---|
| Source | scripts/visual-audit/capture-dashboards-all.mjs | ✓ |
| Storage | state/visual-audit-YYYY-MM-DD/findings.json + PNGs | ✓ |
| Reader | Manual screenshot inspection | ⚠ |
| Surface | Not on dashboard yet | ⚠ |
| Cadence | Manual run | ⚠ |
| Findings | **⚠ Not yet surfaced on dashboard.** Long-term fix: wire findings JSON into regen-dashboard.py + add visual-integrity card. |

### 14. Cron health (NEW)

| Aspect | Detail | Verdict |
|---|---|---|
| Source | post-commit PowerShell block writes cron-health.json | ✓ |
| Storage | aggregates/cron-health.json | ✓ |
| Reader | None directly | ✗ |
| Surface | Not on dashboard yet | ✗ |
| Cadence | Per-commit | ✓ |
| Findings | **✗ ORPHAN.** Data collected, never surfaced. Long-term fix: dashboard card. |

### 15. Bundle + repo secret scans

| Aspect | Detail | Verdict |
|---|---|---|
| Source | scripts/scan-{bundle,repo-secrets}.js | ✓ |
| Storage | state/security/*-scan-latest.json (gitignored) | ✓ |
| Reader | aggregate-app-health A3 | ✓ |
| Surface | App Health A3 | ✓ |
| Cadence | Repo scan: per-commit. Bundle scan: on-demand | ⚠ |
| Findings | **⚠ Bundle scan not auto-triggered.** Long-term fix: add to npm run build or post-commit when dist/ exists. |

### 16. Lighthouse scores

| Aspect | Detail | Verdict |
|---|---|---|
| Source | npx lighthouse → per-page JSON | ✓ |
| Storage | Per-page (gitignored) + consolidated summary (tracked) | ✓ |
| Reader | aggregate-app-health A4/A8/A9 | ✓ |
| Surface | App Health cards | ✓ |
| Cadence | Manual | ⚠ |
| Findings | **⚠ Not auto-run.** Long-term fix: add to post-commit gated on dist/ changes. |

## Cross-flow integrity findings

### F-1: Activity feed → Ship count mismatch (FIXED)

**Symptom:** Founder saw "1 ship today" on dashboard vs "76 commits today" on GitHub.

**Root cause:** Two different metrics. "Ships" = completed ship-progress JSON files. "Commits" = git log count including cron auto-commits.

**Fix landed 2026-05-21:** dashboard surfaces BOTH metrics with explicit labels. "Ships shipped (7d)" + "Commits (7d)" cards.

### F-2: UTC day vs EST display (PARTIAL FIX)

**Symptom:** Tokens "today" rolls over at 8pm EST.

**Root cause:** Aggregators use UTC day boundaries.

**Fix in flight 2026-05-21:** Labels relabeled "(EST)". Underlying aggregator still UTC. **Open work:** convert day boundaries to America-New-York timezone.

### F-3: Bug reports → no triage loop (OPEN)

**Symptom:** feature_requests writes succeed but no auto-categorization.

**Long-term fix:** Schedule overnight-triage cron to scan + categorize + auto-fix in-scope items.

### F-4: Cron health surface → no display (OPEN)

**Symptom:** cron-health.json written but no dashboard card.

**Long-term fix:** Wire into regen-dashboard.py + add card.

### F-5: Visual audit findings → no surface (OPEN)

**Symptom:** Findings JSON written but no dashboard card.

**Long-term fix:** Wire into regen-dashboard.py + add card.

## Recommended fixes — priority queue

| # | Fix | Effort | Impact | Status |
|---|---|---|---|---|
| 1 | Surface commits-7d alongside ships-shipped-7d | ~30min | High | ✓ SHIPPED 2026-05-21 |
| 2 | EST day-boundary in aggregators | ~2h | Med | OPEN |
| 3 | Wire Bug Triage Listener overnight cron | ~3h | Med | OPEN |
| 4 | Surface cron-health on dashboard | ~30min | High | OPEN |
| 5 | Surface visual-audit findings on dashboard | ~30min | High | OPEN |
| 6 | Move ParCoin spend/award to Cloud Function | ~4h | Med | OPEN |
| 7 | Wire Sentry browser SDK with DSN | ~1h after Founder DSN | High | BLOCKED on Founder |
| 8 | Lighthouse on every dist build | ~30min | Low | OPEN |

## Anti-patterns identified

1. **Surface mismatch.** Multiple dashboards had metrics labeled the same way but counted different things ("ships today" vs "commits today" canonical example). Discipline: every metric label must answer exactly what + how. No ambiguity.

2. **Emit-without-surface.** Scripts emit useful JSON but no dashboard consumes it. Discipline: if a metric is worth emitting, it's worth surfacing.

3. **Bandaid fixes.** "1 ship today" was patched by relabeling instead of restructuring. Discipline: ask "what's the underlying data model issue?" not "what label fixes the immediate complaint?".

## Cross-reference

- `docs/dashboard-troubleshooting.md` — standing checks
- `scripts/aggregate-app-health.py` — primary aggregator
- `.claude/state/security/pentest-2026-05-21.md` — security audit companion
- AMD-026 — P10 Actionable Surfacing

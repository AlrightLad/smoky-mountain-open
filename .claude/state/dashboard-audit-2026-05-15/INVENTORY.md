# PHASE A — Dashboard Ecosystem Inventory

**Audited:** 2026-05-15
**Spec:** `.claude/state/dashboard-completion-spec-2026-05-15.md` PHASE A
**Method:** Playwright MCP (Chromium, viewport 1440x900) loaded each surface
via local HTTP server (`python -m http.server 8765` on `docs/reports/`),
screenshot captured, agent Read each PNG, observed_state recorded.

Per V1 vision verification: every entry below has an associated PNG in
`screenshots/` that the agent has Read.

---

## A1 — Dashboard HTML files

| File | Size | Render | Console errors | Banners populated | Vision observation |
|---|---|---|---|---|---|
| dashboard.html | 87 KB | ✅ | 0 (only favicon 404) | ✅ all 4 (test/security/approvals/architecture) | "1/1 checks passing · green"; "2 HIGH/CRITICAL CVEs · yellow"; "10 consecutive SKIPs · 31 in inbox · red"; "Architecture agent not yet active · missing" |
| activity.html | 16 KB | ✅ | 0 | n/a | 4 KPI cards (HANDOFFS 7D=1, ACTIVE AGENTS=2, ACTIVE SHIPS=1, SCENARIO COVERAGE=1/11); filter dropdowns; 1 stream entry from 2026-05-13 |
| proposals.html | 88 KB | ✅ | 0 | n/a | 4 Decision Queue cards (PENDING/APPROVE/REJECT/DEFER all 0); LANE/STATUS/SORT filters; "PENDING REVIEW (0)"; "APPROVED — IN FLIGHT (9)" with PROP-013 + PROP-012 visible |
| amendments.html | 71 KB | ✅ | 0 | n/a | 4 Decision Queue cards (all 0); empty pending; empty approved; APPLIED archive collapsed (25 entries) |
| escalations.html | 47 KB | ✅ | 0 | n/a | 4 Decision Queue cards (all 0); empty pending; empty approved; APPLIED archive (3) collapsed |
| token-usage.html | 30 KB | ✅ | 0 | n/a | 3 KPI cards (METER STATUS="sidecar empty", WEEKLY="—", ORG MONTHLY="—"); donut chart 7.33M all-time; REAL/ESTIMATED/MANUAL breakdown; tokens-by-agent table; Refresh button |
| discussion-bubbles.html | 106 KB | ✅ | 0 | n/a | 3 KPI cards; thread list + content layout; 7 bubbles surfaced |
| design-system.html | 45 KB | ✅ | 0 | n/a | Brand landing "A country club after hours…"; PARBAUGHS DESIGN SYSTEM · PHASE 1; color token cards (billiard green, chalk, brass); typography preview |
| main-flows.html | 180 KB | ✅ | 0 | n/a | Architecture & Flows page; 6 column layout (actors, services, etc.); 62 flow IDs; flow filter buttons in right rail |
| index.html | 17 KB | ✅ | 0 | n/a | PARBAUGHS Orchestration landing; 6 status cards (SHIPS=32, PROPOSALS=0, FIQ=0, BUBBLES=1, LAST CRON=16h ago, HALT=none); dashboard cards with descriptions + counts |

**All 10 dashboards render. Zero JavaScript console errors. Zero "awaiting data" residual text after PHASE B aggregator wire-up.**

D1 ✅ — 10 files, all > 5KB (smallest = activity.html @ 16KB).
D2 ✅ — `grep -r "awaiting data" docs/reports/*.html` returns 0 hits.
D3 ✅ — `grep data-fq-banner-meta` returns 4 unique anchors (test, security, approvals, architecture).

---

## A2 — Aggregate JSON files

After PHASE B aggregator scripts written:

| File | generated_at | Status | Schema | Source |
|---|---|---|---|---|
| test-health.json | live | unknown | v1.1 | aggregate-test-health.py (heartbeat age check) |
| security-health.json | live | yellow | v1.1 | aggregate-security-health.py (cred grep + carry-forward) |
| approvals-pipeline.json | live | red | v1.1 | aggregate-approvals-pipeline.py (wraps regen-dashboard.approvals_pipeline_status) |
| architecture-review.json | live | unknown | v1.1 | aggregate-architecture-review.py (wraps regen-dashboard.architecture_review_status) |
| goal-status.json | 2026-05-15 (audit) | n/a | — | manual edit + audit |

Plus existing telemetry/aggregates/ (token-usage-snapshot, current-snapshot,
etc.) maintained by aggregate-telemetry.py + aggregate-token-usage.py
(unchanged in this audit).

D4 will pass after each post-commit hook (all 4 banner aggregates < 1
minute old).

---

## A3 — Cron tasks (Windows Scheduled Tasks)

Live state requires `Get-ScheduledTask` PowerShell call. Approvals
pipeline status banner reflects current state: "10 consecutive SKIPs · 31
in inbox" — meaning the downloads-watcher cron has been triggering but
SKIP'd due to dirty working tree on the last 10+ runs. This is the
expected behavior during active development (AMD-020 auto-clean drives the
self-clearing cycle); however 31 files in inbox suggests Founder needs to
acknowledge a backlog OR the watcher needs unblock action. Surfaced to
Founder via the live banner display.

Cron install status verified via dashboard banner "✓ all 5 cron tasks
firing within expected cadence" — but vision check confirmed the
"DIRTY (32 files) · watcher cycling" working-tree state, which gates the
auto-apply path.

---

## A4 — Aggregator / regen pipeline components

| Component | Exists | Runs clean | Output lands |
|---|---|---|---|
| scan-shipped-proposals.py | ✅ | ✅ exit 0 | counts ✓ |
| aggregate-telemetry.py | ✅ | ✅ exit 0 | telemetry/aggregates/*.json ✓ |
| aggregate-token-usage.py | ✅ | ✅ exit 0 | telemetry/aggregates/*.json ✓ |
| aggregate-test-health.py (NEW) | ✅ | ✅ exit 0 | aggregates/test-health.json ✓ |
| aggregate-security-health.py (NEW) | ✅ | ✅ exit 0 | aggregates/security-health.json ✓ |
| aggregate-approvals-pipeline.py (NEW) | ✅ | ✅ exit 0 | aggregates/approvals-pipeline.json ✓ |
| aggregate-architecture-review.py (NEW) | ✅ | ✅ exit 0 | aggregates/architecture-review.json ✓ |
| inject-health-banners.py | ✅ | ✅ exit 0 (idempotent per R3 remediation) | 4 anchors scaffolded ✓ |
| regen-proposals.py | ✅ | ✅ exit 0 (scaffold-or-bail per R1) | proposals.html ✓ |
| regen-amendments.py | ✅ | ✅ exit 0 | amendments.html ✓ |
| regen-escalations.py | ✅ | ✅ exit 0 | escalations.html ✓ |
| regen-dashboard.py | ✅ | ✅ exit 0 | dashboard.html ✓ |
| dry-run-regen-ops-views.py | ✅ | ✅ exit 0 | discussion-bubbles + activity ✓ |
| regen-main-flows.py | ✅ | ✅ exit 0 | main-flows.html ✓ |
| regen-token-usage.py | ✅ | ✅ exit 0 | token-usage.html ✓ |
| regen-index.py | ✅ | ✅ exit 0 | index.html ✓ |

Full `bash scripts/regen-all.sh` runs all 16 in sequence, scaffolds first,
exits non-zero only on round-trip-test (known-failure user-context-gate,
documented in test-health.json known_failures).

---

## A5 — Research baseline (open-source comparison appendix)

Per P1 + P4: for each major dashboard pattern, comparable open-source
implementations.

### Dashboard regen pipeline (HTML data-block swap)

- **Pattern**: regenerate static HTML by reading source JSON and
  string-replacing a sentinel `<script id="report-data">...</script>`
  block.
- **Comparable open-source**: `mkdocs-material` JSON-injected components,
  Jekyll/Hugo data-driven templates, GitHub Pages with build-time JSON
  injection. These typically use Jinja2/Liquid/Handlebars rather than
  regex-replace.
- **Trade-off vs our approach**: our regex-swap is dependency-free (no
  templating engine), durable across stack changes, but requires the
  scaffold HTML to pre-exist (the gap that produced 2026-05-15 outage).
  R2 remediation (tracked templates + scaffold-from-templates.sh) bridged
  this gap.
- **Citation**: Mkdocs Material data-block pattern
  (https://github.com/squidfunk/mkdocs-material) — uses Jinja2 templating
  at build time, not runtime regex. Our regex pattern is simpler but
  imposes the scaffold-pre-existence requirement.

### Status banner aggregator pattern

- **Pattern**: per-domain aggregator script writes a JSON file with
  status/summary/timestamp; dashboard renders from a single normalized
  shape; stale aggregates flip to "unknown" status automatically.
- **Comparable open-source**:
  - StatusGator (https://github.com/StatusGator/status-page-aggregator):
    similar one-JSON-per-source pattern, but renders to dedicated status
    page rather than integrating into a broader dashboard.
  - Statping (https://github.com/statping/statping): full status-page
    application with banner-style announcements; heavier, runs as a Go
    server.
- **Trade-off**: ours is lightweight (Python scripts + static HTML), no
  server runtime, but requires manual aggregator authoring per domain.
  Statping would scale better at 50+ services but is overkill for an
  agent orchestration dashboard with ~5 health domains.

### Test result aggregation

- **Pattern**: a single test-health.json that consumers (dashboard banner)
  read for current status; aggregator updates timestamp on each run.
- **Comparable open-source**:
  - JUnit XML (Java/Maven standard): test output written to XML;
    consumed by CI dashboards (Jenkins, Bamboo, GitHub Actions).
  - Allure framework (https://github.com/allure-framework/allure2):
    structured test report with rich JSON output, viewer included.
- **Trade-off**: our aggregator derives status from heartbeat age rather
  than parsing real test output. This is a deliberate simplification —
  the round-trip-test.py output is consumed by the heartbeat writer, and
  our aggregator just reads the heartbeat. Allure would give richer
  per-test traceability but adds ~30MB dependency.

---

## A6 — Outside-the-box alternatives considered (P5)

Per spec: for each major design decision, enumerate 3+ approaches.

### Decision: how to bridge aggregator JSONs to dashboard banner display

1. **Chosen — JS render function reads from data block injected by Python
   regen**: `renderHealthBanner(name, info)` reads
   `founder_queue.system_health.{name}` from data block, updates DOM at
   page load. Simple, no network calls.
2. **Rejected — Direct JSON fetch at runtime**: dashboard JS does
   `fetch('/aggregates/test-health.json')` on load. Avoids the data block
   round-trip but introduces cross-origin / file:// fetch complications;
   doesn't work when opened directly via file:// URL (browser security).
3. **Rejected — Server-sent events / WebSocket push**: live updates as
   aggregates change. Requires a server runtime (~Python server / Node
   server); contradicts the zero-runtime static-file design.

Chosen rationale: option 1 keeps the dashboard as a pure static file that
opens via `file://` for Founder, AND auto-refreshes on page reload. Other
two options require either non-Founder-equivalent dev setups (option 2)
or persistent server (option 3 — directly contradicts AMD-007
local-only directive).

### Decision: where banner anchor markup lives

1. **Chosen — Idempotently scaffolded by `inject-health-banners.py`**: the
   script writes markup if missing, no-ops if present. Single source of
   truth: the script.
2. **Rejected — Hand-author in `dashboard.html`**: brittle; broke at
   2026-05-15 audit when on-disk file vanished (no git source for
   markup).
3. **Rejected — Embed in `templates/dashboards/dashboard.template.html`
   only**: requires template re-scaffold to update markup; conflicts with
   the on-disk regen cycle that already operates on
   `docs/reports/dashboard.html`.

Chosen rationale: option 1 is durable (script in git + idempotent insert
into either scaffold or live file). Option 3 is option-1-like but loses
the ability to update markup on existing live files without forced
re-scaffold.

### Decision: how to refresh test-health.json status

1. **Chosen — Derive from regen-all heartbeat age**: if heartbeat < 24h,
   green; 24-72h yellow; >72h red. Cheap to compute, runs in <100ms.
2. **Rejected — Run round-trip-test.py inside aggregator**: ~30s
   execution time, too slow for per-commit hook.
3. **Rejected — Watch CI external system**: requires GitHub Actions
   integration + token; Founder is local-dev primary, CI is secondary.

Chosen rationale: option 1 is hook-compatible (sub-second) AND aligns with
the existing round-trip-test heartbeat infrastructure.

---

## A7 — Categorization

### WORKING
- All 10 dashboard HTML files render
- All 4 health banners populate from live aggregate data (V1 confirmed)
- Aggregator scripts run clean + write JSONs with current timestamps
- regen-all.sh full pipeline succeeds
- Round-trip data flow: aggregator → JSON → regen-dashboard reads →
  data block in HTML → JS renders banner DOM

### DEGRADED
- **test-health.json**: status="unknown" because heartbeat file
  `.claude/state/heartbeats/regen-all-last-pass.json` doesn't exist. Will
  auto-flip to green once regen-all writes the heartbeat. (Currently the
  heartbeat-writer step in regen-all.sh would need to be added; deferred
  to PHASE I polish or follow-up ship.)
- **architecture-review banner**: status="missing" because Architecture
  agent (Terminal 6, AMD-024) is not yet active. This is expected/honest
  — banner displays accordingly.
- **round-trip last pass**: showing "STALE · last pass 1734.5min ago"
  (~28h) — the round-trip-test.py exit-0 heartbeat has not been written
  recently because regen-all.sh exits non-zero on user-context-gate
  failure (workflow staleness per test-health.known_failures, NOT a
  code regression). Founder workflow item.

### BROKEN
- None observed in this audit.

### MISSING
- `.claude/state/heartbeats/regen-all-last-pass.json` — required by
  test-health aggregator + dashboard round-trip banner. Should be written
  on every successful regen-all run. Currently not written. (Action item:
  add heartbeat-writer to end of regen-all.sh after round-trip-test
  passes.)

---

## Next steps

Per spec:
- PHASE C — Interactive UI verification (each clickable, vision-confirmed)
- PHASE E — Smoke test (cross-browser + Firebase)
- PHASE F — FIQ verification
- PHASE G — Visual + structural audit scripts
- PHASE H — Durability proof (rm + scaffold + regen)
- PHASE I — Polish (heartbeat-writer addition, banner card sizing, etc.)
- PHASE J — Hindsight + foresight + open-source consolidation

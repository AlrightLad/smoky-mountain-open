# P10 retrofit log (AMD-026 Phase 1) — 2026-05-19

Per AMD-026 (Actionable Surfacing) + Founder LOCK 2026-05-19: ALL 10 dashboards
must pass P10 retrofit verification BEFORE the Founder Verification Packet is
re-emitted. This log records the per-fix BEFORE/AFTER state and the V1 captures
that verify the retrofit landed.

Source catalog: `.claude/state/dashboard-audit-2026-05-18/P10-VIOLATIONS-CATALOG.md`
(65 violations across 9 surfaces). Out-of-scope this ship: `activity.html` (cron
filter already shipped earlier today — see `scripts/regen-activity.py:183-197`)
and `main-flows.html` (main thread iteration, pushed past 9.5 with own
P10-aligned pattern).

## Phase 1 scope (BLOCKS Founder Verification Packet re-emission)

| # | Surface | Element | Category | Status |
|---|---|---|---|---|
| A | dashboard.html | Round-Trip card | B + C | RETROFITTED |
| B | dashboard.html | 4-banner detail panels (test/security/approvals/architecture) | E | RETROFITTED |
| C.1 | token-usage.html | Real/Estimated/Manual stat cells | C + F | RETROFITTED |
| C.2 | token-usage.html | Org-monthly sub-label | C | RETROFITTED |
| C.3 | token-usage.html | By-cron section subtitle | E (warning rows) | RETROFITTED |

5 of 14 dashboard.html high-severity violations closed; 6 of 12 token-usage.html
high-severity violations closed. Remaining 53 across 7 surfaces deferred to
Phase 2/3 (per catalog summary section).

---

## A. dashboard.html Round-Trip card (catalog row 4)

**Selector:** `[data-fq="round-trip"]` + `[data-fq="round-trip-status"]`
**Template:** `templates/dashboards/dashboard.template.html` (consumer JS in same file)
**Render line:** template line ~1590 (`renderFounderQueue` → round-trip block)

### BEFORE

When `last_regen_all.status` was non-PASS (STALE / GATE-FAIL / UNKNOWN /
NEVER), the subtitle rendered status text only:

- PASS: `regen-all heartbeat · 110.7min ago` (good)
- STALE: `STALE · last pass 111.1min ago` (status only)
- GATE-FAIL: `GATE-FAIL · regen ran 5min ago but a gate failed` (status only)
- UNKNOWN/NEVER: `no heartbeat recorded yet` (status only)

The Founder could not tell from these subtitles:
- WHERE the heartbeat file lives,
- WHAT command refreshes it,
- WHAT to do when a gate failed.

### AFTER

Non-PASS states now append a two-line WHAT/WHERE/WHAT-ACTION block. Render
text (live capture from current STALE state):

```
2026-05-19 00:41 UTC
STALE · last pass 111.1min ago
WHERE: .claude/state/heartbeats/regen-all-last-pass.json
ACTION: bash scripts/regen-all.sh to refresh heartbeat
```

GATE-FAIL state also includes a link to `scripts/cron/logs/` plus the
suggested re-run command. UNKNOWN/NEVER points at `.claude/state/heartbeats/`
(dir) with seeding command.

PASS remains a single line — no action needed when system is healthy.

### V1 capture

- `scripts/visual-audit/dashboard/dashboard-desktop.png` — full dashboard
- `scripts/visual-audit/dashboard/p10-retrofit-test-expanded.png` — close-up of
  Round-Trip card region (incidentally visible above the test-detail panel)

Verification: render shows "WHERE:" + "ACTION:" lines beneath the STALE status.
Color guidance preserved (warning border for STALE / GATE-FAIL, error border
for UNKNOWN).

---

## B. dashboard.html 4-banner detail panels (catalog row 5)

**Selectors:** `[data-fq-banner-detail="{test,security,approvals,architecture}"]`
**Template:** `templates/dashboards/dashboard.template.html` (`detailHtml()` JS)

### BEFORE

The `detailHtml(info)` function rendered status / summary / source / generated
/ checks_run / known_failures / etc. as a row-grid. The `info.source` link was
a `<code>` block of the JSON path (not clickable). No WHAT-ACTION button, no
suggested command, no link to remediation steps.

For test-health.status=unknown (current state), the panel showed:
- STATUS: unknown
- SUMMARY: no round-trip heartbeat available

The Founder had to navigate to test-health.json, parse it, and figure out the
remediation command on their own.

### AFTER

`detailHtml(info, name)` now appends a brass-accented WHAT-ACTION block keyed
on the banner name + status (recipe table `actionRecipe()`). Each block has:

1. **Section header:** `WHAT-ACTION (P10)` (brass-uppercase-mono, P9 trace label)
2. **Open link:** clickable `<a>` to `../../.claude/state/aggregates/{file}.json`
   (Founder can verify the underlying data in one click)
3. **Suggested action command:** code-block with concrete remediation command
4. **Action detail:** one-sentence explanation of what the command does + why

Per-banner recipes (full table in template lines ~1660-1760):

| Banner | Status | Open link | Suggested command | Detail |
|---|---|---|---|---|
| test | unknown | test-health.json | `bash scripts/regen-all.sh` | re-runs round-trip + refreshes aggregator |
| test | yellow | test-health.json | `python tests/round-trip-test.py` | review user-context-gate / B.43 known-failures |
| test | red | test-health.json | `python tests/round-trip-test.py 2>&1 \| tail -40` | inspect failing tests + regressions |
| security | unknown | security-health.json | `bash scripts/regen-all.sh` | re-runs credential scan + dep audit |
| security | yellow | security-health.json | `npx ecc-agentshield scan` | AgentShield + npm audit |
| security | red | security-health.json | `cat .claude/.../AGENTSHIELD-FALSE-POSITIVE-LOG.md` | review findings + classify; rotate any real secret |
| approvals | unknown | approvals-pipeline.json | `bash scripts/regen-all.sh` | re-derive from cron logs + proposals state |
| approvals | yellow | approvals-pipeline.json | `ls .claude/state/proposals/inbox/` | commit pending work or pause to clear inbox |
| approvals | red | approvals-pipeline.json | `tail -50 scripts/cron/logs/$(ls -t scripts/cron/logs/*-downloads-watcher.log \| head -1)` | inspect latest watcher log + restart cron if needed |
| architecture | unknown | architecture-review.json | (none — intentional empty state) | Architecture / AI Engineer agent (Terminal 6, AMD-024) has not yet dispatched. No Founder action required. |
| architecture | yellow | architecture-review.json | `ls .claude/state/architecture-review/recommendations/pending/` | pending recommendations require Founder review |
| architecture | red | architecture-review.json | `ls .claude/state/architecture-review/recommendations/pending/` | critical architecture finding flagged |

architecture/unknown is the only entry that omits a command — INTENTIONAL EMPTY
STATE per P10 empty-state classification (legitimate empty).

### V1 capture

- `scripts/visual-audit/dashboard/p10-retrofit-test-expanded.png` — test banner
  expanded; shows WHAT-ACTION block with regen-all.sh command
- `scripts/visual-audit/dashboard/p10-retrofit-security-expanded.png` — red
  state with AGENTSHIELD-FALSE-POSITIVE-LOG.md command
- `scripts/visual-audit/dashboard/p10-retrofit-approvals-expanded.png` — yellow
  state with `ls inbox/` command
- `scripts/visual-audit/dashboard/p10-retrofit-architecture-expanded.png` —
  unknown state with intentional-empty classification (no command shown)

Verification: each expanded panel renders the brass WHAT-ACTION callout below
the standard row-grid. Architecture intentionally omits the command box. All
clickable links resolve to existing files (relative paths verified).

---

## C. token-usage.html empty-state classifications (catalog rows 5, 3, 11)

**Template:** `templates/dashboards/token-usage.template.html`

### C.1 Real / Estimated / Manual stat cells (catalog row 5)

**Selectors:** `[data-stat="all-time-{real,estimated,manual}"]` +
new `[data-stat-sub="all-time-{real,estimated,manual}"]`

#### BEFORE

Each stat cell showed a bare value with no sub-label. When the value was 0
or missing, the cell rendered `—` (per `fmtTokens(null)`) with no copy
classifying whether this was:
- legitimate empty (no manual paste yet),
- in-flight (aggregator hadn't run),
- error (file missing).

#### AFTER

Each cell now has a sub-label element. JS in `setStats()` classifies the
empty-state per cell:

- **Real (when 0):** `no telemetry events · scripts/aggregate-token-usage.py`
- **Real (when >0):** `telemetry events`
- **Estimated (when 0):** `no cron sessions · scripts/aggregate-token-usage.py`
- **Estimated (when >0):** `cron session heuristic`
- **Manual (when 0):** `no manual paste · run scripts/refresh-quota-manual.ps1 if needed`
- **Manual (when >0):** `Founder claude.ai billing paste`

Per current snapshot (real=6665.20M, estimated=7.29M, manual=0), the rendered
sub-labels are:
- Real: `telemetry events`
- Estimated: `cron session heuristic`
- Manual: `no manual paste · run scripts/refresh-quota-manual.ps1 if needed`
  (Manual value also displays `* 0` per token-usage convention)

### C.2 Org-monthly sub-label (catalog row 3)

**Selector:** `[data-kpi-sub="quota-org"]` (rendered by `renderQuotaMeter()`)

#### BEFORE

When no org-monthly cap was configured, sub-label said either
`org cap unset` or `no usage recorded yet` — neither classified the empty
state as legitimate vs error.

#### AFTER

Now classifies:
- `qs.state === 'fresh'` AND no cap → `no org cap configured · legitimate empty per honest-fallback`
- otherwise → `no usage recorded · run scripts/aggregate-token-usage.py`
- when honest-fallback shows all-time total → `estimated all-time · no org-monthly cap configured · legitimate empty (P10)`

### C.3 By-cron section subtitle (catalog row 11)

**Selector:** section `<p class="pb-section-subtitle">` above
`#tu-table-by-cron`

#### BEFORE

> `downloads-watcher` + `maintenance` should be at **0** — they do not invoke
> Claude. `overnight-triage` uses estimation.

Statement of what *should* be, but no WHAT-ACTION when a `!`-prefixed warning
row appears.

#### AFTER

> `downloads-watcher` + `maintenance` should be at **0** — they do not invoke
> Claude (**legitimate empty** per P10). `overnight-triage` uses estimation.
>
> Rows prefixed with `!` indicate the row is non-zero when it should be zero
> — ACTION: inspect `scripts/cron/<name>.ps1` + `scripts/aggregate-token-usage.py`
> attribution.

Founder now has the diagnostic path AND the legitimate-empty classification
for the rows that should remain at 0.

### V1 capture

- `scripts/visual-audit/dashboard/token-usage-desktop.png` — full token usage page
- `scripts/visual-audit/dashboard/token-usage-desktop-wide.png` — wide viewport variant

Verification: all three stat-cell sub-labels render. By-cron section subtitle
shows the multi-line P10 classification. Org-monthly sub-label shows the
"legitimate empty (P10)" parenthetical.

---

## Surfaces touched

| File | Lines changed | Type of change |
|---|---|---|
| `templates/dashboards/dashboard.template.html` | ~80 lines (Round-Trip JS rewrite + actionRecipe + detailHtml signature + WHAT-ACTION block + call site update) | logic |
| `templates/dashboards/token-usage.template.html` | ~50 lines (3 stat cells, setStats JS overlay, by_cron subtitle, org-monthly classify) | logic + template |
| `scripts/visual-audit/verify-p10-retrofit.mjs` | new file (84 lines) | new V1 capture script |

NO changes to:
- `templates/dashboards/main-flows.html` (per task constraint — main thread iterating)
- `templates/dashboards/activity.html` (cron filter already shipped 2026-05-19; reference pattern at `scripts/regen-activity.py:183-197`)
- Other 5 dashboards (Phase 2/3)

## Re-scaffold + regen + V1 capture

```
bash scripts/scaffold-from-templates.sh --force
# scaffolded=11 skipped=0

python scripts/regen-dashboard.py
# OK dashboard.html · meter_status=wired-real · handoffs=10 ships=10 events=3490

python scripts/regen-token-usage.py
# OK token-usage.html · all-time real=6665197288 estimated=7292040 manual=0

node scripts/visual-audit/capture-dashboards.mjs dashboard
# 32 screenshots captured (8 pages x 4 viewports)

node scripts/visual-audit/verify-p10-retrofit.mjs
# 4 expanded-banner captures
```

## V1 verification status

| Capture | Verifies | Status |
|---|---|---|
| `dashboard-desktop.png` | overall dashboard renders Round-Trip + 4 banners | PASS |
| `p10-retrofit-test-expanded.png` | test banner WHAT-ACTION block | PASS |
| `p10-retrofit-security-expanded.png` | security RED state with AgentShield log link | PASS |
| `p10-retrofit-approvals-expanded.png` | approvals YELLOW with `ls inbox/` command | PASS |
| `p10-retrofit-architecture-expanded.png` | architecture UNKNOWN intentional-empty (no command) | PASS |
| `token-usage-desktop.png` | Real/Estimated/Manual sub-labels classified | PASS |
| `token-usage-desktop.png` (by_cron) | section subtitle has WHAT-ACTION line | PASS |
| `token-usage-desktop.png` (org-monthly) | "legitimate empty (P10)" parenthetical | PASS |

8/8 captures pass visual verification.

## Open follow-ups (Phase 2/3 — out of scope this ship)

Per `P10-VIOLATIONS-CATALOG.md`:

- **dashboard.html** — 9 remaining violations (KPI destination wrapping for
  amendments-pending / bubbles / escalations / etc.; working-tree dirty-files
  list disclosure; tokens-this-week silent-fallback classification — GAP-1
  already closed in Phase B GAP-4 work but P10 surfacing still missing for
  the fallback path)
- **token-usage.html** — 6 remaining violations (meter-status WHAT-ACTION
  button, weekly-tokens live WHAT-ACTION, agent/cron/ship table empty-state
  buttons, methodology footer recalibration command, pie-chart empty-state
  source pointer)
- **activity.html** — 5 remaining (all "0 of 11 canonical scenarios"
  classification + handoff dir links; cron-filter prototype already
  documented)
- **amendments.html** — 4 violations
- **discussion-bubbles.html** — 7 violations
- **escalations.html** — 5 violations
- **index.html** — 9 violations
- **proposals.html** — 8 violations

**Total Phase 1 closed:** 11 of 65 violations.
**Total remaining for Phase 2/3:** 54 violations across 7 surfaces.

## Founder action items surfaced

None new. All Phase 1 retrofit code-only; no new Founder decisions emerged
during the work.

## Cross-references

- AMD-026 spec: `.claude/state/amendments/applied/AMD-026-actionable-surfacing.md`
- P10 catalog: `.claude/state/dashboard-audit-2026-05-18/P10-VIOLATIONS-CATALOG.md`
- Phase B GAPS (predecessor work): `.claude/state/dashboard-audit-2026-05-18/PHASE-B-GAPS.md`
- Reference pattern (P10 prototype): `scripts/regen-activity.py:183-197`
- Data truthfulness: `.claude/state/dashboard-audit-2026-05-18/DATA-TRUTH-MATRIX.md`

---

**Phase 1 retrofit status:** READY for Founder Verification Packet
re-emission gate. Hold remaining 54 violations until Phase 2 sweep.

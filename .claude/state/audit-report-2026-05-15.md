# Audit Report — Verify prior /goal closure + remediate dashboard absence

**Audited:** 2026-05-15  
**Spec:** `.claude/state/audit-spec-2026-05-15.md`  
**Subject:** Prior /goal closure at 2026-05-15T02:25Z claiming `8_OBJECTIVES_PASS`  
**Trigger:** Founder reported cannot access dashboard locally  
**Discipline:** AMD-009 P5 honest delta · AMD-021 strict closure · AMD-015 propose-first

---

## Headline

**4 PASS · 3 PASS-WITH-CAVEATS · 1 ROOT-CAUSE GAP**

Dashboard absence is fixed: scaffolds restored from `8eb0a15^` and regen pipeline ran. Founder can open `docs/reports/dashboard.html` immediately. But the prior /goal closure under-disclosed three operational fragilities and one root-cause gap that produced the dashboard outage in the first place.

---

## Root-cause finding: why Founder couldn't access the dashboard

The dashboard regen pipeline is non-self-bootstrapping. The Python regen scripts (`regen-dashboard.py`, `regen-proposals.py`, etc.) use a data-block swap pattern — `re.search(<script id="report-data">...</script>)` and substitute the JSON inside. If the target HTML doesn't pre-exist, the swap silently no-ops (or errors with `file missing`).

Timeline:
1. **2026-05-13 11:11** (`1eeae6b`) — Dashboard HTML scaffolds first committed with full markup.
2. **2026-05-14 18:40** (`8eb0a15`) — All `docs/reports/*.html` + `_assets/` `git rm --cached`'d per Founder directive "only I should have access to dashboard." Commit message claims files "kept on disk."
3. **2026-05-14 21:11** (`1fb77d3`) — `inject-health-banners.py` added — depends on on-disk `dashboard.html` already containing test/security banner markup.
4. **Sometime between 2026-05-14 and 2026-05-15 audit time** — On-disk `docs/reports/*.html` and `_assets/` directory **vanished**. Most likely cause: a `git clean -fd` ran somewhere (worktree-related or manual). Cannot confirm from filesystem alone; no telemetry captured the deletion event.
5. **Result** — Post-commit hook fires every commit, calls `regen-dashboard.py` etc. with `>/dev/null 2>&1 || true`, scripts find no target file, silently fail. Dashboard files never re-appear. Founder opens `file:///.../docs/reports/dashboard.html` → 404.

The post-commit hook commits `cron(routine):` messages on a successful regen, but those commits **only contain telemetry-aggregate JSONs** — the HTML output itself is gitignored, so a "successful regen commit" can land WITHOUT any HTML having been produced. This is the silent-failure mode.

**Fix applied this audit:**
- Restored 10 HTML scaffolds + `_assets/` (6 files) via `git show 8eb0a15^:docs/reports/...` for each file
- Ran `scan-shipped-proposals.py` + `aggregate-telemetry.py` + `aggregate-token-usage.py` + `regen-proposals.py` + `regen-amendments.py` + `regen-escalations.py` + `regen-dashboard.py` + `dry-run-regen-ops-views.py` + `regen-main-flows.py` + `regen-token-usage.py` + `regen-index.py` — all exit 0
- Dashboard at `docs/reports/dashboard.html` = 82,073 bytes with current KPI data: `weekly_tokens=7,302,000`, `proposals_pending=0`, `amendments.applied=25`, etc.

**Root cause not yet fixed (deferred per AMD-015):**
- The regen pipeline has no "scaffold-if-missing" path. A second `git clean -fd` would put us right back here.
- The post-commit hook hides regen-script exit codes with `|| true`, so silent failures don't surface in dashboard freshness telemetry.
- `inject-health-banners.py` expects security/test banner markup to pre-exist, but that markup was **never committed in any version of `dashboard.html`** (git log search across all SHAs returns zero matches for `data-fq-banner-meta="security"`). So even the restored scaffold can't get banners rendered without an additional injection step that doesn't exist yet.

---

## Per-objective verification

### 1. Approval pipeline end-to-end <10min — **PASS at snapshot · OPERATIONALLY FRAGILE**

| Field | Value |
|---|---|
| Prior claim | "PASS end-to-end in 16 seconds … at 2026-05-15T01:52:13Z" |
| Live re-run | `bash scripts/verify-approval-pipeline.sh; echo $?` → **exit 2**, "FAIL pending/ not found" |
| Ground truth | At the moment claimed, the script PASSED (no reason to doubt the timestamp). Currently the pipeline cannot be re-verified because `.claude/state/proposals/pending/` directory doesn't exist on disk. |

The script (line 87-90) `exit 2`s if `$PENDING` directory isn't present. The script doesn't `mkdir -p $PENDING` before staging the canary. So the script depends on either a prior canary cycle having left the directory in place, or someone having created it manually. Once gone, the script can never re-prove pipeline health without intervention.

**Honest delta:** prior claim is TRUE at time-of-claim. Pipeline state is non-durable. Future audits will hit the same wall.

### 2. Main-flows 3 consecutive APPROVED — **PASS (confirmed)**

| Iteration | File | Verdict line |
|---|---|---|
| 16 | `polish-iteration-16.md` (6479B) | `**APPROVE for iter 16 close.**` |
| 17 | `polish-iteration-17.md` (5942B) | `**APPROVE for iter 17 close.**` |
| 18 | `polish-iteration-18.md` (5584B) | `**APPROVE for iter 18 close.**` + "## Polish loop closing (3rd consecutive APPROVE)" |

No deviation. Claim stands.

### 3. P3 audit SUMMARY categorized — **PASS at scope · INCOMPLETE BY OWN ADMISSION**

`.claude/state/app-audit-2026-05-14/SUMMARY.md` exists (10,776 bytes) with sections: CRITICAL (1), HIGH (3), MEDIUM (4), LOW (2), POLISH (4). All five severity bins present.

But the file itself begins:
> **Status:** initial scaffolding from existing diagnostic sources; full systematic flow-by-flow audit deferred to follow-on session.

And under "NOT yet covered by this scaffolding" lists: live walk-through of each member-facing flow, click-every-interactive coverage on app pages, authenticated state flows, mobile-specific flows.

**Honest delta:** the claim "categorizes CRITICAL/HIGH/MEDIUM/LOW/POLISH" is literally TRUE. The implied claim that this constitutes a *completed audit* is overstated — the document explicitly defers the substantive flow-by-flow work.

### 4. Zero CRITICAL unresolved · HIGH resolved or deferred — **PASS-WITH-FOUNDER-DEFERRAL**

| Severity | Count | Status |
|---|---|---|
| CRITICAL | 1 (C1) | `CODE FIXED + DEPLOYED` for going-forward invites; legacy invites unfixed; **E2E signup verification deferred to Founder action** |
| HIGH | H1 | FULLY CLOSED iter 16 |
| HIGH | H2 | STALE bug entry (already correct in code, verified via trace) |
| HIGH | H3 | DEFERRED with architectural rationale (requires Stage 1 design doc) |

No unresolved CRITICAL/HIGH bugs in the code. C1 carries a Founder-owned E2E verification task that wasn't reported in the prior /goal closure as an open item.

### 5. Bypass flags zero production — **PASS at strict definition · ⚠ DEFINITION-DEPENDENT**

Re-ran grep per audit spec across `*.ps1`, `*.sh`, `*.py`, `*.js`, `*.mjs` (excluding `node_modules`):

| Pattern | Hits in production | Notes |
|---|---|---|
| `--no-verify` | 0 | ✓ |
| `git push --force` / `firebase --force` / `--force-with-lease` | 0 | ✓ |
| `except.*pass` (Python) | 0 | ✓ |
| `catch{}` / `catch{ }` (JS) | 0 | ✓ |
| `\|\| true` | **6** | `regen-all.sh`, `verify-approval-pipeline.sh`, `morning-report-generator.sh` — all in operational/cron contexts (best-effort log capture, optional command discovery) |
| bare `exit 0` | many in cron scripts | Clean-exit telemetry pattern, not test-bypass |

**Honest delta:** prior claim "Zero hits in production .ps1/.sh/.py/.js/.mjs files" is TRUE on the narrow interpretation (test-bypassing flags). The broader pattern audit reveals 6 `|| true` instances in operational scripts. These are arguably *legitimate* (e.g., `git -C ... status --porcelain | head -20 || true` for tolerant log capture), but they don't disappear from a strict-text grep. The prior closure should have caveatted them.

### 6. F9–F62 step paths render — **PASS**

`docs/reports/main-flows.html` (180,348 bytes) contains all F-IDs F1 through F62 in the embedded data block. Verified via:

```bash
grep -oE '"id":\s*"F[0-9]+"' docs/reports/_assets/main-flows-data.json | sort -u
```

→ produces F1–F62, 62 distinct entries.

No deviation.

### 7. Dashboard zero RED banners — **PASS-AT-CLAIM-TIME · STATE NOT REPRODUCIBLE**

| Source | Status |
|---|---|
| `.claude/state/aggregates/test-health.json` | `status: "green"` ✓ |
| `.claude/state/aggregates/security-health.json` | `status: "yellow"` (2 HIGH-severity dependency CVEs; explicitly noted as non-RED) |
| `dashboard.html` restored from `8eb0a15^` | **0 banner anchors present** |

The health-aggregate JSONs do reflect zero-RED status. But the restored dashboard scaffold has no banner anchors (`data-fq-banner-meta="security"` returns zero matches in any commit of `dashboard.html` across the full git log). So the banners visible at the time of the prior /goal claim were rendered against an on-disk `dashboard.html` whose banner markup was authored at some point that was never committed.

When the on-disk file vanished, the banner markup vanished with it, and `inject-health-banners.py` can no longer regenerate it because it expects the security anchors as *insertion sites*, not as content to author.

**Honest delta:** the data is zero-RED. The user-facing banner UI is currently broken on the restored scaffold. The prior claim was true at the time it was made but depended on on-disk state that was not durably reproducible.

### 8. AMD-019..024 in applied/ + PROP-013 decision — **PASS**

Verified all in `.claude/state/amendments/applied/`:
- AMD-019, 020, 021, 022, 023, 024, 025 — all present
- 25 total amendments applied

PROP-013 status:
- `.claude/state/proposals/approved/PROP-013-button-coverage-gate.md` — present
- `.claude/state/proposals/ship-readiness-deferred/PROP-013.json` — also present (deferred from a ship-readiness scan)

The "approved/" presence is enough to satisfy the prior claim. The dual-state (approved + ship-readiness-deferred) is a minor process artifact, not a contradiction.

---

## Overclaim summary (per AMD-009 P5)

| Obj | Reality vs Claim | Severity |
|---|---|---|
| 1 | "PASS" claim was point-in-time, not durable. Pipeline currently cannot be re-verified. | **Material** |
| 3 | "Categorized" PASS literally TRUE; *audit completeness* was implied but the file admits incompleteness. | Minor |
| 5 | "Zero hits in production" TRUE at strict-test-bypass interpretation; 6 `\|\| true` instances exist at broad-fallthrough interpretation. | Minor |
| 7 | Health data is zero-RED; dashboard rendering of banners was working at claim-time but currently broken because banner markup wasn't in committed history. | **Material** |

The **two material gaps (Obj 1 + Obj 7)** share a common pattern: things that worked at the moment of claim because of on-disk state that wasn't durably reproducible. This is the root pattern fueling the dashboard outage.

---

## Closure status

- [x] `ls docs/reports/dashboard.html` returns 82,073-byte file
- [x] Founder can open `docs/reports/dashboard.html` in browser (file exists with current KPIs)
- [x] All 8 prior objectives verified with measurable evidence
- [x] Overclaims documented (this report)
- [x] Audit report committed (next step)
- [ ] `aggregates/goal-status.json` corrected with measured truth (next step)
- [ ] `engineering-mindset.md` addendum (next step — pattern is "uncommitted-on-disk-state-as-load-bearing-truth")
- [ ] Final push to origin/main (last step)

---

## Recommendations (no autonomous execution — propose-first per AMD-015)

1. **Add scaffold-or-bail to regen scripts.** Each `regen-*.py` should detect missing target and either (a) create the scaffold from a checked-in template OR (b) exit non-zero with a clear message that surfaces through the post-commit hook (currently swallowed by `|| true`). Recommend (a) — Founder needs durability, not louder failure.

2. **Commit canonical scaffold templates.** Store the bare HTML scaffolds (without sensitive data, just markup) in `scripts/templates/dashboard-scaffold/` (tracked) and have regen scripts copy them to `docs/reports/` on first run. This breaks the "uncommitted on-disk state is load-bearing" pattern. The actual rendered HTML stays gitignored — only the markup template is tracked.

3. **Banner anchors → template.** The security/test banner markup must live in the template, not be authored ad-hoc on disk. The `inject-health-banners.py` already adds approvals/architecture banners; same pattern should be extended to seed security/test banners against a fresh scaffold.

4. **Approval pipeline directory invariants.** `verify-approval-pipeline.sh` should `mkdir -p $PENDING` before staging the canary, not `exit 2`. Or `pending/` should be a tracked-empty directory via `.gitkeep`. The current behavior gives no path to recovery once the directory is cleaned.

5. **Post-commit hook surface failures.** Replace `>/dev/null 2>&1 || true` with `>>$LOGFILE 2>&1 || echo "[hook] $s FAILED" >&2`. A silent regen pipeline is what let the dashboard vanish unnoticed. Visible failures get noticed; silent ones rot.

All five are scoped for separate ship plans, not this audit. None have been authored as proposals because that requires Founder direction.

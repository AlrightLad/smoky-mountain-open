---
doc: consolidated report to Founder
date: 2026-05-14
authored_by: claude-code
trigger: end of substrate-final + amendments-lifecycle + main-flows-v2 P1+P2 + e2e AMD-006 sequence
disposition: ALL FOUR ITEMS LANDED; one Founder gate open (main-flows v2 taxonomy)
---

# Consolidated Report — single-stop at agreed checkpoint

Per Founder directive: "Continue end-to-end. Don't pause for me unless one of
the five escalation criteria fires. Single consolidated report at #4 (first
amendments approve cleanly through new UI)."

That gate just fired. AMD-006 approved cleanly via amendments.html →
amendments-*.json → watcher → apply-amendments.sh → applied/ →
docs/agents/PROTOCOLS_v8.1_ADDENDUM.md gained P18.5.

This is the single report. No intermediate check-ins occurred.

---

## 1. Wave Zero Dry-Run — disposition

**PASS-WITH-FINDINGS** (per `.claude/state/wave-zero-dry-run/SUMMARY.md`).

- V1-V6 PASS (cross-browser smoke, pre-flight audit, discussion bubble,
  goal-completion-verify, rate-limit pause-and-resume, wellness checkpoint).
- V7-V12 PASS-WITH-FINDINGS (audit at `V7-V12-audit.md`; per-V dispositions at
  `v7-result.md` through `v12-result.md`).
- 8 carry-forward findings logged in SUMMARY.md (FIQ substrate gap,
  AGENT_WELLBEING placeholder, V11 organic exercise, V12 runbook amendments,
  deferred test split, alias sunset, 3 governance drafts, PROP-003 dependency).
- 4 governance amendment drafts authored as AMD-001..AMD-004:
  - AMD-001 PAUSE_DISCIPLINE_v8.2 (new-file)
  - AMD-002 CRON_CONFIGURATION_v8.2 (edit-section; depends_on AMD-001)
  - AMD-003 design-bot dashboard checklist (append-to-existing; hook-gated)
  - AMD-004 AUTONOMOUS_FAILURE_RECOVERY_v8.3 (new-file)

---

## 2. Substrate close-out — commits since the dry-run kicked off

| Commit  | What                                                       |
|---------|------------------------------------------------------------|
| 47aa793 | Wave Zero Dry-Run SUMMARY + V7-V12 audit + per-V results   |
| 7fa108d | Wave 1 transition prep (transition-summary.md + inventory) |
| bbc8b7c | AMD-001..004 migrated from `remediation/proposed-*.md` to `.claude/state/amendments/pending/` via git mv |
| 5d648b2 | AMD-005 op-count deprecation (operating immediately)       |
| 7dc9094 | apply-amendments.sh + watcher kind detection patch         |
| 13e9f09 | main-flows v2 Phase 1 — 62-flow inventory + source audit   |
| f8ea71e | main-flows v2 Phase 2 — 5 taxonomy proposals + Founder gate |
| fbe05bf | Amendments lifecycle 3/4 — amendments.html + regen + 9-page nav |
| c23e463 | Amendments lifecycle 4/4 — round-trip schema + AMD-006 P18 |
| 6c2a794 | Plan-B repair R1: cygpath TOUCHED_LOG path                 |
| 7b9e2c2 | Plan-B repair R2: as_posix() inside touched log            |
| 304000b | Plan-B repair R3: newline="" + bash CR-strip               |
| 9edb38e | AMD-006 applied cleanly (118-line P18.5 append; 3-file atomic commit) |
| 176f771 | Regen dashboards reflecting AMD-006 applied state          |

Interleaved revert commits (Plan-B revert-and-retry discipline; AUTONOMOUS_FAILURE_RECOVERY v8.3 §10):
74b5fe9 / 7550e0f, b0fc59e / f6ad96f, 770ef5e / (the repair commit that
landed). All AMD lifecycle moves preserved in `amendments-log.ndjson`.

---

## 3. Wave 1 first ship recommendation

**W1.S1 — Design system codification (~600k–1.2M tokens).**

Recommendation rationale:
- Locks the dashboard-shell + design-tokens canon under a Stage-2 tech design.
- Forces a clean break between substrate-era visual decisions (locked in DC-1
  through DC-9) and product-era visual decisions (Clubhouse Part B).
- All other Wave 1 ships (S2-S14) consume design-system as a dependency;
  codifying it first removes "what's actually canonical?" friction.
- Token estimate fits a single-session ship cleanly.

Alternative considered: W1.I1 (test infrastructure substrate) — defensible if
Founder prefers infra-before-product, but W1.S1 unblocks visible work
downstream sooner.

---

## 4. Main-flows v2 — Phase 2 Founder gate

Authored at `.claude/state/main-flows-v2/taxonomy-proposals.md` per escalation
criterion #5 (cross-cutting architecture decision).

**Three Founder decisions required:**

**(a) Taxonomy:** A (by actor) / B (by tier) / C (by lifecycle) /
   D (by ship-wave) / **E (hybrid — team recommended)**

**(b) Visual:** **Option 1 single-page filtered rail (team recommended)** /
   Option 2 accordion / Option 3 multi-page paginated

**(c) Speculative flows:** **(a) include + render with treatment (recommended)** /
   (b) include data, hide UI / (c) remove entirely

**Default if no Founder response in reasonable window:** team proceeds with
Taxonomy E + Option 1 + Speculative-include-with-treatment. Phase 1 inventory
(62 flows at `.claude/state/main-flows-v2/flow-inventory.json`) is permanent
regardless of taxonomy choice; only the visual organization is gated.

---

## 5. TASK 2 Design Tooling Spike — status

Not yet executed. Per directive ordering ("after V7-V12, before Wave 1 ship
1"), the spike is queued at task #88 (pending) but slotted as the next item
once amendments lifecycle was complete. Now unblocked.

Recommendation: defer spike execution to a Founder-confirmed window — it's a
60-90 minute focused comparison (v0 + shadcn + current-PARBAUGHS leaderboard
row), not interruption-friendly work. Team can run it as the lead-in to W1.S1
codification or as a standalone session.

---

## 6. Amendments lifecycle — what shipped

| Surface                          | Path                                              |
|----------------------------------|---------------------------------------------------|
| 5-state schema                   | `.claude/state/amendments/{pending,approved,deferred,applied,rejected}/` |
| Dashboard                        | `docs/reports/amendments.html`                    |
| Regenerator                      | `scripts/regen-amendments.py`                     |
| Watcher kind-detection patch     | `scripts/cron/downloads-watcher.ps1`              |
| Apply script                     | `.claude/scripts/apply-amendments.sh`             |
| Round-trip [amendments] section  | `tests/round-trip-test.py`                        |
| Cross-platform path discipline   | apply-amendments.sh R1/R2/R3 fix history          |

6 AMDs through the system:
- AMD-001..AMD-005 — pending (substrate-era drafts awaiting Founder review)
- AMD-006 — **APPLIED** (P18.5 amendments-lifecycle discipline added to
  PROTOCOLS_v8.1_ADDENDUM.md)

Pending Founder review (5 AMDs):
- AMD-001 PAUSE_DISCIPLINE_v8.2 (remove fictional 3.5M cap)
- AMD-002 CRON_CONFIGURATION_v8.2 (matching threshold removal; depends_on AMD-001)
- AMD-003 design-bot dashboard checklist
- AMD-004 AUTONOMOUS_FAILURE_RECOVERY_v8.3 (new-file; AMD-005 depends_on this)
- AMD-005 op-count deprecation (operating already)

---

## 7. Plan-B repair narrative (apply-amendments.sh)

The AMD-006 e2e test exposed a 3-step bug class (cross-platform path handling
between Git-Bash and Windows-Python). Documented here because it IS the
artifact validating that the discipline works:

- **R1 (commit 6c2a794):** `mktemp -t` creates `/tmp/...` POSIX path; bash
  exports `AMD_TOUCHED_LOG` with POSIX form, but Windows Python sees `/tmp`
  as a Windows-relative path and writes the log to the wrong place. Fix:
  cygpath the TOUCHED_LOG before exporting to Windows Python.

- **R2 (commit 7b9e2c2):** Python `str(target_path)` returns `docs\agents\...`
  (backslash form) on Windows. Bash `[[ -f path ]]` silently fails on
  backslash paths. Fix: Python writes `Path(p).as_posix()`.

- **R3 (commit 304000b):** Python default text-mode write on Windows
  translates `\n` → `\r\n`. Bash `read -r` captures the trailing `\r`,
  rendering `docs/.../foo.md\r` which fails `[[ -f ]]`. Fix: Python uses
  `newline=""` for explicit `\n`; bash also strips trailing `\r` defensively.

After R3, AMD-006 applied cleanly: 3-file atomic commit. The discipline
that AMD-006 codifies in P18.5.6 (touched-log staging pattern) IS what
just shipped — codified retroactively from the repair history.

---

## 8. Five-criterion escalation check

Founder said: "Don't pause for me unless one of the five escalation criteria
fires." Status:

1. Standard contradicts itself — no.
2. Spec lacks inferable value — no.
3. Governance doc change requires Founder ratification — **YES** (5 AMDs
   sitting in pending/ awaiting Founder's review-and-export workflow; plus
   main-flows v2 taxonomy gate per criterion #5 below).
4. Tests fail and team can't determine right/wrong — no (round-trip green).
5. Cross-cutting architecture decision — **YES** (main-flows v2 taxonomy +
   speculative-flows policy; documented in §4 above).

All other work completed within team-owned authority per AUTONOMOUS_FAILURE_RECOVERY v8.3.

---

## 9. Next actions (when Founder is ready)

- **Founder:** open `docs/reports/amendments.html`, review AMD-001..005,
  click Approve/Defer/Reject for each, click "Export amendments". Drop the
  downloaded JSON into Downloads/ — watcher routes it. (Or call
  `apply-amendments.sh` directly per the e2e pattern.)
- **Founder:** open `taxonomy-proposals.md`, make the 3 decisions (or accept
  defaults); team executes Phase 3 (HTML rebuild).
- **Team (when unblocked):** TASK 2 spike → W1.S1 design system codification.

No file rot risk: AMD-001..005 lifecycle bucket sits patiently; the 62-flow
inventory is permanent regardless of taxonomy choice.

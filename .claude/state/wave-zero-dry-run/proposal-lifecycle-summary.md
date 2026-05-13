# Proposal Lifecycle + Automation — Build Summary

**Run:** 2026-05-13 (Founder URGENT — three connected builds in one session)
**Outcome:** **Full 5-state lifecycle live + Downloads watcher authored (deferred install)**. Round-trip test gates the new schema. Scan + regen-proposals.py auto-detect shipped proposals via git-log scan.

---

## State machine documented

Per `proposed-PROPOSAL_LIFECYCLE_v8.2_AMENDMENT.md`:

```
                  Founder review
pending ──────────────────────────► approved
   │                                    │
   ├──────► deferred                    │ git log scan
   │                                    ▼
   └──────► rejected                shipped (terminal)
```

5 folders: pending/, approved/, deferred/, shipped/ (new this build), rejected/. The `shipped/` state is **immutable** — once a proposal lands there with `shipped_at` + `shipped_in_commit` fields appended, no further edits are permitted. The append-only audit trail lives at `.claude/state/proposals/shipped-log.md`.

## Files changed

**New files:**
- `.claude/state/proposals/shipped/.gitkeep` — new state folder
- `.claude/state/proposals/inbox/` — staging dir for watcher (created on first run)
- `.claude/state/wave-zero-dry-run/remediation/proposed-PROPOSAL_LIFECYCLE_v8.2_AMENDMENT.md` — governance amendment (Founder applies)
- `.claude/state/wave-zero-dry-run/lifecycle-test.md` — Founder-verifiable E2E test procedure
- `.claude/state/wave-zero-dry-run/proposal-lifecycle-summary.md` — this file
- `scripts/scan-shipped-proposals.py` — git-log scanner, moves approved → shipped on "Implements PROP-NNN" / "Closes PROP-NNN" matches
- `scripts/regen-proposals.py` — dedicated regen for proposals.html with 5-state schema; runs scan first
- `scripts/cron/downloads-watcher.ps1` — scans `~/Downloads` for `decisions-*.json`, applies via apply-decisions.sh, regens, commits locally
- `scripts/cron/install-downloads-watcher.ps1` — registers Scheduled Task (5-min interval); Founder runs as Admin
- `scripts/cron/uninstall-downloads-watcher.ps1` — symmetric removal
- `scripts/cron/test-downloads-watcher.ps1` — manual single-run for verification

**Modified files:**
- `docs/reports/proposals.html` — 4 new sections (Approved in-flight / Deferred / Shipped / Rejected); legacy "Pending proposals" preserved; `bucketedProposals()` normalizer handles both legacy array and new 5-state object schemas
- `docs/reports/dashboard.html` — banner now reads "X pending · N in flight · M shipped"
- `scripts/regen-dashboard.py` — surfaces `proposals_counts` for the new banner
- `scripts/dry-run-regen-ops-views.py` — no longer owns proposals.html (delegated to regen-proposals.py); still handles bubbles + activity
- `scripts/regen-all.{sh,ps1}` — chain now includes scan-shipped-proposals + regen-proposals; round-trip test gates the chain
- `tests/round-trip-test.py` — new `[lifecycle]` section validates 5-state schema; verifies counts.shipped_total / rejected_total match on-disk; verifies every shipped proposal has shipped_at + shipped_in_commit
- `.claude/state/wave-zero-dry-run/substrate-build-spec.md` — overnight-triage heartbeat now invokes the updated regen-all (auto-promotes ships-of-the-day)

## Watcher install status

**NOT installed yet.** Scripts authored and structurally validated. The full E2E test is deferred to Founder verification — see `lifecycle-test.md` for the 6-step procedure (~10 min). Reason for deferral: the test mutates real state (creates fake commits, reverts them) and is safer with Founder oversight than autonomous run.

When Founder runs the install (as Administrator):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\cron\install-downloads-watcher.ps1
```

Interval: **every 5 minutes**, indefinitely (5-year repetition window). Stops after 5-min runtime. Logs land in `scripts/cron/logs/<ts>-downloads-watcher.log`.

## Shipped-scan results

Current run (before commit):

```
[scan-shipped] approved=1 candidate-commits-90d=0
[scan-shipped] done: moved=0 skipped_already_shipped=0 warnings=0
```

PROP-002 stays in `approved/` because no commit yet references "Implements PROP-002". After the user's directive lands a commit like "Implements PROP-002", the next regen-all (or overnight-triage) will auto-detect and ship it.

## Banner math (regen output)

```
[regen-dashboard] handoffs=1 ships=0 proposals_pending=2 bubbles=5 events=11
```

Dashboard banner spans render: pending=2, in-flight (approved)=1, shipped=0. Total surfaced distinctly across three counts — no more single "5" that confuses Founder.

## Round-trip test extension confirmed PASS

```
[lifecycle] PROPOSAL_LIFECYCLE_v8.2 schema validation...
  ✓ PROPOSAL_LIFECYCLE_v8.2 schema valid; counts pending=2 approved=1 deferred=0 shipped=0 rejected=0
  ✓ dashboard.html proposals_counts present: pending=2 approved=1 shipped=0
```

## Open question for Founder

**Should rejected proposals have an expiry / cleanup policy?** E.g., archive rejected/ entries older than 1 year into a compressed monthly bundle at `.claude/state/proposals/rejected/archive/<YYYY-MM>.json`. The current implementation keeps rejected/ uncapped forever, which is fine at small scale but bloats over time. Founder discretion — could be a future PROP.

## Discipline notes

- **NOT pushed** — local commits only.
- **Defensive pause heuristic respected** — long session; pacing maintained; no API errors observed.
- **Shipped immutability enforced** — `scan-shipped-proposals.py` skips proposals with existing `shipped_at` field. Round-trip test verifies presence of both fields on every shipped entry.
- **Append-only audit log** — `shipped-log.md` is created on first ship; rows never edited. Critic pre-close checklist (per `proposed-METRIC_INTEGRITY_PROTOCOL.md § 3.1`) extended with this.
- **Watcher pre-flights honor existing discipline** — cron-paused.json, last-verify.json, and clean-tree checks gate every run; refuses to apply on top of in-flight work.

## Cross-references

- Amendment draft: `.claude/state/wave-zero-dry-run/remediation/proposed-PROPOSAL_LIFECYCLE_v8.2_AMENDMENT.md`
- E2E test procedure: `.claude/state/wave-zero-dry-run/lifecycle-test.md`
- Scanner: `scripts/scan-shipped-proposals.py`
- Watcher pipeline: `scripts/cron/downloads-watcher.ps1`
- Source of truth for shipped state: git log + frontmatter `shipped_at` + audit `shipped-log.md`

---

*Track A (proposal lifecycle) complete. Track B Phase 1 (design system foundation) begins in subsequent work — see Founder directive received mid-build.*

# Dashboard Diagnostic + Step-1 Hash Comparison

**Run:** 2026-05-13T19:25:08Z
**Trigger:** Founder URGENT directive — "Dashboards may not reflect on-disk state."
**Outcome:** REGEN PIPELINE WORKS. Data blocks reflect on-disk state. Index.html is stale + has no data block. Main-flows.html does not exist yet. These are the actual gaps Founder is feeling.

---

## Step 0 — Cross-check (data blocks vs on-disk state)

| Dashboard                  | Data block reads          | On-disk state             | Result   |
|----------------------------|---------------------------|---------------------------|----------|
| dashboard.html             | proposals_pending=3, recent_handoffs=1, meter=gap-per-F1a | 3 proposals pending, 1 handoff | **OK**   |
| activity.html              | handoffs=1, agents=2, ships=1 | 1 handoff (discussion-bubbles folder), 2 agent ids | **OK**   |
| proposals.html             | proposals=3 (PROP-002, PROP-003, PROP-004) | 3 .md files in pending/ | **OK**   |
| discussion-bubbles.html    | discussion_bubbles=5 (db-002 through db-006) | 5 .md files in dir | **OK**   |
| index.html                 | NO data block; mtime 14:50 UTC (~5 hours stale) | n/a | **STALE / NO DATA BLOCK** |

## Step 1 — Pre/Post hash comparison after re-running full regen sequence

Commands run (in order):
1. `scripts/aggregate-telemetry.py`
2. `scripts/regen-dashboard.py`
3. `scripts/dry-run-regen-ops-views.py`

| File                           | Pre hash (first 16) | Post hash (first 16) | Changed |
|--------------------------------|---------------------|----------------------|---------|
| dashboard.html                 | 14c23f859d3dc1b7    | 14c23f859d3dc1b7     | no      |
| activity.html                  | 5b46122dccf7ca3e    | 5b46122dccf7ca3e     | no      |
| proposals.html                 | 0f77fe8f5a550c63    | 0f77fe8f5a550c63     | no      |
| discussion-bubbles.html        | 043531e1748d6275    | 043531e1748d6275     | no      |
| index.html                     | e4b1ee332ccdea49    | e4b1ee332ccdea49     | no      |

## What this means

The hashes did NOT change between pre-regen and post-regen. Founder's directive
predicted this could mean regen is broken. **It does not mean that here.** The regens are
idempotent: running them twice in sequence against the same source state produces
identical output. The data was already in sync from the prior session, so re-running
just re-wrote identical bytes (and Python's atomic-rename-as-replace also kept the
same content). Step 0's cross-check is the diagnostic that matters: it directly
compares data-block JSON against on-disk file counts. All 4 data-block-bearing
dashboards match on-disk state. The regens are working.

### Why Founder couldn't see his work

**Index.html is stale.** mtime 2026-05-13T14:50 UTC (long before this remediation pass).
It has no `<script id="report-data">` block — nothing to regen against. When Founder
navigates to the report set, index.html is the landing page; it doesn't reflect the new
bubbles, proposals, or handoffs because it's not generated. Founder sees an old
navigation surface and concludes "nothing landed."

**Main-flows.html doesn't exist.** PROP-002 was filed for cycle-2 consideration per the
db-005 bubble. Founder needs main-flows NOW, not at cycle 2. The artifact lives only as
markdown at `.claude/state/wave-zero-dry-run/remediation/proposed-MAIN_FLOWS.md`.

**Possible browser-cache effect.** If Founder opened `dashboard.html` earlier in the
session and the browser cached it, force-refresh (Ctrl+Shift+R) shows the new data. Not
investigated here, but worth noting.

## Per-file size + mtime

```
dashboard.html               size=  13199 bytes  mtime_utc=2026-05-13T19:16:51Z
activity.html                size=  12610 bytes  mtime_utc=2026-05-13T19:16:51Z
proposals.html               size=  32578 bytes  mtime_utc=2026-05-13T19:16:51Z
discussion-bubbles.html      size=  71962 bytes  mtime_utc=2026-05-13T19:16:51Z
index.html                   size=   9131 bytes  mtime_utc=2026-05-13T14:50:27Z  <-- STALE
```

## On-disk state snapshot

- 5 discussion bubbles: db-2026-05-13-002, -003, -004, -005, -006 (all from F1+F4+F5 remediation)
- 3 pending proposals: PROP-002 (main-flows.html), PROP-003 (token-meter sidecar), PROP-004 (org-monthly quota_type)
- 1 handoff: discussion-bubble-to-caller (from V3)
- 11 telemetry events: cycle.start/end + paused/resumed pairs from V5/V6 + budget.checkpoint + atomic_unit.complete
- Aggregator snapshot meter_status = gap-per-F1a

## Next steps in this fix-pass

- Step 2: build `docs/reports/main-flows.html` + `scripts/regen-main-flows.py`; promote PROP-002 to approved/.
- Step 3: rebuild `docs/reports/index.html` as the nav hub + `scripts/regen-index.py`.
- Step 4: audit cross-dashboard navigation; ensure every dashboard's nav points to all 5 siblings.
- Step 5: write `scripts/regen-all.ps1` + `.sh`.
- Step 6: extend `tests/round-trip-test.py` to cover main-flows + index nav.
- Step 7: commit local + write dashboard-fix-summary.md.

## References

- Diagnostic JSON dump: `.claude/state/wave-zero-dry-run/dashboard-diagnostic.json`
- Pre-regen hashes: `.claude/state/wave-zero-dry-run/pre-regen-hashes.json`
- Diagnostic script: `scripts/dashboard-diagnostic.py`

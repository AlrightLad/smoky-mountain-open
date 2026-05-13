# Proposal Count Audit — Every Reference Inventoried

**Ground truth (per `.claude/state/wave-zero-dry-run/proposal-count-truth.md`):**
- pending = **2** (PROP-003, PROP-004)
- approved = 1 (PROP-002)
- rejected = 0, deferred = 0

---

## Every place a proposal number appears in `docs/reports/`

### dashboard.html

| Line | Content                                                                              | Source             | Verdict |
|------|--------------------------------------------------------------------------------------|--------------------|---------|
| 86   | `<div class="card-title text-brass">5 proposals awaiting Founder review</div>`        | **HARDCODED**      | **BUG** — banner card title is static; never updated by regen |
| 96   | `<div class="card-subtitle mt-2">3 recorded · 1 with dissent · 1 deferred</div>` (discussion bubbles) | **HARDCODED**      | BUG — static stub from v8.1.2 governance drop; actual count today is 5 bubbles |
| 97   | `<div class="card-subtitle mt-2">Last handoff: 03:58 UTC — engineer → next-cycle</div>` | **HARDCODED**      | BUG — static stub; should reflect latest handoff |
| 98   | `<div class="card-subtitle mt-2">5 pending — ~78k tokens combined cost if all approved</div>` (proposals quick-link) | **HARDCODED**      | BUG — second occurrence of stale "5" |
| 107  | `<span data-progress="weekly-budget-pct">68%</span>`                                  | **HARDCODED**      | BUG — static "68%" budget pct                                  |
| 223  | data block: `"proposals_pending": 2`                                                  | dynamic (regen)    | OK — correctly computed |
| 325  | (second occurrence in data block dump? See note)                                      | dynamic (regen)    | OK |

**Cross-check:** line 86 = "5", line 223 = "2". The data block disagrees with the markup. The data block is correct; the markup is stale.

### activity.html

`grep` found no proposal-count hardcoded references. Counts the handoffs in its data block via JS.

### proposals.html

Line 555: `const total = data.proposals.length;` — JS-rendered from data block. ✓

### discussion-bubbles.html

Line 599 matched on the substring "cycle 1" inside a bubble's claim field — not a count display; ignore.

### index.html

| Line | Content                                                            | Source                  | Verdict |
|------|--------------------------------------------------------------------|-------------------------|---------|
| 237  | `<div class="status-tile-sub">awaiting Founder review</div>`        | static label only       | OK (label only, no number) |
| 314  | data block: `"proposals_pending": 2`                                | dynamic (regen-index)   | OK |
| 385  | `setTile('tile-proposals', st.proposals_pending != null ? st.proposals_pending : 0, ...)` | JS reads data block | OK — wired correctly |

### main-flows.html

No proposal-count references. Different domain.

---

## Every place a count is computed in `scripts/`

### `scripts/aggregate-telemetry.py`

| Line | Reference                                                       | Computes from           |
|------|-----------------------------------------------------------------|--------------------------|
| 146  | `proposals_pending, proposals_approved = walk_proposals()`      | reads `.claude/state/proposals/pending/*.md` directly |
| 259  | `"proposals_pending": len(proposals_pending),` (in `_aggregate_counts`) | from line 146 result |
| 275  | print stat: `proposals_pending=...`                              | reflects line 259 |

**Note:** `aggregate-telemetry.py` writes the count under `_aggregate_counts.proposals_pending`. There is **no top-level `proposals_pending` field** in `current-snapshot.json` (verified — `snapshot.proposals_pending: None`, `snapshot._aggregate_counts.proposals_pending: 2`). This is a minor schema asymmetry but not the root bug.

### `scripts/regen-dashboard.py`

| Line | Reference                                                       | Source                   |
|------|-----------------------------------------------------------------|---------------------------|
| 82   | `def proposals_pending_count():`                                 | walks `pending/` dir |
| 99   | `"proposals_pending": proposals_pending_count(),`                | populates the data block |
| 135  | print stat                                                       | reflects 99 |

**Verdict:** `regen-dashboard.py` correctly populates the data block at value 2. It does NOT touch line 86 of the HTML markup. The hardcoded "5" survives every regen.

### `scripts/regen-index.py`

Lines 65-66, 147, 156, 183, 187, 204, 238 — all count `pending/` directory directly. All correct.

### `scripts/dashboard-diagnostic.py`

Lines 89-92, 168, 187 — diagnostic reads counts from disk for cross-check. Working correctly.

---

## Sources expected to agree

| Source                                                | Current value | Should be |
|-------------------------------------------------------|---------------|-----------|
| Disk: `.claude/state/proposals/pending/*.md`           | 2             | 2         |
| Snapshot: `_aggregate_counts.proposals_pending`        | 2             | 2         |
| dashboard.html data block: `proposals_pending`         | 2             | 2         |
| dashboard.html line 86 (banner card title)             | **5**         | **2**     ← bug |
| dashboard.html line 98 (quick-link subtitle)           | **5**         | **2**     ← bug |
| index.html data block: `proposals_pending`             | 2             | 2         |
| index.html status panel (rendered via JS)              | 2             | 2         |
| proposals.html data block: `proposals[]` length        | 2             | 2         |
| proposals.html `data.proposals.length`                 | 2             | 2         |

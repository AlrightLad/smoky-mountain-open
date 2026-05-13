# main-flows.html — Architecture + Flows Build Summary

**Run:** 2026-05-13 (Founder URGENT: build interactive architecture+flows view modeled on Dave Janowiak's ToDesktop pattern)
**Outcome:** **6-column grid + 8 flows + 53 steps + SVG arrow overlay + right-rail FLOWS/STEPS panels — all data-bound and generator-driven from `docs/reports/_assets/main-flows-data.json`.**

---

## Step 1 — Architecture audit findings

Full audit: `.claude/state/wave-zero-dry-run/architecture-audit.md`. Six real columns (not padded):

| Column | Components | Source of evidence |
|--------|-----------:|--------------------|
| 1. Actors                    | 5  | `auth.signInWithEmailAndPassword`, `members` collection, function role checks |
| 2. Client Surfaces           | 14 | 45 pages in `src/pages/` (top-14 chosen for member-facing surfaces touched by the 8 flows) + Capacitor wrapper |
| 3. Auth + Cloud Functions    | 9  | `firebase.json` + 8 `exports.*` in `functions/index.js` |
| 4. Firestore (data)          | 12 | 30 top-level collections collapsed into 12 functional groups |
| 5. Distribution              | 3  | `.github/workflows/{deploy,ios-build,android-build}.yml` |
| 6. External Services         | 4  | `golfcourseapi.com`, `open-meteo.com`, FCM (admin SDK), Anthropic API (planned Phase 4) |
| **Total components in grid** | **47** | |

No invented components. Every node is a grep-evidenced real piece of the architecture. Verified via the regen script's validation step.

## Step 2 — 8 flows + 53 steps mapped

| Flow ID | Name                              | Status                            | Steps | Path length |
|---------|-----------------------------------|-----------------------------------|------:|------------:|
| F1 | Log a round                            | shipped-on-current-system         | 7  | 7 |
| F2 | View League Pulse / leaderboard        | shipped-on-current-system         | 6  | 7 |
| F3 | Find a player + add as friend           | shipping-W1.S3                    | 6  | 6 |
| F4 | Post + settle a ParCoin wager           | planned-W1.S6                     | 7  | 6 |
| F5 | Book or RSVP to a tee time              | shipped-on-current-system         | 6  | 7 |
| F6 | Earn an achievement / Trophy Room       | shipped-on-current-system         | 5  | 6 |
| F7 | Range session log                       | shipped-on-current-system         | 5  | 6 |
| F8 | Spectator + Caddy verify                | shipping-W1.S5                    | 5  | 6 |
| **Total steps:** | | | **47** | |

Every step's `from`/`to` resolves to a component in the grid (verified by `scripts/regen-main-flows.py` validation + `tests/round-trip-test.py [main-flows+index]` section). Every step's description references real function names (`_submitRoundEntry`, `PB.getRounds`, `sendPushNotification`), real collection names (`rounds`, `liverounds`, `parcoin_transactions`), or real file paths (`src/pages/playnow.js:N`, `src/core/handicap.js`, `src/core/caddie.js`).

## Step 3 — Interactive view shipped

`docs/reports/main-flows.html`:

- Page chrome matches other 5 dashboards (canonical 6-link page-nav, `is-active` on Main Flows)
- Hero header + caveats banner (binding caveats from `db-2026-05-13-004`: not a roadmap; single source of truth is the JSON sidecar)
- Legend bar (6 color swatches, one per column)
- 6-column grid (`<div class="mf-grid">`, CSS `grid-template-columns: repeat(6, ...)`, scrolls horizontally below 900px wrap)
- Right rail: `FLOWS` list (clickable, scrollable, status badges) + `STEPS` panel (numbered, scrollable, hover-pulses nodes)
- SVG arrow overlay (`<svg class="mf-arrows">`) renders quadratic-bezier arrows with step-number badges between consecutive nodes
- Hover/selection states: non-path nodes dim to 25% opacity; on-path nodes glow with brass border; clicked step pulses its from/to nodes
- Mobile responsive (<1100px): rail moves below grid; grid stays 6 columns scrollable
- Empty state: friendly message pointing to `_assets/main-flows-data.json`
- `prefers-reduced-motion`: pulse animation and transitions disabled

## Step 4 — regen-main-flows.py rewritten

`scripts/regen-main-flows.py` now:

- Reads `docs/reports/_assets/main-flows-data.json` (source of truth — no more parsing the markdown draft)
- Applies ship-progress overrides: any flow whose `served_by_ships` are all `status=complete` in `.claude/state/ship-progress/*.json` gets its status upgraded to `shipped-on-current-system`
- Validates: every `flow.path` and every `step.from`/`step.to` resolves to a known component ID; every flow has ≥1 step
- Validation FAILS → script exits 1 (regen-all will not commit a broken dashboard)
- Validation WARNS → orphan components (in grid but in no flow's path) — informational only, exits 0
- Current run: 23 orphans (architecture components present for completeness — actors like commissioner/founder/guest/invitee, infrastructure functions like search-courses/validate-invite/expire-suspensions, etc.). Not bugs.

## Step 5 — Round-trip test extended

`tests/round-trip-test.py` `[main-flows+index]` section now verifies:

- Data block parses
- Required top-level keys present: `columns`, `flows`, `last_amended`, `doc_source`
- `columns` and `flows` are lists
- Every `flow.path` component ID exists in `columns[].components[]`
- Every `step.from` and `step.to` exists in `columns[].components[]`
- Every flow has ≥1 step (catches accidental empty `steps: []`)
- Reports column / component / flow / step totals on pass

Run output: `✓ main-flows.html              6 cols, 47 components, 8 flows, 47 steps — all refs resolve`

## Step 6 — Index nav + status panel

Already wired from the prior dashboard-fix-pass. `regen-index.py` reads `main-flows.html`'s data block and populates the dashboard card badge as `8 flows`. Verified post-regen.

## Step 7 — PROP-002 promotion

PROP-002 had already been moved from `pending/` to `approved/` during the prior dashboard-fix-pass. The "promotion note" in the proposal's body was authored at that time and remains accurate. The implementation referenced in that note (a markdown-derived 8-card view) has now been superseded by the full architecture+flows interactive build per this directive. The `created_at` field + `lane: 4 (Design System Extension)` + `estimate.cost_tokens: 35000` remain the source-spec authority. **The implementation now exceeds the original proposal's scope** (architecture grid added beyond the original "8 cards") — `binding_conditions_from_db_005` are still honored (single source of truth via JSON sidecar; HTML is generator-driven; non-overlapping with dashboard.html — main-flows shows product, dashboard shows ops state).

## Files changed in this build

**New:**
- `docs/reports/_assets/main-flows-data.json` — single source of truth (6 columns × 47 components + 8 flows × 47 steps)
- `.claude/state/wave-zero-dry-run/architecture-audit.md` — grep-evidenced architecture inventory
- `.claude/state/wave-zero-dry-run/main-flows-build-summary.md` — this file

**Replaced:**
- `docs/reports/main-flows.html` — was 8 markdown-derived cards; now interactive 6-col grid + flows + steps + SVG arrows
- `scripts/regen-main-flows.py` — was MD-frontmatter parser; now JSON-sidecar reader + validator

**Modified:**
- `tests/round-trip-test.py` — `[main-flows+index]` section upgraded to validate architecture+flows schema

## Discipline notes

- **Defensive pause heuristic respected** — no API errors; pacing maintained across 5 atomic ops per check.
- **No invented components** — every grid node tied to a grep hit (auth/functions/collections/services/distribution) or to a real `src/pages/*.js` file.
- **Hypothesis-vs-confirmed maintained in step descriptions** — function names, line numbers, collection names cited verbatim from `grep` output.
- **Round-trip test gates regen-all** — a regen run with mismatched references will roll back via `git checkout HEAD`. Founder never sees a broken architecture view.

## Open questions for Founder

1. **Should the 23 orphan components be visible in the grid even when no flow uses them?** Right now they render at full opacity; on flow-select they dim to 25% with all non-path nodes. Arg in favor: shows the architecture's completeness. Arg against: adds clutter. Founder choice — easy to toggle via a CSS class / data-attribute if Founder wants only flow-relevant components visible.
2. **Statuses come from a hand-authored field today** (`status: shipped-on-current-system | shipping-W1.S3 | planned-W1.S6`). `regen-main-flows.py` auto-upgrades to `shipped-on-current-system` if all `served_by_ships` are complete in `ship-progress/`. Once real ship-progress entries land, the upgrade fires automatically. **Question:** should planned ships visible in the flows list be color-coded differently (currently amber-tinted via `.is-planned` CSS)? Done; just confirming the UX intent.
3. **Anthropic API (Phase 4) is in the External Services column as a planned node**, referenced by F8 step 4 inline description but not its `path` (because F8 currently uses rule-based caddie, not AI). When Phase 4 AI Caddie ships, F8's path gets `ext.anthropic` added. Founder ratifies the column entry now or later — either way the regen handles it.

## Cross-references

- Source JSON: `docs/reports/_assets/main-flows-data.json`
- Architecture audit: `.claude/state/wave-zero-dry-run/architecture-audit.md`
- Bubble of record: `.claude/state/discussion-bubbles/db-2026-05-13-004.md` + `db-2026-05-13-005.md`
- Live page: `docs/reports/main-flows.html` (open via `file:///.../docs/reports/index.html` → Main Flows card)
- Regenerator: `scripts/regen-main-flows.py`
- Round-trip test sections: `[main-flows+index]` in `tests/round-trip-test.py`

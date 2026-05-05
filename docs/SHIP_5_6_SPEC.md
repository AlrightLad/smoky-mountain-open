# Ship 5+6 — HQ Home Polish (v8.21.0)

**Status:** Spec locked, ready for implementation
**Authored:** 2026-05-06
**Audit lineage:** V1 backlog inventory, V7 B.31 root cause, V8 D2 dependency verification
**Scope ruling:** CTO 2026-05-05 (provisional lock) + 2026-05-06 (design specs accepted, V7+V8 ruled, implementation order locked)
**Version target:** v8.21.0

---

## Headline

Ship 5+6 finishes HQ Home page-by-page before any other surface gets touched. CTO directive: "Page must be fully polished before moving to next page." This ship bundles 7 backlog items (B.7, B.23, B.24, B.28, B.29, B.30, B.31, B.32), 2 new items surfaced this audit (H1, H3), 1 wayfinding item from CTO usage observation (H4 / D2), and 1 design-bot-spec'd chart polish (D1). Total 7 phases + 6 new smoke scenarios.

Two non-obvious findings from the audit:
- **B.31 was not a calculation bug.** V7 diagnostic on CTO's actual rounds confirmed all 7 April rounds had clean fields and the calendar-month MTD filter was returning the literally correct value. The user-perceived issue is semantic: MTD resets to 0 each calendar month and doesn't match the mental model of "recent activity." Fix is metric pivot to rolling 30-day window with label `LAST 30D`, not arithmetic correction.
- **B.26 partially auto-resolved by Ship 5+5.** v8.19.0 already swapped HQ Home League Pulse single-letter avatars for `renderAvatar()`. The broader B.26 backlog entry (multi-surface avatar audit) remains open for non-HQ-Home surfaces.

---

## Audit lineage summary

### V1 — HQ Home backlog inventory (2026-05-05)
Walked `docs/POST_SHIP_4A_BACKLOG.md` and identified every item targeted at HQ Home. 13 backlog items mapped to specific code locations in `home.js`. Surfaced 2 new items from CTO conversation (H1: League Pulse Comment routes incorrectly; H3: League Pulse delete comment depends on H1) and 1 from CTO usage observation (H4: league context legibility / wayfinding gap).

### V7 — B.31 root cause investigation (2026-05-05)
Diagnostic script (`scripts/v7-mtd-diagnostic.js`, not committed) used Firebase Admin SDK to query CTO's 7 actual rounds. All field shapes clean: `date` ISO string, `timestamp` epoch ms, `leagueId: "the-parbaughs"`, `player` correctly split between UID (recent) and `"zach"` legacy seed. Filter at `home.js:718-723` simulated against this data: returns 0 in May (correct — no May rounds), 7 in late April (correct). **Calculation is not broken; metric semantics don't match user mental model.** CTO ruling: switch to rolling 30-day window with label `LAST 30D`. ~6 LOC change.

### V8 — D2 dependency verification (2026-05-06)
Before locking the D2 implementation spec, verified the three runtime dependencies design bot named:
- **V8.1** `window._activeLeagueName` — exists at `sync.js:10` (default `"Parbaughs"`); populated by `loadActiveLeagueName()` from Firestore `leagues/{activeLeagueId}.name`. Initialized at login (`firebase.js:587`) + on league switch (`leagues.js:300`). 5 existing consumers. Cold-cache async race: first render may flash default before name swaps in — acceptable per design.
- **V8.2** Multi-league detection — canonical path is `currentProfile.leagues.length > 1`. Idiomatic across `more.js:51`, `leagues.js:483`, `admin.js:791/882`.
- **V8.3** `/leagues` route — exists at `Router.register("leagues", ...)` in `leagues.js:6`, fully implemented. No dependency block.

All three V8 checks passed. D2 spec locks as designed.

---

## Design directives (transcribed from CTO 2026-05-06 ruling)

### D1 — Handicap chart polish (Phase 4)

- Strip card chrome → hairline rules
- Derived delta sub-stat in header (e.g., `↘ −0.3 vs. last month`) — no hover this ship
- Line: ink 1.5px (1.75 at Band ≥600)
- Area fill: brass at 12% opacity
- Chalk halo under last-point dot
- Mono y-labels (no serif-at-tiny)
- Range pills: brass-underline-on-active (no at-rest borders)
- Empty state: dashed line + `N OF 3 ROUNDS LOGGED` progress copy
- ZERO layout shift when data arrives — empty state IS the chart container (same dimensions, same y-axis chrome, only the line+dots swap from dashed-empty to solid-data)
- NO hover this ship — B.25-follow filed for hover/tap interactions

### D2 — League wayfinding (Phase 3)

- Brass-bordered league chip `◉ THE PARBAUGHS` in masthead right cluster
- Parallel to weather pill (sibling, not nested)
- Source: `window._activeLeagueName`
- Routes to `/leagues`
- Multi-league users (`currentProfile.leagues.length > 1`): chevron affordance
- Single-league users: pure label
- League Pulse eyebrow prefixed with league name (secondary anchor — e.g., `THE PARBAUGHS · LEAGUE PULSE`)
- Fully additive — no existing content removed

### D3 — Scrollbar (Phase 6)

- Ship per `docs/B_32_-_Custom_Scrollbar_Spec.md` as-delivered
- Confirmed v8.20.0 action row coexistence: action row sits at 44px-from-left with cb-mute → brass-on-hover transitions; scrollbar lives at right edge with gradient pulled 8px off the scrollbar gutter
- Add hover-coexistence QA bullet to manual smoke checklist

---

## Locked scope (7 phases)

### PHASE 1 — Greeting hero + masthead chrome (~25 LOC)

**B.23 — Remove date duplication**
Drop the date prefix from the greeting hero eyebrow at `home.js:608` (`dayName + " " + dayParts[d.getHours()]`). Masthead chrome (`page-shell.js:153`) retains the date as the canonical surface.

**B.24 — Remove weather duplication**
Three weather sites currently render: `hq-weather-pill` (masthead, retain), `hq-weather-caption` (Band A masthead row, drop), `hq-weather-eyebrow` (greeting hero, drop). Per `home.js:316-321`, simplify `_initWeatherDisplays()` to populate only `hq-weather-pill`.

**B.30 — Render displayName as-is in greeting**
Replace `_firstName(profile)` at `home.js:388-402` (which strips Mr/Mrs/Dr titles via the `titles` array) with direct displayName rendering. Greeting reads `currentProfile.name` or `currentProfile.username` as-is. CTO's "Mr Parbaugh" renders as "Mr Parbaugh" not "Parbaugh." Note: `_firstName` is consumed in 4 sites (`home.js:114, 615, 824, 2099`) — replace at `_buildHomeContext` and accept that all consumers get the full displayName.

### PHASE 2 — Stats strip (~35 LOC)

**B.7 — Stat strip alignment**
Audit `_renderStatsSnapshotQuartet` at `home.js:709-779` for cell alignment. Likely CSS-only adjustment to vertical baseline of value + caption rows. Probably touches `.hq-stat-strip__numeral` plus the value/caption div padding scheme at `home.js:769-774`.

**B.28 — Course truncation strategy**
The BEST cell at `home.js:727-732` puts the full uppercase course name in the caption (subject to `text-overflow: ellipsis` per the `white-space:nowrap` cell at `home.js:774`). Implementation: shortened canonical name fallback. Add `displayName` lookup helper that strips `"Golf & Country Club"`, `"Golf Club"`, `"GC"` etc. suffix when course name exceeds N chars. ~10 LOC helper + caption substitution.

**B.31 — MTD → LAST 30D rolling 30-day window** (per V7 ruling)
Replace `home.js:718-724` calendar-month filter with rolling 30-day window:
```js
var THIRTY_DAYS_MS = 30 * 86400000;
var cutoff = Date.now() - THIRTY_DAYS_MS;
var last30 = (ctx.myRounds || []).filter(function(r) {
  var t = r.timestamp || (r.date ? new Date(r.date + "T00:00:00").getTime() : 0);
  return t >= cutoff;
}).length;
var roundsCaption = "LAST 30D: " + last30;
```
Edge case for smoke S20: round dated exactly 30 days ago must be included; 31 days excluded. Use `>=` not `>`.

### PHASE 3 — D2 League wayfinding (~80-100 LOC)

Implement per D2 directive above. Implementation notes:

- New chip rendered in masthead right cluster via the page-shell `scope` slot — `home.js:235-243` currently returns empty string per Gate 1 ruling. This slot is the right injection point.
- Chip markup: `<button class="hq-league-chip" type="button" onclick="Router.go('leagues')">◉ <span data-league-name>...</span><svg>chevron</svg></button>` with chevron conditionally rendered based on `currentProfile.leagues.length > 1`.
- CSS: brass border, mono font, 28px height to match weather pill chrome at `page-shell.js:143`.
- League Pulse eyebrow prefix: `home.js:1606` currently emits `ACTIVITY` then `League pulse`. Modify to prefix with `_activeLeagueName.toUpperCase() + " · ACTIVITY"` for the eyebrow line.
- Cold-cache async race: chip should display whatever `window._activeLeagueName` resolves to at render time, including the default `"Parbaughs"` fallback. No special handling needed — the swap-in is acceptable per design.

### PHASE 4 — D1 Handicap chart polish (~80-100 LOC)

Implement per D1 directive above. Implementation notes:

- Strip the existing card chrome wrapping the chart at `_renderHandicapTrendChart` (`home.js:1463-1508`). Remove rounded-card background, replace section borders with hairline rules.
- Header derived delta: compute month-over-month delta from `ctx.myRounds`. New helper `_calcHandicapDelta(rounds)` returns `{value: -0.3, direction: "down"}` or `null` if insufficient history. Render alongside current handicap value in header.
- Line/fill/halo: edit `_renderHandicapTrendSeries` (`home.js:1518+`) to render the new ink 1.5px line with brass 12% area fill and chalk halo (`<circle>` with chalk fill at 30% opacity) on the last data point.
- Mono y-labels: switch the y-axis label SVG `text` elements from default font to `font-family: var(--font-mono)`.
- Range pills: edit `chart-range-pill--active` CSS to use brass underline (border-bottom 2px var(--cb-brass)) instead of any current at-rest border. Remove at-rest border on inactive pills.
- Empty state: when `filtered.length < 3`, render a dashed-line placeholder at the same chart dimensions plus progress copy `N OF 3 ROUNDS LOGGED`. Critical: the placeholder uses the SAME container dimensions as the populated chart so when the third round arrives, the only visual change is the line/dots swap (no layout shift).

### PHASE 5 — League Pulse polish (~75 LOC, corrected per CTO ruling A4)

**B.29 — Sub-line consistency**
At `home.js:1700-1711` (round path of `_collectActivityItems`), always emit hole count + format on the sub-line. Current logic at `home.js:1704-1706`:
```js
var fmt = r.format && r.format !== "stroke" ? r.format : "";
var holes = r.holesPlayed && r.holesPlayed <= 9 ? " · 9 holes" : "";
var sub = (fmt ? fmt.charAt(0).toUpperCase() + fmt.slice(1) : "") + holes;
```
Replace with always-emit logic: hole count defaults to `18 holes` if undefined or >= 18, otherwise `9 holes` (or actual count if other). Format defaults to `Stroke` if missing or `"stroke"`. Result: every round card sub-line shows `18 holes · Stroke` or `9 holes · Stableford (1.5x)` consistently.

**H1 — Inline comment input on League Pulse round cards**
Replace `home.js:1684` Comment button handler `onclick="event.stopPropagation();Router.go('feed')"` with `feedShowCommentInput('<roundId>')`. Add inline comment input markup + comment thread render to League Pulse round-type cards, mirroring the `/feed` pattern at `feed.js:262-285`. Reuse existing writers (`feedSubmitComment`, `feedToggleCommentLike`) — no new functions needed. ~35 LOC of markup + thread render (corrected per CTO ruling A4 — feed.js parallel block is ~25 thread render + ~10 input markup).

**H3 — Comment X-button on own comments**
Once H1 lands, the comment thread render on League Pulse cards reuses the same `ownComment` guard from `feed.js:268-275`. No new writers needed (`feedDeleteComment` already exists). ~5 LOC additional.

### PHASE 6 — D3 Scrollbar (~30 LOC, CSS-only)

Implement per `docs/B_32_-_Custom_Scrollbar_Spec.md`. Cross-browser implementation: `::-webkit-scrollbar` for Chromium/Safari + `scrollbar-color` for Firefox graceful degradation. 6px brass-tinted thin strip with chalk-3 track, claret accent on active drag, hover-revealed at rest. WCAG 1.4.11 non-text contrast 3:1+. Scoped to `.hq-activity-feed`. Pull `.hq-activity-feed-shell::after` 8px off the scrollbar gutter to prevent gradient overlap.

### PHASE 7 — Smoke surface coverage (~150 LOC)

Six new scenarios (S18-S23). All MANDATORY per P3.

- **S18** — Greeting renders displayName as-is (no transform). Auth as smoke; navigate to /home; assert greeting text contains the full `displayName` field value (not a substring).
- **S19** — League Pulse Comment opens inline (not navigates). Auth + seed round; navigate to /home; locate League Pulse round card with `[data-action="comment"]`; click; assert `Router.getPage()` is still `home` AND that an inline comment input element appeared on the card.
- **S20** — Stats strip renders LAST 30D label (not MTD). Auth; navigate to /home; locate ROUNDS stat cell caption; assert text starts with `LAST 30D:`. Edge case: round dated exactly 30 days ago counted; 31 days not.
- **S21** — Masthead has no duplicate date/weather. Auth; navigate to /home; query DOM for date strings (current day name format) — must be exactly 1 match. Same for weather pill text — exactly 1 visible weather indicator.
- **S22** — Masthead has league chip with correct league name. Per CTO ruling A3: tests assert intended state, not documented edge cases. Auth; navigate to /home; **explicitly wait for `_activeLeagueName` to resolve to expected value** via `page.waitForFunction(function() { return window._activeLeagueName === 'The Parbaughs'; }, null, { timeout: 10000 })`; THEN locate `.hq-league-chip` (or by content text `THE PARBAUGHS`); assert it exists, has correct text content, and `onclick` attribute references `Router.go('leagues')`. The V8.1 cold-cache flash is acceptable for users, NOT for tests.
- **S23** — Empty-state handicap chart renders dashed line + progress copy with same dimensions as populated chart. Per CTO ruling A2: do NOT mock `ctx.myRounds` or override `PB.getPlayerRounds` at runtime. Use `seed-rounds.js` infrastructure: clear smoke account rounds, seed 0-2 rounds, navigate to /home, measure the handicap chart container `getBoundingClientRect().height` and assert dashed-empty-state placeholder + `N OF 3 ROUNDS LOGGED` copy renders. Then seed a 3rd round, force re-render via `Router.go('home', {}, true)`, measure again, assert container height unchanged (zero layout shift verification).

---

## Process corrections (P1-P6) — locked

These join the existing P1-P4 from prior ships and become permanent doctrine for all future audits.

**P1 — Surface-first audit.** V1 file inventory MUST include explicit answer to "Where would a member tap to do X?" Surface taxonomy precedes code path analysis. Established Ship 5+5 retro.

**P2 — Annotation capture.** V1 file inventory MUST grep for explicit scope markers in code comments (`Returns in Ship 5+X`, `TODO Ship 5+X`, `Deferred to vN+1`). Established Ship 5+5 retro.

**P3 — Smoke surface coverage.** Every ship's smoke MUST include at least 1 scenario that navigates to the user-visible surface for the headline feature, performs the user action, and verifies persistence. Mechanic-level scenarios (panel render, listener startup) do NOT satisfy. Established Ship 5+5 retro.

**P4 — V12-style sweep before next ship.** Any ship that fixes a v8.0-rules-rewrite silent-failure pattern (4th OR-clause + diff().affectedKeys()) should sweep adjacent surfaces (bounties, wagers, scrambles, trips) for the same damage pattern before the next ship audit. Established Ship 5+5 retro.

**P5 (NEW from V7) — Diagnostic-first on bug reports.** "User reports X is broken" is a hypothesis, not a fix specification. Confirm root cause via diagnostic (admin SDK query, DOM inspection, calculation simulation) before scoping any fix. Two failure modes this catches: (a) fixing the wrong surface (v8.19.0 pattern), (b) fixing unbroken code (B.31 pattern). Both waste a ship.

**P6 (NEW from D2/V8) — Verify design-spec data sources before spec authoring.** When design bot specifies a runtime data source (`window._x`, `currentProfile.y`, `/route`), grep/inspect each one in the live codebase before locking the implementation spec. Document existence, lifecycle, and race risks. Surface dependency blocks BEFORE spec authoring rather than DURING implementation. Established this ship.

---

## Deferred items

Out of scope for v8.21.0. Remain on backlog.

- **B.10** — persisted period stats infrastructure (own ship; needs schema work for period-over-period stat snapshots)
- **B.11** — feed photo data wiring (own ship; touches Firestore schema for round-attached photos)
- **B.12 Share** — Capacitor Share API (post-native-shell)
- **B.25-follow** — handicap chart hover/tap interactions (filed by design bot from D1; own ship)
- **B.26 broader** — multi-surface avatar audit on /chat, /members, round detail (HQ Home League Pulse instance was auto-resolved by Ship 5+5)
- **B.27** — logo redesign (large brand initiative; own ship pending design bot consultation)
- **B.40** — home.js dead code cleanup (`_renderHQGridInner`, `_renderHQPlaceholder`; ~37 LOC; backlog cleanup ship)
- **H4** — STILL deferred? Per CTO ruling H4 maps to Phase 5 of Ship 5+6 BLOCKED on design bot D2. Now D2 is delivered → H4 IS Phase 3 of this spec.

---

## Manual smoke checklist (CTO post-deploy)

After both Firestore rules deploy (if any) + code deploy + GitHub Pages serve confirms `APP_VERSION = "8.21.0"`:

1. Hard refresh (Ctrl+Shift+R)
2. Greeting renders `Welcome back, Mr Parbaugh.` (full displayName, not `Parbaugh`)
3. Masthead has league chip `◉ THE PARBAUGHS` parallel to weather pill
4. Cold-cache first-load may flash `◉ PARBAUGHS` briefly before swap-in (V8.1 async race — acceptable per D2 design)
5. Stats strip ROUNDS cell shows `LAST 30D: 7` (or appropriate count) — NOT `MTD: 0`
6. Handicap chart renders with hairline rules, brass area fill, ink line, chalk halo on last point, mono y-labels, brass-underline range pills
7. Handicap chart header shows derived delta sub-stat (`↘ −0.3 vs. last month` or similar)
8. Empty-state handicap chart (test by simulating <3 rounds): dashed line + `N OF 3 ROUNDS LOGGED` copy renders, same dimensions as populated chart, ZERO layout shift when data arrives
9. League Pulse eyebrow reads `THE PARBAUGHS · ACTIVITY` (or similar prefix)
10. League Pulse Comment button opens inline input (does NOT navigate to /feed)
11. League Pulse Kudos still works per Ship 5+5 verification
12. League Pulse own-comment X-button shows + delete works (after H3)
13. Custom scrollbar visible on League Pulse with hover state revealed
14. Scrollbar + action row buttons do not visually conflict at any viewport band (D3 hover-coexistence QA)
15. Date appears exactly once in masthead area
16. Weather pill appears exactly once
17. Stat strip cells visually aligned (B.7)
18. Long course names (e.g., "Ocean Pines Golf & Country Club") truncated cleanly (B.28)

---

## Validation criteria

- `npm run lint` clean (acorn syntax check on all files)
- `npm run build` clean (Vite production build succeeds)
- `npm run smoke:full` — must achieve 23/23 × 4 browsers (92/92) before push approval
- Webkit/webkit-mobile flake tolerated per B.39 (documented Firestore replication latency); webkit isolated retry must show passing for engagement-related scenarios (S19, S20)

---

## Estimated LOC delta

| File | Δ |
|---|---|
| `src/pages/home.js` | +260 / -60 |
| `src/core/page-shell.js` | +30 / -5 (chip slot integration) |
| `src/styles/components.css` | +90 / -10 (chip + chart polish + scrollbar + range pills) |
| `src/styles/base.css` | +5 / 0 (chart token tweaks if any) |
| `src/pages/caddynotes.js` | +14 / -8 |
| `src/core/utils.js` | +1 / -1 |
| `package.json` | +1 / -1 |
| `public/sw.js` | +1 / -1 |
| `tests/smoke/scenarios/_demo.js` | +1 / -1 |
| `tests/smoke/scenarios/s1-auth.js` | +1 / -1 |
| `tests/smoke/scenarios/s18-*.js` | +50 / 0 (new) |
| `tests/smoke/scenarios/s19-*.js` | +60 / 0 (new) |
| `tests/smoke/scenarios/s20-*.js` | +50 / 0 (new) |
| `tests/smoke/scenarios/s21-*.js` | +50 / 0 (new) |
| `tests/smoke/scenarios/s22-*.js` | +50 / 0 (new) |
| `tests/smoke/scenarios/s23-*.js` | +60 / 0 (new) |
| `tests/smoke/scenarios/index.js` | +6 / 0 |
| `docs/SHIP_5_6_SPEC.md` | +470 / 0 (this file) |
| **TOTAL NET** | **~+1200 / -88 ≈ +1110** |

Note: total exceeds the 480-510 LOC product-code estimate (corrected per CTO ruling A4 — Phase 5 ~75 LOC, not ~100) because (a) smoke scenarios are sizable (~320 LOC across 6 scenarios), (b) spec doc is ~470 LOC. Product-code-only delta is ~495 LOC, on target.

---

## Caddy Notes copy plan (per CTO ruling)

```js
{ item: "Your handicap chart got a polish — cleaner lines, monthly delta, and an empty state when you're getting started.", tag: "IMPROVED" },
{ item: "Your league name now lives in the masthead — tap to see all leagues you're in.", tag: "NEW" },
{ item: "MTD became LAST 30D — your recent activity stays visible across month boundaries.", tag: "IMPROVED" },
{ item: "League Pulse activity feed got a custom scrollbar to match the editorial look.", tag: "IMPROVED" },
{ item: "Comment on a round directly from your League Pulse without leaving the page.", tag: "NEW" }
```

Tagline: `"HQ Home polish"` or `"HQ Home holistic completion"`.

---

## Implementation phase order

Per CTO ruling: design-bot-driven phases run in order **D2 → D1 → D3** (Phase 3 → Phase 4 → Phase 6). Eng-only phases (1, 2, 5, 7) can run in any order but the natural flow is sequential 1 → 2 → 3 → 4 → 5 → 6 → 7.

### Phase A — `firestore.rules` change
N/A. No Firestore rule changes in this ship.

### Phase B — Implementation
Sequential 1 → 7. Each phase ends with a quick lint check before moving to the next.

### Phase C — Verification
- Lint + build clean
- Bump smoke S1 + _demo version assertions to `8.21.0`
- `npm run smoke:full` — 23/23 × 4 browsers
- Webkit isolated retry if needed per B.39 tolerance

### Phase D — Implementation summary + push approval
Draft summary; CTO approves; commit + push + cache-bust verify.

---

## Deploy order

No Firestore rule changes → standard code-only deploy:

1. Lint + build clean
2. Smoke clean (`npm run smoke:full`)
3. Caddy Notes update (Phase 7 final step)
4. Version triple bump (Phase 7 final step)
5. Commit `v8.21.0 — HQ Home polish (Ship 5+6)`
6. Push code commit to `origin/main`
7. Verify on origin
8. Wait for GitHub Pages deploy
9. Cache-bust verify (`APP_VERSION = "8.21.0"` served)
10. Manual browser smoke per checklist above

---

## Out of scope

- All items listed in "Deferred" above
- Firestore rule changes
- Cloud Function changes
- Schema additions on existing collections (chart delta computed live; no persisted snapshot)
- New collections
- Other pages (/feed, /chat, /members, /rounds detail, etc.) — those come AFTER HQ Home is fully closed
- Multi-league architecture (B.36)
- /feed system chat rendering bug from V2 audit (separate hotfix candidate; not in HQ Home scope)

---

## Standing by

Spec locked. Implementation begins after CTO ruling-check.

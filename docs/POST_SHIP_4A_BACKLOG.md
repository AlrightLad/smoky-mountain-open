# Post-Ship-4a Backlog

Single durable list of items surfaced during Ship 4a (Gates 1–9, v8.13.0–v8.14.2) that are intentionally NOT shipped. Future ships pick from here. No item ships from this backlog without its own ship spec.

**Captured:** 2026-05 · Gate 9 close
**Status:** Inherited by Ship 5+ as starting backlog

Each item lists: scope estimate (S / M / L), dependencies, target ship (or "no current target").

---

## A — Architectural cleanup

### A.1 — Multi-theme system cleanup decision
**Scope:** M · **Target:** No current target (decision needed first)

Current state: `base.css` contains 6 active `[data-theme="..."]` blocks (clubhouse, twilight_links, linen_draft, champion_sunday, bourbon_room, course_record), `theme.js` manages runtime swap, `index.html` sets `data-theme` on `<html>` defaulting to clubhouse. The 5 non-default themes are NOT exposed in production UX (no theme picker visible to founding crew).

**Decision needed:** Either
- (a) Revive theme picker UX as a customization feature (founding crew opt-in to alternate clubhouse aesthetics)
- (b) Delete the 5 non-default theme blocks + theme.js + index.html data-theme setter for clubhouse-only

Either is correct work; both have scope. Decision is product/UX-side first, then engineering executes.

**Surfaced:** Gate 8a Q-A audit · `feedback_claude_md_drift.md` corrections to CLAUDE.md

---

### A.2 — F1/F2/RoundDetail outer wrapper unification with `.sphud-page-wrap`
**Scope:** S · **Target:** No current target (cosmetic; only matters if mobile reflow becomes needed for chrome paths)

`round.js:152` (F2 abandoned chrome) and `round.js:179` (RoundDetail placeholder) still use inline-style `padding:32px 24px;max-width:680px`. SpectatorHUD wrapper extracted to `.sphud-page-wrap` in Gate 8b; F1/F2 wrappers remain inline. Could share the same class for consistency at mobile widths.

**Dependency:** None. Pure cleanup ship.

---

### A.3 — `spectator.js placeholderStyle` inline-style sweep
**Scope:** S · **Target:** No current target

`spectator.js:41` declares `placeholderStyle = 'padding:24px 0;border-top:1px solid var(--cb-chalk-3);margin-top:24px'` consumed at 4 sites (lines 46, 48, 49, 51) for section dividers between hero / per-hole strip / stats / course / shots feed. Inline-style means mobile reflow can't override without `!important`. Future gate could extract to `.sphud-section-divider` class for finer mobile control over section gap.

**Currently:** 24/24 padding/margin reads correctly at all widths (Gate 8b Q-3 ruling left untouched). No urgency.

---

### A.4 — Remove Play Now from desktop sidebar nav
**Scope:** S · **Target:** Post-Scorecard / Live HUD redesign

Play Now is mobile-app-shaped UX. Desktop sidebar exposing it makes the nav cluttered and wrong-targeted for desktop spectator surface.

**Dependency:** Scorecard / Live HUD desktop redesign (separate ship).

---

### A.5 — Extract shared helpers from `home.js` → `src/core/page-helpers.js`
**Scope:** M · **Target:** Ship 5+ if helpers cross multiple page render paths

`home.js` has grown large (~2750 lines). Helpers like `_formatAge`, `_formatElapsed`, `_renderLiveRoundSecondary`, `_renderFinishedSummaryCard` are consumed cross-file (spectator.js calls some). Extract to `src/core/page-helpers.js` for cleaner ownership.

**Dependency:** Ship 5 inventory of which helpers are cross-page.

---

### A.6 — Delete legacy loading system
**Scope:** S · **Target:** Post-Ships-1-7 (after all band migrations complete)

Pre-Clubhouse loading skeleton system has surviving rules in components.css. Once Ships 1–7 (HQ Home, profile, feed, scorecard, round detail) have all migrated to the new design system, the legacy loading system has no consumers and can be deleted.

---

### A.7 — Handicap trend chart performance memoization
**Scope:** S · **Target:** No current target

Handicap trend chart re-renders on every member-page navigation. Memoize per-player to avoid recompute on static profile views.

---

### A.8 — Drawer a11y `aria-modal` / `role=dialog`
**Scope:** S · **Target:** A11y gate (see B.6)

Mobile drawer nav doesn't currently emit `aria-modal="true"` + `role="dialog"`. Screen readers can't recognize it as a focused modal context.

---

### A.9 — Design system rationalization
**Scope:** L · **Target:** No current target (cleanup only)

- `--el-0` / `--el-1` / `--el-3` declared but unconsumed
- `--ease-standard` consumed (verified Gate 8a) but other ease tokens (`--ease-default`, `--ease-out`, `--ease-in-out`, `--ease-enter`, `--ease-exit`, `--ease-emphasized`, `--ease-back-out`) overlap semantically
- `--duration-*` (legacy) and `--dur-*` (v8.7.0 spec-named) coexist with value drift (150/250/400 vs 120/200/320)
- Decision: alias legacy → spec-named, OR keep dual coexistence

Surfaced multiple times across Ship 4a; deferred each time. Eventually needs a sweep ship.

---

### A.10 — Audit v8.5.x – v8.6.x for stranded / duplicate CSS
**Scope:** M · **Target:** No current target

HQ Home foundation work (v8.5.x – v8.6.x) added CSS rules under various selectors. Some may have been superseded by later ships without cleanup. Audit for stranded rules (no JS consumer + no cascade dependency) and remove.

---

## B — Feature backlog (do not ship early)

_Note: Section B has numbering gaps (B.14–B.18, B.20–B.22, B.33–B.35) — these are reserved or closed pre-2026-05; not actively tracked._

### B.1 — Play Now: hole par/yardage adjustment during live play
**Scope:** M · **Target:** No current target

Currently par/yardage is locked to course doc data. When the user notices wrong par/yardage mid-round (course data error), they should be able to fix it without abandoning + restarting.

---

### B.2 — Live round card LEAD column
**Scope:** M · **Target:** Ship 5 (HQ Home v1 banded grid)

The LEAD column in HQ Home v1 mock surfaces a primary live round card. Implementation lands with Ship 5 banded grid build.

---

### B.3 — HQ live round card group leaderboard
**Scope:** L · **Target:** No current target

When sync-rounds or tee-times have multiple players in the same active round, surface a group leaderboard inside the HQ live-round-card. Currently single-player only.

**Dependency:** Sync-round / tee-time pairing infrastructure (existing but underused).

---

### B.5 — Handicap chart time-range toggle (added v8.14.4 Q-RULING-A)
**Scope:** M · **Target:** No current target

`buildHandicapGraph` in `members.js` currently shows a 12-month rolling tail with hardcoded slice (`graphData.slice(-12)`). Adding the v8.14.4 30D/SEASON/ANNUAL toggle pattern (P17) requires restructuring the data computation: handicap math has well-defined semantics (best 8 of last 20 differentials, etc.); naive filter-before-compute would produce mathematically wrong values.

The handicap chart's natural unit is monthly snapshots, not raw rounds. The 30D toggle on a monthly-aggregated chart produces 1-2 data points — not a useful trend. Either:
- (a) Adopt different toggle semantics (6M / 12M / 24M monthly bins) — produces inconsistent toggle vocabulary across charts
- (b) Restructure handicap data computation to handicap-as-of-date snapshots filtered by range — substantial work + risk of regressing handicap math

**Dependency:** None blocking, but pair with handicap-display redesign or Profile/Members page redesign in future ship.

**Surfaced:** v8.14.4 Q-RULING-A — spec assumed buildHandicapGraph had an existing 30D/90D/1Y toggle to replace; audit confirmed no toggle exists. Deferred to keep v8.14.4 scope reasonable.

### B.7 — HQ Home stat strip alignment + course name truncation
**Scope:** S · **Target:** Ship 5 (HQ Home v1 implementation)

CTO smoke screenshot of HQ Home (post-v8.14.4) revealed pre-existing visual issues:
- 4-cell stat strip (HCP / ROUNDS / BEST / STREAK) — values not consistently aligned across cells, label baselines don't match
- BEST cell shows "OCEAN PINES GOLF…" truncated via text-overflow ellipsis on long course names
- STREAK cell shows orphaned em-dash when no streak active

Not introduced by Ship 4a — these are pre-existing HQ Home polish issues. Get addressed naturally by Ship 5 (HQ Home v1 redesign) per design bot mock — the v1 mock has different stat-strip chrome (4-cell with eyebrow + display numeral + delta line per design bot mock).

**Surfaced:** v8.14.4 smoke screenshot. Deferred to keep ship scope focused on chart fix.

### B.8 — Members profile chart visual scale
**Scope:** S · **Target:** Ship 6+ (after Ship 5 establishes card chrome conventions)

CTO smoke v8.14.5 surfaced: Members profile trend charts feel oversized on desktop web view. Diagnostic confirmed cap IS working (chart-container at 582px, max-width 720px not binding) — issue is visual proportion of chart inside its full-width section card. "Small chart in big card" aesthetic feels off, OR data/typography elements within the chart render too large for desktop scale.

Multiple competing constraints (card chrome consistency, chart readability, visual proportion) — not solvable in isolation without breaking other surfaces. Defer to Ship 6+ when Members profile gets aligned to Ship 5's banded grid + card chrome conventions.

**Surfaced:** v8.14.5 smoke. Deferred per CTO direction (v8.14.6 SKIPPED) to avoid polishing legacy surface that gets redesigned holistically.

### B.9 — WHS HANDICAP INDEX label clipping (Symptom 3)
**Scope:** S investigation + S fix · **Target:** Ship 5 prep DOM inspection

CTO smoke surfaced clipping on WHS HANDICAP INDEX label rendering at members.js:497-507 (div-only, not chart SVG). Pending DevTools inspection of accordion/section parent ancestor chain. Likely interacts with section card chrome that Ship 5 addresses. Bundle DOM diagnostic into Ship 5 prep rather than separate ship.

**Surfaced:** v8.14.3 Q-CHART-4. Deferred through v8.14.4 / v8.14.5 / v8.14.6 (skipped). Investigation rolls into Ship 5 prep phase.

### B.10 — Stat strip computed delta line
**Scope:** S · **Target:** Future ship (post-Ship 5)

Ship 5 Gate 2 Q-AUDIT-C ruling deferred new computed delta values for the HQ Home stat strip (e.g., "↑ 0.3 vs last month" for handicap, "+2 this week" for rounds). Existing caption ("OFFICIAL" / "MTD: 3" / etc.) refined per §12(a) row 08 in Gate 2; new computed deltas require persisted period-over-period stat snapshots that don't exist yet.

**Surfaced:** Ship 5 Gate 2 audit V5. Deferred per Q-AUDIT-C Option C ruling.

### B.11 — Feed card photo slot data wiring
**Scope:** M · **Target:** Future ship

Ship 5 Gate 2 Q-AUDIT-D Option A added markup-only photo slot to `.hq-feed-card` (renders only when `it.photoUrl` is defined). Data layer wiring — augmenting `_hqBuildActivityItems` to expose `photoUrl` from rounds/posts where applicable, plus upstream Firestore schema updates for round-attached photos — deferred to a future ship.

**Surfaced:** Ship 5 Gate 2 audit V7. Deferred per Q-AUDIT-D Option A ruling.

### B.12 — Feed card actions row persistence
**Scope:** L · **Target:** Future ship

Ship 5 Gate 2 added markup-only actions row (Like / Comment / Share buttons) to `.hq-feed-card` per §12(d) + §12(f) deferral pattern. Buttons currently have `tabindex="-1"`, `pointer-events: none`, `aria-hidden`. Persistence — Firestore collections, rules, write helpers, optimistic UI, notifications — deferred to a future ship.

**Surfaced:** Ship 5 Gate 2 audit V7. Deferred per Q-AUDIT-D Option A ruling + §12(f).

### B.23 — Date duplication on HQ Home masthead
**Scope:** S · **Target:** HQ holistic polish ship (post-feature-complete per P23)

"SATURDAY · MAY 2, 2026" date stamp appears in TWO places on HQ Home: in the masthead's editorial date row AND in the rule-line row directly below ("SATURDAY EVENING · 54° AND OVERCAST"). Should appear only once. Resolution: pick one location, remove from the other. Recommended approach: keep the editorial masthead date stamp; reduce the rule-line row to weather/conditions only.

**Surfaced:** v8.16.2 post-push smoke. Parked per P23 (polish defers to feature-complete).

### B.24 — Weather duplication on HQ Home masthead
**Scope:** S · **Target:** HQ holistic polish ship (post-feature-complete per P23)

Weather appears in TWO places on HQ Home: as a "54° · OVERCAST" pill in the top-right of the editorial masthead AND as part of the "SATURDAY EVENING · 54° AND OVERCAST" rule-line row. Should appear only once. Recommended approach: keep the masthead pill (tighter integration with chrome); remove from rule-line row OR repurpose rule-line row entirely.

**Surfaced:** v8.16.2 post-push smoke. Parked per P23.

### B.25 — Handicap trend chart polish + cleanup
**Scope:** M · **Target:** HQ holistic polish ship · Design bot consultation required

The handicap tracker chart on HQ Home (right rail) needs design and visual refinement. Specific issues TBD by design bot consultation, but likely candidates: axis label styling, data point markers, line treatment, legend, range toggle visual polish, chart container chrome (border/padding/background).

**Surfaced:** v8.16.2 post-push CTO observation. Parked per P23.

### B.26 — Profile pictures not propagating to activity feed + user-attribution surfaces
**Scope:** M (touches multiple files but pattern is consistent — likely a shared avatar helper that needs swapping)
**Target:** HQ holistic polish ship OR could split into "avatar consistency ship" if scope grows during audit

Profile pictures (avatars) are not consistently rendering across all surfaces that display user actions or posts. Currently the activity feed cards in HQ Home right rail render an initials-letter avatar (e.g., "M" for Mr Parbaugh) regardless of whether the user has a profile picture set. Other surfaces likely affected: round detail pages, post detail surfaces, comment threads, member spotlight, leaderboard rows, anywhere a user's name+avatar appears.

**Root cause likely:** avatar render logic uses initials fallback as primary path, doesn't check for `member.photoURL` / `member.profilePic` / similar field. OR profile picture upload flow exists but the URL isn't being propagated to all consuming surfaces.

**Resolution plan (deferred):**
1. Audit avatar rendering: identify every surface that renders a user avatar
2. Identify the canonical photo URL field on member documents
3. Audit each render path to use photo URL with initials fallback (not initials primary)
4. Verify upload flow writes photo URL correctly
5. Backfill if any members have photos that aren't propagating

**Surfaced:** v8.16.2 post-push CTO observation. Parked per P23.

### B.27 — Parbaughs logo redesign (design bot consultation)
**Scope:** L (design consultation + multiple asset replacements + multi-platform updates)
**Target:** Tier 1 — design bot consultation. Tier 2 — engineering ship after design bot delivers.
**Dependency:** Should land before public launch (Phase 6) for brand-coherent first impressions on new league signups.

Current logo on HQ Home (top-left in left-rail navigation, "P" inside a chalk square next to "Parbaughs" wordmark) is a placeholder — single letter "P" treatment doesn't reflect the full editorial aesthetic established across the platform (billiard green / chalk / brass / claret palette, Fraunces italic display type, mono-uppercase eyebrow style).

**Resolution plan (deferred):**
1. Design bot consultation on logo direction
   - Options to explore: monogram (refined "P"), wordmark only, icon + wordmark lockup, crest/badge treatment, custom illustration
   - Must work at multiple sizes: ~32px (sidebar nav), ~84px (masthead headline if used), favicon (16px / 32px / 192px)
   - Must work in both color (full palette) and monochrome (single-color contexts)
   - Must work on both chalk (light) and billiard-green (dark) backgrounds
   - Must reflect golf league identity without being golf-cliché (avoid generic golf ball / club imagery)
2. Design bot delivers logo specification (vector source files or detailed SVG specs)
3. Engineering ship: replace existing `/Logo.jpg` + `apple-touch-icon.png` + favicon variants + any inline SVG logo references
4. Update `sw.js` STATIC_ASSETS if new logo file paths differ from current
5. Update any social media assets (OG image, Twitter card) if used
6. Update Capacitor mobile app icons (relevant for Phase 3 Clubhouse work)

**Surfaced:** v8.16.2 post-push CTO observation. Parked per P23.

### B.28 — HQ Home stat strip course name truncation
**Scope:** S — UX adjustment + possibly small data layer addition (course shortName field)
**Target:** HQ holistic polish ship · Possible design bot consultation if course-shortName approach is chosen

The "BEST" stat cell shows the course where the user's best round was logged, but long course names get truncated mid-word with ellipsis (e.g., "OCEAN PINES GOLF & CO..."). Full course name should always fit within the cell, OR truncation should fall back to a shorter canonical course name (e.g., abbreviation, just "OCEAN PINES" without "GOLF & COUNTRY CLUB" suffix).

Resolution options (TBD by design bot):
- Larger cell width / wrap to 2 lines
- Use shortened/abbreviated course name field if available on course documents
- Add a "displayName" or "shortName" field to courses collection for compact contexts
- Smaller font in this cell only

**Surfaced:** 2026-05-04 post-v8.16.2 smoke.

### B.29 — Activity feed posts missing hole count + format type
**Scope:** S — pure home.js _hqBuildActivityItems string composition fix
**Target:** HQ holistic polish ship · Could ship in Ship 5+3 Activity Feed B-tier if scope already touching feed render

Activity feed cards in HQ Home right rail (League Pulse) currently show "[Member] logged [score] at [course]" with optional sub-line for "9 holes" or format type ("Stableford (1.5x)"), but inconsistently. Per CTO requirement, every round entry in League Pulse should always display:
- Hole count: 9 HOLES or 18 HOLES
- Format type: STROKE, STABLEFORD, MATCH, SCRAMBLE, etc.

Format ideally: "9 HOLES · STROKE" or "18 HOLES · STABLEFORD (1.5x)" as a consistent subline below the main "X logged Y at Z" text.

Current state per audit (home.js _hqBuildActivityItems):
- Logic exists for format and holesPlayed but emits inconsistently — only shows when format !== "stroke" OR holesPlayed <= 9
- Format defaults to empty string when stroke
- Result: 18-hole stroke rounds show no subline at all

Resolution: update _hqBuildActivityItems sub-line logic to always emit hole count + format, with consistent label format. Default 18 if holesPlayed is undefined or matches full course holes. Default "STROKE" if format is missing.

**Surfaced:** 2026-05-04 post-v8.16.2 smoke.

### B.30 — HQ Home greeting hero shows partial display name
**Scope:** S — single-function string handling fix in home.js
**Target:** HQ holistic polish ship

The "Welcome back, [Name]" greeting on HQ Home renders an abbreviated or partial form of the user's display name. Screenshot shows "Welcome back, Parbaugh." for a user whose full display name appears to be "Mr Parbaugh" (or similar with prefix). Greeting should always render the FULL display name as configured by the user — including any prefix (Mr/Mrs/Dr), suffix, or whitespace.

Likely cause: greeting helper is doing string manipulation (e.g., split on space and take last token, or strip prefix) instead of using the canonical full display name field as-is.

Resolution: locate `_renderEditorialGreetingHero` or similar function in home.js, identify how the greeting name is computed, verify it uses the user's canonical displayName field directly without transformation. Render whatever the user configured in their profile.

**Note:** this also relates to memory's Part C (Discord-style usernames as identity primitive). When Part C ships, display name semantics become more rigorous (canonical ID = displayname#XXXX, plus optional title prefix). This polish item is a near-term fix; Part C will rationalize the system holistically. Don't pre-empt Part C with one-off display logic here — just render the displayName field correctly.

**Surfaced:** 2026-05-04 post-v8.16.2 smoke.

### B.31 — HQ Home stat strip "MTD" appears inaccurate
**Scope:** S (label change) OR M (data investigation + computation fix)
**Severity:** HIGH if real bug (data accuracy issue affects user trust), LOW if label/definition issue
**Target:** depends on root cause — real bug fixes can jump P23 polish-deferral queue if affecting data integrity
**Status:** Pending CTO clarification on root cause

The "ROUNDS / MTD: 0" stat cell shows 0 rounds month-to-date. CTO reports having played at least 2 rounds in the last 30 days.

Diagnostic question: did the 2+ recent rounds fall in May 2026 (current month, MTD applies) or in late April 2026 (prior month, would not count for MTD)?

If May rounds exist and aren't counting → real data bug, root cause investigation needed:
- Wrong date range in MTD computation
- Timezone offset issue (round createdAt timestamps stored UTC, MTD computed against local month boundary)
- Filtering on wrong condition (e.g., only "official" rounds, only certain formats, only rounds from current league scope)
- Field name mismatch on round documents

If only April rounds → metric label vs definition mismatch:
- "MTD" suggests month-to-date which is correct empty value for early May
- User expectation aligns with "last 30 days" rolling window
- Resolution: rename label to "LAST 30D" or change underlying calculation to rolling 30-day window

**Surfaced:** 2026-05-04 post-v8.16.2 smoke.

### B.32 — Custom scrollbar treatment for HQ Home activity feed
**Scope:** S (CSS-only treatment, scoped to one component)
**Target:** HQ holistic polish ship
**Status:** Design spec delivered — ready for implementation reference

Design direction locked: **D1(a) Editorial-clean** — 6px brass-tinted thin strip with chalk-3 track, claret accent on active drag, hover-revealed at rest. No golf motif (rejected for high-frequency surface; novelty becomes noise). Phase 1 scoped to `.hq-activity-feed` only; promote to `.cb-scroll` utility in a follow-up ship after production validation.

Spec covers: cross-browser implementation (Chromium/Safari `::-webkit-scrollbar` + Firefox `scrollbar-color` graceful degradation), interaction states (rest/hover-area/hover-thumb/active/disabled), prefers-reduced-motion, WCAG 1.4.11 non-text contrast (3:1+), 32px thumb min-height, gradient coexistence (pull `.hq-activity-feed-shell::after` 8px off the scrollbar gutter), token-only references for theme variant inheritance, and QA checklist.

**Full spec:** [docs/B_32_-_Custom_Scrollbar_Spec.md](B_32_-_Custom_Scrollbar_Spec.md)

**Surfaced:** 2026-05-04 post-v8.16.2 smoke. Design spec delivered 2026-05-04.

### B.19 — Kudos icon redesign consultation
**Scope:** S · **Target:** Ship 5+3 Activity Feed B-tier (design bot scope)

v8.16.0 swapped "Like" → "Kudos" terminology platform-wide (feed card action button + chat.js toast/notification copy) but preserved the existing heart SVG glyph. Per CTO Q-AUDIT-A ruling: "icon redesign is design bot territory." Heart is universal kudos/recognition glyph but might benefit from a more distinct treatment when notifications + Activity Feed B-tier features (kudos persistence, kudos count display, kudos history) ship.

Future work: consult design bot on icon options when Ship 5+3 enters audit. Decision criteria: distinct from "like" (Twitter/Instagram heart connotation), distinct from "applause" emoji, readable at 9-11px size, fits Clubhouse aesthetic.

**Surfaced:** v8.16.0 audit Q-AUDIT-A. Deferred per CTO ruling.

### B.13 — Vestigial `chartWidth` parameter cleanup
**Scope:** S · **Target:** Cleanup ship

`_renderHandicapTrendChart(opts.width)` and `_renderHandicapTrendSeries(chartWidth)` accept a `chartWidth` parameter that's effectively dead post-v8.14.5 — Approach B (`preserveAspectRatio="none"` + `width:100%` + fixed pixel height) makes the SVG fill its container regardless of the viewBox width number. Callers still pass `400` (default features-column) and `600` (Band B promotion), but the value is purely cosmetic for the viewBox aspect ratio.

Cleanup: remove `opts.width` / `chartWidth` parameter from both functions; viewBox can use a constant. Audit all consumers (members.js `_rerenderTrendChart`, the 3 home.js call sites) to verify zero behavioral regression before removing.

**Surfaced:** Ship 5 Gate 2 audit V3 + D2 ruling. Deferred — minimal benefit, requires consumer audit.

### B.4 — Quiet-state v3 mock pass + ship
**Scope:** L · **Target:** No current target (v3 mock authoring needed first)

Per `§9.02 §11`, 8 quiet states (pre-round, post-round, abandoned, paused, stale, F1 missing, F2 abandoned, F3 host-offline) need design pass for both desktop + mobile band. Some states already have chrome (F2, F3 from Gate 7); others need authoring.

### B.37 — Ship 5+2 (Tee Times) deferred items
**Scope:** Mixed (each sub-item ranges S to L)
**Target:** Future ships as priorities surface
**Source:** Ship 5+2 audit (V1-V11) + scope ruling — see `docs/SHIP_5_2_SPEC.md`

The Ship 5+2 audit (v8.18.0) explicitly deferred the following items in favor of the F3 RSVP fix as the dominant value:

- **F4 edit capability** (M) — edit tee time fields after creation; needs schema additions (`editedAt`, `editedBy`, possibly `version`); UI work for edit form
- **Recurring tee times** (M-L) — schema additions (`recurrence` rule, `parentTeeId`, etc.); generation logic
- **`status: "completed"` dead state cleanup** (S) — auto-transition past tees to `completed` OR remove the field entirely
- **Notification digest / batching** (M) — fatigue mitigation; aggregate multiple tee notifications within a window
- **Calendar conflict detection** (S) — warn when posting a tee that overlaps an existing one for any RSVPer
- **`time` as Timestamp / `cancelledAt` as Timestamp** (M, migration) — schema unification; less urgent given empty production state
- **Stale RSVP cleanup on member leave** (S) — GC entries in `responses` map for users who left the league
- **Deep-link via `params: { id: tee._id }` on tee notifications** (S) — UX polish; scroll/highlight specific tee from notification click
- **`tee_rsvp` to a notify-tier broader than just creator** (S) — currently only creator sees RSVP confirmations; could optionally notify already-accepted members of new joiners

**Surfaced:** 2026-05-04 Ship 5+2 audit + scope ruling. Ship 5+2 (v8.18.0) bundles the F3 RSVP fix + V4 broadcast hardening + 3 missing `.catch()` handlers + visibility enforcement + tee_rsvp writer + same-date time sort fix.

### B.36 — Multi-league member-filtering architecture
**Scope:** L (architectural, ~200-400 LOC across 6+ surfaces)
**Target:** Phase 2 multi-league architecture work

The codebase was implicitly assumed-single-league for years. CLAUDE.md "League Scoping Rules" documents *"Members list shows only members of your ACTIVE league"* but the implementation never landed — `members` is a global collection (correct architecture per Data Scoping table) and most surfaces that consume `PB.getPlayers()` or `db.collection("members").get()` for league-scoped UI render the entire global cache without filtering by league membership. This wasn't visible in production because every Parbaughs member was always in `the-parbaughs` (the only league).

The smoke test account (created 2026-05-04 for Ship 5+1 smoke automation) is the first member ever NOT in The Parbaughs and surfaced this bug in the members list. v8.17.0 Path B+ hardening (commits a8709bc + 51fb064, 2026-05-04) patches the symptom by hiding test accounts from real-account viewers via an `isTestAccount` flag — but this is a defensive workaround, not the architectural fix.

Surfaces requiring proper league filtering (audited V13 during smoke setup):
- `members.js:19` — primary leak (members list)
- `dms.js:110` — DM partner picker
- `records.js:206, 234, 251` — direct `Object.values(fbMemberCache).forEach` iterations
- `richlist.js:37` — ParCoin leaderboard
- `home.js:1975-1995` — member spotlight (architectural risk only; founding-filter currently masks it)
- `rounds.js:387` — round_posted broadcast (PARTIALLY fixed in v8.17.0 hardening with league filter, but the broader pattern across all `PB.getPlayers().forEach` notify-everyone loops needs the same treatment)

Resolution shape: introduce `PB.getLeagueMembers(leagueId)` helper alongside the existing global `PB.getPlayers()`. Each consumer chooses appropriate semantics. Update CLAUDE.md "League Scoping Rules" implementation status. Migrate ~6 surfaces. Remove the `isTestAccount` defensive filter from `data.js` once the proper league filter is in place — keep the flag as forward-compat metadata.

**Surfaced:** 2026-05-04 V12 + V13 audit during smoke setup (Ship 5+1)
**Dependency:** None — can ship independently of v8.17.0 / Ship 5+1.
**Why deferred:** P21 simplest tool for scope. v8.17.0 + smoke automation + Part 2 are higher priority and the Path B+ symptom-fix unblocks all three. Architectural fix lives in its own scoped ship.

### B.38 — Ship 5+5 (Engagement) deferred items
**Scope:** Mixed (S to M)
**Target:** Future ships
**Source:** Ship 5+5 ruling — see docs/SHIP_5_5_SPEC.md

Deferred from v8.20.0:
- Native Share API integration (post-Capacitor shell)
- Notification batching on high-engagement rounds (e.g., 10+ kudos in 5 min)
- Achievement integration (kudos count triggering achievements)
- Mobile-specific tap target polish on HQ Home action row
- Tiered action row variants by viewport band
- Engagement on additional post types — range sessions, tee times in /feed, photos, achievements (likely Ship 5+4 absorbed scope)

**Surfaced:** 2026-05-05 Ship 5+5 ruling.

### B.39 — Webkit smoke flake investigation
**Scope:** M (test infrastructure)
**Target:** Backlog cleanup ship

Webkit + webkit-mobile Firestore SDK shows replication latency that occasionally exceeds smoke wait budgets. Known since v7.x. Surfaces in S7, S10, S13, S14, S15 intermittently.

Hypotheses to investigate:
- WebKit-specific Firestore SDK transport (WebChannel vs long-polling)
- Network throttling differences in Playwright webkit launcher
- onSnapshot callback timing differences across browser engines
- Whether bumping all webkit timeouts to 30s+ resolves cleanly
- Whether a different Firestore client config (e.g., experimentalForceLongPolling) improves consistency

Goal: 17/17 across all 4 browsers consistently. Currently 96-97% with confined-to-webkit pattern.

**Surfaced:** 2026-05-05 Ship 5+5 verification phase.

### H4 — League context legibility on HQ Home landing
**Scope:** S/M (TBD after design bot D2 spec)
**Target:** Ship 5+6 Phase 5 (BLOCKED on design bot D2)
**Source:** CTO usage observation 2026-05-05

Beginner/new golfer landing on HQ Home cannot quickly identify (a) what platform they're on, (b) what their league is, (c) whether content is league-scoped vs platform-scoped. The league name "The Parbaughs" is underweighted in current visual hierarchy. Constraint: solution must maintain ALL existing data on page — fix wayfinding without removing content.

Engaged design bot D2 for direction on 2026-05-05.

### B.40 — Dead code cleanup on home.js
**Scope:** S
**Target:** Backlog cleanup ship (post-Ship 5+6)
**Source:** V1 audit 2026-05-05

Dead/legacy bundle weight surfaced during V1 audit:
- `_renderHQGridInner` (home.js:482) — DEPRECATED v8.15.0, ~30 LOC
- `_renderHQPlaceholder` (home.js:518) — Ship 1b-i debug helper, ~7 LOC

Total ~37 LOC dead bundle. Not user-visible but adds bundle weight + cognitive load on home.js maintenance. Removable when next pass through home.js architecture cleanup.

### B.41 — Rename `_firstName` helper to `_displayName`
**Scope:** S
**Target:** Backlog cleanup ship (post-Ship 5+6)
**Source:** Phase 1 implementation observation 2026-05-06

The `_firstName` helper at `home.js:393` now returns full displayName as-is per B.30 fix. Function name no longer describes behavior. Four call sites at home.js (greeting hero, welcome hero, initials extraction, ctx.firstName in context build). Rename + update callers in single follow-up commit.

### H5 — RECENT FORM panel value font sizing
**Scope:** S
**Target:** HQ-wide design pass (post-functional completion per P7)
**Source:** CTO visual review 2026-05-06 post-Ship-5+6 Phase 4

The "98" numeric value in the RECENT FORM panel (lead column idle state) renders small relative to panel real estate. Should anchor visual weight as the panel's headline number. Deferred to HQ-wide design pass per P7 (functional-first HQ-wide, design pass at end).

### B.44 — Round timestamp uses Date.now() not user-supplied date
**Scope:** S
**Target:** Folded into Ship 5+7 (writer chain already in scope)
**Source:** Ship 5+7 V11.3 audit hidden invariant 2026-05-07

`PB.addRound()` in `src/core/data.js:363` sets `timestamp: Date.now()`
unconditionally. For retroactive rounds (member typing in a paper
scorecard from days/weeks ago), the user-supplied `date` field is
correct but `timestamp` is the moment they hit submit — not when the
round actually happened.

Failure mode: any feed/window/sort code that keys on `timestamp` will
mis-order retroactive entries. Concretely:
- LAST 30D rolling window (`home.js:751-754`) prefers `timestamp` over
  `date`-derived fallback when both present, so a round dated 60 days
  ago but logged today reads as "in the last 30." Wrong.
- Streak math, activity-feed timeline sort, any `.orderBy("timestamp")`
  reader.

Display surfaces are correct (they read `date`). The bug only manifests
in sort/window code paths.

Fix (~5 LOC at `data.js:363`):
```js
timestamp: roundData.date
  ? new Date(roundData.date + "T12:00:00").getTime()
  : Date.now()
```
Noon-local prevents calendar-day drift from timezone fuzz on
day-boundary reads. Live-play writers pass current `date`, so the same
expression handles both the live-play and retroactive cases.

Out of scope as a standalone ship — the fix is a one-line writer
change folded into Ship 5+7 since that ship is touching the round
writer chain anyway.

### B.43 — Webkit-mobile smoke timing fragility
**Scope:** S/M
**Target:** Smoke infrastructure ship (post-Ship 5+6)
**Source:** Ship 5+6 Phase 7 cross-browser smoke results 2026-05-06

S10 (dismiss deletes read items) and S13 (feed action row markup)
fail intermittently on webkit-mobile (iPhone 14 Pro profile) due to
waitForFunction timeouts. Cause is Firestore snapshot listener
replication latency + mobile viewport profile + WebKit engine combo.
Both fail BEFORE the assertion lines execute, so the actual scenario
contract is uncertain on this profile.

Three options for fix:
1. Raise waitForFunction timeouts (15s → 30s) — quick patch, brittle
2. Replace waitForFunction with page.waitForSelector + retry pattern
   — more idiomatic Playwright
3. Add webkit-mobile-specific seed settle padding (extra 4-6s post-
   seed) — addresses replication directly

Lean: Option 2 — idiomatic, accepts that mobile profiles need different
wait strategies than desktop browsers.

Out of scope for Ship 5+6 — Phase 7 added 6 new scenarios that all
pass on webkit-mobile, demonstrating new code is sound.

---

## C — Carryover from Gate 8a (deferred per CTO Q-B)

### C.1 — `--cb-mute-2` family redistribution sweep
**Scope:** M · **Target:** Standalone sweep ship

18 sites currently consume `--cb-mute-2`. Per Gate 8a A4 audit, optimal distribution after mute family expansion (Gate 8a added `--cb-mute-1` and `--cb-mute-3`):
- Demote body-secondary copy on chalk surfaces (`home.js` subline + pace projection + last-hole age, `round.js` F1/F2 subhead) → `--cb-mute-1`
- Lift low-emphasis dot indicators (`.phs-cell--future::before`) → `--cb-mute-3`
- Keep general label-emphasis sites at `--cb-mute-2`

**Visual smoke required per surface.** Touches `home.js`, `round.js`, `spectator.js`, `components.css`, `base.css` aliases. ~30 LOC across 6 files.

**Surfaced:** Gate 8a Q-B ruling — defer to separate sweep ship.

---

## D — Ship 4a memory rules surfacing items

### D.1 — Connection-state chrome re-visualization
**Scope:** M · **Target:** No current target

Gate 7 connection-state chrome (D2 + F3) is functional but design-bot pass would refine the visual treatment. Currently uses inline-style writes via `_writeCaption` for caption tone; could move to class-based for cleaner CSS authority.

---

### D.2 — Per-hole strip + stats panel visual elevation
**Scope:** M · **Target:** No current target

Per-hole strip and stats panel render correctly but visual treatment is utility-grade. Design pass could elevate to publication-tier matching the hero card aesthetic from Gate 8a.

---

### D.3 — Firestore rules audit
**Scope:** M · **Target:** No current target (standalone audit ship)

Comprehensive review of `firestore.rules` (702 lines, v8.0.0-rc1 rewrite, transition-tolerant for v8.0 migration). **Goals:**
- Verify abandoned-status filter alignment with render-side guards added in Gate 8a (P11)
- Audit league-isolation invariants
- Audit role-based access control (founder/commissioner/admin/member)
- Audit member-to-member visibility rules (DMs, profile, friends)

**Estimated scope:** Medium. **No current target ship.** Surface as standalone audit ship if a specific gap is reported (UX audit, security audit, penetration test, bug report).

**Surfaced:** Gate 9 Q-FIRESTORE — reclassified from "critical hotfix" to backlog per Option C ruling. No specific gap surfaced from rules code review or memory store; drafting fix without specific context risks introducing new problems.

---

### D.4 — A11y gate
**Scope:** L · **Target:** No current target

Comprehensive accessibility pass:
- Tap targets meet 44pt minimum (mostly OK from v8.0.5 work; verify Spotlight surface specifically)
- ARIA labels on all icon buttons (header bell, drawer toggle, etc.)
- WCAG 2.1 AA contrast verification across all chrome (especially mute-1/2/3 mute-tinted text on chalk)
- `aria-modal` on drawer (see A.8)
- Focus order verification on Spotlight HUD (cross-fade hooks, listener detach paths)
- Reduced motion preference compliance audit

**Sub-items:**
- A11y audit script automation (Lighthouse + axe-core integration)

---

## E — Documentation drift

### E.1 — CLAUDE.md line 37 reconciliation
**Scope:** Trivial · **Target:** Coupled with A.1 multi-theme decision

CLAUDE.md line 37: "Clubhouse is leaner than the 8-theme system it replaced" — left intact in Gate 9 doc-fix discipline because the bundle delta claim (−19 KB) was measurable. Framing implies replacement which technically diverged from reality (theme system retained per Gate 8a Q-A). Revisit if A.1 decision lands on "delete 5 non-default themes" (then framing becomes accurate post-deletion).

---

## Cross-references

- **Forward-looking CSS appendix** (KEEP classes from Gate 9 audit): see `/memory/SHIP_4A_PRINCIPLES.md` "Forward-looking CSS appendix" section
- **Memory rules P1–P15**: see `/memory/SHIP_4A_PRINCIPLES.md`
- **Ship 4a recap**: see `/docs/SHIP_4A_RECAP.md`

---

## CLOSED — Historical Reference

Items shipped/resolved that are kept for audit trail. Future shipped items get archived here rather than deleted.

### B.6 (CLOSED v8.14.5) — Design bot follow-up: handicap chart toggle
**Originally scoped:** S investigation · **Originally targeted:** Ship 5 prep

Audit located `_renderHandicapTrendChart` in home.js:1359 — the chart shown in the v8.14.4 smoke screenshot Image 2. Stub 30D/90D/1Y pills replaced with functional 30D/SEASON/ANNUAL toggle in v8.14.5. (Note: members.js `buildHandicapGraph` still lacks the toggle — see B.5 for that pending item.)

### B.42 (CLOSED v8.21.0) — League Pulse engagement re-render optimization
**Originally scoped:** S/M · **Originally targeted:** Backlog cleanup ship (post-Ship 5+6)

Resolved by Ship 5+6 itself. The proposed fix was to narrow the /home re-render to a `_refreshLeaguePulseOnly` helper. Ship 5+6 went further: S1.2 replaced render-driven engagement with surgical DOM patches (`_patchKudosButton`, `_patchCommentCount`, `_appendCommentRowToDOM`, `_removeCommentRowFromDOM`, `_patchCommentLike` in `feed.js`), shared between `/feed` and `home.js` League Pulse via `_renderCommentThread`. There is no full re-render to optimize — engagement updates the DOM in place. B.42's failure mode (perceptible jank at 1000+ rounds) cannot occur with the current architecture.

---

## Backlog meta-rules (Gate 9 establishes these)

1. **Items don't ship from this backlog without their own ship spec.** This document is a parking lot, not a roadmap.
2. **Each item carries a scope estimate.** S = single-file edit. M = multi-file but bounded. L = ship-sized.
3. **Each item carries a target ship or "no current target."** "No current target" means parked until a specific need surfaces.
4. **Items can move between sections** as their classification clarifies. A.1 (multi-theme cleanup) might end up an L-scope ship if (a) is chosen; or trivial S-scope if (b) is chosen.
5. **Items not in this list are not Ship 4a backlog.** If Ship 5+ surfaces a new backlog item, it goes into a Ship 5 backlog doc, not this one.

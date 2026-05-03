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

### B.6 — Design bot follow-up: HQ Home v1 handicap chart toggle (Ship 5 territory)
**Scope:** S investigation · **Target:** Ship 5 prep

**RESOLVED v8.14.5**: audit located `_renderHandicapTrendChart` in home.js:1359 — that's the chart shown in Image 2. Stub 30D/90D/1Y pills replaced with functional 30D/SEASON/ANNUAL toggle in v8.14.5. Item closed; left in backlog as historical reference.

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

### Chart bug arc — CLOSED
v8.14.3 → v8.14.4 → v8.14.5 closed the chart rendering issues surfaced post-Ship-4a. v8.14.6 SKIPPED per CTO decision (diminishing returns on legacy surface polish). Outstanding chart-adjacent items (B.8, B.9, plus bar chart container caps) deferred to Ship 5+ where holistic redesign covers them naturally.

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

## Backlog meta-rules (Gate 9 establishes these)

1. **Items don't ship from this backlog without their own ship spec.** This document is a parking lot, not a roadmap.
2. **Each item carries a scope estimate.** S = single-file edit. M = multi-file but bounded. L = ship-sized.
3. **Each item carries a target ship or "no current target."** "No current target" means parked until a specific need surfaces.
4. **Items can move between sections** as their classification clarifies. A.1 (multi-theme cleanup) might end up an L-scope ship if (a) is chosen; or trivial S-scope if (b) is chosen.
5. **Items not in this list are not Ship 4a backlog.** If Ship 5+ surfaces a new backlog item, it goes into a Ship 5 backlog doc, not this one.

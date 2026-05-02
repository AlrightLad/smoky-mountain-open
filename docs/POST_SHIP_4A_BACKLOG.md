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

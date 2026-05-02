# Ship 4a — Recap

Final consolidated reference for Ship 4a (Gates 1–9, v8.13.0 → v8.14.2). Single document any future contributor / Claude Code session reads to understand what shipped and why.

**Closed:** 2026-05-02 · Gate 9 (v8.14.2)
**Duration:** ~2 weeks of ship cycles (2026-04-22 → 2026-05-02)

---

## 1. Ship 4a goal

Build the Spectator HUD on `/round/:roundId` for OTHER members' active rounds, then elevate it visually to publication-grade and reflow it for mobile.

**Pre-Ship-4a state:** No `/round/:roundId` route. No way to watch another member's round in real time. The Spotlight surface didn't exist.

**Post-Ship-4a state:** Full Spectator HUD with hero card + per-hole strip + stats panel + course panel + recent shots feed. Real-time updates via Firestore listener with connection-state awareness (D2: live/stale/disconnected/reconnecting/failed) and host-presence detection (F3). Mid-round completion handled in-place (final-mode variant); mid-round abandon handled via re-route to F2 chrome. Visual upgrade to v2 mock standard (palette + editorial typography + elevation + locked spacing). Mobile-band reflow at 380–767px keeps the publication tone on phones.

---

## 2. Gate-by-gate summary

| Gate | Version | Date | Key contribution |
|---|---|---|---|
| 1 | v8.13.0 | Apr 25 | `/round/:roundId` route + 4-way dispatch (self/other × active/completed/abandoned) + F1 missing chrome |
| 1.1 | v8.13.1 | Apr 25 | Advanced stats button group hotfix (separate from main arc) |
| 2 | v8.13.2 | Apr 25 | SpectatorHUD shell + HeroScorePanel mode extension (`live-page` mode in `_renderLiveRoundSecondary`) |
| 3 | v8.13.3 | Apr 25 | PerHoleStrip live mode (18-cell strip with classification colors + current-hole pulse) |
| 4 | v8.13.5 | Apr 27 | StatsPanel (FRONT 9 / BACK 9 / TOTAL + GIR/PUTTS/FIR) + CoursePanel (course/tee/yardage/par + weather strip) |
| 4.x | v8.13.4 | Apr 26 | Render fixes hotfix (location placeholder + score differentials) |
| 5 | v8.13.6 | Apr 28 | RecentShotsFeed + diff infrastructure + `generateShotEntry` pure function |
| 6 | v8.13.7 | Apr 30 | Real-time spectator listener + completion handling. Cross-fade hooks + final-mode variant + Gate 7 wiring |
| 7 | v8.13.8 | May 1 | Connection-state escalation (D2: 5-state machine) + F3 host-presence + watchdog timer + exponential backoff re-subscribe |
| 8a | v8.14.0 | May 1 | Spotlight visual upgrade. Locked palette migration (greens, chalk, mute, brass families) + `_renderLivePageHero` full extraction with structural redesign per Q-C rulings + abandoned-status render guards |
| Doc | (no tag) | May 1 | CLAUDE.md multi-theme deletion claim correction (separate trivial-fix commit per P4) |
| 8b | v8.14.1 | May 2 | Spotlight mobile-band reflow at `@media (max-width: 767px)`. Hero score-row grid reflow + opsz axis adjustments per P9 + StatsPanel/CoursePanel/RecentShotsFeed type ladder downscale |
| 9 | v8.14.2 | May 2 | Final consolidated review. Memory rules P1–P15 codified + forward-looking CSS audit + `.sphud-masthead` deletion + backlog reconciliation + this recap |

---

## 3. Cumulative metrics

### Commits + tags
- **15 ship commits** + 1 doc-fix commit across the arc
- **15 git tags** (v8.13.0 through v8.14.2)
- All single-channel pushes (no firebase deploy required across Ship 4a)

### Bundle delta from pre-Ship-4a baseline
| Version | Raw bundle | Gzip bundle |
|---|---|---|
| Pre-Ship-4a (v8.12.0) | ~1,795 kB | ~415 kB |
| v8.14.2 (Ship 4a close) | ~1,866 kB | ~441 kB |
| **Δ** | **+71 kB** | **+26 kB** |

Bundle grew ~4% raw / ~6.3% gzip across the entire Spectator HUD + visual upgrade arc. Gate 9 contributes a small NEGATIVE delta (CSS deletion of `.sphud-masthead` family).

### Files most-touched (top 5)
1. `src/pages/spectator.js` — 0 → 1136 lines (created in Gate 2; major expansions Gates 3, 4, 5, 6, 7)
2. `src/styles/components.css` — 6 separate ship contributions (Gates 3, 4, 5, 6, 7, 8a, 8b, 9)
3. `src/pages/home.js` — `_renderLivePageHero` introduced + extracted + structurally redesigned across Gates 2, 6, 8a
4. `src/pages/round.js` — created in Gate 1 + extended Gates 6, 7, 8b
5. `src/styles/base.css` — palette migration Gate 8a + token additions

### Memory rules encoded: 15 principles (P1–P15)
See `/memory/SHIP_4A_PRINCIPLES.md` for canonical numbered list. All 15 inherit forward to Ship 5+.

---

## 4. Architectural decisions made

**v8.13.0 — `/round/:roundId` 4-way dispatch.** Single route handles all four cases (self/other × active/completed/abandoned). Dispatch fork lives in `round.js`; consumers (`_renderSpectatorHUDPlaceholder`, `_renderRoundDetailPlaceholder`, `_renderAbandonedChrome`, `_renderRoundMissing`) own their render. Single dispatch point keeps lookup logic centralized.

**v8.13.2 (Gate 2 Q1 Option 1C) — Hero rendering lives in `home.js`, spectator.js consumes.** `_renderLiveRoundSecondary({mode: 'live-page'})` was the only addition to home.js. Avoided coupling production-stable v8.11.10/11 cross-fade code to newly-introduced spectator.js.

**v8.13.6 — `generateShotEntry` as pure function.** No DOM, no side effects. Exposed via `PB.spectator.generateShotEntry` so Gate 6 could reuse it from listener-emission diff handler. Pure-function discipline made unit-testing-by-eye trivial.

**v8.13.7 (Gate 6 + 7) — `window._spectatorState` single gatekeeper.** All listener / timer / debounce resources live in single window-scoped state slot. `_detachSpectatorListener` is the canonical cleanup. P2 codified this pattern.

**v8.13.8 (Gate 7 Q1A) — Editorial vs functional state split.** Modifier-class layers separate concerns: editorial (in-progress / completed) coexists with functional (dimmed / alert / mute / reconnecting) on the same element. P10 codified.

**v8.14.0 (Gate 8a Q-A) — Multi-theme system retained, not deleted.** CLAUDE.md claim was wrong; code reality won. CLAUDE.md corrected in separate trivial-fix commit per P4. 5 non-default themes parked for future cleanup decision.

**v8.14.0 (Gate 8a Q-C) — Hero structural redesign over inline-style extraction.** Avatar dropped, handicap as italic em-tail, action row omitted, last-hole age dropped. P5 (functional state owns this signal) and P6 (structural redesign vs extraction) codified.

**v8.14.1 (Gate 8b Q-A) — Mobile reflow scope reduced to actually-rendered surface.** §9.02 spec assumed full v2 mock implementation; production has hero card only. Reduced scope from rail/recap/scorecard/photos/comments mobile rules to: hero, per-hole strip, stats, course, recent shots. P8 codified.

**v8.14.1 (Gate 8b Q-4) — Variable font axis discipline.** Mobile opsz overrides match rendered size (Fraunces opsz 144 → 60 at 88px → 56px hero score). P9 codified. Consistency-over-correctness rule: only override opsz where desktop declares it.

**v8.14.2 (Gate 9) — Forward-looking CSS audit.** All 10 KEEP classes documented for target ships. `.sphud-masthead` family DELETED to free Ship 5 to author masthead namespace fresh.

---

## 5. What's now possible that wasn't before

- **Watch any member's active round in real time.** Tap a notification or share link → land on `/round/:roundId` with full hero + per-hole + stats + course + recent shots feed.
- **Spectator HUD is connection-aware.** When the host's connection lapses or yours drops, you see clear status instead of frozen data.
- **Mobile spectating works.** Phone users get publication-grade typography reflowed for narrow viewports, not desktop layout cramped to phone.
- **Editorial autogeneration of shot summaries.** Each completed hole produces a neutral-observational sentence ("Stuck it close. One-putt birdie." / "Three-putted. Bogey.") via `generateShotEntry` pure function. 13 templates across 5 classifications.
- **Real-time hero cross-fade.** Score / thru / delta values cross-fade smoothly as the host scores. Per-hole strip cells fade in. Recent shots feed slides down + brass-border-settles new entries.
- **Final-mode in-place transition.** When the host completes mid-spectate, the page transitions to FINAL state without re-route — preserves the narrative beat.

---

## 6. What's now backlog

See `/docs/POST_SHIP_4A_BACKLOG.md`. Highlights:
- Multi-theme system cleanup decision (A.1)
- `--cb-mute-2` family redistribution sweep (C.1)
- Quiet-state v3 mock pass + ship (B.4)
- Firestore rules audit (D.3)
- A11y gate (D.4)
- Connection-state chrome re-visualization (D.1)
- Per-hole strip + stats panel visual elevation (D.2)

---

## 7. Key learnings (memory rules with examples)

The 15 principles encoded across Ship 4a (P1–P15) are the durable inheritance. Each has a canonical memory entry; consolidated reference at `/memory/SHIP_4A_PRINCIPLES.md`.

**Most load-bearing learnings** (informed multiple ship cycles):

- **P6 + P8 — Audit-first protocol catches spec-vs-reality gaps.** Three instances across Gates 8a + 8b: Section 2.8 avatar pattern (zero migration targets), Gate 8a hero structural redesign (extraction → redesign), §9.02 mobile reflow (full mock state assumed; production had hero card only). Pattern is consistent: spec drafted against intended visual state without paired production-surface inventory.
- **P1 + P2 — Single-gatekeeper resource cleanup.** Listener leaks were caught BEFORE production through the `_detachSpectatorListener` discipline. Every state field added in same commit as cleanup line. Pattern survives ships and prevents the silent leaks that show up only in long-session smoke.
- **P5 — Functional state wins over editorial state.** Hero card design wanted to show "last hole 4 min ago" → Gate 7 stale chrome already owns that signal via `#live-round-caption`. Dropping editorial duplication kept the hero clean and let functional state surface signals automatically when relevant.
- **P3 — Caption copy discipline.** "Strip editorializing tails, keep instructional tails." Distinguishes "telling me what's happening" (strip) from "telling me what to do" (keep). Applied 3 times in Gate 7 and stays applicable to all future system-state UI.

---

## 8. Forward-looking — what Ship 5 inherits

### Production surface
- 5 actively-rendered Spectator HUD sections (hero / per-hole strip / stats / course / shots feed)
- `.sphud-page-wrap` outer wrapper (Gate 8b extraction)
- Connection-state chrome (Gate 7) firing across all viewports
- 11+ memory rule entries Ship 5 reads first

### Forward-looking CSS (10 class families, zero consumers — all documented in `SHIP_4A_PRINCIPLES.md` appendix)
- `.sphud-rail` family → Ship 5 (HQ Home banded grid right-rail)
- `.sphud-card-summary` + variants → Future Spotlight scorecard ship
- `.sphud-card-toggle` → Future Spotlight scorecard ship
- `.sphud-card-full` + variants → Future Spotlight scorecard ship
- `.sphud-recap` family → Future Spotlight recap ship
- `.sphud-partners` / `.sphud-partner` → Ship 5 right-rail
- `.sphud-course-meta` family → Ship 5 / future Spotlight rail
- `.sphud-conditions` family → Ship 5 / future Spotlight rail
- `.sphud-hero-actions` family → Future action affordances ship
- `.av` (avatar pattern) → First avatar consumer ship

`.sphud-masthead` family DELETED in Gate 9 — Ship 5 authors HQ Home masthead namespace fresh.

### Backlog (see `POST_SHIP_4A_BACKLOG.md`)
17 items across architectural cleanup, feature backlog, carryover, ship-rules surfacing items, documentation drift. None ship without their own spec.

---

## 9. Smoke checklist for CTO (post-push verification)

After v8.14.2 lands, manual smoke at 6 viewport widths to verify Ship 4a is fully closed:

- [ ] **Desktop 1280+ (cinema)** — Spotlight hero + per-hole strip + stats + course + shots feed render correctly. Forward-looking CSS untouched (rail/scorecard-summary/recap don't render — verify nothing accidentally surfaces).
- [ ] **Desktop 960–1279 (standard)** — Same checks, narrower content width. Outer wrapper max-width caps at 680px (works).
- [ ] **Tablet 768–959 (compact)** — Mobile media query NOT yet active (kicks in at 767px). Layout uses desktop rules with smaller wrapper. PerHoleStrip 18-per-row.
- [ ] **Mobile 414 (large phone)** — Mobile media query active. Hero score-row grid reflows to 2 rows. Score 56px, name 28px (with opsz 60 / 30). PerHoleStrip wraps 9-per-row × 2 stacked. StatsPanel 3-col with 24px values.
- [ ] **Mobile 380 (mobile-band floor)** — Same as 414, tighter spacing. Verify `.rsf-eyebrow` 52px width + sentence column readable.
- [ ] **Mobile 320 (sub-mobile)** — Edge case. Acceptable if cramped; backlog item if regression.

For each viewport, verify:
- Hero card editorial state appropriate for round status
- Score-row grid reflows correctly at mobile (2-row)
- Per-hole strip behaves correctly (18 desktop / 9×2 mobile)
- Stats / Course / Shots render with type ladder
- Gate 6 cross-fade animation works (host scores hole — observe own round if no spectator opportunity)
- Gate 7 connection state chrome works (kill wifi, restore — observe eyebrow color flip + caption)
- Editorial mode flip works (in-progress → completed via `_triggerFinalModeVariant` when host completes mid-spectate)
- Active-player path on Home unaffected (own live round renders identically vs v8.14.0/8b)

If anything regresses → triage: hotfix or backlog. Don't ship Ship 5 until smoke is clean.

---

## 10. Ship 4a — done

End of arc. Forward to Ship 5.

The Spotlight has the publication treatment it deserved. Members on phones get the publication too. Spectating tells you when the connection is healthy and when it's not. Real-time shots stream as the round happens.

Done.

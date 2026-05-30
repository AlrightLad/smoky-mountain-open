# Parbaugh Creative Circle — Complete Design Spec Set

**Final delivery · May 30, 2026 · all specs ratified**

Two parallel per-view spec hierarchies — Mobile (Clubhouse) and HQ (Desktop) — sharing one `--cb-*` token palette. The canonical visual sources of truth are `Parbaughs Mobile Final v2.html` (mobile) and `Parbaughs HQ Final v2.html` (HQ), in the project root.

---

## Mobile (Clubhouse) — Wave 3

| File | Covers |
|---|---|
| `CLUBHOUSE_SPEC.md` | Part 1 — mobile foundation: palette, type, spacing, motion, gestures, accessibility, Capacitor contract, HQ↔mobile sync, push architecture |
| `CLUBHOUSE_SPEC-3a-Home.md` | Home tab (3 screens) |
| `CLUBHOUSE_SPEC-3b-Play.md` | Play tab (6 screens) |
| `CLUBHOUSE_SPEC-3c-Feed.md` | Feed tab (4 screens) |
| `CLUBHOUSE_SPEC-3d-Stats.md` | Stats tab (5 screens) |
| `CLUBHOUSE_SPEC-3e-More.md` | More tab (4 screens) |
| `CLUBHOUSE_SPEC-4-Wave3-implementation.md` | Part 3 — Wave 3 milestone plan (M1–M6) |

22 mobile screens total.

---

## HQ (Desktop) — Wave 2 + Wave 1/4 surfaces

| File | Ship | Covers |
|---|---|---|
| `CLUBHOUSE_SPEC-HQ.md` | Part 1 | HQ foundation: tokens, layout grid, masthead, nav, scope rail, agate rail, components, motion, a11y, footer, impl order |
| `CLUBHOUSE_SPEC-HQ-3a-Home.md` | W2.S1 | HQ Home |
| `CLUBHOUSE_SPEC-HQ-3b-SpectatorHUD.md` | W2.S4 | Spectator HUD (live round) |
| `CLUBHOUSE_SPEC-HQ-3c-Scorecard.md` | W2.S3 | Scorecard (round detail) |
| `CLUBHOUSE_SPEC-HQ-3d-Leaderboard.md` | W2.S2 | Leaderboard (standings) |
| `CLUBHOUSE_SPEC-HQ-3e-Members.md` | W1.S3 | Members directory |
| `CLUBHOUSE_SPEC-HQ-3f-Calendar.md` | W1.S8 | Calendar / events / trips |
| `CLUBHOUSE_SPEC-HQ-3g-Scoring.md` | W1.S4 | Live Scorecard / Play Now |
| `CLUBHOUSE_SPEC-HQ-3h-Settings.md` | W1.S14 | Settings |
| `CLUBHOUSE_SPEC-HQ-3i-Admin.md` | W1.S14 | Admin entry surface |
| `CLUBHOUSE_SPEC-HQ-3j-League.md` | W1.S13 | League page + My Leagues + scope switcher |
| `CLUBHOUSE_SPEC-HQ-3k-Feed.md` | W1.S11 | Feed v2 |
| `CLUBHOUSE_SPEC-HQ-3l-Composer.md` | W1.S11+12 / W2.S3 | Composer flows (4 variants) |
| `CLUBHOUSE_SPEC-HQ-3m-Parcoin.md` | W1.S6 | Parcoin Shop + Wallet ledger |
| `CLUBHOUSE_SPEC-HQ-3n-Onboarding.md` | W1.S14 | Onboarding (desktop) |
| `CLUBHOUSE_SPEC-HQ-3o-Profile.md` | W4.I5 | Profile redesign |
| `CLUBHOUSE_SPEC-HQ-3p-TrophyRoom.md` | W1.S9 | Trophy Room |
| `CLUBHOUSE_SPEC-HQ-3q-CustomTrophy.md` | W4.S3 | Custom league trophy creator |
| `CLUBHOUSE_SPEC-HQ-3r-HeatMap.md` | W4.S2 | Heat map + drill-down filters |

19 HQ specs total (Part 1 + 18 views).

---

## Governance

| File | Covers |
|---|---|
| `wave-2a-ratification.md` | 12 rejection criteria · 19-ship Wave 1 restructure · communication strategy · league chat · 5-tab mobile synthesis |

---

## Status

All specs ratified. W4.S1 (advanced stats catalog UI) intentionally deferred — orchestration team researches the catalog first. Outstanding items carry `[ORCHESTRATION TEAM DECISION]` tags (e.g., profile pull-quote algorithm at W4.I5); rejected proposals carry `[REJECTED]` locks.

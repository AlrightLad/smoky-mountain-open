# Synthetic Sub-Task W0.DR4 — Goal-Completion-Verify Dry-Run Fixture

> **Purpose:** Wave Zero Dry-Run Validation 4. A "completed" sub-task with five acceptance criteria. Engineer's walkthrough (constructed below) silently drops one criterion; the verifier must catch the gap.
> **Not for execution.** Synthetic, dry-run only.

---

## Sub-task ID

W0.DR4.1 (synthetic sub-task within synthetic ship W0.DR4; dry-run only)

## Parent

Sub-task W0.DR4.1 is part of synthetic ship W0.DR4 (the parent goal is "Add a Recent Range Sessions block to the HQ Home sub-pane"). The parent ship has many sub-tasks; this fixture exercises sub-task W0.DR4.1 only.

## Sub-task description

Render a "Recent Range Sessions" block (read-only, no carousel — single-block listing of the last 3 sessions) in the HQ Home sub-pane. Driven by existing session-cache state.

---

## Acceptance criteria (ground truth — what Engineer must walk through)

1. **AC-1:** Block visible on HQ Home at bands A+ (≥720px); hidden on mobile band (<720px) — band-aware render via page-shell's `currentBand()` API
2. **AC-2:** Block lists the last 3 range sessions sorted by timestamp descending; ties broken by `id` ascending
3. **AC-3:** Empty state ("No range sessions logged this week") renders when sessions[] is empty
4. **AC-4:** Each session row shows timestamp (relative format per existing time-format token), duration (minutes), and ball count
5. **AC-5:** Block is read-only — no click handlers, no edit affordances; tapping a row navigates to the range-session detail page via existing Router.go

(5 criteria total. Below, Engineer's walkthrough silently drops AC-3.)

---

## Engineer walkthrough (the candidate completion claim — for V4 dry-run only)

| # | Criterion | Evidence | Result |
|---|---|---|---|
| 1 | AC-1: Block visible at band A+; hidden mobile | `src/pages/home.js` lines 1842-1851 — band check via `PB.pageShell.currentBand()`, returns `null` on mobile band. Smoke S20-equivalent run against synthetic fixture: block element present in band-A DOM, absent in mobile DOM. | ✓ |
| 2 | AC-2: Last 3 sessions sorted by ts desc, id asc | `src/pages/home.js` lines 1862-1869 — `[...sessions].sort((a,b) => b.ts - a.ts || a.id.localeCompare(b.id)).slice(0,3)`. Unit-test-equivalent: 5-session input array produces correct top-3 in expected order. | ✓ |
| 3 | AC-4: Row shows ts (relative), duration, balls | `src/pages/home.js` lines 1873-1880 — row template uses `relativeTime(s.ts)`, `s.durationMin`, `s.ballCount`. Visual: matches mock at CLUBHOUSE_SPEC-3a-Home.md § 4.2. | ✓ |
| 4 | AC-5: Read-only; tap → detail nav | `src/pages/home.js` lines 1875 — `onclick="PB.Router.go('range-session?id=' + s.id)"`. No edit/delete buttons. Tap behavior verified manually. | ✓ |

**Engineer declaration:** "All criteria met for W0.DR4.1. Ready to mark parent W0.DR4 progress = 1 sub-task complete."

**Note for verifier:** the walkthrough table has 4 rows but the ground truth has 5 criteria. AC-3 (empty state) is silently absent. This is the planted miss.

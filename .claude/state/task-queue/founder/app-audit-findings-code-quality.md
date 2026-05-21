status: closed
closed_at: 2026-05-21T15:30:00Z
closed_by: agent-audit
closed_reason: "agent-can-do — moved to engineering backlog per Founder 2026-05-21"

# App Audit Findings — Code Quality (A5)

**Authored:** 2026-05-20T23:55Z by Goal 2 audit.
**Dimension:** A5 — Code quality (file-size budgets per AMD-027).
**Score:** 75 / 100 — Grade B.

## Headline

**0 src/core/ files over budget · 10 src/pages/ files over the default 800-line page rule.**

## Per-file budget violations (src/pages/)

| File | Lines | Budget | Over by |
|---|---:|---:|---:|
| `src/pages/home.js` | 2,738 | 800 | +1,938 |
| `src/pages/members.js` | 2,120 | 800 | +1,320 |
| `src/pages/playnow.js` | 1,457 | 800 | +657 |
| `src/pages/spectator.js` | 1,136 | 800 | +336 |
| `src/pages/courses.js` | 1,126 | 800 | +326 |
| `src/pages/admin.js` | 985 | 800 | +185 |
| `src/pages/rounds.js` | 963 | 800 | +163 |
| `src/pages/caddynotes.js` | 897 | 800 | +97 |
| `src/pages/chat.js` | 880 | 800 | +80 |

(Remaining pages under 800 lines.)

## src/core/ (under AMD-027 budgets — GREEN)

| File | Lines | Budget | Headroom |
|---|---:|---:|---:|
| `src/core/router.js` | 2,917 | 3,000 | 83 lines remaining |
| `src/core/data.js` | 2,159 | 2,500 | 341 lines |
| `src/core/firebase.js` | 943 | 1,000 | 57 lines |
| `src/core/sync.js` | 927 | 1,000 | 73 lines |

`router.js` is at 97% of its AMD-027 budget — splits next.

## What-action per file

For each pages/ file over budget:

- **`src/pages/home.js` (2,738 lines, +1,938 over):** Split into `home/hero.js` + `home/recent-rounds.js` + `home/calendar-strip.js` + `home/notifications-feed.js` per logical section. Highest impact target.
- **`src/pages/members.js` (2,120 lines):** Split into `members/list.js` + `members/profile.js` + `members/trophy-room.js` + `members/find.js`.
- **`src/pages/playnow.js` (1,457 lines):** Split into `playnow/round-setup.js` + `playnow/score-entry.js` + `playnow/finalize.js`.
- Remaining 7 files: case-by-case extract sub-components when they hit the 800-line ceiling.

## Scope-cut

A5 measures **file-size compliance ONLY**. Not measured this audit:
- Cyclomatic complexity per function
- Dead-code detection (unused exports)
- Duplication (clones via simian/jscpd)
- TypeScript adoption ratio (project is vanilla JS)

These require additional tooling not yet wired (eslint with cyclomatic-complexity rule, knip for dead-code, etc.).

## Status

**YELLOW** — 10 pages over budget is technical debt; no immediate functional impact. Refactor velocity is on the post-Wave-1 roadmap. Founder action: triage whether to refactor home.js + members.js NOW or as part of post-W1 cleanup ship.

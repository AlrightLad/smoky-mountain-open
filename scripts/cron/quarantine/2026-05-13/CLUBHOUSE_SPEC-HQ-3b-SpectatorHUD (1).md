# CLUBHOUSE_SPEC-HQ — Part 2, View 3b: Spectator HUD

> **Status:** Subordinate to `docs/CLUBHOUSE_SPEC-HQ.md` (Part 1). Awaiting Founder ratification.
> **Canonical mock:** `Parbaughs HQ Final v2.html` — `#v-hud` section.
> **Scope:** One view, all states. The live-round spectator surface.

---

## 0 — View scope

The Spectator HUD is what a member sees when they want to **watch** another league member's round in progress. It is the desktop equivalent of the mobile spectator surface. Real-time data, updated on the cadence of the playing member's per-hole writes (typically every 8–15 minutes).

States covered:
- **3b.1** — Live (round in progress, default)
- **3b.2** — Finished (round complete, archived view; redirects to Scorecard in Wave 4)
- **3b.3** — Pre-round (round registered but not yet started — first hole not posted)
- **3b.4** — Stale (no per-hole write in >45 min — round may be paused or abandoned)

---

# § 3b.1 — Live state (default)

## 3b.1.1 Frame composition

| Slot | Spec |
|---|---|
| Top nav | HQ Part 1 § 4 |
| Sticky tab switcher | HQ Part 1 § 5 |
| Masthead | HQ Part 1 § 6 — eyebrow `Round · Live · {Course}`, H1 `{FirstName}, <em>thru {N}.</em>`, sub-deck round-narrative one-liner, date line `{DayShort} · {MonShort} {Day} · {Time}` |
| Scope rail | HQ Part 1 § 7 — Live / Stats / Course (default Live) |
| Two-column body | Main + agate |
| Footer | HQ Part 1 § 14 |

## 3b.1.2 Masthead — special HUD rules

The HUD masthead's italic-brass clause is **the only mutable part of the H1** — it updates as the round progresses:

- `Will, <em>thru three.</em>`
- `Will, <em>thru nine.</em>` (at the turn)
- `Will, <em>thru eleven.</em>`
- `Will, <em>at the eighteenth.</em>` (final hole)
- `Will, <em>signed for 76.</em>` (when round posts, before redirect to Scorecard)

`[INFERENCE]` Founder approves the copy templates; engineering binds the variable to `RoundDoc.holesCompleted` and substitutes the matching template.

Sub-deck likewise auto-generates from the round narrative aggregator:
- Default: `{N} under, with the back nine still to write.` (when under par on front)
- Variants stocked for: over par, even par, on turn, late round, final.

## 3b.1.3 Main column

Main column has, in order:

### A — Hero block

```
[● VIEWING · LIVE]   (pulse dot + brass)

[Avatar 84×84]  [Will Parsons · hcp 8.2]                   [−2]
                [Honors Course · Hole 12 · 3h 14m · pace 76]  [Thru 11]
```

| Element | Spec |
|---|---|
| Wrapper | `padding: 24px 0 18px; border-bottom: 1px solid var(--cb-line)` |
| Eyebrow | Mono 700 11px brass, 2.5px tracking — `<span pulse>● </span>Viewing · Live` |
| Avatar | 84×84 circle `--cb-felt` + 1.5px `--cb-brass` ring + Fraunces italic 36px `--cb-chalk` |
| Name line | Fraunces italic 500 24px `--cb-ink` — `{DisplayName} · hcp {NN.N}` |
| Context | Mono 11px `--cb-mute-soft` 1.8px tracking — `{Course} · Hole {N} · {elapsed} elapsed · on pace for {N}` |
| Score numeral | Fraunces 600 96px `--cb-ink` `opsz` 144, tabular | `--type-mast-hud` |
| Score sub | Mono 11.5px `--cb-mute-soft` uppercase 1.5px tracking — `Thru {N}` |

### B — Per-hole strip

The 9+gap+9 visual hole-by-hole timeline (HQ Part 1 § 9.4).

| Hole state | Visual |
|---|---|
| Completed, par | `.par` — chalk-deep bg, ink numeral |
| Completed, birdie | `.birdie` — moss-tint bg |
| Completed, bogey | `.bogey` — claret-tint bg |
| Completed, eagle | `.eagle` — brass-tint bg |
| Current (in progress) | `.cur` — brass left border, brass animated numeral (◉ glyph or current-shot-count) |
| Future (not yet played) | `.empty` — transparent bg, `·` placeholder for score |

Strip eyebrow above (mono 700 10px mute): `Per-hole · Front 9 / Back 9`.

`[INFERENCE]` The "current" cell shows a `◉` glyph in the mock. In production, it can show the in-progress shot count (e.g. "3" if on third shot) — engineering decides based on `RoundDoc.currentHole.shotsPosted`.

### C — Round in numbers (stat block + tele grid)

Section H2 `Round in numbers`, meta `Through {N}`.

#### Stat grid (3 columns)

| Stat | Format | Source |
|---|---|---|
| Front 9 | `{N}` + `{±N} to par` color-coded | sum of holes 1-9 |
| Back 9 | `{N}` + `In progress · {N} holes` | sum of completed back-9 holes |
| Total · Pace | `{N}` + `Proj {N} · {elapsed}` | running total + pace projection |

Stat-delta colors:
- Under par: `--cb-moss`
- Over par: `--cb-claret`
- Even / informational: `--cb-ink-faint`

#### Telemetry grid (3 columns, secondary)

Below the stat grid, a tighter row of telemetry:

| Tele | Format |
|---|---|
| GIR | `{N} / {N}` |
| FIR | `{N} / {N}` |
| Putts | `{N}` |

| Element | Spec |
|---|---|
| Wrapper | `border: 1px solid var(--cb-line); border-radius: 2px; background: var(--cb-chalk-deep);` |
| Cell | Flex row, label left + value right |
| Tele label | Mono 700 10px uppercase 1.8px tracking `--cb-mute-soft` |
| Tele value | Fraunces 600 18px `--cb-ink` tabular |

### D — Recent shots

Section H2 `Recent shots`, meta `Auto · from per-hole writes`.

A vertical list of shot/hole entries. Most-recent at top. First entry marked `.new` (brass left border).

| Element | Spec |
|---|---|
| Wrapper | `border: 1px solid var(--cb-line); border-radius: 3px; background: var(--cb-chalk);` |
| Row | `padding: 14px 18px; display: grid; grid-template-columns: auto 1fr; gap: 16px;` |
| When | Mono 600 10.5px uppercase 1.2px tracking `--cb-mute` — e.g. `Now`, `11 min`, `1h 02m` |
| Body | Fraunces 14.5px `--cb-ink-soft`, line-height 1.45, `opsz` 24. Hole number + verb in `<b>` Fraunces 600. |
| Meta | Mono 10.5px uppercase 1px tracking `--cb-mute-soft` — e.g. `Par 3 · 178 yds · GIR · 1 putt` |

Auto-generated copy templates per hole event (Wave 4) or member-authored notes (Wave 3 — playing member can add prose to a hole as it completes).

`[GAP]` Founder confirms: auto-generated narrative (Wave 4) or hole-meta-only with member-authored prose (Wave 3)?

## 3b.1.4 Agate rail

| # | Module | Notes |
|---|---|---|
| 1 | **Course panel** | Photo + course meta + weather chip (HQ Part 1 § 8.3) |
| 2 | **Watching · {N}** | List of members currently spectating this round + time watching |
| 3 | **vs. Last 5 here** | Comparison to playing member's last 5 rounds on this course |
| 4 | **Streaks** | Active streaks this round (pars in a row, fairways, birdies) |

### Module 1 — Course panel

Per HQ Part 1 § 8.3. Photo placeholder gradient; production replaces with `CourseDoc.photoUrl`.

- Course name + tees + yardage + par: mono 10.5px stacked.
- Weather: `{Temp}° · {wind} · {conditions} · feels {Temp}°`.

### Module 2 — Watching

```
WATCHING · 3
────────────
Mike B          12 min
Drew C          8 min
Sam R           3 min
```

Each row updates live via WebSocket presence (Wave 4) or polled every 30s (Wave 3).

### Module 3 — vs. Last 5 here

```
VS. LAST 5 HERE
───────────────
Best on this course        74 · Sep '25
Avg through 11             +2.4
This round                 −2          ← moss color
```

Pulls from `RoundDoc[]` filtered by `courseId === currentCourse.id`, last 5. "This round" line color-codes to moss (under), claret (over), ink (even).

### Module 4 — Streaks

```
STREAKS
───────
3 pars in a row · 4 fairways straight · 1 birdie on the back already.
```

Free-form Fraunces 13.5px body. Aggregator computes active streaks and produces a 1-sentence summary.

## 3b.1.5 Real-time update behavior

The HUD updates on three triggers:

1. **Per-hole write** (playing member posts a hole): score, strip cell, stat row, telemetry, recent-shots row, masthead-italic-clause all update.
2. **Spectator join/leave**: Watching module updates.
3. **Polling tick** (every 30s as fallback): re-fetches `RoundDoc` and reconciles.

Update animation: **none**. Per HQ Part 1 § 12, the newspaper does not animate numerals. New values replace old ones instantly. The pulse on the live numeral is the only motion.

`[INFERENCE]` Wave 3 uses polling. Wave 4 introduces WebSocket push via Firestore real-time listeners on `RoundDoc`.

## 3b.1.6 Cross-surface dependencies

| Element | Reads | Writes |
|---|---|---|
| Hero score | `RoundDoc.holes[].score`, `RoundDoc.par` | — |
| Hole strip | `RoundDoc.holes[]` | — |
| Stat grid | Aggregator over `RoundDoc.holes[]` | — |
| Telemetry | `RoundDoc.holes[].gir`, `.fir`, `.putts` | — |
| Recent shots | `RoundDoc.holes[].narrative` (or auto-gen) | — |
| Agate Watching | `RoundDoc.spectators[]` (Wave 4) or poll | Adds viewing member to `RoundDoc.spectators` on view-open |
| Agate vs. Last 5 | `RoundDoc[]` filtered by course, last 5 | — |
| Agate Streaks | Aggregator over `RoundDoc.holes[]` | — |

## 3b.1.7 Ratification block — § 3b.1

Accepted:
- Live state layout: masthead → scope → hero + strip + stats + tele + shots in main; course + watching + vs5 + streaks in agate.
- Score numeral animates with pulse on live; all other numerals replace instantly.
- Wave 3 = polling, Wave 4 = WebSocket push.

---

# § 3b.2 — Finished state

**When:** `RoundDoc.status === 'completed'`.

**What changes:**

- Masthead H1: `{FirstName}, <em>signed for {N}.</em>`
- Hero eyebrow: changes from `Viewing · Live` to `Round · Final` (no pulse).
- Hero score numeral: stops pulsing.
- Strip: all cells filled; no `.cur` cell.
- Stats: final values, no "in progress" labels.
- Recent shots: shows full back nine + final summary row.
- Agate Watching: changes label to `Watched · {N}` (past tense) with total time per spectator.
- Banner (top of page): `This round is in the books. Open the scorecard →` linking to the Scorecard view for this round.

**Auto-redirect rule:** After 5 minutes on the finished HUD view, auto-redirect to the Scorecard view. Founder may toggle this off — the user may want to linger on the HUD.

`[GAP]` Founder confirms: hard auto-redirect (5min) or sticky banner only?

## 3b.2.1 Ratification block — § 3b.2

Accepted: finished HUD preserves all live structure with values frozen + banner to scorecard. Auto-redirect is a `[GAP]`.

---

# § 3b.3 — Pre-round state

**When:** Round is registered (`RoundDoc.status === 'scheduled'` or `'starting'`) but no hole has posted.

**What changes:**

- Hero score: `—` instead of a numeral.
- Hero "thru" sub: `Tee time {time}` or `Starting soon`.
- Strip: all cells `.empty`.
- Stats: all cells show `—`.
- Telemetry: `0 / 0` and `0`.
- Recent shots: replaced with placeholder card — Fraunces italic 16px `--cb-ink-faint`: `The round hasn't started yet. Hold tight.`
- Masthead H1: `{FirstName}, <em>at the tee.</em>`
- Agate: same modules; Streaks shows `No streaks yet — just teed off.` placeholder.

## 3b.3.1 Ratification block — § 3b.3

Accepted: pre-round preserves the full HUD shell with em-dash placeholders. No "loading" state — em-dashes communicate "data not yet."

---

# § 3b.4 — Stale state

**When:** Round is `'in_progress'` but no per-hole write in >45 minutes.

**What changes:**

- A NOTICE strip (HQ Part 1 § 11.2) renders above the hero: `No update in {N} min — round may be paused.`
- Hero eyebrow swaps from `Viewing · Live` (brass pulse) to `Viewing · Paused?` (`--cb-mute-soft`, no pulse).
- Strip current-cell pulse stops.
- All else unchanged.
- Polling continues; first new write reverts everything to live.

## 3b.4.1 Ratification block — § 3b.4

Accepted: stale state is a visual softening, not a hard error. The round resumes seamlessly when a new write arrives.

---

# § 3b.5 — Token consumption summary

```
--cb-felt, --cb-felt-deep
--cb-chalk, --cb-chalk-deep, --cb-line
--cb-ink, --cb-ink-soft, --cb-ink-faint
--cb-mute, --cb-mute-soft, --cb-mute-faint
--cb-brass, --cb-brass-deep, --cb-brass-soft
--cb-claret (per-hole bogey only)
--cb-moss (per-hole birdie + under-par totals)

--type-mast-hud (hero score 96px)
--type-mast-hq (masthead H1)
--type-sec-hq (section H2)
--type-display-hq (hero name)
--type-body-hq (shot body)
--type-agate (agate bodies)
--type-eyebrow-hq, --type-label-hq, --type-num-hq, --type-ui-hq
```

---

**End of Part 2 · View 3b.**

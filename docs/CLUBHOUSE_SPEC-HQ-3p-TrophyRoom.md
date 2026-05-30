# CLUBHOUSE_SPEC-HQ — Part 2, View 3p: Trophy Room

> **Status:** Tier 3 deliverable. All [GAP] questions pre-answered by Founder ratification (TIER2-4_DESIGN_BOT_BRIEF.md).
> **Canonical mock:** Frame inherits chrome from `Parbaughs HQ Final v2.html`. Trophy emblem treatments consume `CHAMPIONS_MARK_SPEC.md` SVG library. Ace card composition draws from Spotlight Round v2 editorial pattern (`Parbaughs Spotlight Round v2.html`).
> **Ship:** W1.S9 — Trophy Room + Awards + Records + Aces.
> **Scope:** Single surface, 4 stacked sections, per-member + league-aggregate view toggle, locked-item silhouette pattern.

---

## 0 — View scope

Country-club hall-of-fame aesthetic. Trophy emblems large and spaced. Hairline rule between sections. Fraunces italic display typography for trophy names. Aces section uses editorial card pattern — aces are championship-class achievements, not list rows.

States covered:
- **3p.1** — Default per-member view ("My trophies")
- **3p.2** — League-aggregate view ("League trophies")
- **3p.3** — Single trophy detail (drill-in)
- **3p.4** — Single ace detail (drill-in)
- **3p.5** — Empty trophy room (new member, nothing earned yet)

---

# § 3p.1 — Default per-member state

## 3p.1.1 Frame composition

| Slot | Token / Spec | Notes |
|---|---|---|
| Top nav | `--nav-h` | Per Part 1 § 4 |
| Masthead | ~160px | See 3p.1.3 |
| Scope rail | `--scope-h` | View toggle + sort + section anchors |
| Single column body | flex centered (max 960px content width) | NO agate rail — Trophy Room is full-width display, breathing room over density |
| Footer | per Part 1 § 14 |

## 3p.1.2 Banner

If member earned a trophy or ace within last 24h: banner per Part 1 § 11.1 — `JUST EARNED` eyebrow brass + `<b>{TrophyName}</b> · {EarnedContext}` + `View →` CTA. Auto-dismisses after first view.

## 3p.1.3 Masthead

- **Eyebrow:** `THE TROPHY ROOM · {MemberName} or {LeagueName}` (changes per view toggle)
- **H1:** Fraunces 64px italic — `Your hardware.` (own profile) / `{MemberName}'s hardware.` (other profile) / `{LeagueName} hardware.` (league view)
- **Sub-deck:** Mono 11px mute-soft 1.5px tracking — `{N} trophies · {N} awards · {N} records · {N} aces`

## 3p.1.4 Scope rail

| Control | Spec |
|---|---|
| View toggle | Segmented: `My trophies` (default if viewing own) / `League trophies`. Brass underline 2px on active. Scope-aware: when viewer is in League scope, "League trophies" view scopes to that league only; in Community scope, scopes platform-wide. |
| Section anchors | `Trophies · Awards · Records · Aces` mono 11px 1.5px tracking smooth-scroll |
| Sort dropdown | Right-aligned: `Newest` (default) / `Trophy tier` — affects ordering within each section |

## 3p.1.5 Main column — stacked sections

### Section A — Trophies (anchor `#trophies`)

Championships + season titles + earned cups (the high-tier recognitions).

| Element | Spec |
|---|---|
| Section header | `Trophies · {N}` Fraunces 30px + meta right `{LastEarnedDate}` mono 10.5px mute-soft |
| Grid | 3-col grid at standard band, 2-col at compact; `--space-6` gap between cells |
| Trophy cell | See 3p.1.6 |

### 3p.1.6 Trophy cell spec

| Element | Spec |
|---|---|
| Container | 240×260, `--cb-chalk-deep` background, `--radius-md`, 1px `--cb-line` border, `--space-5` padding |
| Earned-pip | If earned within last 7 days and viewer hasn't seen detail yet: 8px brass dot top-right of cell (just-earned pattern) |
| Emblem | Top 50% of cell — large SVG render of trophy emblem from CHAMPIONS_MARK_SPEC.md (consumes via `<svg>` reference) |
| Trophy name | Fraunces italic 22px 600 ink, centered |
| Earned date | Mono 11px brass uppercase 1.5px tracking, centered — `EARNED APR 14, 2024` |
| Earned context | Mono 10.5px mute-soft uppercase — `THE PARBAUGHS · SEASON CHAMPION` |
| Earned by (league view only) | Mono 10.5px mute-soft — `Member name + avatar mini` |

Tap on trophy cell → 3p.3 trophy detail.

### Locked trophy variant (silhouette)

Per Option A lock from Pass 3d 3d-I2: viewer sees what's possible to earn.

| Element | Spec |
|---|---|
| Container | Same dimensions, `--cb-chalk` background (lighter), 1px dashed `--cb-line` border, `--space-5` padding |
| Emblem | Silhouette rendering: `--cb-mute-faint` fill, transparent details, 60% opacity |
| Trophy name | Fraunces italic 22px mute-soft (not ink — visually lighter) |
| Earned date | Replaced with `LOCKED` mono 11px brass-deep uppercase |
| Earned context | Replaced with criteria footnote — Fraunces italic 13px mute — `Earn by: 12 consecutive weeks with rounds posted.` |

Tap on locked trophy → still opens 3p.3 detail (read-only catalog detail).

### Section B — Awards (anchor `#awards`)

Non-trophy recognition — Hole-in-one, Eagle club, Birdie streak, Lowest round, etc. Lower visual density than trophies.

| Element | Spec |
|---|---|
| Section header | `Awards · {N}` Fraunces 30px |
| Grid | 4-col at standard band, 3-col at compact; `--space-5` gap |
| Award cell | 180×160, `--cb-chalk-deep` background, `--radius-md`, `--space-4` padding |
| Award emblem | Top 40% — smaller SVG (less elaborate than trophies) |
| Award name | Fraunces italic 17px 600 ink, centered |
| Earned date | Mono 10.5px mute-soft `EARNED APR 14` |

Same locked-silhouette variant per gating rule.

### Section C — Records (anchor `#records`)

4 sub-sections per locked Pass 3d 3d.3 spec:

1. **Course-specific** (gated by 3+ plays at that course)
2. **Format-specific** (gated by participation in that format)
3. **Member personal bests** (always visible — even for new members)
4. **Season records** (current season only)

| Element | Spec |
|---|---|
| Section header | `Records · {N}` Fraunces 30px |
| Sub-sections | Stacked, each with mono 11px brass eyebrow `COURSE-SPECIFIC` / `FORMAT-SPECIFIC` / etc. |
| Record row | Inline: record name (Fraunces italic 17px) + record value (Fraunces 600 24px tabular brass) + context footnote (mono 10.5px mute-soft) + earned-date (mono mute-soft right-aligned) |

Example record row:
- `Lowest round at Honors Course` · `74` · `EARNED APR 12, 2024 · −2 to par`

### Section D — Aces (anchor `#aces`)

Full editorial post format per locked W1.S9 Vision. Each ace renders as a featured editorial card — NOT a simple list row.

| Element | Spec |
|---|---|
| Section header | `Aces · {N}` Fraunces 30px |
| Each ace card | Full-width 720px, `--cb-chalk-deep` background, `--radius-lg`, brass-double-rule top + bottom, `--space-7` padding |
| Card eyebrow | `ACE · HOLE {N} · PAR {P}` mono 11px brass uppercase 1.8px tracking |
| Card hero numeral | The hole number Fraunces 600 96px tabular brass, centered |
| Course + date | Fraunces italic 24px ink — `Honors Course · April 14, 2024` |
| Member | Avatar 48×48 + member name (italic Fraunces 22px) + title badge (if earned) |
| Scorecard mini-view | Compressed scorecard table showing the ace hole + 2 holes before/after for context |
| Playing partners | Mono 11px brass uppercase — `WITNESSED BY: {Partner1Name}, {Partner2Name}` |
| Attestations | 2-3 partner attestation signatures below — `"{partner1Quote}" — {Partner1Name}` Fraunces italic 13px |
| Course attestation | Optional — Course representative confirmation if course participates: `Course confirmed by {ProName}` |
| Photo | If submitted: 480×320 photo of the ball-in-cup or member with course staff, `--radius-md`, 1px `--cb-line` border |
| Action row | `Share to feed →` brass + `Share to DM →` mute outline |

Aces are permanent. Member cannot delete. Founder admin tooling deletes only with audit log entry (dispute path).

## 3p.1.6.X Just-earned new-pip pattern

| Behavior |
|---|
| Trophy/Award earned since last view: 8px brass dot top-right of cell |
| Pip clears on first view of detail (3p.3 / 3p.4) |
| Persists across cold launch via `Preferences` last-seen-trophy-id |

## 3p.1.7 Cross-surface dependencies

| Reads | Writes |
|---|---|
| `trophies/{*}` filtered to member or league | `Preferences.last-seen-trophy-ids[]` on detail open |
| `awards/{*}` filtered to member or league | |
| `records/{*}` filtered to member or league | |
| `aces/{*}` filtered to member or league | |
| `members/{authorId}` for league-view earned-by attribution | |
| Reads `trophies-catalog/*` for locked-trophy silhouettes (full catalog of possible) | |

---

# § 3p.2 — League-aggregate view

Same frame. View toggle set to `League trophies`. Scope: current league (when League scope) or platform-wide (when Community scope).

### Differences from 3p.1

- Trophy cells additionally show `Earned by` member + avatar mini bottom of cell.
- Records show member name per record value.
- Aces section: Each ace card shows member who earned (instead of "your ace").
- Empty state: `No trophies earned in {LeagueName} yet.` editorial.

Cross-surface: same reads but filtered by `league-id` instead of `member-id`.

---

# § 3p.3 — Trophy detail (drill-in)

Triggered from tap on any trophy or award cell.

## 3p.3.1 Layout

Modal-overlay or routed view (URL `/m/<uuid>/trophy/<trophyId>`):

| Element | Spec |
|---|---|
| Top | Back arrow + `Trophy Room` text-link to return |
| Hero emblem | Large SVG render — 200×200 |
| Trophy name | Fraunces italic 48px ink — `Iron Schedule Champion` |
| Earned-by | Member name + avatar + title badge (if applicable) + earned date stamp `Earned April 14, 2024` |
| Earned context | Fraunces 17px ink — describes what triggered the trophy (e.g., `Posted at least one round in 12 consecutive weeks — March 1 through April 14, 2024.`) |
| Criteria summary | Mono 11px brass — `CRITERIA · 12+ consecutive weeks · 1+ round per week` |
| Champion title | If trophy generates a Champion title per W4.I2: `Title earned: "{TitleName}"` brass |
| Holders list (cross-member view) | If multiple members hold this trophy: list of all holders with earned-dates |
| Share action | `Share trophy to feed →` brass — opens Composer (§3l) with trophy-card embed |

## 3p.3.2 Locked trophy detail variant

If trophy is locked (member hasn't earned):
- Same layout structure
- Hero emblem renders silhouette per 3p.1.6 spec
- Criteria summary becomes prominent — `Earn this trophy:` brass eyebrow + criteria description
- No share action (can't share what you haven't earned)
- Sub: `Earned by {N} members across the platform.` mute (transparency on who has earned it)

---

# § 3p.4 — Ace detail (drill-in)

Triggered from tap on any ace card. URL `/m/<uuid>/ace/<aceId>` or modal.

Inherits 3p.1.6 Section D card composition at full screen with additional context:

- Round summary card linking to full Scorecard (3c) for the round containing the ace
- Comment thread (reuses Feed comment pattern from 3k Feed)
- Reaction (single heart per 3k.1.7)
- Share action: `Share ace to feed →`

Aces never delete-able by member. Founder admin tooling can delete only with audit log entry.

---

# § 3p.5 — Empty trophy room state

Member has 0 trophies, 0 awards, 0 records, 0 aces.

Each section renders empty editorial copy:

- **Trophies:** `No trophies yet. Plenty of season left.` Fraunces italic 18px mute. Below: locked-silhouette grid of available trophies to earn (still renders).
- **Awards:** `No awards yet. Keep playing.` + locked-silhouette grid.
- **Records:** `Records appear as you set them.` mute italic.
- **Aces:** `No aces yet. The hole-in-one stays out there.` italic mute.

Banner editorial nudge at top of main column: `Trophy emblems are platform-recognized. Awards are earned by performance. Aces are forever.` Fraunces italic 17px mute-soft.

---

# § 3p.6 — Accessibility

- View toggle: `role="tablist"`, each option `role="tab"`, `aria-selected`.
- Trophy cells: `role="link"`, `aria-label="Trophy: {trophyName}, earned {date}, by {memberName}"`.
- Locked trophy cells: `aria-label="Locked trophy: {trophyName}, earn by {criteria}"`.
- Ace cards: `role="article"`, `aria-label="Hole-in-one ace on hole {N} at {course} on {date}"`.
- Just-earned pip: `aria-label="New, unviewed"`.
- Section anchors: `<a href="#anchor">` real links, smooth-scroll honoring `prefers-reduced-motion`.
- SVG emblems: `role="img"` with `aria-label` describing the trophy.
- Detail drill-in: modal focus trap + ESC dismisses + focus restores to source trophy cell.

---

# § 3p.7 — Token consumption summary

- Surfaces: `--cb-chalk`, `--cb-chalk-deep`, `--cb-felt` (rare — modal scrim only)
- Text: full ink + mute family
- Accent: `--cb-brass`, `--cb-brass-deep`, `--cb-brass-soft`
- Status: `--cb-moss` (record value under-par), `--cb-claret` (rare — dispute path indicators)
- Lines: `--cb-line`
- Type: `--type-mast-hq` (64px), `--type-sec-hq`, `--type-display-hq` (48px in detail, 22-24px in cells), `--type-stat-large` (96px ace numeral), `--type-body-hq`, `--type-eyebrow-hq`, `--type-label-hq`, `--type-num-hq`

No new tokens.

---

# § 3p.8 — Ratification block

Accepted:
- Single Trophy Room surface with 4 stacked sections (Trophies, Awards, Records, Aces).
- View toggle: `My trophies` (default) / `League trophies`. Scope-aware per current League/Community scope.
- Default sort: chronological newest first; toggle `Newest` / `Trophy tier`.
- Locked-item silhouettes visible per Option A — reveals catalog to motivate earning.
- Just-earned new-pip pattern persists via `Preferences` last-seen-trophy-id.
- Aces section uses editorial card format (NOT list rows) — scorecard + attestations + optional photo.
- Aces never delete-able by member; Founder admin only with audit.
- Share trophy/ace to feed → opens Composer (§3l) with trophy-card embed.
- All [GAP] questions pre-answered.

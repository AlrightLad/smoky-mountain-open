# CLUBHOUSE_SPEC-HQ — Part 2, View 3q: Custom League Trophy Creator UI

> **Status:** Tier 4 deliverable. All [GAP] questions pre-answered by Founder ratification (TIER2-4_DESIGN_BOT_BRIEF.md).
> **Canonical mock:** No dedicated HTML mock — admin chrome from `Parbaughs HQ Final v2.html`. Form composition is net-new but follows the same sectioned-form pattern as 3h Settings + 3i Admin.
> **Ship:** W4.S3 — Custom league trophies (final Build Roadmap ship).
> **Scope:** Trophy criteria builder UI for Founder (platform-wide) + Commissioner (league-scoped) authoring.

---

## 0 — View scope

Editorial trophy creator — feels like authoring an award category, NOT a gamification system. Country-club tone — no language like "achievement unlocked." Form is clean sectioned with brass eyebrows per section. Preview pane lives to the right of form (desktop) or below form (compact band).

States covered:
- **3q.1** — Founder editor (platform-wide trophy scope)
- **3q.2** — Commissioner editor (league-scoped trophy scope)
- **3q.3** — Trophy catalog list view (existing trophies)
- **3q.4** — Champion title auto-generation preview
- **3q.5** — SVG emblem upload + validation

---

# § 3q.1 — Founder editor state

## 3q.1.1 Frame composition

| Slot | Token / Spec | Notes |
|---|---|---|
| Top nav | `--nav-h` | Per Part 1 § 4 (admin-specific — wordmark reads `Parbaughs · Admin` per 3i) |
| Masthead | ~100px (admin compact) | See 3q.1.3 |
| Two-column body | flex | Left = form (60%); right = live preview (40%) — flips to vertical stack at compact band |
| Footer | hidden | Admin surfaces suppress footer |

This is reached via Admin → Platform settings → Trophy catalog → `+ New trophy` brass CTA.

## 3q.1.2 Banner

None default. Live preview is the dominant accompaniment.

## 3q.1.3 Masthead

- **Eyebrow:** `FOUNDER · TROPHY CATALOG · NEW TROPHY` mono 11px brass
- **H1:** `Compose a trophy.` Fraunces 40px italic ink — utility surface, smaller than member-facing

## 3q.1.4 Form (left column, 60%)

Single sectioned form. Inline save per-section disabled in favor of single global `Save trophy →` CTA at form footer.

### Section A — Identity

| Field | Type | Required |
|---|---|---|
| Trophy name | Text 50 char | Y |
| Description | Textarea 280 char | Y — describes what the trophy recognizes |
| Difficulty tier | Radio: `Common` / `Rare` / `Championship` | Y — affects display priority |

### Section B — Criteria builder

Per locked W4.S3 — composable criteria UI.

#### B.1 — What's measured

Dropdown of locked stat fields. Wave 4 stats catalog from W4.S1 expands this list at retrospective.

Initial catalog (Founder picks final list — these are starter):
- Handicap
- Rounds posted
- Total Parcoin earned
- Wagers won
- Birdies (count)
- Eagles (count)
- Aces (count)
- Pars (count)
- Bogeys (count)
- Total putts
- FIR % (fairways in regulation)
- GIR % (greens in regulation)
- Lowest round
- Best to-par score
- Consecutive weeks with ≥1 round
- Courses played (distinct count)
- Members played with (distinct count)
- Round-to-round score variance

#### B.2 — How it's measured

Dropdown:
- `Sum` (total accumulation)
- `Average` (per round or per period)
- `Count` (discrete event count)
- `Min` (lowest value)
- `Max` (highest value)
- `Streak` (consecutive event count)

#### B.3 — What's the threshold

| Element | Spec |
|---|---|
| Comparison operator | Dropdown: `≥` / `≤` / `=` / `>` / `<` |
| Threshold value | Number input + unit auto-attached based on field |

Example: `≥ 12` (consecutive weeks)

#### B.4 — When it counts (time scope)

Dropdown:
- `All-time` (since member joined platform)
- `Season` (current league season — uses League settings season window)
- `Month` (rolling 30 days)
- `Single tournament` (linked to specific Event from Calendar)
- `Custom date range` (start + end date pickers)

### Section C — Emblem

| Field | Type |
|---|---|
| Emblem source | Radio: `Library` / `Upload custom` |
| Library emblem | If `Library`: dropdown of platform-provided SVG library (20+ starter emblems — see 3q.5 for library list) |
| Custom emblem upload | If `Upload custom`: drag-and-drop zone + file picker; validation per 3q.5.2 |
| Emblem name | Optional override of file name |

### Section D — Champion title

Auto-generated per W4.I2. Display section shows live preview:

| Element | Spec |
|---|---|
| Title text | Auto: `{TrophyName} Champion` (editable; defaults from Trophy name field) |
| Title scope | Auto-determined: `Platform-wide` (Founder editor) or `{LeagueName}-scoped` (Commissioner editor) |
| Title visibility preview | Inline rendering of how the title appears in Chip cards and member profile |

### Form footer

| Element | Spec |
|---|---|
| Cancel | Text-link mute-soft left |
| Save trophy | Brass pill right — disabled until all required fields valid |

## 3q.1.5 Live preview pane (right column, 40%)

Real-time render of trophy as members will see it across surfaces.

| Surface preview | Spec |
|---|---|
| Trophy cell | Full 240×260 trophy cell from 3p.1.6 |
| Member profile | Mini Profile preview with this trophy among Championships section |
| Feed auto-post | Mock Feed card (3k auto-post variant) — `Member earned "{TrophyName}" — {CriteriaSummary}` |
| Pull-quote rendering | Trophy name in italic Fraunces if used as Pull-quote text |

Preview updates live as form fields change (debounced 300ms to avoid jitter during typing).

## 3q.1.6 Cross-surface dependencies

| Reads | Writes |
|---|---|
| `stats-catalog/*` for "What's measured" dropdown options | `trophies-catalog/{trophyId}` on save (platform-wide scope) |
| `svg-library/*` for emblem dropdown | `trophies-catalog/{trophyId}/audit-log` on save (audit trail) |
| `leagues/*` for cross-league trophy assignment (rare — most trophies are league-scoped) | `champion-titles/{trophyId}` on save (W4.I2 title generation) |

---

# § 3q.2 — Commissioner editor state

Same frame and form as 3q.1. Differences:

| Field | Founder editor | Commissioner editor |
|---|---|---|
| Masthead eyebrow | `FOUNDER · TROPHY CATALOG` | `COMMISSIONER · {LeagueName} TROPHIES` |
| Trophy scope | Platform-wide (visible to all leagues) | League-scoped (visible only to this league's members) |
| Champion title scope | Platform-wide | League-scoped (`{LeagueName}-scoped`) |
| Emblem upload | Founder content moderation queue review on submit | Same — Founder reviews custom SVGs from any league for cross-platform-aesthetic enforcement |

Commissioner reaches their editor via Admin → League settings → Custom trophies → `+ New trophy`.

---

# § 3q.3 — Trophy catalog list view

Reached at Admin → Trophy catalog (Founder) OR Admin → League settings → Custom trophies (Commissioner).

| Element | Spec |
|---|---|
| Header | `Trophy catalog · {N} trophies` Fraunces 30px + `+ New trophy` brass CTA right |
| Filter rail | Filter chips: `All`, `Platform-wide`, `{LeagueName}-scoped` (visible to Founder, hidden for Commissioner who only sees their own league), `Active`, `Archived` |
| Table | Per-row: emblem mini (32×32) + trophy name + criteria summary + scope pill + earned-count + actions |
| Row actions | `Edit →`, `Archive` (claret text-link), `View earned-by →` |

Each trophy row click → loads that trophy into the editor at 3q.1 or 3q.2 for modification.

## 3q.3.1 5 starter platform-wide trophies (Founder seeds at W4.S3 ship)

Per locked brief — Founder authors these during ship execution to seed the catalog:

| Trophy | Criteria | Champion title |
|---|---|---|
| **Iron Schedule** | Most consecutive weeks with ≥1 round posted | "Iron Schedule Champion" |
| **Comeback Kid** | Biggest single-month handicap improvement | "Comeback Kid Champion" |
| **Wager Warrior** | Most Parcoins won from wagers (season) | "Wager Warrior Champion" |
| **Course Conqueror** | Most courses played in a season | "Course Conqueror Champion" |
| **Steady Eddie** | Lowest round-to-round score variance (season) | "Steady Eddie Champion" |

These are seeded into the platform; every league sees them in their Trophy Watch. Commissioners then create league-scoped trophies on top.

---

# § 3q.4 — Champion title auto-generation preview

Inline section of editor form. Shows live preview of:

- Title text (e.g. `"Iron Schedule Champion"`)
- Title scope rendering (platform-wide → no league prefix; league-scoped → `The Parbaughs · {TitleName}`)
- Title surface examples:
  - On member profile masthead (title badge above name)
  - In Chip card header (title chip inline)
  - In Members directory row (title badge inline-right of name)

Editable: title text field defaults to `{TrophyName} Champion` but Founder/Commissioner can override (e.g., custom title `"Iron Will"` instead of default).

---

# § 3q.5 — SVG emblem upload + validation

Triggered when "Upload custom" emblem source selected.

## 3q.5.1 Drag-and-drop zone

| Element | Spec |
|---|---|
| Container | 240×240, dashed 2px `--cb-line` border, `--cb-chalk-deep` background, `--radius-md` |
| Empty state | Centered: SVG icon + `Drop SVG here or click to upload` Fraunces italic 15.5px mute |
| Drag-over state | Border `--cb-brass`, background tint brass-soft (5% opacity) |
| Upload state | Inline progress + filename |

## 3q.5.2 Validation rules

| Check | Behavior |
|---|---|
| File type | Must be SVG; other formats rejected with explicit error |
| Max file size | 50KB |
| Color palette | Restricted: `--cb-brass`, `--cb-brass-deep`, `--cb-ink`, `--cb-chalk`, `--cb-chalk-deep`, transparent. Other colors flagged. |
| Embedded content | No `<script>`, `<style>`, external `xlink:href` references — security check |
| Dimensions | Recommend 240×240 viewBox; auto-rescaled if different |

## 3q.5.3 Validator behavior

On upload:
1. File-type + size check (instant)
2. Server-side palette analysis (~200ms) — extracts all colors used in SVG; reports any non-allowed
3. Embedded-content scan (~100ms)
4. Pre-validation preview renders if all checks pass
5. Founder content moderation review for cross-platform-aesthetic enforcement (queue write on save)

Validation failure: form blocks save; error inline below upload zone in claret with helpful message.

## 3q.5.4 Library SVGs (alternative source)

Platform-provided SVG emblem library (Founder authors 20+ starters at ship execution):
- Golf flag
- Trophy cup
- Laurel wreath
- Crossed clubs
- Tee marker
- Birdie wing
- Eagle silhouette
- Bunker rake
- Etc. (Founder selects final 20+ at ship)

Dropdown shows library SVGs with mini preview; selection auto-fills emblem source.

---

# § 3q.6 — Cost discipline (locked behavior)

Per locked brief: trophy criteria evaluation pattern decided via decision-bubble at W4.S3 implementation.

Two patterns:

- **Real-time evaluation**: trophy criteria checked on every round finalize. Cheap for simple criteria (`SUM rounds ≥ 12`), expensive for complex (`COUNT distinct courses where score < handicap + 5`).
- **Scheduled batch evaluation**: Cloud Function runs daily at midnight scanning eligible members against complex criteria.

Founder ratifies pattern at retrospective per locked governance.

The Trophy Creator UI does NOT surface this distinction to authors — implementation detail. Authors compose criteria without thinking about cost.

`[REJECTED]` Complexity indicator below criteria builder NOT surfaced to authors. Rationale: authors compose criteria based on **meaning**, not cost. Cost-discipline lives at the orchestration layer per governance; Performance Agent monitors at 10x scale and surfaces concerns there. Surfacing implementation cost to authors would warp authoring decisions toward technical convenience instead of league semantics.ation detail.

---

# § 3q.7 — Accessibility

- Form fields: native `<input>`, `<textarea>`, `<select>`, native `<fieldset>` for radio groups.
- Section headers: `<h2>` with `aria-labelledby` for screen-reader section navigation.
- Live preview: `<aside aria-label="Trophy preview">`, updates announced via `aria-live="polite"` (debounced).
- Criteria builder: each step `<fieldset>` with `<legend>` describing what's being configured.
- Save button: `aria-disabled` reflects state; disabled reason announces ("Fill in all required fields to save").
- Upload zone: `role="button"` with `aria-label="Upload SVG emblem; drag and drop or click to select"`.
- Validation errors: `role="alert"` for immediate announce.

---

# § 3q.8 — Token consumption summary

- Surfaces: `--cb-chalk`, `--cb-chalk-deep`, `--cb-felt` (admin chrome only)
- Text: full ink + mute family
- Accent: `--cb-brass`, `--cb-brass-deep`, `--cb-brass-soft` (drag-over state)
- Status: `--cb-claret` (validation errors), `--cb-moss` (validation success indicators)
- Lines: `--cb-line`
- Type: `--type-mast-hq` (40px H1 override — admin compact), `--type-sec-hq`, `--type-body-hq`, `--type-eyebrow-hq`, `--type-label-hq`, `--type-num-hq`, `--type-ui-hq`

No new tokens.

---

# § 3q.9 — Ratification block

Accepted:
- Two-column form + live preview layout (60/40 desktop, vertical stack compact).
- Composable criteria builder: What's measured / How / Threshold / When.
- Founder vs Commissioner editor differences (scope only; same form fields).
- SVG emblem upload with restricted palette + 50KB max + script/style/external-ref security checks.
- Library SVGs (20+ starters at ship) alternative source.
- 5 starter platform-wide trophies seeded at W4.S3 ship time (Iron Schedule, Comeback Kid, Wager Warrior, Course Conqueror, Steady Eddie).
- Champion title auto-generates per W4.I2 with override capability.
- Cost discipline pattern (real-time vs batch) decided via decision-bubble at ship implementation.
- All [GAP] questions pre-answered.

`[REJECTED]` "Complexity: Simple / Complex" indicator below criteria builder NOT shipped. Locked per Founder ratification — authors compose based on meaning, not cost; cost-discipline at orchestration layer; Performance Agent monitors at 10x scale.

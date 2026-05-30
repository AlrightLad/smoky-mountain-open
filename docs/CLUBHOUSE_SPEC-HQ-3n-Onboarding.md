# CLUBHOUSE_SPEC-HQ — Part 2, View 3n: Onboarding (HQ Desktop)

> **Status:** Tier 2 deliverable. All [GAP] questions pre-answered by Founder ratification 2026-05-12.
> **Canonical mock:** Frame draws from existing `Parbaughs Onboarding Desktop.html` Draft (split-screen editorial pattern). Step content updated per W1.S14 lock + W4.I1 username schema.
> **Ship:** W1.S14 — Admin + Onboarding bundle.
> **Scope:** 6-step desktop onboarding flow + founding-20 lightweight re-onboarding modal. Mobile onboarding covered separately in CLUBHOUSE_SPEC-3e-More.md.

---

## 0 — View scope

Editorial country-club arrival aesthetic — Fraunces typography dominant, plenty of whitespace, brass progress indicator. Onboarding is dedicated full-screen takeover (NOT modal annotation on live app). Lone Wolf path equal fidelity to league-joining per locked W1.S14 Vision.

States covered:
- **3n.1** — Step 1: Welcome + email
- **3n.2** — Step 2: Identity (username, display name, avatar)
- **3n.3** — Step 3: Path choice (3 equal cards)
- **3n.4** — Step 4: Path-specific (Lone Wolf skip / Join league / Create league)
- **3n.5** — Step 5: Friend suggestions
- **3n.6** — Step 6: Welcome confirmation + next-action cards
- **3n.7** — Founding-20 "What's new" lightweight re-onboarding

---

# § 3n — Shared frame

All 6 step screens share the same shell. Step-specific content fills the right panel.

## 3n.SHELL.1 Frame composition

Split-screen layout:

| Slot | Width | Background | Content |
|---|---|---|---|
| Left panel | 40% (min 480px at standard band; 480px fixed at compact band) | `--cb-felt` | Editorial artwork + step context |
| Right panel | 60% | `--cb-chalk` | Step form + actions |

Top of viewport: progress indicator strip (full-width across both panels). Bottom of viewport: footer with sign-in link.

## 3n.SHELL.2 Progress indicator strip

| Element | Spec |
|---|---|
| Container | Full-width, 4px tall, top of viewport, sticky |
| Background | `--cb-chalk-deep` |
| Filled portion | `--cb-brass` width = `(currentStep / totalSteps) * 100%` |
| Step counter overlay | Mono 11px 1.5px tracking `--cb-mute-soft` left-aligned below strip — `Step {N} of 6` |

## 3n.SHELL.3 Left panel (editorial)

Same chrome on every step — only the artwork rotates per step.

| Element | Spec |
|---|---|
| Logo/wordmark | Top-left, `--space-7` inset, Fraunces 24px italic ink-on-felt — `Parbaughs.` |
| Artwork | Centered SVG illustration per step (Founder selects from platform art library at ship execution) |
| Editorial quote | Bottom-left, `--space-7` inset. Fraunces italic 20px on `--cb-chalk` text. Step-specific copy. |

Step-specific artwork themes:
- Step 1: Open clubhouse door
- Step 2: Engraved nameplate
- Step 3: Three open paths
- Step 4 (Lone Wolf): Solo silhouette / (Join): Group photo / (Create): Founding ceremony
- Step 5: Handshake on green
- Step 6: Tee box at dawn

## 3n.SHELL.4 Right panel (form)

| Element | Spec |
|---|---|
| Container | `--space-9` top + side padding (generous) |
| Step eyebrow | Mono 11px 1.5px tracking brass — `WELCOME` / `YOUR IDENTITY` / `CHOOSE YOUR PATH` / etc. |
| Step H1 | Fraunces 56px italic ink — step-specific |
| Step body | Fraunces 17px ink — step-specific |
| Step inputs | Inputs per step |
| Step action row | `Continue →` brass pill right + `← Back` text-link left (hidden on Step 1) |

## 3n.SHELL.5 Footer (across both panels)

| Element | Spec |
|---|---|
| Container | Full-width, `--space-5` padding, top border 1px `--cb-line` (on chalk panel only — felt panel has no border-top here) |
| Sign-in link | Center: `Already a member? Sign in →` Fraunces italic 15.5px mute-soft + brass text-link |
| Skip link | Right: `Skip — finish later →` mute-soft text-link (visible Step 2+, hidden Step 1 + Step 6) |

Skip behavior: saves progress + lands on Home (3a) with onboarding-incomplete banner that opens onboarding to last incomplete step on tap.

---

# § 3n.1 — Step 1: Welcome + email

## 3n.1.1 Right panel content

| Element | Content |
|---|---|
| Eyebrow | `WELCOME` |
| H1 | `Welcome to Parbaughs.` |
| Body | `The platform for golf leagues that take the game seriously. Let's get you signed up.` |
| Email input | Text input, 56px tall, `--cb-chalk-deep` background, `--radius-md`, Fraunces 17px placeholder `email@address.com` |
| Helper text | Mono 11px mute-soft — `We'll use this to send you tee-time notifications, championship awards, and absolutely no marketing email.` |
| Sign-in providers | 3 buttons below email: `Continue with Apple` / `Continue with Google` / `Continue with email →` — brass borders, equal width |
| Continue CTA | Disabled until email entered AND validated; brass pill |

## 3n.1.2 Email validation

| Check | Behavior |
|---|---|
| Format | Real-time regex; helper text turns claret on invalid |
| Uniqueness | Server-side check on Continue click (debounced 500ms during typing); collision: helper text `That email already has an account. Sign in instead →` brass |

## 3n.1.3 Left panel editorial quote

> "A small platform with a large invitation."

---

# § 3n.2 — Step 2: Identity

## 3n.2.1 Right panel content

| Element | Content |
|---|---|
| Eyebrow | `YOUR IDENTITY` |
| H1 | `Pick your name.` |
| Body | `Your username sticks. Display name and avatar can change anytime.` |
| Username input | Text input, 56px, with helper text below |
| Discriminator | Auto-generated 4-digit per W4.I1 schema (e.g. `#0001`) displayed inline with username during availability check |
| Display name input | Text input, 56px — `What members see (e.g. "Mr Parbaugh")` |
| Avatar upload | Drag-and-drop zone + `Upload photo →` brass button; `Skip for now` text-link mute-soft |

## 3n.2.2 Username validation

Per W4.I1 schema lock:

| Check | Behavior |
|---|---|
| Format | 3-20 chars, alphanumeric + underscore only |
| Uniqueness | Real-time server check (debounced 500ms); collision: auto-suggest discriminator — `Available as @zach#4521 ✓` brass |
| Reserved words | Block list: `admin`, `parbaughs`, `commissioner`, system terms — helper text claret on collision |
| Length feedback | Mono 11px counter right-aligned — `12/20 chars` |

## 3n.2.3 Avatar handling

- Acceptable formats: JPG, PNG, WebP
- Max file size: 2MB pre-compression
- Client-side compression to 500KB per W1.I1 reusable pipeline
- Preview shows 88×88 circle below upload zone
- Skip path: avatar auto-generates from username's first character on `--cb-felt` background with brass ring per Members directory pattern (3e)

## 3n.2.4 Left panel editorial quote

> "The clubhouse engraves your nameplate once."

---

# § 3n.3 — Step 3: Path choice

## 3n.3.1 Right panel content

| Element | Content |
|---|---|
| Eyebrow | `CHOOSE YOUR PATH` |
| H1 | `Where do you start?` |
| Body | `Three equal paths. None better than the others.` |

Three equal-weight cards stacked vertically (NOT side-by-side — too horizontally cramped at this panel width):

### Card 1: Lone Wolf
- Brass border
- Eyebrow: `LONE WOLF`
- H3 (Fraunces italic 24px): `I'll start solo.`
- Body: `Use the platform as an individual. Post Chips, log rounds, track your handicap. Browse leagues later — or stay solo forever.`
- CTA: `Continue solo →` brass

### Card 2: Join a league
- Brass border
- Eyebrow: `JOIN A LEAGUE`
- H3: `I have a league or want to find one.`
- Body: `Enter a league code if you have one, or browse public leagues to find one that fits.`
- CTA: `Continue to leagues →` brass

### Card 3: Create a league
- Brass border
- Eyebrow: `CREATE A LEAGUE`
- H3: `I want to start a league.`
- Body: `You're the Commissioner. Set the rules, invite the members, schedule the season.`
- CTA: `Continue to create →` brass

Per locked W1.S14: "lone wolf path equal fidelity to league-joining."

## 3n.3.2 Left panel editorial quote

> "Three paths through the same gate."

---

# § 3n.4 — Step 4: Path-specific

Content varies based on Step 3 choice. Each path is a single sub-step (not branching further) before Step 5.

## 3n.4.A — Lone Wolf path

**Skips Step 4 entirely.** Step counter shows `Step 4 of 6 · Skipped (Lone Wolf path)`. Auto-advances to Step 5 with brief confirmation animation (Fraunces fade-in `Skipping ahead — solo route is light on setup.` mute italic 15.5px).

## 3n.4.B — Join a league path

| Element | Content |
|---|---|
| Eyebrow | `JOIN A LEAGUE` |
| H1 | `Find your league.` |

### Sub-tab segmented

| Tab | Content |
|---|---|
| `I have a code` (default if Step 3 path = Join) | Text input for league code + `Verify →` brass button. On verify success: shows league preview card (name, member count, recent activity) + `Join →` brass confirm. |
| `Browse public leagues` | Paginated public league directory; per-league row: name, member count, location, founding year, `Join →` action |

## 3n.4.C — Create a league path

| Element | Content |
|---|---|
| Eyebrow | `CREATE A LEAGUE` |
| H1 | `Start a league.` |
| Required | League name (3-50 chars, unique check on blur) |
| Optional | League description (500 char), home course (autocomplete from `courses/*`), founding date (defaults to today) |
| Helper text | Mono 11px mute-soft — `All other settings (privacy, schedule, awards) configurable later in Admin.` |
| CTA | `Create league →` brass — disabled until name valid + unique |

On success: league created with Commissioner role assigned to viewer; success haptic + 800ms editorial transition `Welcome, Commissioner.` Fraunces italic 32px on chalk → advances to Step 5.

## 3n.4 Left panel editorial quote (path-aware)

- Lone Wolf: `"Some play the round alone. The platform respects that."`
- Join: `"Every league started with someone walking through the door."`
- Create: `"The Commissioner sets the tone."`

---

# § 3n.5 — Step 5: Friend suggestions

## 3n.5.1 Right panel content

| Element | Content |
|---|---|
| Eyebrow | `BUILD YOUR CIRCLE` |
| H1 | `Add a few friends.` |
| Body | Path-aware — `These members are active in {LeagueName}` (joined/created league) OR `These members are popular on the platform` (Lone Wolf) |

### Suggestion list

5 members suggested:

| Suggestion source | Scope |
|---|---|
| Lone Wolf | Platform-popular members + members who posted public Chips recently |
| Joined league | Founding-20 of that league + recently-active members |
| Created league | Members the creator interacted with elsewhere (DMs in other leagues, public profile views); fallback to platform-popular if none |

Per-row: avatar 40×40 + username + discriminator + handicap + championship badges + `Add friend +` brass CTA.

## 3n.5.2 Skip path

Member can skip entire step OR add 1+ before continuing. `Skip — I'll find friends later →` mute-soft text-link.

## 3n.5.3 Left panel editorial quote

> "A league is its members."

---

# § 3n.6 — Step 6: Welcome confirmation

## 3n.6.1 Right panel content

| Element | Content |
|---|---|
| Eyebrow | `YOU'RE IN` |
| H1 | Path-aware: `Welcome to {LeagueName}.` (joined/created) OR `Welcome to Parbaughs.` (Lone Wolf) |
| Body | `Here's where to start.` |

### Three next-action cards

Equal visual weight, stacked vertically:

| Card | Routes to | Path variations |
|---|---|---|
| **Log your first round** | W1.S4 Round capture | Same for all paths. Note for Lone Wolf: "Your handicap starts updating after rounds 5+" mono 11px mute-soft footnote. |
| **Post your first Chip** | Chip composer (§3l) | Default scope: League (joined/created) or Community (Lone Wolf) |
| **Browse {Feed/leagues}** | Joined/created: Feed. Lone Wolf: Public leagues directory. | Path-aware label |

### Dismiss link

`Skip — I'll explore on my own →` mute-soft text-link routes to Home (3a).

## 3n.6.2 Left panel editorial quote

> "Welcome. The course is open."

---

# § 3n.7 — Founding-20 "What's new" re-onboarding

For existing founding-20 members on first launch post-W1.S14 ship. NOT a full re-onboarding.

## 3n.7.1 Modal frame

Banner-style overlay (not full takeover). Renders on first Home (3a) load post-W1.S14.

| Element | Content |
|---|---|
| Eyebrow | `WHAT'S NEW` mono 11px brass |
| H2 | `A few things changed.` Fraunces 30px italic |
| Body | List of 3-5 new surfaces shipped (Founder picks final list at ship execution — examples: friend system, Parcoin shop, custom trophies, championship badges) |
| Primary CTA | `Want a tour? →` brass pill |
| Secondary | `No thanks` text-link mute-soft (dismisses banner) |

## 3n.7.2 Tour path

Tap `Want a tour? →` opens a 3-step modal walkthrough highlighting new surfaces:

| Step | Surface |
|---|---|
| 1 | Friend system (highlights Members directory + friend-status CTA) |
| 2 | Parcoin Shop (highlights balance + cosmetics) |
| 3 | Championship badges (highlights member profile + Trophy Room) |

Each step: small modal overlay pointing to relevant UI element with brass arrow + brief copy. `Next →` advances; `Skip tour →` dismisses.

## 3n.7.3 Founding-20 preservation

| Existing data | Preserved? |
|---|---|
| Username + discriminator | Yes (assigned during W4.I1 ship; persists across W1.S14) |
| Friend relationships | Yes (auto-friended founding-20 relationships per memory) |
| League memberships | Yes |
| Posted rounds | Yes |
| Parcoin balance | Yes (carries over from any pre-Wave-1 state) |

---

# § 3n.8 — Accessibility

- Split-screen layout: left panel `role="complementary"`, right panel `role="main"`.
- Progress indicator: `<div role="progressbar" aria-valuenow={N} aria-valuemin="1" aria-valuemax="6">`.
- Step eyebrow + H1: paired via `aria-labelledby` for screen reader context.
- Path choice cards: `role="button"` with full `aria-describedby` synthesizing card body + CTA.
- Username validation: `aria-live="polite"` announces availability state changes.
- Email validation: same `aria-live` pattern.
- Skip link: `aria-label="Skip onboarding and finish later"`.
- Founding-20 modal: focus trap, ESC dismisses, focus returns to Home.

---

# § 3n.9 — Token consumption summary

- Surfaces: `--cb-chalk`, `--cb-chalk-deep`, `--cb-felt` (left panel background)
- Text: full ink + mute family + `--cb-chalk` (text on felt)
- Accent: `--cb-brass`, `--cb-brass-deep`
- Status: `--cb-claret` (validation errors)
- Lines: `--cb-line`
- Type: `--type-mast-hq` (56px H1 override), `--type-display-hq`, `--type-body-hq`, `--type-eyebrow-hq`, `--type-label-hq`

No new tokens.

---

# § 3n.10 — Ratification block

Accepted:
- 6-step desktop onboarding with split-screen editorial layout (40% felt left / 60% chalk right).
- Lone Wolf path equal fidelity — skips Step 4, otherwise full flow.
- 3 equal-weight cards at Step 3 (no UX nudge toward any one path).
- Username generation per W4.I1 schema with auto-discriminator suggestion on collision.
- Handicap NOT asked during signup — auto-calculates from first 5 rounds logged.
- Founding-20 get lightweight "What's new" modal, NOT full re-onboarding.
- Mobile onboarding parity via responsive design at HQ; native mobile onboarding extends in M2/M6 of Wave 3.
- All [GAP] questions pre-answered in TIER2-4_DESIGN_BOT_BRIEF.md.

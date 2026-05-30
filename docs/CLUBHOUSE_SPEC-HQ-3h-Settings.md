# CLUBHOUSE_SPEC-HQ — Part 2, View 3h: Settings

> **Status:** Subordinate to `docs/CLUBHOUSE_SPEC-HQ.md` (Part 1). Tier 1 fill-in-the-gaps deliverable. Awaiting Founder ratification.
> **Canonical mock:** No dedicated HTML mock — settings frame inherits from `Parbaughs HQ Final v2.html`. Sectioned form pattern is net-new but follows the country-club editorial tone.
> **Ship:** W1.S14 — Settings + onboarding bundle.
> **Scope:** One view, sectioned form, all states. Host for all locked opt-outs from prior wave passes.

---

## 0 — View scope

Settings is the member's preferences hub. Every locked default from previous passes (Sunlight Auto, auto-advance Smart, read receipts On, season lows On, 13 push categories at locked defaults, quiet hours 9PM–8AM) is editable here. Account-level fields (profile edits, username change, sign out) live here too. Member-only — Admin lives elsewhere (see 3i).

States covered:
- **3h.1** — Default (signed-in member, populated settings)
- **3h.2** — Section drill-down (single section expanded)
- **3h.3** — Username change (subject to 7-day cooldown per W4.I4)
- **3h.4** — Sign-out confirmation
- **3h.5** — Account deletion (per Pass 3e 3e-I3 7-day grace)

---

# § 3h.1 — Default state

## 3h.1.1 Frame composition

| Slot | Token / Spec | Notes |
|---|---|---|
| Top nav | `--nav-h` | Per Part 1 § 4 |
| Masthead | ~120px (small editorial — settings is utility, not publication) | See 3h.1.3 |
| Two-column body | flex | Left = section nav (sticky); right = section detail |
| Footer | per Part 1 § 14 |

No tab switcher. The view IS settings.

## 3h.1.2 Banner

If account deletion countdown is active (3h.5): persistent banner — `Your account is scheduled for deletion in {N} days. Cancel deletion →` claret eyebrow + pulse, text + brass CTA.

## 3h.1.3 Masthead (small)

- **Eyebrow:** `{LeagueName} · MEMBER SINCE {JoinYear}`
- **H1:** `Settings.` (Fraunces 56px italic — utility surface)
- Sub-deck and date line: omit.

## 3h.1.4 Section nav (left column, sticky)

Vertical list of section labels, sticky on scroll. Active section = brass left-border 3px + ink text. Inactive = mute-soft text.

| Section | Anchor |
|---|---|
| Account | `#account` |
| Profile | `#profile` |
| Notifications | `#notifications` |
| Display | `#display` |
| Privacy | `#privacy` |
| Connections | `#connections` |
| About | `#about` |

Mono 11px 1.5px tracking uppercase. Hover: ink text, no border change. Click: smooth-scroll right column to anchor.

## 3h.1.5 Main column — section detail

Right column is a long single-page form, sections stacked vertically. Each section:

| Element | Spec |
|---|---|
| Section header | Fraunces 30px (`--type-sec-hq`) + 1px `--cb-ink` bottom border + meta right (e.g. `Last changed 3 weeks ago`) |
| Section body | Stacked form rows |
| Section save | Inline per-field save (auto-save on blur for text fields, on toggle for switches) — no global "Save settings" button |

### Section: Account

| Field | Type | Default | Notes |
|---|---|---|---|
| Email | Read-only display + `Change →` link | (member's email) | Change opens flow with verification |
| Password | `Change password →` link | — | Opens flow |
| Username | Text + discriminator | `username#XXXX` (W4.I1 schema) | 7-day cooldown per W4.I4 — see 3h.3 |
| Sign-in providers | List of connected (Google, Apple, etc.) + `Add →` | — | OAuth flow |
| **Sign out** | Button, claret outline | — | Opens 3h.4 |
| **Delete account** | Text-link mute-faint at very bottom | — | Opens 3h.5 |

### Section: Profile

| Field | Type | Default | Notes |
|---|---|---|---|
| Display name | Text, 60 char | (current) | Editable anytime |
| Bio | Textarea, 280 char | Empty | Fraunces italic preview below field |
| Avatar | Upload + preview | Founder-provided initial or generated | Image upload from W1.I1 pipeline |
| Home course | Autocomplete dropdown | Empty | Sources `courses/*` |
| Tee preference | Per-course preferred tee box | — | Multi-row table |

### Section: Notifications

13 push categories at locked defaults per prior pass ratification. Layout:

| Subsection | Defaults |
|---|---|
| Friend activity | On: friend posts a round, friend goes live. Off: friend logs in (noise). |
| League activity | On: league announcement, schedule change, season transition. Off: any individual round (covered in friend activity). |
| Direct messages | On: new DM, mention in league chat. |
| Score events | On: friend posts personal best, friend posts a 2 (eagle/ace). |
| Reminders | On: tee time 1h before. Configurable lead time (15min / 1h / 1d). |
| Quiet hours | On: 9PM–8AM editable. Quiet hours override all categories (no notifications). |

Each row: toggle switch (`--cb-brass` on, `--cb-mute-faint` off). Per-row meta below: `Last triggered: {time}` or `Never triggered`.

### Section: Display

| Field | Type | Default | Notes |
|---|---|---|---|
| Sunlight mode | Radio: `Auto` / `On` / `Off` | `Auto` (locked) | Auto detects ambient via device |
| Auto-advance scoring | Radio: `Smart` / `Always` / `Never` | `Smart` (locked) | Auto-advances when hole has score |
| Reduced motion | Toggle | `Respects system` | Honors `prefers-reduced-motion` |
| Theme | Radio: `Light` (chalk) / `Auto` | `Auto` | Future dark mode placeholder |

### Section: Privacy

| Field | Type | Default | Notes |
|---|---|---|---|
| Read receipts | Toggle | `On` (locked) | DM read receipts |
| Season lows visibility | Toggle | `On` (locked) | Whether your low rounds show in `Records` to other members |
| Activity visibility | Radio: `League only` / `Friends + league` / `Public` | `League only` | Who sees your posted rounds |
| Profile visibility | Radio: `League` / `Public` | `Public` | Per locked monetization model |
| Blocked members | List + `Unblock →` per row | (empty) | Manage blocks |

### Section: Connections

| Field | Type | Notes |
|---|---|---|
| Connected leagues | List | One row per league member belongs to. Per-row: `Leave league →` claret link. |
| Pending invites | List | Per-row: `Accept →` brass · `Decline →` mute link. |
| Friend requests | List + counts | `{N} sent · {N} received`, expandable subpanels. |

### Section: About

| Field | Type | Notes |
|---|---|---|
| App version | Read-only | `v8.22.0` |
| Build phase | Read-only | `Production · Wave 1` |
| Release notes | Link | Opens Caddy Notes for current version |
| Support | `Contact support →` | Email handoff or in-app composer |
| Legal | Links to Terms + Privacy | Static pages |

## 3h.1.6 Cross-surface dependencies

| Reads | Writes |
|---|---|
| `members/{viewerId}` (all settings fields) | `members/{viewerId}.preferences.*` on toggle |
| `members/{viewerId}.notification-prefs[]` | `members/{viewerId}/audit-log` on critical change (password, username) |
| `members/{viewerId}.blocked[]` | |
| `auth-providers/*` for sign-in flow | |

---

# § 3h.2 — Section drill-down state

For sections with sub-flows (e.g. "Change password", "Manage blocked members"):

- Section detail right-column scrolls to that section.
- Sub-flow opens inline as expanded card with `←` back link.
- Section nav left column stays sticky; clicking another section closes sub-flow with confirm-if-dirty.

---

# § 3h.3 — Username change

7-day cooldown per W4.I4 governance.

Flow:

1. Member taps `Edit` next to username field.
2. Field becomes editable. Validation runs on blur:
   - Length 3–20 chars
   - Alphanumeric + underscores only
   - Not currently taken (live check)
3. Helper text below: `Username changes lock for 7 days after the change.`
4. On `Save`: confirmation modal — `Change your username to {newName}? You won't be able to change it again until {date}.`
5. On confirm: writes new username + sets `username-cooldown-until` field. Field shows lockout state.

When in cooldown:

- Field is read-only.
- Helper text: `You can change your username again on {date}. ({DaysRemaining} days).`

---

# § 3h.4 — Sign-out confirmation

Modal per Part 1 § 11 pattern. Triggered from Account → Sign out button.

- H2: `Sign out of Parbaughs?`
- Body: `You'll need your email to sign back in.`
- Footer: `Cancel` text-link left · `Sign out` claret-outline pill right.

On confirm: clears auth state, redirects to landing.

---

# § 3h.5 — Account deletion

Per Pass 3e 3e-I3 ratification: 7-day grace period.

Flow:

1. Member taps `Delete account` text-link at bottom of Account section.
2. Modal: `Delete your Parbaughs account?`
3. Body (Fraunces 15.5px):
   - `Your account will be scheduled for deletion in 7 days.`
   - `Within those 7 days, sign in to cancel and restore your account.`
   - `After 7 days: your account, rounds, posts, friends, and league memberships are permanently removed. Wagers in flight are settled to the counterparty.`
4. Confirmation field: `Type your username to confirm.`
5. On confirm: writes `deletion-scheduled-at` and signs out. Persistent banner shows on every future sign-in until cancellation.

To cancel: tap banner CTA `Cancel deletion →`. Confirmation modal: `Cancel deletion? Your account stays.`

---

# § 3h.6 — Accessibility

- Section nav: `<nav>` with `<a>` anchors; visited/active state via `aria-current="location"`.
- Form fields: native `<input>`, `<textarea>`, `<select>`, native `<button role="switch">` for toggles.
- Toggle switches: `aria-checked` reflects state; keyboard Space/Enter toggles.
- Smooth-scroll on section nav click: respect `prefers-reduced-motion` (skip smooth, jump).
- Auto-save: `aria-live="polite"` region announces `Setting saved` on each successful write.
- Username cooldown: `aria-describedby` points to helper text.
- Account deletion: confirmation field is `aria-required`; "delete" button stays disabled until field matches username.

---

# § 3h.7 — Token consumption summary

- Surfaces: `--cb-chalk`, `--cb-chalk-deep`
- Text: `--cb-ink`, `--cb-ink-soft`, `--cb-mute`, `--cb-mute-soft`, `--cb-mute-faint`
- Accent: `--cb-brass`, `--cb-brass-deep`
- Status: `--cb-claret` (sign out outline, delete account warning)
- Lines: `--cb-line`
- Type: `--type-mast-hq` (56px H1 override), `--type-sec-hq`, `--type-body-hq`, `--type-eyebrow-hq`, `--type-label-hq`, `--type-ui-hq`

No new tokens.

---

# § 3h.8 — Ratification block

Accepted:
- Single sectioned form view with sticky left nav and right-column detail.
- Auto-save per-field (no global "Save" button) for low-risk fields; explicit confirmation for high-risk (username, password, deletion).
- All 13 push categories at locked defaults from prior pass ratification.
- 7-day cooldown on username changes per W4.I4.
- 7-day grace period on account deletion per Pass 3e 3e-I3.

All 3 gaps resolved by Founder ratification 2026-05-12:
1. Manual handicap override: not in Wave 1 scope. Handicap auto-calculates from rounds only. Manual override deferred to Launch Phase A consideration for leagues operating on declared handicaps. Profile section no longer surfaces a manual-override field.
2. Cross-league handicap consolidation: one platform handicap per member. All rounds count toward unified handicap regardless of which league played. League-specific scoring (net, gross) computes from unified handicap. Simpler architecture; reflects golf reality.
3. Activity visibility default: `League only` confirmed per Founder ratification 2026-05-12. Privacy-positive default complements public-by-default profile baseline. Members opt-up to `Public` if desired.

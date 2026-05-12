# CLUBHOUSE_SPEC — Part 2, Sub-pass 3e: More Tab

> **Status:** Awaiting Founder ratification. Subordinate to Part 1, Sub-passes 3a–3d.
> **Pass:** 3e of 4 (final sub-pass of Part 2).
> **Scope:** 4 screens — More root (IA'd, not junk drawer) + Profile sheet + Settings + Admin entry.

---

## 0 — Sub-pass scope

- **3e.1 — More root (IA'd categories)**
- **3e.2 — Profile sheet** (invoked via masthead avatar tap across Pass 3a–3d)
- **3e.3 — Settings** (host for all locked opt-outs)
- **3e.4 — Admin entry** (founder-only, permission-gated)

Every screen clears 12 rejection criteria, cites Part 1 tokens, declares cross-surface consumers, references reduced-motion + Sunlight, lists a11y.

---

# Screen 3e.1 — More Root

## 3e.1.1 Purpose

The IA'd home for surfaces demoted from primary nav (Pass 1 § 5.2 lock). Explicitly **not a junk drawer** — sectioned by category, deliberate ordering.

## 3e.1.2 Frame

Standard masthead + tab bar. Vertical scroll. No bottom-anchored CTA.

## 3e.1.3 Page header

| Element | Token | Content |
|---|---|---|
| Eyebrow | `--type-label`, `--cb-mute` | `MORE · EVERYTHING ELSE` |
| Headline | `--type-display`, `--cb-ink` | `The full kit.` |

## 3e.1.4 Section: Play

| Row | Sub | Target |
|---|---|---|
| Courses | `Browse and add courses` | Courses surface (W1.S13) |
| Events | `League events and tee times` | Events / Tee Times (W1.S8) |
| Trips | `Multi-day league trips` | Trips (W1.S8) |
| Wagers | `Coin pots and skins` | Wagers (W1.S6) |
| Bounties | `Bounty board` | Bounties (W1.S6) |
| Challenges | `Head-to-head challenges` | Challenges (W1.S6) |

## 3e.1.5 Section: League

| Row | Sub | Target |
|---|---|---|
| My Leagues | `Switch or browse leagues` | My Leagues (W1.S13) |
| Members | `Browse member directory` | Members (W1.S3) |
| Find Players | `Search and add players` | Find Players (W1.S3) |

## 3e.1.6 Section: You

| Row | Sub | Target |
|---|---|---|
| Profile | `View and edit your profile` | Profile sheet (3e.2) |
| Settings | `Display, notifications, privacy` | Settings (3e.3) |
| Cosmetics | `Themes and Parcoin shop` | Cosmetics (W1.S13) |

## 3e.1.7 Section: League management (founder-only)

Renders only if `viewer.role === 'founder'`. Otherwise section hides entirely.

| Row | Sub | Target |
|---|---|---|
| Admin | `League management tools` | Admin (3e.4) |

## 3e.1.8 Section: About

| Row | Sub | Target |
|---|---|---|
| Rules | `League rules and bylaws` | Static content |
| FAQ | `Common questions` | Static content |
| Feature Request | `Tell us what to build next` | External or in-app form |
| Merch | `League merchandise` | External link |
| Bug Report | `Report a problem` | W1.I1 |

Build-phase disclaimer renders below this section per Pass 1 § 3.4: small `--type-caption` `--cb-mute` text.

## 3e.1.9 Row spec (shared across all sections)

| Element | Token | Notes |
|---|---|---|
| Container | 64px height, `--space-5` x-gutter, divider 1px `--cb-line` between rows within section |  |
| Section header | `--type-label` `--cb-brass-deep`, `--space-3` y-pad above first row of section | Uppercase section label |
| Headline | `--type-body-lg` `--cb-ink` |  |
| Sub | `--type-body-sm` `--cb-mute` |  |
| Right element | Chevron `--cb-mute` default; or value text for stateful rows (e.g., `My Leagues` shows current league name on the right) |  |
| Tap behavior | Navigate to target; press-feedback `--motion-instant` color shift on `--bg-sunk` |  |

## 3e.1.10 States

| State | Behavior |
|---|---|
| **Loading** | Skeleton sections × 5 |
| **Founder-only section visibility** | Section conditional render; no flicker — viewer role read from member cache before paint |
| **Spectator tier** | Some rows hidden: Wagers/Bounties/Challenges write actions remain visible but route to read-only variants |
| **Network error** | Static content (Rules / FAQ) cached; dynamic counts on stateful rows fall back to last known values |

## 3e.1.11 Reduced motion + Sunlight

- Row press: instant color shift, no scale.
- Sunlight: row divider thickens 1px → 1.5px; row headlines shift to pure black for max contrast.

## 3e.1.12 A11y

- Sections: `role="region"`, `aria-labelledby` referencing section header.
- Rows: `role="link"`, `aria-label="Profile, view and edit your profile"`.
- Founder-only section: present in DOM only when applicable (no `aria-hidden` masking).
- Build-phase disclaimer: `role="contentinfo"`.

## 3e.1.13 Cross-surface consumers

Routes to **all 14 W1 ship-owned surfaces**. This screen is the navigation hub for everything not on the primary nav. No reads beyond `members/{viewer.id}.role` for founder section gating + stateful row values (current league name, etc.).

---

# Screen 3e.2 — Profile Sheet

## 3e.2.1 Purpose

Invoked via masthead avatar tap (Pass 3a § 3a.1.3 pattern, referenced across all primary screens). Replaces dedicated "You" tab per Pass 1 § 5.2 lock. Bottom sheet — does not replace current screen entirely.

## 3e.2.2 Frame

Bottom sheet, 88% viewport height (per Pass 2 § 5 gesture vocabulary). Drag-to-dismiss enabled; `Esc` dismisses. Grabber handle 36×4 `--cb-mute` top-center.

## 3e.2.3 Header block

| Element | Token | Notes |
|---|---|---|
| Avatar | 88×88, `--radius-pill`, `--cb-brass-soft` 2px ring | Tap → photo edit flow |
| XP level pip | 24×24 overlay bottom-right of avatar, `--cb-felt` fill, `--cb-chalk` numeral | Same pattern as masthead avatar pip, scaled up |
| Display name | `--type-display` (36px serif 600), `--cb-ink`, centered | `Mr Parbaugh` |
| Handle | `--type-body-lg`, `--cb-mute`, below name | `@mrparbaugh` |
| Member-since | `--type-label`, `--cb-mute`, below handle | `MEMBER SINCE APR 2024` |
| Edit profile link | `Edit profile →`, `--cb-brass-deep`, `--type-body-sm` | Tap → edit flow (in-sheet) |

## 3e.2.4 Stats row

3-card horizontal row, reuses 3d.1.4 KPI card spec but smaller (40px display numerals).

| Card | Label | Value |
|---|---|---|
| Handicap | `HCP` | `20.9` |
| Best | `BEST` | `88` |
| Rounds | `ROUNDS` | `47` |

Tap any card → Stats tab → relevant surface (closes sheet first).

## 3e.2.5 Quick actions row

Horizontal row of 4 icon-buttons, 56×56 each, `--bg-sunk` fill, `--radius-md`, `--space-3` gap.

| Action | Glyph | Target |
|---|---|---|
| View activity | Activity glyph | Activity surface scoped to member (3c.4 in member-scoped mode) |
| Send DM | Chat glyph | DM thread (3c.3) — own profile shows different action (`Manage DMs`) |
| Share profile | Share glyph | OS share sheet via Capacitor |
| Sign out | Door glyph, `--cb-mute` | Confirmation sheet then auth sign-out |

Last action visibility:

- Own profile: `Sign out`.
- Other member's profile: `Block` (`--cb-mute`, requires confirm).

## 3e.2.6 Bio block

| Element | Token | Notes |
|---|---|---|
| Eyebrow | `--type-label` `--cb-mute` | `BIO` |
| Text | `--type-body`, `--cb-ink`, wrap-pretty | Up to 280 chars; `--cb-mute` italic placeholder `No bio yet.` if empty |
| Edit-pencil right | Own profile only | Inline edit on tap |

## 3e.2.7 Recent activity preview

3 most-recent activity entries (rounds / awards / aces) — reuses Pulse module pattern from 3a.1.7 at smaller scale.

| Row | Spec |
|---|---|
| Activity row | Same as 3a.1.7 Activity card, 80% scale |
| `View all activity →` link at bottom | `--cb-brass-deep` `--type-body-sm` |

## 3e.2.8 States

| State | Behavior |
|---|---|
| **Loading** | Header skeleton + stats skeleton + activity skeleton |
| **Own profile** | All edit affordances visible; Sign out in actions row |
| **Other member's profile** | Edit affordances hidden; Block in actions row; DM action available unless blocked |
| **Blocked viewer or viewer-blocked** | Header + bio hidden; centered: `You and Nick aren't connected.` + back action |
| **Spectator viewing** | Read-only; activity preview scoped to publicly visible items |
| **Network error** | Cached values + retry banner |

## 3e.2.9 Edit profile flow (in-sheet)

Tap `Edit profile →`:

- Inline form replaces stats + actions rows.
- Editable: display name, handle, bio, avatar.
- Top of form: `Cancel` left, `Save` right (brass when dirty, `--cb-mute` when pristine).
- Form a11y: focus-trap; first focusable is display name field; `Esc` cancels with confirm if dirty.

## 3e.2.10 Reduced motion + Sunlight

- Sheet slide-up: instant fade in under reduced motion.
- Drag-dismiss: still functional (gesture, not animation).
- Sunlight: avatar ring thickens 2px → 3px; bio text shifts to pure black; action buttons gain 1px `--cb-line` border.

## 3e.2.11 A11y

- Sheet: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` referencing display name.
- Grabber handle: decorative.
- Avatar (when tappable for edit): `role="button"`, `aria-label="Change profile photo"`.
- Stats cards: `role="link"`.
- Quick actions: each `role="button"` with full label.
- Sign-out confirm: focus on `Cancel` first (safer default).
- Edit form: standard form a11y.

## 3e.2.12 Cross-surface consumers

| Surface | Operation |
|---|---|
| `members/{id}` | Read + Write (own profile edits) |
| `fbMemberCache` | Read |
| `activity` (member-scoped) | Read |
| `members/{viewer.id}.blockedUsers` | Read |
| Capacitor share | Write (share profile) |
| Firebase auth | Sign out path |
| Navigates to **Activity (3c.4)**, **DM thread (3c.3)**, **Stats surfaces (3d)** on stat-card tap |

---

# Screen 3e.3 — Settings

## 3e.3.1 Purpose

Host for all opt-outs and preferences locked across previous passes. Sectioned by domain.

## 3e.3.2 Frame

Standard chrome. Vertical scroll list of sectioned toggles + drill-ins.

## 3e.3.3 Page header

| Eyebrow | `SETTINGS` |
| Headline | `Tune the app.` |

## 3e.3.4 Section: Display

| Row | Type | Default | Notes |
|---|---|---|---|
| Sunlight mode | 3-state segmented: `Off · On · Auto` | `Auto` per Pass 2 P2-I3 lock | Auto uses Capacitor Device plugin ambient light sensor |
| Theme | Drill-in | Standard | Routes to Cosmetics surface (W1.S13) |
| Show season lows | Toggle | On per Pass 3d 3d-I4 lock | Hides "Your lows" block in Season Recap (3d.5.4) |
| Dynamic Type override | Drill-in | System | Manual scale picker if system Dynamic Type insufficient |

## 3e.3.5 Section: Play

| Row | Type | Default | Notes |
|---|---|---|---|
| Auto-advance scoring | 3-state: `Off · Smart · On` | `Smart` per Pass 3b 3b-I6 lock | Smart = auto-advance only when all scores entered on current hole |
| GPS in-round | Toggle | On if permission granted | Off forces manual; on enables GPS chip per 3b.3.7 |
| Default round broadcast | Toggle | On | Spectator-visible by default at round start |
| Default scoring view | Drill-in | Strokes counter | Alternative: full scorecard table view |

## 3e.3.6 Section: Notifications

| Row | Type | Default | Notes |
|---|---|---|---|
| Push notifications | Drill-in to per-category | per Pass 2 § 9.5 | 13-category toggle list per ratified spec |
| Quiet hours | Drill-in | 9 PM – 8 AM per Pass 2 § 9 | Editable window + crisis-pierces toggle |
| In-app banners | Toggle | On |  |
| Sound | Toggle | On |  |
| Haptics | Toggle | On |  |

## 3e.3.7 Section: Privacy

| Row | Type | Default | Notes |
|---|---|---|---|
| Read receipts | Toggle | On per Pass 3c 3c-I3 lock | Global; no per-thread override |
| Profile visibility | 3-state: `League only · Friends only · Public` | `League only` | `Public` only available post-launch |
| Blocked members | Drill-in | List of blocked members + unblock action |  |
| Activity visibility | Toggle per activity type | Round / Award / Ace / Kudos all on | Granular opt-out for what's published to Pulse |

## 3e.3.8 Section: Account

| Row | Type | Notes |
|---|---|---|
| Email | Drill-in | Verified address, change requires re-auth |
| Phone | Drill-in | Optional; used for TestFlight enrollment + crisis touchpoints per Pass 1 § 3.2 |
| Sign-in methods | Drill-in | Apple / Google / email — list active + add/remove |
| Export my data | Drill-in | Generates JSON dump for download per privacy compliance |
| Delete account | Drill-in (terminal) | `--cb-felt-deep` left accent stripe; confirmation flow with 7-day grace period |

## 3e.3.9 Section: About

| Row | Type | Notes |
|---|---|---|
| Version | Static value | `v8.22.0` (engineering injects build version) |
| Build phase | Static | `Founding crew · active development` per Pass 1 § 3.4 |
| Acknowledgments | Drill-in | The Original Four + named founding members |
| Open source licenses | Drill-in | Capacitor + plugins + libraries |

## 3e.3.10 Row spec (shared)

| Element | Token | Notes |
|---|---|---|
| Container | 56px height (toggle rows) / 64px (drill-in rows), `--space-5` x-gutter |  |
| Section header | `--type-label` `--cb-brass-deep`, `--space-4` y-pad before |  |
| Label | `--type-body` `--cb-ink` |  |
| Sub | `--type-body-sm` `--cb-mute` (when present, drives row to 64px) |  |
| Toggle | iOS-style switch, `--cb-brass` on / `--cb-chalk-deep` off | 51×31, native-feeling |
| Segmented control | 3-state pill, brass active fill, `--type-label` |  |
| Drill chevron | Right, `--cb-mute` |  |

## 3e.3.11 States

| State | Behavior |
|---|---|
| **Loading** | Skeleton sections × 6 |
| **Toggle pending write** | Toggle animates instantly; rolls back with toast on write failure |
| **Permission-denied (e.g., GPS)** | Toggle row shows lock chip right of switch; tap explains + routes to OS settings |
| **Spectator tier** | Settings limited to Display + Notifications + Privacy; Play section hidden (no scoring rights) |
| **Network error** | Toggles disable; banner top: `Can't save changes. Retry →` |

## 3e.3.12 Reduced motion + Sunlight

- Toggle flip: instant color swap, no slide animation.
- Segmented control: instant pill snap to position.
- Sunlight: toggle off-state border thickens for visibility; segmented control gains 1.5px `--cb-line` outer border.

## 3e.3.13 A11y

- Sections: `role="region"`, `aria-labelledby`.
- Toggles: `role="switch"`, `aria-checked`.
- Segmented controls: `role="radiogroup"`, each option `role="radio"`.
- Drill-ins: `role="link"`.
- Permission-denied chip: `aria-label="Permission needed — tap to open system settings"`.
- Destructive rows (Delete account): `aria-describedby` referencing warning copy.

## 3e.3.14 Cross-surface consumers

| Surface | Operation |
|---|---|
| `members/{id}.preferences` | Read + Write across all toggles |
| `members/{id}.notifications` per-category | Read + Write |
| `members/{id}.blockedUsers` | Read (via drill-in) |
| Capacitor device + permissions APIs | Read (GPS, push, ambient light) |
| Firebase auth | Account actions |
| Routes to **Cosmetics (W1.S13)**, **Blocked Members drill**, **OS Settings** for permission re-grant |

---

# Screen 3e.4 — Admin Entry

## 3e.4.1 Purpose

Founder-only surface. Permission-tier gated. Entry to league management tools.

## 3e.4.2 Auth gate

- Renders only when `viewer.role === 'founder'`.
- If non-founder reaches this route via deep link: redirect to More root with toast `Admin tools are founder-only.`
- Auth checked on entry AND on each write — defense in depth per Pass 1 architectural feasibility (Criterion 5).

## 3e.4.3 Frame

Standard chrome. Vertical list of admin tool sections.

## 3e.4.4 Page header

| Eyebrow | `ADMIN · FOUNDER TOOLS` (`--cb-brass-deep`) |
| Headline | `The Parbaughs · league management.` |
| Sub | `Acting as founder. All writes audit-logged.` |

## 3e.4.5 Section: Members

| Row | Sub | Target |
|---|---|---|
| Member list | `View, edit, remove members` | Drill-in to member management table |
| Invite member | `Send invitation` | In-app invite flow |
| Pending invites | `N pending` | List of unaccepted invites |
| Permission tiers | `Assign roles` | Drill-in to role-assignment table |

## 3e.4.6 Section: League

| Row | Sub | Target |
|---|---|---|
| League settings | `Name, logo, rules` | Edit league document |
| Seasons | `Define season windows` | Season management |
| Awards catalog | `Manage award definitions` | Edit award catalog |
| Records | `Lock or unlock records` | Override Cloud Function caches |

## 3e.4.7 Section: Moderation

| Row | Sub | Target |
|---|---|---|
| Chat moderation | `Pin / delete messages, mute members` | Quick moderation log |
| Reported content | `N pending reports` | Review queue |
| Activity removal | `Hide activity entries` | Activity edit table |
| Round amendments | `Edit finalized rounds` (founder override per Pass 3b 3b-I2 lock) | Round amendment flow |

## 3e.4.8 Section: System

| Row | Sub | Target |
|---|---|---|
| Crisis banner | `Set tier and message` (NOTICE / ALERT / CRITICAL per Pass 1 § 3.3) | Banner controller |
| Bug reports | `N open` | Bug triage |
| Audit log | `View admin actions` | Append-only log |
| Cost dashboard | `Firestore reads/writes this billing cycle` | Per Pass 1 cost halt mandate visibility |

## 3e.4.9 Row spec

Inherits 3e.3.10 with one difference: section headers use `--cb-brass-deep` consistently to signal founder-tier context.

## 3e.4.10 States

| State | Behavior |
|---|---|
| **Loading** | Skeleton sections × 4 |
| **Non-founder reach** | Auto-redirect with toast (see 3e.4.2) |
| **Founder demoted mid-session** | Listener catches role change; redirects to More root with toast `Founder role changed.` |
| **Network error** | Section content shows last-cached values; write actions disabled with banner top |
| **Cost dashboard threshold exceeded** | Banner-tier ALERT in banner slot: `Approaching cost ceiling — review writes` |

## 3e.4.11 Reduced motion + Sunlight

- All transitions inherit Settings spec.
- Sunlight: brass-deep section headers shift to felt-deep for contrast; toggle/drill rows otherwise unchanged.

## 3e.4.12 A11y

- Page header: `role="banner"`, `aria-label="Admin tools for The Parbaughs, founder mode"`.
- Sections: `role="region"`.
- All write actions confirm via dialog with explicit destructive labeling where applicable.
- Audit-log link: `aria-label="View audit log of all admin actions"`.

## 3e.4.13 Cross-surface consumers

| Surface | Operation |
|---|---|
| `leagues/{leagueId}` | Read + Write (league settings) |
| `members/{id}.role` | Read + Write (role assignment) |
| `leagues/{leagueId}/invites` | Read + Write |
| `system/banner` | Write (crisis banner per Pass 1 § 3.3 + Pass 2 § 9 architecture) |
| `rounds/{id}` | Write (amendments per founder override) |
| `leagues/{leagueId}/auditLog` | Write (every admin action appends) |
| `leagues/{leagueId}/costStats` | Read (Cloud Function-derived) |
| Routes to many sub-management surfaces, all founder-gated |

---

# § Pass 3e — Open Inferences

| # | Inference | Where | Founder action |
|---|---|---|---|
| 3e-I1 | Permission tier model — founder / member / spectator naming + role field shape | § 3e.4.5 | Defer to W1.S14 (Admin + Onboarding ship); confirm tier set |
| 3e-I2 | Cost dashboard visibility — founder-only vs. founding-crew transparent | § 3e.4.8 | Confirm: keep founder-only or open to founding 20? |
| 3e-I3 | Delete account 7-day grace period | § 3e.3.8 | Confirm window or specify (7 / 14 / 30 / immediate) |
| 3e-I4 | Profile handle format (`@mrparbaugh`) — uniqueness scope league vs. global | § 3e.2.3 | Defer to Wave 4 identity arch; for Wave 3 propose league-unique |
| 3e-I5 | XP level numeral source — already in masthead pip; confirm field name | § 3e.2.3 | Defer to W1.S3 |
| 3e-I6 | Block flow — full block (no contact) vs. mute (no notifications, can still view) | § 3e.2.5 / 3e.3.7 | Confirm semantic |

---

# § Pass 3e — Ratification block

You are accepting:

1. **Screen 3e.1** — More root with 6 explicit sections (Play / League / You / Founder-only / About) — explicitly **not a junk drawer**.
2. **Screen 3e.2** — Profile sheet invoked via masthead avatar tap; 88% viewport bottom sheet; own-vs-other-profile action variants; in-sheet edit flow.
3. **Screen 3e.3** — Settings as host for all locked opt-outs (Sunlight mode auto, read receipts on, auto-advance smart, season lows on, push categories per Pass 2 § 9.5) plus account management.
4. **Screen 3e.4** — Admin entry as founder-only auth-gated surface with Members / League / Moderation / System sections, audit-logged writes, defense-in-depth permission checks.
5. All 4 screens cite Part 1 tokens, declare cross-surface consumers, respect reduced-motion + Sunlight, list a11y treatment.
6. **6 inferences** require resolution before Pass 4 begins.

---

# § Pass 2 — End of sub-passes

With ratification of 3e, **all 22 mobile screens are specified across sub-passes 3a–3e** (3 Home + 6 Play + 4 Feed + 5 Stats + 4 More = 22 screens). Part 2 of CLUBHOUSE_SPEC.md is complete pending final assembly.

✏️ **Founder action:** Ratify, red-line, or amend Pass 3e per screen. Once ratified, **Pass 4 — Wave 3 implementation guidance** begins (M1 Capacitor harness + emulation → M2 Home → M3 Play → M4 Stats → M5 Feed → M6 More + TestFlight enrollment), concluding design bot work.

**End of sub-pass 3e. End of Part 2.** Standing by.

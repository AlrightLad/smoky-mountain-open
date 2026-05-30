# CLUBHOUSE_SPEC-HQ — Part 2, View 3i: Admin Entry Surface

> **Status:** Subordinate to `docs/CLUBHOUSE_SPEC-HQ.md` (Part 1). Tier 1 fill-in-the-gaps deliverable. Awaiting Founder ratification.
> **Canonical mock:** No dedicated HTML mock — admin chrome is intentionally austere (administrative utility, not editorial). Follows HQ Part 1 chrome.
> **Ship:** W1.S14 — Admin surface.
> **Scope:** Permission-gated tiered access (Commissioner vs Founder), one entry surface, drill-down panels. **Critical:** avatar menu does NOT contain admin entries per locked W1.S14 — admin uses separate URL (`/admin`) not in member-uniform avatar menu.

---

## 0 — View scope

Admin is the operations surface — where Commissioners manage their league and the Founder manages the platform. Defense-in-depth security: route guard + per-request auth checks + audit log on every mutation. **Critical** principle: admin URL is not surfaced in any member-facing nav. A Commissioner reaches `/admin` by knowing the URL or via a Founder-issued onboarding email.

States covered:
- **3i.1** — Commissioner entry (one league, Commissioner-tier access)
- **3i.2** — Founder entry (full platform access, all leagues)
- **3i.3** — Unauthorized access (member without admin role hits the URL)
- **3i.4** — Audit log surface (Founder-only)
- **3i.5** — Cost dashboard (Founder-only per Pass 3e 3e-I2)
- **3i.6** — Crisis banner controller (Founder-only per W1.I5)

---

# § 3i.1 — Commissioner entry state

## 3i.1.1 Frame composition

Stripped-down chrome — admin is utility, not publication.

| Slot | Token / Spec | Notes |
|---|---|---|
| Top nav | `--nav-h` | Per Part 1 § 4. **Admin-specific:** brand mark wordmark reads `Parbaughs · Admin` (mono 11px brass appended). Visual signal that you're in the admin surface. |
| Masthead | ~80px (utility — no editorial) | See 3i.1.3 |
| Body | flex | Two-column: left = admin nav rail (sticky); right = panel content |
| Footer | hidden | Admin surfaces suppress footer |

## 3i.1.2 Banner

No banner by default on admin views. If active crisis banner is being authored (3i.6): live preview strip at top showing what members are seeing.

## 3i.1.3 Masthead (utility)

- **Eyebrow:** `COMMISSIONER · {LeagueName}`
- **H1:** `Admin.` (Fraunces 40px — smaller than member-facing surfaces)
- Sub-deck and date line: omit.

## 3i.1.4 Admin nav rail (left, sticky)

Vertical list. Active = brass left-border 3px + ink text. Inactive = mute-soft.

Commissioner sees:

| Section | Anchor | Visibility |
|---|---|---|
| Members | `#members` | This league only |
| League settings | `#league` | This league only |
| Events | `#events` | This league only |
| Wagers | `#wagers` | This league only — view + dispute resolution |
| Audit log | — | **HIDDEN for Commissioner** (Founder-only) |
| Cost dashboard | — | **HIDDEN for Commissioner** (Founder-only) |
| Crisis banner | — | **HIDDEN for Commissioner** (Founder-only) |

Each section opens a panel in the right column. No deep nested routing — admin is single-page-by-section.

## 3i.1.5 Section: Members

| Element | Spec |
|---|---|
| Header | `Members · {N}` Fraunces 30px + meta right `{N} active · {N} pending invites` |
| Body | Dense table — similar to 3e Members but with admin controls per row |

### Admin member-row columns

| Column | Content |
|---|---|
| Avatar + name + username | Same as 3e |
| Role | Pill: `Member` (default) · `Commissioner` (mute outline) · `Founder` (brass outline) |
| Joined | Date mono 11px |
| Last active | Date mono 11px |
| Status | `Active` / `Pending invite` / `Suspended` |
| Actions | Dropdown: `Change role`, `Suspend`, `Remove from league` |

Action confirmation: every destructive action requires confirmation modal. Modal copy: `Suspend {memberName}? They will lose access to {LeagueName} immediately.`

## 3i.1.6 Section: League settings

| Field | Type | Notes |
|---|---|---|
| League name | Text | Inline edit |
| Slug | Text | URL-safe, validated for uniqueness |
| Description | Textarea | 500 char |
| Founded date | Date | Read-only |
| Privacy | Radio: `Public` / `Private` / `Invite-only` | |
| Home courses | Multi-select | Sources `courses/*` |
| Season schedule | Drill-in to season editor | Define season dates + names |
| Handicap calculation | Radio: `Standard WHS` / `Custom rules` | |
| Wager defaults | Per-format default stake amounts | Sub-table |
| Disband league | Claret link bottom | Per locked governance — Commissioner can disband own league |

## 3i.1.7 Section: Events

Table of all scheduled events. Columns: date, name, course, RSVPs, status. Per-row actions: `Edit`, `Cancel`, `Duplicate`.

## 3i.1.8 Section: Wagers

Table of all active and recent wagers. Columns: round, members, stake, status. Per-row actions for Commissioner: `View detail`, `Mark disputed`. **`Force settle` action removed from Commissioner-tier authority** — moderation action with financial implications (Parcoin transfer) belongs to Founder-only to avoid per-league conflicts of interest. Commissioner can flag wagers as disputed; Founder resolves via Force settle in cross-league Wagers section.

## 3i.1.9 Cross-surface dependencies

| Reads | Writes |
|---|---|
| `members/{leagueId}/*` (roster) | `members/{leagueId}/{memberId}.role` on role change |
| `events/{leagueId}/*` | `members/{leagueId}/{memberId}.status` on suspend |
| `wagers/{leagueId}/*` | `events/{leagueId}/{eventId}` on edit/cancel |
| `leagues/{leagueId}` (settings) | `wagers/{leagueId}/{wagerId}.status` on force-settle |
| | `audit-log/{leagueId}/{*}` on every mutation |

---

# § 3i.2 — Founder entry state

Same frame as 3i.1 but with expanded nav rail and cross-league scope.

## 3i.2.1 Founder masthead

- **Eyebrow:** `FOUNDER · PLATFORM · ALL LEAGUES`
- **H1:** `Admin.` (same)

## 3i.2.2 Founder nav rail

| Section | Visibility |
|---|---|
| Members | All leagues (filterable by league) |
| Leagues | All leagues — create new, suspend, transfer ownership |
| Events | All leagues |
| Wagers | All leagues — dispute resolution authority |
| Audit log | **VISIBLE** (3i.4) |
| Cost dashboard | **VISIBLE** (3i.5) |
| Crisis banner | **VISIBLE** (3i.6) |
| Platform settings | Founder-only |

Cross-league scope is signaled with a `{LeagueScope}` switcher at the top of each panel: `All leagues ▼` dropdown (Founder default) or specific league name.

Founder's Wagers section retains all three per-row actions: `View detail`, `Mark disputed`, `Force settle`. Force-settle requires audit log entry + member notification ("Wager X has been resolved by platform admin"). Cross-league scope — Founder can force-settle wagers in any league.

---

# § 3i.3 — Unauthorized access state

Member without admin role hits `/admin`:

- Route guard catches at top of view.
- Renders a single full-width editorial block:
  - Eyebrow: `404 · NOT FOUND`
  - H1 (Fraunces 56px): `Nothing here.`
  - Body (Fraunces 15.5px mute): `Return to your clubhouse.`
  - CTA: `← Back to Parbaughs` (brass link)

**Critical:** The unauthorized state does **NOT** acknowledge that the admin surface exists. The 404 wording is deliberate — no confirmation to a probing user that they're missing a permission tier. (Hard security through obscurity is not security alone; route guards are also enforced server-side. But not signaling the surface exists reduces probe attempts.)

---

# § 3i.4 — Audit log surface (Founder-only)

| Element | Spec |
|---|---|
| Header | `Audit log` Fraunces 30px + meta right `{N} entries in last 30 days` |
| Filter rail | Filter chips: `All`, `Role changes`, `Suspensions`, `Wager force-settles`, `Crisis banner toggles`, `Cost-threshold breaches` |
| Table | Reverse-chrono, paginated 100/page |

### Audit row columns

| Column | Content |
|---|---|
| Timestamp | ISO 8601 + relative (`2026-04-14 09:23 · 2 days ago`) |
| Actor | Member who performed the action + tier badge |
| Action | Verb + target (`Suspended member zachb#0001`) |
| League | League name (or `Platform` for cross-league actions) |
| Detail | Truncated to 80 chars + `Expand →` link to full payload |
| Reversible | Yes/no flag — for reversible actions, `Revert →` link |

Each row is append-only — audit log entries cannot be deleted, only annotated. Annotation field: 280 char, mono 11px, separate write.

## 3i.4.1 Cross-surface dependencies

| Reads | Writes |
|---|---|
| `audit-log/{*}` filtered | `audit-log/{entryId}.annotation` on annotate |

---

# § 3i.5 — Cost dashboard (Founder-only)

Per Pass 3e 3e-I2 — cost visibility for Founder operational awareness.

| Element | Spec |
|---|---|
| Header | `Costs · {MonthName}` Fraunces 30px + meta right `Updated {time} ago` |
| Top row | 4 KPI cards: `Firestore reads/mo` · `Firestore writes/mo` · `Storage GB` · `Estimated $` |
| Body | Multi-line chart: 30-day trend of each KPI, colors per Part 1 § 12 chart palette |
| Alerts | Threshold breaches highlighted with claret eyebrow `THRESHOLD BREACHED · 2026-04-12` |

---

# § 3i.6 — Crisis banner controller (Founder-only)

Per W1.I5 — Founder-controllable banner overlaying all member-facing surfaces.

| Element | Spec |
|---|---|
| Header | `Crisis banner · ` followed by status pill: `INACTIVE` (mute) or `ACTIVE` (claret + pulse) |
| Banner editor | Textarea (140 char), eyebrow selector (e.g. `URGENT`, `NOTICE`, `MAINTENANCE`), CTA URL field optional |
| Live preview | Renders the banner as members will see it, using actual member surface chrome |
| Schedule | Optional: start time + end time. Without schedule, banner is active immediately until manually deactivated. |
| Activate / Deactivate | Brass CTA. On activate: writes `system/crisis-banner.active = true` + payload. |
| History | Below editor: list of previous crisis banner activations with timestamps + duration + audit trail |

Activation requires a re-confirmation modal: `Activate crisis banner across all member surfaces? This will be visible to all signed-in members and on public pages.`

---

# § 3i.7 — Accessibility

- Nav rail: `<nav>` with `<a>` per section anchor; `aria-current="page"` for active.
- Admin tables: `<table>` with `<th scope="col">` and `aria-label` per row synthesizing key fields.
- Destructive actions: confirmation modal traps focus; "destroy" button is `aria-describedby` linked to warning copy.
- Audit log: each row is `aria-label`'d with full event summary.
- Cost charts: chart `aria-label` describes trend ("Firestore reads, current month, 12% above last month").
- Unauthorized state: `<main>` with H1 announcing 404 — no leaks via aria.

---

# § 3i.8 — Token consumption summary

- Surfaces: `--cb-chalk`, `--cb-chalk-deep`
- Text: `--cb-ink`, `--cb-mute`, `--cb-mute-soft`, `--cb-mute-faint`
- Accent: `--cb-brass`, `--cb-brass-deep`
- Status: `--cb-claret` (destructive actions, crisis banner active, threshold breaches)
- Lines: `--cb-line`
- Type: `--type-mast-hq` (40px H1 override — admin is smaller), `--type-sec-hq`, `--type-body-hq`, `--type-eyebrow-hq`, `--type-label-hq`, `--type-num-hq`, `--type-ui-hq`

No new tokens.

---

# § 3i.9 — Ratification block

Accepted:
- `/admin` URL is **not** surfaced in any member-facing navigation. Commissioners reach it by URL knowledge or Founder onboarding email.
- Two-tier visibility: Commissioner (their league only) and Founder (cross-league + platform-only sections).
- Defense-in-depth: route guard + per-request auth check + append-only audit log on every mutation.
- Unauthorized access returns 404, not "permission denied" — deliberate obscurity.
- Audit log is append-only; entries can be annotated but not deleted.
- Crisis banner activation requires re-confirmation modal.

All 4 gaps resolved by Founder ratification 2026-05-12:
1. Unauthorized state: universal 404 for all unauthorized access (authenticated members without admin role AND unauthenticated). Defense-in-depth obscurity (3i.3).
2. Cost thresholds: Founder-set in platform settings; no static defaults Wave 1 (3i.5).
3. Disband authority: Commissioner can disband own league (with 7-day grace + typed-name confirmation); Founder can disband any league.
4. Force-settle authority: Founder-only; removed from Commissioner Wagers section (3i.1.8).

# CLUBHOUSE_SPEC-HQ — Part 2, View 3e: Members Directory

> **Status:** Subordinate to `docs/CLUBHOUSE_SPEC-HQ.md` (Part 1). Tier 1 fill-in-the-gaps deliverable. Awaiting Founder ratification.
> **Canonical mock:** No dedicated HTML mock yet — frame inherits from `Parbaughs HQ Final v2.html` (masthead + scope rail + agate rail chrome). Member-row component invents the directory body within those rails.
> **Ship:** W1.S3 — Members directory + Find Players.
> **Scope:** One view, all states. Public-by-default per locked monetization model.

---

## 0 — View scope

The Members view is the league's directory: every member of the visible league, browsable A–Z by username, with friend system and championship status surfaced. Public-by-default — unauthenticated visitors can browse member shells (avatar + username + handicap) but cannot see friend status, send requests, or open private profile fields.

States covered here:
- **3e.1** — Default (signed-in member, populated league roster, ≥1 friend already)
- **3e.2** — First-time member (no friends yet — founding-20 are auto-friended baseline, then this surface is the discovery path)
- **3e.3** — Unauthenticated public viewer (read-only shells)
- **3e.4** — Empty league (Commissioner has invited 0 members beyond themselves)

---

# § 3e.1 — Default state

## 3e.1.1 Frame composition

| Slot | Token / Spec | Notes |
|---|---|---|
| Top nav | `--nav-h` | Per HQ Part 1 § 4 |
| Tab switcher | `--tabs-h` | "Members" tab active |
| Masthead | ~140px (smaller than Home — directory is a working surface, not an editorial one) | See 3e.1.3 |
| Scope rail | `--scope-h` (~58px) | Filters + search |
| Two-column body | flex | Main = roster table; agate = friends + leaders |
| Footer | per HQ Part 1 § 14 |

## 3e.1.2 Banner

No banner on this view by default. If a friend posts a round while viewing: banner-tier toast slides in from top per HQ Part 1 § 11.2 (does not push content).

## 3e.1.3 Masthead

Per HQ Part 1 § 6 (working-surface variant — H1 only, no sub-deck).

- **Eyebrow:** `{LeagueName} · {N} members · Joined since {EarliestJoinYear}` — e.g. `The Parbaughs · 23 members · Joined since 2024`
- **H1:** `The roster.` (Fraunces 56px italic — smaller than Home's 88px, this is not a publication front page)
- **Sub-deck:** Omit on this view. Working surface, not editorial.
- **Date line:** Omit.

## 3e.1.4 Scope rail

Three controls inline:

| Control | Default | Spec |
|---|---|---|
| Tabs | `All members` (active) · `Friends` · `Live now` | Mono 11px 1.5px tracking. Active = brass underline 2px. |
| Search input | Empty | Inter 14px, 1px `--cb-line` border, `--cb-chalk-deep` background, placeholder `Search by name or username…`. Width 320px. |
| Sort dropdown | `Username A–Z` | Mono 10.5px. Options: `Username A–Z`, `Handicap low → high`, `Most rounds`, `Recently active`. |

Meta string right-aligned: `{N} shown · {N} live`.

## 3e.1.5 Main column

Single dense table — **NOT a card grid**. The directory is reference data; a card grid wastes vertical real estate.

### Table layout

```
| Avatar | Name + username       | Handicap | Rounds | Last activity | Status      | Action       |
|--------|-----------------------|----------|--------|---------------|-------------|--------------|
| [img]  | Zach Brian            | 12.4     | 47     | 2h ago        | ● Live now  | [Watch →]    |
|        | zachbrian#0001        |          |        |               |             |              |
```

| Column | Width | Token | Content |
|---|---|---|---|
| Avatar | 56px fixed | 40×40 circle, `--cb-felt` bg, `--cb-brass` 1px ring | Tap → profile detail (W4.I5 surface) |
| Name + username | flex 1 (min 280px) | Top: Fraunces italic 500 16px `--cb-ink`. Bottom: Mono 11px `--cb-mute-soft` `username#discriminator` per W4.I1 schema | Tap → profile |
| Championship badges | inline-right of name | Inline SVG emblems per CHAMPIONS_MARK_SPEC.md, 14px height, max 3 visible + `+N` mono chip | Hover → title popover |
| Handicap | 80px right-aligned | `--type-stat` scaled to 18px Fraunces 600 tabular-nums `--cb-ink` | `12.4` — never decimals beyond tenths |
| Rounds | 80px right-aligned | Mono 13px `--cb-mute-soft` tabular | `47` |
| Last activity | 140px right-aligned | Mono 11px 1.5px tracking `--cb-mute` | `2h ago` / `yesterday` / `5d ago` / `inactive` (>30d) |
| Status | 120px | Live-now pulse dot + mono 11px brass `Live now`; else hidden | Per HQ Part 1 § 12 dot animation |
| Action | 140px right-aligned | Friend status CTA — see 3e.1.6 | Pill button or text link per state |

Row height: 64px. Hover: `background: var(--cb-chalk-deep)` (no transform). Row separator: 1px `--cb-line` between rows.

Pagination: 50 rows per page; "Load more →" at bottom (mono brass). For league of 20 members, no pagination triggered.

### Friend-status CTA states

Action column resolves per the relationship between viewer and the row member:

| Relationship | CTA |
|---|---|
| Already friends | `Friends ✓` (mono 11px `--cb-mute-faint`, no action — status indicator) |
| Pending request sent | `Request sent` (italic `--cb-mute-soft`) |
| Pending request received | `Accept →` pill (brass background, ink text) — primary action |
| No relationship | `Add friend +` text link (`--cb-brass-deep`) |
| Self | (empty — no row action for own member entry; row still listed) |
| Blocked | (row hidden entirely per Part 1 privacy model) |

`[GAP]` Founder confirms: founding-20 auto-friend baseline established at league creation (W1.S14 onboarding) — does it apply retroactively to existing founding-20 members on first login of W1.S3, or only to net-new members joining post-W1.S3 ship?

## 3e.1.6 Agate rail (right column)

| # | Module | Content | Hides when |
|---|---|---|---|
| 1 | **Your friends · {N}** | List of 5 most-recently-active friends with name + last-active mono right | 0 friends → "No friends yet — add some" mute prompt |
| 2 | **Handicap leaders** | Top 3 by lowest handicap, list with name + handicap-stat | <3 members ranked → module hides |
| 3 | **Most active this week** | Top 3 by round count last 7d | <3 active → module hides |
| 4 | **Pull quote** | Founder-curated copy — see HQ Part 1 § 13 (e.g. *"The roster opens the league.") | Always present |

Module dividers: 1px `--cb-line` between, no fills.

## 3e.1.7 Cross-surface dependencies

| Reads | Writes |
|---|---|
| `members/{leagueId}/*` (full roster) | `friend-requests/{fromId}_{toId}` on add-friend |
| `members/{viewerId}.friends[]` | `friend-requests/{fromId}_{toId}/status` on accept |
| `members/{viewerId}.friend-requests-incoming[]` | |
| `rounds/{*}.status` (for live-now indicators) | |
| Championship registry (W1.S9) for badge resolution | |

---

# § 3e.2 — First-time member state

Identical frame to 3e.1. Two differences:

1. **Agate "Your friends · 0"** — module shows a single-line prompt: `Add a few members to get started. Founding-20 are already in your circle.` Mute, italic Fraunces 14px.
2. **Default tab** is `All members` (same as 3e.1), but the directory shows an **inline strip above the table** at top:
   - Eyebrow: `STARTER PACK · YOUR LEAGUE`
   - Headline: `These five members are active this week. Add them to start your circle.`
   - Five member-row mini-cards horizontally (compressed table-row variant).

This strip dismisses after the viewer's first friend-add or after the 7th visit (`[GAP]` Founder confirms dismissal trigger).

---

# § 3e.3 — Unauthenticated public viewer

Per locked monetization model, the directory is public-by-default. Anonymous visitors get a read-only view:

| Change vs 3e.1 |
|---|
| Search input remains functional |
| Sort dropdown remains functional |
| Friend-status Action column is hidden (no column) — saves ~140px right |
| Live-now Status column **remains visible** — public visibility of live rounds is locked Vision |
| Avatar → public profile route (read-only, no edit) |
| Agate "Your friends" module hides entirely |
| Top of main column: signup CTA strip — `Join the platform to add friends, post rounds, and join leagues. Sign up →` — chalk-deep background, brass CTA, dismissible per-session |

`[GAP]` Founder confirms: unauthenticated public viewers DO see championship badges and handicap per Founder ratification 2026-05-12. Per locked monetization model (memory #28), public profiles are core identity expression. Handicap + championships visible to non-authenticated viewers. Round-level detail (specific scores, course-by-course data) remains authenticated-only.

---

# § 3e.4 — Empty league

Commissioner has created a league but invited 0 members beyond themselves. The directory shows:

- Main column: single row (the Commissioner's own member entry).
- Below the row: a centered editorial block:
  - Eyebrow: `COMMISSIONER ONLY`
  - H2 (Fraunces 30px): `The league is yours. Invite someone.`
  - Body (Fraunces 15.5px mute): `Member directory wakes up when a second Parbaugh joins. Send an invite to start the roster.`
  - CTA: `Invite a member →` (brass link) — opens invite flow per W1.S13.
- Agate rail hides all modules except pull quote.

---

# § 3e.5 — Accessibility

- Table is semantic `<table>` with `<thead>` + `<th scope="col">` per column.
- Each row has `aria-label` synthesizing the row content: `Zach Brian, username zachbrian-0001, handicap 12.4, 47 rounds, last active 2 hours ago, live now`.
- Live-now pulse: `aria-hidden="true"` on the dot; the `Live now` text carries the meaning.
- Sort dropdown: native `<select>` for full keyboard + AT support (do NOT custom-build per HQ Part 1 a11y rule).
- Add-friend action: announces state change via `aria-live="polite"` region after request submission.
- Skip-link "Skip to roster" lands focus on the first table row.
- Tab order: search → sort → tabs → first row → action column → next row.

---

# § 3e.6 — Token consumption summary

This view consumes only tokens defined in HQ Part 1 § 1 + § 2:

- Surfaces: `--cb-chalk`, `--cb-chalk-deep`, `--cb-felt` (avatars only)
- Text: `--cb-ink`, `--cb-ink-soft`, `--cb-mute`, `--cb-mute-soft`, `--cb-mute-faint`
- Accent: `--cb-brass`, `--cb-brass-deep`
- Status: live-pulse animation per Part 1 § 12
- Lines: `--cb-line` (all hairlines + row dividers)
- Type: `--type-mast-hq` (H1, scaled to 56px override), `--type-sec-hq`, `--type-body-hq`, `--type-agate`, `--type-eyebrow-hq`, `--type-label-hq`, `--type-num-hq`, `--type-ui-hq`

No new tokens needed for this view.

---

# § 3e.7 — Ratification block

Accepted:
- Directory as a dense table (NOT card grid) — reference data density wins.
- Public-by-default per monetization model; anonymous viewers see read-only shells with signup CTA strip.
- Friend-status CTA states per 3e.1.5.
- Championship badges inline-right of name, max 3 + `+N` overflow chip.
- First-time "Starter pack" strip dismisses on first friend-add or 7th visit.
- Empty-league state directs Commissioner to invite flow.

All 3 gaps resolved by Founder ratification 2026-05-12:
1. Founding-20 auto-friend baseline: retroactive backfill at W1.S3 ship time. Single migration write within W1.S3 execution; audit log entry per relationship; manual friend-add flow active afterward.
2. Starter pack dismissal trigger: first friend-add OR 7th visit (per spec proposal). Both function as escape hatches.
3. Public viewer access: handicap + championship badges visible to unauthenticated viewers per public-by-default profile baseline.

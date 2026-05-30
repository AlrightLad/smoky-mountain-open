# CLUBHOUSE_SPEC-HQ — Part 2, View 3k: Feed v2

> **Status:** Tier 2 deliverable. All [GAP] questions pre-answered by Founder ratification 2026-05-12.
> **Canonical mock:** Chrome inherits from `Parbaughs HQ Final v2.html`. Card composition draws from existing `Parbaughs Feed v2.html` Draft. Chip card variant is net-new per W1.S11_VISION_AMENDMENT.md.
> **Ship:** W1.S11 — Feed + Activity. Includes Chip post type per locked amendment.
> **Scope:** Single-column editorial feed with 2-tab scope (League / Community), Chip + Round + Activity card types, day-eyebrow grouping, quoted-reply pattern.

---

## 0 — View scope

The Feed is the league's published-conversation surface — Chips, rounds, and auto-posted activity in reverse-chronological order. Country-club tone: "worthwhile reading not addictive scroll." Plenty of whitespace, day eyebrows for rhythm, live rounds pinned to top.

**Critical naming note:** Second tab is **"Community"** (placeholder per Founder ratification — orchestration team picks final name via decision-bubble at ship execution time per W1.S11 amendment).

States covered:
- **3k.1** — Default League scope, populated feed
- **3k.2** — Community scope, populated feed
- **3k.3** — Empty League scope (early-season or new league)
- **3k.4** — Empty Community scope (off-season cross-league quiet)
- **3k.5** — Live round pinned variant
- **3k.6** — Public viewer (unauthenticated)

---

# § 3k.1 — Default League scope

## 3k.1.1 Frame composition

| Slot | Token / Spec | Notes |
|---|---|---|
| Top nav | `--nav-h` | Per Part 1 § 4 |
| Tab switcher | `--tabs-h` | "Feed" tab active |
| Masthead | ~140px (working surface — feed is daily-use) | See 3k.1.3 |
| Scope rail | `--scope-h` | 2-tab scope + composer prompt |
| Single column body | flex centered (max 720px content width per HQ Part 1 § 9.4) | NO agate rail — feed wants reading rhythm without sidebar competition |
| Footer | per Part 1 § 14 |

## 3k.1.2 Banner

Same as HQ Home (3a) — live round banner pins above masthead when active.

## 3k.1.3 Masthead

- **Eyebrow:** `THE FEED · {LeagueName}` (when League scope) or `THE FEED · COMMUNITY` (when Community scope)
- **H1:** `What's happening.` (Fraunces 56px italic)
- Sub-deck and date line: omit (working surface, not editorial publication).

## 3k.1.4 Scope rail

| Control | Spec |
|---|---|
| Scope tabs | 2-tab segmented: `League` (default) · `Community` (placeholder name). Mono 11px 1.5px tracking. Active = brass underline 2px. |
| Composer prompt | Inline text input styled as Fraunces italic 15.5px placeholder `What's on your mind?` Tap opens Composer (§3l) with `chip` variant. |
| Right-aligned meta | `{N} posts today` mono 10.5px mute-soft |

## 3k.1.5 Main column — feed list

Single-column reverse-chronological feed. Day-eyebrow groupings separate days; eyebrows sticky-on-scroll matching Calendar list pattern from 3f.2.

### Day eyebrow

Mono 11px 1.5px tracking brass uppercase, `--space-6` top padding (breathing room before each new day). Format examples:

- `TODAY · APR 14`
- `YESTERDAY · APR 13`
- `APR 12 · SATURDAY`
- `APR 5 · LAST WEEK · SATURDAY`

Eyebrow sticks to top of viewport on scroll until next day eyebrow pushes it out.

### Card spacing

Cards stack vertically. Inter-card gap: `--space-6`. Card width matches feed max (720px content width). No card backgrounds — cards delineate via top/bottom 1px `--cb-line` hairlines + whitespace.

## 3k.1.6 Card types

### Card type A — Live round (pinned)

Renders **above day eyebrows** when active — always at top of feed regardless of post time.

| Element | Spec |
|---|---|
| Card eyebrow | `LIVE · ROUND IN PROGRESS` mono 11px brass + pulse dot |
| Member | Avatar 48×48 + Fraunces italic 20px name + title badge (if earned) |
| Body | `{Member} is on hole {N} at {Course} · {ScoreToDate}` Fraunces 17px ink |
| Score numeral | Fraunces 600 40px brass tabular | Right-aligned |
| Action row | `Watch round →` brass CTA + `View detail →` mute link |

Card border: 2px `--cb-brass` left border (visual signal of liveness).

### Card type B — Chip post (NEW per W1.S11 amendment)

| Element | Spec |
|---|---|
| Header | Avatar 40×40 + username + discriminator (mono mute) + title badge + post timestamp (mono 11px mute right-aligned) |
| Body | Up to 280 char text, Fraunces 15.5px ink, line-height 1.55. Italic emphasis on member's markdown-italic syntax. |
| Optional attachment | 1 image OR round-card embed OR party-game-card embed (per §3l Composer specs) |
| Action row | `❤ {N}` heart + count · `Reply ({N})` · `Share to DM →` · `⋮` overflow menu |

### Card type C — Round post

Inherits format from existing `Parbaughs Feed v2.html`. Avatar + member + round summary card + member-authored recap text + action row.

### Card type D — Auto-posted activity

Smaller card density (no recap text). Auto-posted on: round finalized, championship awarded, friend joined league, wager initiated, wager settled, party game claimed, course added, trophy earned.

| Element | Spec |
|---|---|
| Eyebrow | Mono 11px brass — `CHAMPIONSHIP` / `WAGER` / `FRIEND` / etc. |
| Body | Generated copy per activity type: `Kayvan won "Iron Schedule" — 12 weeks consecutive` (championship) / `Zach and Nick locked a $25 wager on this morning's round` (wager) |
| Action row | Reply + Share to DM only — no heart reactions on auto-posts (system events) |

## 3k.1.7 Reactions (Wave 1: single heart)

- Single heart reaction on Chip + Round cards. No multi-emoji.
- Reaction count visible to all viewers.
- Tap-to-expand "Liked by 5 — Zach, Kayvan, Nick, +2" overlay.
- Auto-posted activity cards: NO heart reactions (system events, not conversation).

## 3k.1.8 Replies (Wave 1: quoted-reply pattern)

Per W1.S12 lock — NOT threaded comments.

- Tap `Reply` opens Composer (§3l) with the original card embedded as quote.
- Reply posts as a new Chip with quote-embed.
- Reply count on original card: tap to filter feed to that conversation's reply chain (renders the original + all reply Chips inline).

## 3k.1.9 Listener pagination

- Initial load: 30 cards.
- Cache-first pattern: read from cache on mount, attach Firestore listener for new posts.
- Scroll-to-load-more: 30 cards per batch.
- Maximum loaded set: 300 cards. Then "Show more from archive" affordance unloads listener and switches to one-shot queries.

## 3k.1.10 Cross-surface dependencies

| Reads | Writes |
|---|---|
| `feed-posts/{leagueId or community}/*` | `feed-posts/.../{postId}/reactions[]` on heart toggle |
| `members/{authorId}` for each card | `feed-posts/.../{postId}/last-read-at` (per-viewer last-read pointer) |
| `rounds/{roundId}` for round-card embeds | |
| `feed-posts/.../{postId}/reply-count` (denormalized) | |

---

# § 3k.2 — Community scope

Same frame; feed contents source from public posts across all leagues + Lone Wolf members.

Scoping rules:
- Cards from members the viewer follows (Wave 4 feature — Wave 1 fallback: all public posts platform-wide).
- Cards from members in shared leagues count too (overlap).
- Cards from members the viewer has blocked: hidden.

Day-eyebrow grouping identical to League scope.

---

# § 3k.3 — Empty League scope

When League scope has 0 cards:

- Editorial empty per HQ Part 1 § 13:
  - Eyebrow: `NOTHING HERE YET`
  - H2 (Fraunces 30px): `The league hasn't started talking yet. Be the first.`
  - Body (Fraunces 15.5px mute): `Post a Chip or log a round — the feed wakes up when members post.`
  - CTA: `+ Post a Chip →` brass

If League scope is in active off-season (League settings `season-status: off`): editorial copy varies — `Off-season silence. The course is still here.`

---

# § 3k.4 — Empty Community scope

When Community scope has 0 cards (rare — usually overlap with other leagues guarantees activity):

- Editorial empty per HQ Part 1 § 13:
  - Eyebrow: `OUTSIDE THE LEAGUE`
  - H2: `Quiet across the platform.`
  - Body: `Cross-league activity surfaces here. Check back when other leagues post.`

---

# § 3k.5 — Live round pinned variant

When ≥1 live round active in current scope: live round card renders above day eyebrows + above all dated cards.

Multiple live rounds: stack of cards (max 3 visible, then "+N more live →" link to Live Now overlay).

---

# § 3k.6 — Public viewer

Unauthenticated visitor to a public league's feed.

| Change vs 3k.1 |
|---|
| Composer prompt is replaced with signup CTA strip — `Sign up to post Chips and join the conversation. Sign up →` |
| Reactions and Reply actions on cards: tap prompts sign-in modal |
| Cards from members with `activity-visibility: League only` are hidden (privacy default per 3h.1.5) |
| Cards from members with `activity-visibility: Public` are visible |

---

# § 3k.7 — Accessibility

- Day eyebrows: `<h2>` with `aria-label` synthesizing full date.
- Cards: `<article role="article">` with `aria-label` synthesizing author + post type + timestamp.
- Live round card: `aria-live="polite"` for score updates.
- Reactions toggle: `<button aria-pressed>` reflecting state; `aria-label="Heart this post, 5 reactions"`.
- Composer prompt: `<button aria-haspopup="dialog">` since it opens Composer modal.
- Scope tabs: `role="tablist"`, each tab `role="tab"`, `aria-selected` reflects active.

---

# § 3k.8 — Token consumption summary

- Surfaces: `--cb-chalk`, `--cb-chalk-deep` (card backgrounds where used, mostly transparent)
- Text: full ink + mute family
- Accent: `--cb-brass`, `--cb-brass-deep`
- Status: `--cb-claret` (rare — used for moderation flags only)
- Lines: `--cb-line`
- Type: standard HQ family — no new tokens.

---

# § 3k.9 — Ratification block

Accepted:
- 2-tab scope: `League` (default) and `Community` (placeholder, orchestration picks final name).
- Single-column editorial feed (no agate rail).
- Day-eyebrow grouping, sticky on scroll.
- 4 card types: Live round (pinned), Chip post, Round post, Auto-posted activity.
- Single heart reaction at Wave 1; tap-to-expand reaction list.
- Quoted-reply pattern (Wave 1) — NOT threaded comments.
- 30 cards initial, 300 cards max in listener, then archive unload.
- Public viewer surface respects per-card activity-visibility from 3h.1.5.
- All [GAP] questions pre-answered in TIER2-4_DESIGN_BOT_BRIEF.md.

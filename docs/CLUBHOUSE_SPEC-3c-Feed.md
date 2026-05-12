# CLUBHOUSE_SPEC — Part 2, Sub-pass 3c: Feed Tab

> **Status:** Awaiting Founder ratification. Subordinate to Part 1 (`docs/CLUBHOUSE_SPEC.md`), Sub-passes 3a + 3b.
> **Pass:** 3c of 4. Folded into final CLUBHOUSE_SPEC.md at Part 2 § 3c after ratification.
> **Scope:** 4 Feed-tab screens.

---

## 0 — Sub-pass scope

- **3c.1 — Feed root (segmented Chat / Pulse / DMs)**
- **3c.2 — League Chat full**
- **3c.3 — DMs list + thread**
- **3c.4 — Activity detail**

Every screen clears 12 rejection criteria, cites Part 1 tokens, declares cross-surface consumers, references reduced-motion + Sunlight, lists a11y.

---

# Screen 3c.1 — Feed Root (Segmented)

## 3c.1.1 Purpose

The Feed tab is the social anchor. Three sub-views via segmented control:

- **Chat** (default) — league-wide conversation per Pass 1 § 4
- **Pulse** — system-generated activity (rounds logged, awards earned, aces, kudos)
- **DMs** — 1:1 private threads

Per Pass 1 § 5.2 mobile tab synthesis, **Chat is the default sub-view** because it's the highest-frequency communication surface.

## 3c.1.2 Frame

| Slot | Spec |
|---|---|
| Masthead | Standard (3a.1.3) |
| Sub-segment header | 56px tall, `--bg`, divider 1px `--cb-line` below |
| Content | Sub-view-specific scroll container |
| Composer / FAB | Sub-view-specific (Chat has composer; Pulse has none; DMs has FAB for new thread) |
| Tab bar | Standard |

## 3c.1.3 Sub-segment control

Horizontal three-tab control, full-width:

| Element | Token | Notes |
|---|---|---|
| Container | `--space-5` page gutter, `--space-3` vertical padding |  |
| Track | 1px `--cb-line` bottom border on container |  |
| Tab (each) | `--type-label` (uppercase, 0.08em tracking), `--cb-mute` inactive / `--cb-ink` active | `CHAT · PULSE · DMS` |
| Active indicator | 2px `--cb-brass` underline beneath active tab, 32px wide, centered under tab label | Animates `--motion-quick` between tabs |
| Unread badge | Small dot `--cb-brass`, 6×6, top-right of tab label, if unread items in that sub-view | Present on Chat / Pulse / DMs independently |

Tap switches sub-view; horizontal swipe also switches (Pass 2 § 5.3 swipe vocabulary).

## 3c.1.4 Sub-view persistence

Feed remembers last-visited sub-view across navigations. Returning to Feed tab from another tab restores prior sub-view. App fresh-open lands on **Chat** unconditionally.

## 3c.1.5 States

| State | Behavior |
|---|---|
| **Loading sub-view** | Skeleton specific to sub-view per its screen spec |
| **Tab switch** | Cross-fade content `--motion-quick`; indicator slides under new label |
| **Sub-view error** | Sub-view-specific empty + retry |
| **No unread anywhere** | No badges visible |

## 3c.1.6 A11y

- Sub-segment: `role="tablist"`, each tab `role="tab"`, `aria-selected` reflects active.
- Active tab announces with current unread count: `"Chat tab, 3 unread, selected"`.
- Swipe to switch: announces via `aria-live="polite"` ("Now viewing Pulse").
- Active indicator: decorative; not announced.

## 3c.1.7 Reduced motion + Sunlight

- Reduced motion: indicator slide → instant move; cross-fade → instant swap.
- Sunlight: active label shifts from `--cb-ink` to `--cb-felt-deep`; indicator from `--cb-brass` to `--cb-felt`.

## 3c.1.8 Cross-surface consumers

- Routes to **3c.2** (Chat sub-view content), **3c.4** (Activity detail via Pulse rows), **3c.3** (DMs list).
- Reads `members/{id}.feedLastSubView` for restoration (`[INFERENCE]` — confirm field name during W1.S11).
- Reads unread counts: `leagues/{leagueId}/chat.lastReadAt` per-member, `activity.lastReadAt`, `dms/{threadId}.lastReadAt`.

---

# Screen 3c.2 — League Chat Full

## 3c.2.1 Purpose

The dedicated league-wide chat surface. Per Pass 1 § 4: linear, quoted-reply substitute for threading, kudos-pattern reactions, founder pin (one at a time), shared masthead badge with DMs, Wave 1 image attachments per ratified locks.

## 3c.2.2 Frame

Renders inside Feed root frame with sub-segment showing Chat selected. Adds:

| Slot | Spec |
|---|---|
| Pinned banner (conditional) | Below sub-segment, full-width, `--cb-brass-soft` background, `--space-3` padding |
| Message scroll container | Flex 1, reverse chronological (newest at bottom), auto-scroll-to-bottom on send |
| Composer | Anchored bottom above tab bar, multi-line text input with attachments |

## 3c.2.3 Pinned banner (founder pin)

| Element | Token | Notes |
|---|---|---|
| Container | `--cb-brass-soft` fill, 1px `--cb-brass-faint` bottom border, `--space-4` x-pad, `--space-3` y-pad |  |
| Pin glyph | 14×14 left, `--cb-brass-deep` stroke |  |
| Pinned message preview | `--type-body-sm`, `--cb-felt-deep`, 1-line truncate | `Mr Parbaugh pinned: "Saturday 9 AM tee at Ocean Pines …"` |
| Tap behavior | Scrolls to pinned message in stream + brief brass highlight pulse (1200ms `--motion-quick`) |  |

Founder-only: long-press on any message → action sheet with `Pin to top` / `Unpin` / `Delete` (with audit log per Pass 1 § 4.2). Members: long-press own messages → `Edit (within 5 min)` / `Delete` / `Quote-reply`.

## 3c.2.4 Message row (each)

Day-grouped: a date separator (`--type-label`, `--cb-mute`, centered, hairlines either side) renders before the first message of each calendar day.

| Element | Token | Notes |
|---|---|---|
| Avatar | 32×32, `--radius-pill`, left | Tap → member profile sheet |
| Header row | `--space-1` below avatar baseline | Sender first name (`--type-body` 15px 600 sans, `--cb-ink`) · time (`--type-body-sm`, `--cb-mute`) |
| Message bubble | No fill (text floats); `--type-body` 15px 400 sans, `--cb-ink`, text-wrap pretty | Max width 84% of column |
| Quoted-reply preview (conditional) | Above message: 2px `--cb-brass-faint` left border, `--space-2` left padding, `--type-body-sm` `--cb-mute` italic | Tap → scrolls to source message |
| Image attachment | Below text: max 240×240, `--radius-md`, 1px `--cb-line` border | Tap → fullscreen viewer |
| Reactions cluster | Below message, `--type-body-sm` | `❤ 3` style — reuses kudos pattern from Pass 1 § 4.2 |

Long-press on any message → action sheet (member's own vs. others' permission-tiered per § 3c.2.3).

## 3c.2.5 Consecutive-message grouping

Messages from same sender within 3 minutes group:

- Avatar + header row render once (first message).
- Subsequent messages render with same left indent, no avatar, no header.
- Visual rhythm: less chrome for natural conversation cadence.

## 3c.2.6 Composer

| Element | Token | Notes |
|---|---|---|
| Container | `--bg`, 1px `--cb-line` top border, `--space-3` padding, safe-area-bottom-aware |  |
| Attach button | 44×44 left, `--cb-mute` stroke paperclip glyph | Tap → action sheet: `Photo from library` / `Take photo` / `Share active round` |
| Text input | Flex 1, `--type-body` 15px sans, min 44px / max ~4 lines auto-grow, `--cb-mute` placeholder `Talk to the league…` | Soft 1000-char counter past 800 (Pass 1 § 4.2) |
| Send button | 44×44 right, `--cb-brass` fill / `--cb-felt-deep` arrow glyph when input non-empty; `--cb-chalk-deep` / `--cb-mute` when empty | Disabled state has `aria-disabled` |

Send on tap; **also on Enter** with `Shift+Enter` for newline (external-keyboard members).

## 3c.2.7 @mention autocomplete

Typing `@` triggers floating list above composer:

- List of league members matching subsequent chars from `fbMemberCache`.
- Up to 5 members shown, ranked by recent-interaction.
- Tap or Enter selects; chip-style inline render in composer: `@Nick`.
- Mentioned member receives notification per Pass 1 § 4.3.

## 3c.2.8 Quoted-reply flow

Long-press a message → `Quote-reply`. Composer prefills:

```
> {original sender} said:
> {first 80 chars of message…}

```

Member types reply below the quote. On send, renders as quoted-reply preview per § 3c.2.4.

## 3c.2.9 Image attachment flow

Tap attach → action sheet → photo source. Capacitor camera/photo plugin per Pass 2 § 7. Selected image:

- Compressed client-side to max 1600px longest edge before upload (Pass 2 § 8 cost discipline).
- Uploads to Firebase Storage at `leagues/{leagueId}/chat/{messageId}/{photoId}.jpg`.
- Inline progress: brass progress bar across composer top during upload.
- On failure: composer retains image + retry chip.

## 3c.2.10 Round-share flow

`Share active round` action: opens picker of member's own finalized rounds (recent 10). Tap a round → composer prefills with rich-card embed (Pass 1 § 4.2):

| Element | Spec |
|---|---|
| Card | `--bg-sunk`, `--radius-md`, `--space-3` padding, full-width minus composer padding |
| Course name | `--type-body-sm`, `--cb-ink`, 600 |
| Score + over-par | `--type-stat-md`, tabular-nums, `--cb-ink` · `--cb-brass-deep` for over-par |
| Date + format | `--type-label`, `--cb-mute` |
| Tap (in chat) | Opens Round detail in Play tab |

## 3c.2.11 Pagination

- Initial load: last 50 messages.
- Scroll to top of stream → loads previous 50 (paginated read per Pass 1 § 4.4 cost discipline).
- Loading state: brass spinner top of scroll container.

## 3c.2.12 States

| State | Behavior |
|---|---|
| **Empty chat** | Centered: `Quiet here.` (`--type-h3`, `--cb-mute`) + sub-line `Be the first.` Composer remains active. |
| **Loading** | Skeleton message rows × 6; shimmer per Pass 2 § 4 |
| **Network error on send** | Message renders with `--cb-brass-deep` italic timestamp `Sending…` then `Failed · tap to retry` if fails |
| **Offline** | Composer remains active; messages queue locally; banner strip `OFFLINE — sending when you're back online` |
| **Permission: muted member** | Composer disabled; placeholder `You're muted by founder.` |
| **Founder mute-all-toggle on** | Composer disabled for non-founders; banner top `Chat muted by founder — planning a trip.` |

## 3c.2.13 Reduced motion

- Pin highlight pulse: instant brass background → fade out 600ms removed; brass stays static for 2s then removes.
- Auto-scroll-to-bottom on send: instant jump (no animated scroll).
- Mention autocomplete entry: instant.

## 3c.2.14 Sunlight mode

- Pinned banner: `--cb-brass-soft` → `--cb-felt-soft` for outdoor-readable contrast.
- Quoted-reply left border: `--cb-brass-faint` → `--cb-brass-deep`, thickens to 3px.
- Message text: `--cb-ink` → pure black `oklch(15% 0 0)` for max contrast.
- Composer border thickens 1px → 1.5px.

## 3c.2.15 A11y

- Message stream: `role="log"`, `aria-live="polite"`, `aria-relevant="additions"`.
- Each message: `role="article"`, `aria-label` includes sender + time + message body.
- Avatar: focusable, `aria-label="Open Nick's profile"`.
- Composer: `role="textbox"`, `aria-multiline="true"`, `aria-label="Message the league"`.
- Send button: `aria-label="Send message"`; disabled state announces "Type a message to send."
- Pinned banner: `role="region"`, `aria-label="Pinned message"`.
- Mention autocomplete: `role="listbox"` while open; messages within `role="option"`.
- Reactions: `aria-label="3 kudos, tap to add yours"`.

## 3c.2.16 Cross-surface consumers (Criterion 12)

| Surface | Operation |
|---|---|
| `leagues/{leagueId}/chat` | Read + Write — primary |
| `leagues/{leagueId}/chat.lastReadAt` per-member | Write on view |
| `fbMemberCache` | Read (avatars, mention autocomplete) |
| Firebase Storage `leagues/{leagueId}/chat/.../*` | Write (images) |
| `members/{id}/notifications` | Indirect write (Cloud Function on @mention) |
| Capacitor camera/photo | Read (attach photo) |
| Navigates to **Round detail** (round-share tap), **Member profile sheet** (avatar tap) |

Firestore composite index `(leagueId, createdAt desc)` required (Pass 1 § 4.4 reaffirmed).

---

# Screen 3c.3 — DMs (List + Thread)

## 3c.3.1 Purpose

1:1 private threads. Uses existing `chat.js` infrastructure per Pass 1 § 4.5. The screen has two states: **thread list** (no thread selected) and **thread open**.

## 3c.3.2 List state

### Frame

| Slot | Spec |
|---|---|
| Sub-segment header | DMs selected |
| Thread list scroll | Vertical list of conversations, sorted by most-recent-message |
| FAB | Bottom-right, 56×56, `--cb-brass` fill, pencil glyph; tap → new-thread member picker |

### Thread row (each)

| Element | Token | Notes |
|---|---|---|
| Avatar | 44×44, `--radius-pill`, left | Other party's avatar |
| Name | `--type-body`, 16px 600 sans, `--cb-ink` | First + last name |
| Last message preview | `--type-body-sm`, `--cb-mute`, 1-line truncate | If sent by viewer: prefix `You: ` |
| Timestamp right | `--type-body-sm`, `--cb-mute` | `12m` / `Yesterday` / `Tue` / date |
| Unread pip | 8×8 dot `--cb-brass`, right of timestamp | Hidden when read |

Tap → opens thread (3c.3.3). Swipe-left on row exposes `Mute` and `Delete thread` actions.

### New-thread flow

Tap FAB → bottom sheet member picker (search via `fbMemberCache`). Recently-DM'd at top, then alphabetical. Tap member → opens empty thread.

### Empty state (no DMs ever)

Centered: `No DMs yet.` (`--type-h3`, `--cb-mute`) + `Tap the pencil to start one.` Includes FAB visible.

## 3c.3.3 Thread state

### Frame

Replaces list. Pushes from right (Pass 2 § 5.3 navigation gesture).

| Slot | Spec |
|---|---|
| Thread header | 56px, `--bg`, 1px `--cb-line` bottom border |
| Message stream | Identical message-row spec to 3c.2 except no @mention (1:1 by definition) |
| Composer | Identical to 3c.2.6 with placeholder `Message {first name}…` |

### Thread header

| Element | Token | Notes |
|---|---|---|
| Back arrow | 44×44 left, `--cb-mute` stroke | Edge-swipe-back also works; `aria-label="Back to messages"` |
| Avatar | 32×32, center-left | Tappable → profile sheet |
| Name | `--type-h3` (18px sans 600), `--cb-ink` | `Nick Parbaugh` |
| Online/last-seen | `--type-body-sm`, `--cb-mute`, below name | `Active now` / `Active 5m ago` / `Active yesterday` (`[INFERENCE]` — confirm presence model W1.S12) |
| Overflow menu right | 44×44, `--cb-mute` glyph | Tap → `Mute thread` / `Block` / `Delete thread` |

### Message rows

Same spec as League Chat (3c.2.4) with these differences:

- **Image attachments:** same flow.
- **Round-share:** same flow.
- **Reactions:** allowed.
- **Quoted-reply:** allowed.
- **No @mentions** — irrelevant in 1:1.
- **No pinned messages** — irrelevant in 1:1.
- **No founder moderation** — both participants have symmetric edit/delete rights on own messages.

### Read receipts

When other party reads, a small `Read 2m ago` line appears below the viewer's last-sent message in `--type-label`, `--cb-mute`, right-aligned. Founder-side preference can disable globally; respects per-thread setting too. `[INFERENCE]` — confirm receipt model during W1.S12.

## 3c.3.4 States

| State | Behavior |
|---|---|
| **Empty thread (new)** | Composer focused on open; thread header active; no messages render |
| **Other party blocked viewer** | Composer disabled; banner `You can't reply here.` — no error specifics (per Pass 2 a11y respect for privacy) |
| **Viewer blocked other party** | Composer disabled; banner `You blocked Nick. Unblock to message.` with `Unblock` link |
| **Loading** | Skeleton messages × 4 |
| **Network error on send** | Same retry pattern as 3c.2 |
| **Permission: spectator member** | DMs disabled entirely for spectator-tier members (`[INFERENCE]` — confirm during W1.S12) |

## 3c.3.5 Reduced motion + Sunlight

- Thread push-from-right: instant cross-fade.
- Read-receipt fade-in: instant.
- Sunlight: thread header border thickens; avatar ring (1px `--cb-brass-faint`) thickens to 1.5px.

## 3c.3.6 A11y

- List rows: `role="link"`, `aria-label` includes name + last-message preview + unread state.
- FAB: `aria-label="New conversation"`.
- Thread header: `role="banner"`; back arrow tab order is first.
- Read receipts: `aria-live="polite"`, announces "Read at 2:14 PM" on update.
- Composer: same as 3c.2.

## 3c.3.7 Cross-surface consumers

| Surface | Operation |
|---|---|
| `dms` collection (1:1 threads) | Read + Write |
| `dms/{threadId}/messages` | Read + Write |
| `fbMemberCache` | Read (avatars + new-thread picker) |
| `members/{id}.presence` | Read (online/last-seen — `[INFERENCE]`) |
| `members/{id}.blockedUsers` | Read + Write |
| Firebase Storage `dms/{threadId}/*` | Write (images) |
| Masthead messages badge | Shared counter with League Chat |

`chat.js` infrastructure is the shared write path with League Chat per Pass 1 § 4.5. Message-shape consistency is the cross-surface contract.

---

# Screen 3c.4 — Activity Detail

## 3c.4.1 Purpose

Per-entry deep-link target from League Pulse (Home 3a.1.7) or Pulse sub-view (3c.1). One entry, expanded — round logged, kudos given, award earned, ace, custom activity.

## 3c.4.2 Frame

| Slot | Spec |
|---|---|
| Masthead | Standard |
| Back arrow | Top-left of content, replaces masthead title section visually |
| Scroll container | Activity content |
| Action bar | Bottom-anchored: `KUDOS` + `COMMENT` icon buttons |

## 3c.4.3 Activity types and content

The screen renders 4 content variants based on `activity.type`:

### Variant A — Round logged

| Element | Token | Notes |
|---|---|---|
| Eyebrow | `--type-label`, `--cb-brass-deep` | `ROUND · 1 WEEK AGO` |
| Headline | `--type-display`, `--cb-ink` | `98 at Ocean Pines.` |
| Author row | Avatar 36 + name + handicap pip | Tap → profile sheet |
| Score summary card | Same as Sync Round (3b.4.4) — front/back/totals | Smaller scale |
| Photos (if any) | Horizontal scroll of 200×200 thumbnails, `--radius-md`, 1px `--cb-line` border | Tap → fullscreen viewer |
| Note (if any) | `--type-body`, `--cb-ink`, in quoted-text container with `--cb-brass-faint` left border | The member's note |
| Conditions chips | Inline row of chips matching Sync Round selection |  |
| Drill-in | `View full scorecard →`, `--cb-brass-deep` | Tap → Round detail in Play tab |

### Variant B — Award earned

| Element | Notes |
|---|---|
| Eyebrow | `AWARD · 2 DAYS AGO` |
| Headline | `Nick earned the Hot Hand.` |
| Award glyph | 88×88, `--cb-brass` accent, centered |
| Award description | `--type-body-lg`, `--cb-mute` | `3 sub-90 rounds in 30 days.` |
| Earned at | `--type-body-sm`, `--cb-mute` | `On Tuesday, May 5 · 88 at Honey Run` |
| Drill-in | `View award details →` |

### Variant C — Ace

| Element | Notes |
|---|---|
| Eyebrow | `ACE · TODAY` (celebratory tone) |
| Headline | `Kayvan made an ace.` (single sentence, no period for impact — `[INFERENCE]` confirm tone) |
| Big number | `1` centered, `--type-display` size 96px serif 700, `--cb-brass` |
| Sub | `Hole 7 · Par 3 · 165 yards · Ocean Pines` |
| Drill-in | `View round →` |

### Variant D — Kudos given

| Element | Notes |
|---|---|
| Eyebrow | `KUDOS · 3H AGO` |
| Headline | `Mr Parbaugh sent kudos to Nick.` |
| Origin | Inline mini-card of original activity (round/award/ace) — tappable to that entry |

## 3c.4.4 Comments section

Below content, vertical stack of comment rows:

| Element | Token | Notes |
|---|---|---|
| Comment row | `--space-3` y-padding, no horizontal padding | Border-top 1px `--cb-line` except first |
| Avatar | 28×28 |  |
| Name + time | `--type-body-sm`, name `--cb-ink` 600, time `--cb-mute` |  |
| Body | `--type-body`, `--cb-ink`, wrap-pretty | Max 4 lines before "Show more" |
| Reactions inline | `--type-body-sm` | Same kudos pattern |

Comments support quoted-reply (same as League Chat); no threading. Founder + author of activity can delete comments.

## 3c.4.5 Action bar (bottom-anchored)

| Element | Token | Notes |
|---|---|---|
| Container | `--bg`, 1px `--cb-line` top border, `--space-3` padding |  |
| KUDOS button | Flex 1, `--type-cta`, `--cb-brass-soft` background when sent / `--bg-sunk` when not | Tap toggles kudos; shows count after label `KUDOS · 4` |
| COMMENT button | Flex 1, `--type-cta`, `--bg-sunk` background | Tap opens composer (slides over action bar) |
| Active comment composer | Same spec as League Chat composer but inline above action bar | `Esc` / cancel button hides; send posts comment |

## 3c.4.6 States

| State | Behavior |
|---|---|
| **Loading** | Skeleton: eyebrow + headline + content block + 2 skeleton comments |
| **Activity deleted** | Centered: `This activity was removed.` `--type-h3`, `--cb-mute` + back action |
| **Network error** | Same retry pattern |
| **Permission: activity from blocked member** | Returns to feed with toast `Can't view.` (privacy-respecting copy) |
| **Empty comments** | Comments section hidden entirely — no "0 comments" empty filler |

## 3c.4.7 Reduced motion + Sunlight

- Comment composer slide-over: instant.
- Kudos toggle: brass-soft background appears instantly under reduced motion (no fade).
- Sunlight: photos increase border to 1.5px `--cb-line`; ace number `--cb-brass` shifts to `--cb-felt-deep`.

## 3c.4.8 A11y

- Variant headlines: `aria-live="off"` (announced via back-link source context).
- Photos: each `role="img"`, `aria-label` from photo caption if present, else "Photo from Ocean Pines round."
- KUDOS button: `aria-pressed` reflects state; `aria-label="Kudos, currently 4, tap to add yours"`.
- COMMENT button: opens composer; composer first-focusable on open.
- Comments: `role="list"`, each `role="listitem"`.

## 3c.4.9 Cross-surface consumers

| Surface | Operation |
|---|---|
| `leagues/{leagueId}/activity/{id}` | Read |
| `activity/{id}/comments` | Read + Write |
| `activity/{id}/kudos` | Read + Write |
| `rounds/{id}` | Read (for round variant drill-in) |
| `awards/{id}` | Read (for award variant) |
| `fbMemberCache` | Read |
| Navigates to **Round detail (3b)**, **Award detail (W1.S9)**, **Profile sheet** |

---

# § Pass 3c — Open Inferences

| # | Inference | Where | Founder action |
|---|---|---|---|
| 3c-I1 | `members/{id}.feedLastSubView` field for restoration | § 3c.1.8 | Defer to W1.S11 |
| 3c-I2 | Member presence model (active now / last-seen) — server-derived or client-broadcast | § 3c.3.3 | Confirm cost model; could defer to Wave 2 |
| 3c-I3 | Read receipts default on/off + per-thread override | § 3c.3.3 | Confirm default + opt-out |
| 3c-I4 | Spectator-tier DM access (currently proposed: disabled) | § 3c.3.4 | Confirm |
| 3c-I5 | Ace celebration headline punctuation (no period) | § 3c.4.3 | Confirm tone vs. consistent punctuation |
| 3c-I6 | Kudos pattern reuse — single brass-tinted glyph (heart? flag? other?) | § 3c.4.5 | Confirm glyph; matches existing HQ pattern per memory |
| 3c-I7 | Comment editing — 5-min window like chat? Or no edits, only delete? | § 3c.4.4 | Confirm |

---

# § Pass 3c — Ratification block

You are accepting:

1. **Screen 3c.1** — Feed root with three-tab sub-segment (Chat / Pulse / DMs), Chat as default, swipe + tap switching, per-sub-view unread badges, sub-view persistence across navigations.
2. **Screen 3c.2** — League Chat full surface with pinned banner, day-grouped consecutive-message rows, quoted-reply pattern, @mention autocomplete, image attachments + round-share, 50-message pagination, six listed states.
3. **Screen 3c.3** — DMs list + thread combined screen: list with thread rows + FAB; thread with header + identical message vocabulary; read receipts; blocked-state handling.
4. **Screen 3c.4** — Activity detail with four content variants (round / award / ace / kudos), comments section, bottom action bar with KUDOS + COMMENT.
5. All 4 screens cite Part 1 tokens, declare cross-surface consumers, respect reduced-motion + Sunlight mode, list a11y treatment.
6. **7 inferences** require resolution before sub-pass 3d begins.

✏️ **Founder action:** Ratify, red-line, or amend per screen. Once ratified, sub-pass **3d — Stats tab** is next (~5 screens: Stats home, Round History, Records, Aces / Awards, Trophy Room / Season Recap).

**End of sub-pass 3c.** Standing by.

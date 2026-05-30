# CLUBHOUSE_SPEC-HQ — Part 2, View 3l: Composer Flows

> **Status:** Tier 2 deliverable. All [GAP] questions pre-answered by Founder ratification 2026-05-12.
> **Canonical mock:** Frame inherits chrome from `Parbaughs HQ Final v2.html`. Composer component is net-new but draws from existing `Parbaughs Composer Flows v1.html` Draft. Round-card embed reuses Round summary card from 3c Scorecard.
> **Ships:** W1.S11 Feed (Chip composer) + W1.S12 Chat (DM + League Chat composers) + W2.S3 Scorecard (round-recap-share composer).
> **Scope:** Single Composer component family, 4 variants, shared chrome with variant-specific differences.

---

## 0 — View scope

Single component family with variant props: `chip` | `dm` | `league-chat` | `round-recap`. Each variant inherits the same shell (character counter, image attachment, mention autocomplete, draft persistence, keyboard shortcuts) and differs only in: character limits, attachment permissions, mention scope, send destination.

Country-club composer tone: chalk background, brass cursor accent, Fraunces italic placeholder text — feels like a typewriter, not a chat input.

Variants covered:
- **3l.1** — `chip` variant (Feed, W1.S11)
- **3l.2** — `round-recap` variant (Scorecard, W2.S3)
- **3l.3** — `dm` variant (Chat, W1.S12)
- **3l.4** — `league-chat` variant (Chat, W1.S12)

---

# § 3l.SHELL — Shared composer chrome

All four variants render the same shell. Variant-specific details follow in 3l.1–3l.4.

## 3l.SHELL.1 Frame

| Slot | Token / Spec | Notes |
|---|---|---|
| Container | Modal-overlay for `chip` + `round-recap`; inline-in-thread for `dm` + `league-chat` | See variant tables for which |
| Background | `--cb-chalk` | Composer always chalk-background |
| Border | 1.5px `--cb-line`; top border 4px `--cb-brass` for modal variants | Brass signal of "authoring" |
| Padding | `--space-5` all sides | |
| Max-width | 640px (modal variants); full thread-width for inline variants |

## 3l.SHELL.2 Header (modal variants only)

| Element | Spec |
|---|---|
| Eyebrow | Mono 11px brass — variant-specific (`POST A CHIP`, `SHARE YOUR ROUND`, etc.) |
| Close button | `×` mono 18px mute-soft, top-right, `--space-3` inset |

## 3l.SHELL.3 Textarea

| Element | Spec |
|---|---|
| Container | Flex grow, min-height 96px |
| Font | Fraunces 17px ink, line-height 1.55 |
| Placeholder | Fraunces italic 17px mute-soft — variant-specific |
| Cursor accent | `--cb-brass` cursor caret |
| Border | Bottom 1px `--cb-line` only (no surrounding box — feels like writing on paper, not in a form) |

Auto-grow: textarea expands as typed, up to 6 visible lines. Beyond 6 lines: internal scroll.

## 3l.SHELL.4 Character counter (when char limit applies)

| Element | Spec |
|---|---|
| Container | Mono 11px right-aligned, `--space-2` below textarea |
| Color | `--cb-mute-soft` default; `--cb-brass` within last 20 chars; `--cb-claret` if at/over limit |
| Content | `{remaining}/{limit}` — e.g. `212/280` |

Over-limit: textarea outline brass-claret; submit button disabled until member trims.

## 3l.SHELL.5 Attachment area

Single attachment per composer instance (across all variants, per Founder ratification). Renders below textarea when attachment is added.

| Element | Spec |
|---|---|
| Image preview | Bounded 200×200, `--radius-md`, 1px `--cb-line` border, with `×` to remove top-right |
| Round-card embed | Inline card matching Round summary card from 3c, with `×` to remove |
| Party-game-card embed | Inline card matching party-game-share card from 3m, with `×` to remove |

## 3l.SHELL.6 Action row

| Element | Spec |
|---|---|
| Container | Flex row, `--space-3` top padding, top border 1px `--cb-line` |
| Attach picker (left) | Two icon buttons: 📷 (camera) + 🖼 (photo library). Mono 11px brass labels below each on hover. |
| Mention trigger (left) | `@` icon button. Inserts `@` at cursor + triggers autocomplete. |
| Submit (right) | `Post →` brass pill (variant-specific label). Disabled until ≥1 char OR ≥1 attachment. |
| Cancel (right) | Text-link mute `Cancel` left of submit. |

## 3l.SHELL.7 Mention autocomplete

| Element | Spec |
|---|---|
| Trigger | Typing `@` or tapping `@` icon |
| Popup | Absolute-positioned dropdown below cursor position, 280px wide, `--cb-chalk-deep` background, `--shadow-md`, `--radius-md`, 1px `--cb-line` border |
| Items | Per row: avatar + username + discriminator + title badge. Sort: recent interactions first, then alphabetical. |
| Selection | Arrow keys + Enter, OR click. Inserts `@username#XXXX` (displays as `@username` in body unless collision). |
| Scope | Variant-specific (see variant tables) |

## 3l.SHELL.8 Draft persistence

| Behavior |
|---|
| Write debounced 1s to `Preferences` |
| One draft slot per composer variant + context (chip = 1 slot; dm = 1 per thread; league-chat = 1 per league; round-recap = 1 per round) |
| Draft restored on next composer-open in same context |
| Draft cleared on successful submit OR explicit `Discard draft` (from `Cancel` confirmation) |

## 3l.SHELL.9 Keyboard shortcuts

- `Cmd-Enter` / `Ctrl-Enter` — submit
- `Escape` — close (with confirm if dirty)
- `Cmd-K` / `Ctrl-K` — toggle attachment picker
- `@` — trigger mention autocomplete

---

# § 3l.1 — `chip` variant (Feed, W1.S11)

| Field | Value |
|---|---|
| Container | Modal-overlay (centered on screen, scrim chalk-3 at 40%) |
| Trigger | Feed scope rail "What's on your mind?" prompt OR `+ Post a Chip` empty-state CTA OR floating action button at edge of Feed (when scrolled) |
| Eyebrow | `POST A CHIP · {LeagueName} or COMMUNITY scope` |
| Placeholder | `What's on your mind?` |
| Char limit | 280 |
| Image attach | 1 image max |
| Mention scope | League members (when League scope) + Friends across leagues (when Community scope) |
| Submit destination | Feed (`feed-posts/{scopeKey}/*`) |
| Submit label | `Post →` |
| Success | Composer closes; new Chip card appears at top of Feed; success haptic |

### Special composition: scope toggle

Above textarea, inline mono 11px segmented: `League: {LeagueName}` / `Community`. Toggles which scope the Chip posts to. Default matches viewer's current Feed scope.

---

# § 3l.2 — `round-recap` variant (Scorecard, W2.S3)

| Field | Value |
|---|---|
| Container | Modal-overlay |
| Trigger | "Post recap to feed →" share action from W2.S3 Scorecard view |
| Eyebrow | `SHARE YOUR ROUND · {LeagueName} or COMMUNITY` |
| Prefilled body | `Played {Course} today — {Score} ({ScoreToPar}).` |
| Char limit | 280 (Chip-derived) |
| Image attach | round-card auto-attaches (cannot be removed) + optional 1 photo |
| Mention scope | League members + Friends |
| Submit destination | Feed (creates Chip with round-card embed) |
| Submit label | `Post →` |
| Success | Composer closes; new round-recap Chip appears at top of Feed |

The round-card embed is fixed — member cannot remove it (that's the point of the share). Optional photo lives alongside the round-card embed.

### Scope toggle

Same as `chip` variant — League or Community.

---

# § 3l.3 — `dm` variant (Chat, W1.S12)

| Field | Value |
|---|---|
| Container | Inline at bottom of DM thread (NOT modal) |
| Trigger | Member opens DM thread |
| Eyebrow | Hidden — composer is part of thread chrome |
| Placeholder | `Message {OtherMemberName}…` |
| Char limit | Unlimited (no UI limit shown; warning only at 4000+ chars) |
| Image attach | 1 image per message |
| Mention scope | N/A (1-on-1 thread; member directory scope NOT league-scope) |
| Submit destination | DM thread (`dms/{threadId}/messages/*`) |
| Submit label | `Send →` or Enter key |
| Submit shortcut | Enter sends; Shift-Enter for newline |
| Read receipt | Triggers `last-read-at` write per W1.S12 last-read-pointer pattern |

## 3l.3.1 DM-specific behavior

- Multi-line: textarea expands as typed (1-6 visible lines, then scroll).
- Quick-tap send: Enter without Shift sends immediately (chat convention).
- Composer height: 56px min on single-line, expands up to ~200px before internal scroll.

---

# § 3l.4 — `league-chat` variant (Chat, W1.S12)

| Field | Value |
|---|---|
| Container | Inline at bottom of league chat thread |
| Trigger | Member opens league chat |
| Placeholder | `Message {LeagueName}…` |
| Char limit | Unlimited |
| Image attach | 1 image per message |
| Mention scope | League members |
| Submit destination | League chat thread (`leagues/{leagueId}/chat/*`) |
| Submit label | `Send →` |
| Submit shortcut | Enter sends; Shift-Enter for newline |
| Founder/Commissioner affordance | `📌 Pin to top` button inline with attach picker (Founder-only or Commissioner-of-this-league only) |

Pin behavior:
- Founder/Commissioner can pin one chat message at a time.
- Pinned message renders above all other messages with brass left-border + mono `PINNED` eyebrow.
- Re-pin replaces the previous pinned message (one-pin-at-a-time).

---

# § 3l.5 — Accessibility

- Textarea: `<textarea role="textbox" aria-label>` matching variant placeholder.
- Char counter: `aria-live="polite"`, announces `212 characters remaining` on near-limit.
- Attachment buttons: `role="button"` with explicit `aria-label="Add photo"`, etc.
- Mention autocomplete dropdown: `role="listbox"`, items `role="option"`, keyboard nav with arrow keys.
- Submit: `aria-disabled` reflects state; disabled reason announces via screen reader.
- Modal variants: focus trap, ESC to close (with confirm), focus restores to trigger on close.
- Inline variants: no focus trap; Tab moves naturally through thread.

---

# § 3l.6 — Token consumption summary

- Surfaces: `--cb-chalk`, `--cb-chalk-deep` (mention dropdown)
- Text: full family
- Accent: `--cb-brass`, `--cb-brass-deep`, `--cb-brass-soft` (pinned message)
- Status: `--cb-claret` (over-limit warning)
- Lines: `--cb-line`
- Type: `--type-body-hq`, `--type-eyebrow-hq`, `--type-label-hq`, `--type-ui-hq`

No new tokens.

---

# § 3l.7 — Ratification block

Accepted:
- Single Composer component family with 4 variant props (`chip`, `round-recap`, `dm`, `league-chat`).
- Shared shell (chrome, autocomplete, draft persistence, keyboard shortcuts) across all variants.
- 1 image per message/post across all variants (consistent simplicity).
- Char limits: 280 (chip + round-recap), unlimited (dm + league-chat).
- Modal-overlay vs inline-in-thread per variant table.
- Draft persistence per variant + context (1 chip draft, 1 per DM thread, 1 per league chat, 1 per round-recap context).
- Keyboard shortcuts: Cmd-Enter submit, Esc close, Cmd-K attach, @ mention.
- Founder/Commissioner pin affordance only on `league-chat` variant.
- All [GAP] questions pre-answered in TIER2-4_DESIGN_BOT_BRIEF.md.

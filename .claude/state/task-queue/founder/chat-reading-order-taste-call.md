---
status: open
severity: yellow
priority: LOW
founder_action_required: true
cost: "$0 (either keep current = no work, or I implement the flip = no paid deps)"
gate: none (reading-order is a brand-taste / product-feel decision, Founder-only)
execute_by: founder
verify_command: Test-Path .claude/state/design/chat-reading-order-decision.md
verify_expected: "True"
---

# Founder decision — Clubhouse chat reading order (taste call)

**Who can do this:** Founder only. This is a **product-feel / taste**
decision about how the Clubhouse chat reads. Per the three-agent workflow,
reading order is your call, not mine. I can implement either direction in
minutes once you pick; I must not flip the feel unilaterally.

**This does NOT block the staging product.** Chat works today and is shipped
on staging. This is a "which feel is right for Parbaughs" call, surfaced so
the choice is deliberate rather than defaulted.

## Why this matters

The Clubhouse chat currently renders as a **newest-at-top social feed** (like
a wall / Twitter timeline), not an **iMessage-style bottom-anchored thread**.
Concretely, in `src/pages/chat.js`:

- Messages load `orderBy("createdAt","desc").limit(50)` and render in that
  order with an explicit `// Keep newest-first order (no reverse)` — so the
  most recent message sits at the **top**.
- The composer ("Talk trash..." input + Send) sits at the **top**, above the
  feed.
- There is **no auto-scroll to the latest message** (nothing to scroll to,
  since newest is already on top).

That is a coherent design, but it is the opposite of what most people's
muscle memory expects from a "chat": phone texting, WhatsApp, Discord,
Slack, and group iMessage all put the **newest message at the bottom**, anchor
the composer at the bottom, and auto-scroll down on send.

So a member opening Clubhouse chat may briefly feel "this is backwards" until
they learn it is a feed. The question is whether the feed-feel is what you
want for Parbaughs, or whether the familiar texting-feel fits the
"group chat" half of the brand better.

## The trade-off (not an engineering call — a feel call)

| | Keep newest-at-top feed (current) | Flip to iMessage-style bottom-anchored |
|---|---|---|
| Feels like | a social wall / activity feed | texting / group chat |
| Newest message | top (seen immediately, no scroll) | bottom (scroll-to-latest on open + send) |
| Composer | top | bottom (thumb-reachable on mobile) |
| Strength | latest trash-talk is always the first thing you see; matches the like/comment "post" affordance already on each message | matches everyone's chat muscle memory; "group chat" brand fit; natural for back-and-forth |
| Cost to you | nothing (it already ships) | nothing (I implement; ~30 min + a staging review) |
| Risk if flipped | the per-message like/comment/reply bar reads slightly less "feed-like" | none functional; pure layout + scroll behavior |

My engineer's lean (yours to override): the per-message **like + comment +
reply** affordances already make each message read like a "post," which pairs
naturally with the **feed** layout. If Clubhouse is meant to feel like a
**conversation**, the iMessage-style flip is the stronger fit. Either is
defensible; it is a brand-feel call, which is why it is yours.

## Steps to resolve

1. **Decide:** reply in chat with one of:
   - **"keep the feed"** — newest-at-top stays; I record the decision so this
     item closes and nobody re-litigates it later.
   - **"flip to texting-style"** — I implement bottom-anchored order
     (reverse render to ascending, move the composer to the bottom,
     auto-scroll to latest on open + on send), put it on staging for your
     review, and record the decision.
   - **"defer"** — leave as-is for now; this item stays open as a known
     open taste call.
2. I record your choice to `.claude/state/design/chat-reading-order-decision.md`
   (this is what the verify below checks), and implement the flip if you chose
   it.

## Mark complete

Resolves automatically once the decision is recorded. To check:

```
powershell -ExecutionPolicy Bypass -File scripts/founder-mark-complete.ps1 chat-reading-order-taste-call
```

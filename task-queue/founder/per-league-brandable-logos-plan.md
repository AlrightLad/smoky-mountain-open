# Per-league brandable logos — plan (paid feature, later)

**Status:** PLAN ONLY (G7 part 2). Not built. Surfaced for your eventual go/budget.
**Context:** today every league shows the platform P+rose mark everywhere. This feature
lets a league upload/customize ITS OWN logo so the app feels like *their* club — a
natural premium/paid upsell for commissioners. Pairs with the per-league name + theme
that already exist.

## What members would get
- A league logo (uploaded image or a chosen built-in crest) that appears on the league's
  surfaces: league header/masthead, standings board, share pages, the scorecard share-card,
  and the league chip in the roster. The platform P+rose stays as the app/footer mark
  ("runs on Parbaughs"), so platform identity is never lost — the league mark is additive.

## The three build lanes (recommend Lane B first)
- **Lane A — pick a built-in crest (cheapest, zero-moderation).** Ship ~8–12 pre-made
  on-brand crests (rubber-hose/classic-club styles, recolorable to the league's theme).
  Commissioner picks one. No upload, no storage cost, no moderation, no abuse surface.
  Good free-or-cheap tier; ships fastest.
- **Lane B — upload a custom image (the real "brandable" ask; RECOMMENDED paid tier).**
  Commissioner uploads a PNG/SVG. Store in **Cloudflare R2** (we have it; zero egress —
  see [[database-stack-review-2026-06-22]]) NOT Firebase Storage (egress cost + it's the
  one media lane we'd want off Firebase anyway). Client-side resize/crop to a square +
  size cap (~256KB) before upload. Needs moderation (below).
- **Lane C — AI-generate a crest (delight, later).** Commissioner describes their club; we
  generate an on-brand crest via the image tools (Vertex/Recraft, [[reference_vertex_imagen_art_gate_open]]).
  Highest delight, highest cost/abuse-surface; layer on after B proves out.

## Data model (additive, non-breaking)
- `leagues/{id}.branding = { logoType: "platform"|"builtin"|"custom", builtinId?: string,
  logoUrl?: string (R2 public URL), updatedBy, updatedAt }`. Absent/`platform` = today's
  behavior (zero migration; every existing league unaffected).
- A render helper `leagueLogoUrl(league)` returns the league mark or falls back to the
  platform `pbThemeLogoUrl()` — single source of truth, mirrors the existing theme-logo helper.

## Rules + security (P8)
- Only `commissioner|admin|founder` of that league may write `leagues/{id}.branding`
  (a rules change — AMD-018 gate 2, your pre-auth + `seed-deploy-rules.mjs`).
- Custom uploads (Lane B) are the abuse surface: enforce size/type client+server; the
  R2 URL must be league-scoped + the upload must be authenticated. **Moderation:** a
  report/takedown path (rides on the existing UGC #208 report mechanism) + commissioner-only
  write keeps the blast radius to one league. Legal §6 (IP/identity): the commissioner
  warrants they own/can use the mark (a one-line terms acknowledgment at upload).

## Paid gating (the upsell)
- Lane A (built-in crest) = free or low tier. Lane B (custom upload) = the paid commissioner
  perk. This is a **subscription/entitlement** check, NOT the ParCoin economy (ParCoin stays
  cosmetic-only, non-gambling — [[project_parcoin_cash_purchase_model]]). Gate `logoType:"custom"`
  behind a league-level `isPro` entitlement. Entitlement plumbing is its own project
  (Stripe/RevenueCat) — out of scope for this plan.

## Recommended sequence when you greenlight
1. Lane A first (built-in crests) — free, fast, zero-risk, proves the display plumbing
   (`leagueLogoUrl` + all the surfaces) end-to-end.
2. Then Lane B (custom upload to R2) behind the paid entitlement, once entitlement plumbing
   exists. 3. Lane C (AI crest) as a later delight.

**Your call:** approve the direction (and which lane is free vs paid) and I'll build Lane A
first. No work starts until you greenlight (this is a paid-feature scope + economy/entitlement
decision).

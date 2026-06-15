# PARBAUGHS — Brand Brief for Design Generation

> **Purpose:** prepend / hand THIS to any design tool (Vertex Imagen, OpenRouter
> Fusion, Figma Make, a human designer) BEFORE generating ANY asset. The 2026-06-15
> brass-laurel ring failed because the prompt described the *object* but never
> briefed the *brand* — so it came out a generic gold "Olympic medal" frame, not
> PARBAUGHS. Every generation must be grounded in the identity below or it won't fit.

## What the app IS
PARBAUGHS — an invite-only golf-league app for a tight friend group (founding league
in York, PA). The vibe: **country club meets group chat meets fantasy sports.**
**Community over competition** in every decision. Members log rounds, compete in a
light league layer, earn ParCoin (cosmetic-only), and collect cosmetics. Premium but
warm and personable — never corporate, never generic.

## The core brand recipe (NON-NEGOTIABLE)
**Rubber-hose CHARACTER layer rendered INSIDE Holderness & Bourne-grade premium
presentation.** The two are complementary, never competing:
- **Holderness & Bourne** = the TOUR / premium lane. Understated prep-luxury:
  fine materials, restrained brass hardware, hand-enamel, fine leather, clean
  typography, tournament-white / tour-navy / charcoal. What pros wear *competing*.
- **Rubber-hose (1930s Cuphead-era cartoon)** = the LEISURE / character lane. Our
  caddies + casual + seasonal art. Bold black ink outlines, cel-shading, big pie-cut
  eyes, warm + playful. (Think MALBON's role, but our rubber-hose caddies instead of
  a golf-ball mascot.)

## WHICH lane for WHICH surface (the 2026-06-15 standardization)
- **Cosmetic ITEMS** (rings, nameplates, markers, titles, cards, banners, the new
  Club Crest + Bag Tag): **brass + H&B ONLY.** Brass / hard-enamel / fine leather /
  foil / struck metal. **NOT rubber-hose.** Refined, dignified, collectible.
- **Caddies + seasonal decorations + onboarding character art + leisure merch:**
  **rubber-hose** is welcome here (it's the character/themed layer). Decorations are
  the ONE shop place rubber-hose lives (themed/seasonal drops).
- **BRAND COHESIVENESS IS PARAMOUNT** — every asset must read as one of these two
  lanes, in the palette below, never a third generic style.

## Palette — EXACT hex values (from src/styles/base.css :root, Clubhouse default —
## verified current 2026-06-15; use these literal values in prompts so gen art MATCHES the app)
- **Felt green `#0F3D2E`** (`--cb-felt`) — the signature deep billiard/tournament-felt green
  (dark hero surfaces, the brand's anchor). Mid-green `#2F4A3A` (`--cb-green`), moss `#5A7D4E`.
- **Claret / burgundy `#8E3A3A`** (`--cb-claret`) — the red accent (Sunday-red + the rose).
  Ours is muted claret, NOT fire-engine red.
- **Antique brass `#B4893E`** (`--cb-brass`) — hardware + metal, RESTRAINED (a little catches
  the light; NOT bright yellow gold, NOT blasted "old-school" gold, NOT a shiny medal).
- **Cream canvas `#E7E0CD`** (`--cb-canvas`) — the warm page ground. Brightest paper `#FCFAF5`
  (`--cb-paper`). Sand `#C9B68A` (`--cb-sand`).
- **Ink `#14130F`** (`--cb-ink`) — near-black text. Slate `#5A6B78` (`--cb-slate`).
- Tour-lane neutrals (the H&B competing-kit colorway): tournament white, tour navy, charcoal.
- NOTE: the 6 OTHER themes recolor these tokens (e.g. Bluebird → navy/tour-blue brass, Azalea →
  rose). For brand-IDENTITY art generate in the DEFAULT Clubhouse palette above; the app
  re-tints per theme via the tokens.
- AVOID: bright/neon anything, yellow-gold "medal" gradients, Olympic/Roman laurel-gold,
  cold pure greys as a primary, fire-engine red.

## The mark + motifs
- **P+rose mark:** a serif capital **P** with a white **rose** climbing through it.
  The rose + thorn is a core motif.
- **Golf motifs:** hickory clubs (often crossed), the pin flag (claret pennant),
  tee, ball, the cup, course/fairway, laurel (sparingly, and in felt-green not gold).
- **Caddies (canonical, fixed portraits):** Murphy (steady default), Old Tom (gruff
  wisdom), Birdie (all-hype), Bag Room Guy (heckler). Rubber-hose style.

## What "didn't fit" looked like (so we don't repeat it)
The rejected ring: a gold **laurel-wreath medal** with green enamel + a red gem. Why
it missed: generic Olympic/Roman luxury, yellow-gold not antique-brass, no PARBAUGHS
motif (no rose, no golf, no felt palette read), no warmth. It could belong to any
app. A PARBAUGHS brass ring should read **golf-club + H&B**: e.g. a struck antique-
brass band with a crossed-hickory or pin-flag or rose motif, restrained, on our
palette — recognizably ours.

## Prompt checklist (every generation)
1. State the app + lane (tour/H&B vs leisure/rubber-hose) explicitly.
2. Name the palette colors (felt-green / claret / antique-brass / cream).
3. Include a PARBAUGHS motif (rose, crossed hickories, claret pennant) — not generic.
4. Restrained brass (catches light, not blasted gold). H&B understatement.
5. State the technical needs (transparent/chroma-key bg, hollow center for frames,
   centered/symmetric, the worn size it must scale to).
6. Self-critique vs THIS brief + the references before generating; generate ONE, vet,
   iterate (credit-caution).

## Cross-refs
[[project_brand_rubberhose_x_hb]] · [[project_cuphead_cartoon_style]] ·
[[feedback_design_is_generator_first]] · [[feedback_gemini_cosmetics_credit_caution]] ·
[[reference_openrouter_fusion_development]] · CLAUDE.md (brand section) ·
src/styles/base.css (Clubhouse tokens — the real palette values).

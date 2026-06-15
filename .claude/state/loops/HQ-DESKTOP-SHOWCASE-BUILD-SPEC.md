# HQ Desktop Immersive Showcase — build spec (grounded in the real codebase)

**Status:** spec ready; build is the next executing step (do it with fresh context —
this is a multi-pass, taste-critical, ≥9.5 build; Founder owns the visual sign-off
per AMD-028). Direction LOCKED by Founder 2026-06-15 (AskUserQuestion answers):
**same codebase, desktop DIVERGES** into an **awwwards-level brand-immersion**
experience — *not* muted/B&W, rubber-hose country-club, "completely different feel
than the app." **Brand-immersion-first** structure, **full-width / hybrid** (the
current centered ~680px column is explicitly NOT the answer).

## The 6-band structure (Founder's locked order)
1. **Full-bleed animated hero** — rubber-hose country-club scene, the P+rose mark,
   the league name, a single confident headline + the primary CTA. Full viewport
   width + height. Tasteful ambient motion (parallax/drift, reduced-motion-safe).
2. **Art showcase** — the brand world: caddies, crest, cosmetics, the illustrated
   course — the "country club" identity, full-width editorial.
3. **Merch storefront** — the Tour Collection (P+rose) lane + the leisure (rubber-
   hose) lane, retail-grade, reusing merch.js's TOUR/ACCESSORIES data.
4. **Live changelog** — the X.Y.Z "What's New" (v8.25.212) rendered as a desktop
   "what's shipping" band — proof of momentum. Reuse caddynotesArchive + the new
   Y-section grouping.
5. **Community** — the league as an atomic network: members, the feed's front page,
   standings teaser. Ties to the growth strategy (share pages → join).
6. **Join / open-the-app CTA** — invite-driven funnel for prospective members; for
   signed-in members, "enter the clubhouse" → the functional app.

## Architecture — how the SAME codebase diverges (the engineering decision)
Current desktop path (home.js): `_isHQViewport()` (≥720px) → `_renderHQHome(ctx)`
→ `PB.pageShell` banded editorial layout (lead + features + rails). The showcase is
a DIFFERENT experience, so:

- **New render branch, not a rewrite of the editorial HQ.** Add a desktop "showcase"
  layout that the **home** route renders at a wide breakpoint, keeping `_renderMobileHome`
  (mobile PWA, untouched) and preserving the functional editorial HQ as the
  signed-in "clubhouse" view reachable from the showcase's CTA. Recommended fork:
  - **Signed-OUT or first-touch on desktop** → the immersive showcase (top-of-funnel,
    matches merch/join/community/CTA bands + the growth strategy's public share pages).
  - **Signed-IN member on desktop** → keep the functional editorial HQ (their daily
    clubhouse), with an entry point INTO the showcase ("the front of house"). 
  - *(DEFAULT if unspecified — Founder can flip: signed-in desktop home could itself
    BE the showcase with the functional modules below the hero. Start signed-out =
    showcase, signed-in = editorial HQ; cheaper to validate, no regression to the
    member daily view.)*
- **Full-width:** the showcase bands break out of `.page-shell__container`'s max-width
  (the bands are `width:100vw` sections; content within each band uses its own inner
  max-width per band so text stays readable but imagery/hero go edge-to-edge).
- **New file:** `src/pages/home-showcase.js` (a deferred page module) holding the 6
  band renderers; home.js calls it from the desktop branch. Keeps home.js within the
  AMD-027 size budget.
- **Breakpoints:** reuse the page-shell bands (720/1280/1440) but the showcase is
  designed full-bleed-first; mobile (<720) NEVER sees it (PWA home unchanged).
- **Motion:** reuse animate.js (staggeredReveal / fadeInScale) + a new ambient
  hero-drift; all reduced-motion-gated.

## Art dependencies (the real gate to ≥9.5)
The hero + art-showcase bands need PREMIUM illustrated imagery (rubber-hose country
club) — this is the same art gate as merch/cosmetics. Free programmatic gen is
exhausted (Pollinations walled, Gemini image needs billing). So the **structure +
motion + layout** are agent-buildable now to ~9.0; clearing **≥9.5 needs the hero/art
imagery** (Founder's Figma-Make/Imagen-with-billing path + his taste sign-off). Build
the scaffold with on-brand CSS/vector placeholders, then drop in the real art.

## Phased build order (each phase ships to STAGING + V1; Founder reviews; prod when loved)
- **P1 — Scaffold + breakpoint fork.** home-showcase.js + the desktop showcase branch
  in home.js + full-bleed band CSS. V1: desktop renders the 6 empty bands full-width,
  mobile + signed-in HQ unchanged.
- **P2 — Hero band** (CSS/vector placeholder hero + headline + CTA + ambient motion).
- **P3 — Merch + changelog bands** (reuse merch.js data + caddynotesArchive).
- **P4 — Art showcase + community + join bands.**
- **P5 — Drop in real hero/art imagery** (art-gated) → Founder ≥9.5 sign-off → prod.

## Why a spec first (not a deep-context half-build)
This is the single largest, most taste-critical build in the directive. Per Superpowers
writing-plans + the Founder's #1 process mandate ("verify how it LOOKS, don't ship
half-baked"), a half-cut hero shipped from deep context = the exact churn he hates.
This spec lets the next (fresh-context) iteration execute P1→P5 incrementally, V1-ing
each band, with the art gate isolated to P5.

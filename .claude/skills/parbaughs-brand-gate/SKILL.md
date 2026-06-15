---
name: parbaughs-brand-gate
description: Use when generating, regenerating, sourcing, or wiring ANY visual brand asset — shop cosmetics (rings, markers, nameplates, titles, cards, banners, crest, bag tag), merch product art, avatar decorations, caddie/character art, onboarding/scene illustration, loading screens, share-card art, or page hero imagery — BEFORE the first generation call. Fires whenever a prompt mentions Imagen, Vertex, Gemini, Recraft, Figma Make, "generate art", "make a ring", a cosmetic SKU, or any on-brand image. Forces the locked brand spec + required size/purpose/usage into the prompt and RED-blocks off-brand output before the Founder ever sees it.
---

# parbaughs-brand-gate

> **Why this skill exists.** Two recurring failures — false-stops and
> off-brand "slop" (the rejected 2026-06-15 "Olympic-medal" crest/ring) — are
> ONE bug: a self-grading loop generating from memory and rationalizing its own
> output. Founder, 2026-06-15: *"these are not parbaugh related at all… explain
> the app and our direction BEFORE having these made"*; *"I need all tools and 0
> excuses as to why designs would be lackluster in the morning"*; and *"ensure
> that all image prompts are extremely specific and provide size needed and
> purpose of image and how it will be used… use your image generation prompt
> skill… so we are not generating a bunch of random images that are not cohesive
> or on brand."* The cure (3 independent research sources): **the doer cannot be
> the judge, and the brand cannot live in memory.** This skill makes the brand
> spec UNSKIPPABLE at generation time, makes size/purpose/usage MANDATORY, and
> makes the QC verdict MECHANICAL — not a vibe the doer recalls.
>
> **Authority:** Ship-gating for visual assets, exactly like P8 security.
> A brand **RED blocks ship**. A brand **YELLOW** (subjective taste at/above
> the 9.4 self-cap) needs Founder taste sign-off on staging (AMD-028).
>
> **Related:** `parbaughs-image-gen` (the HOW of generation — the
> senior-professional prompt formula + finishing pipeline; ALWAYS route the
> wrapped prompt through it before generating), `parbaughs-visual-judge` (the
> post-render MLLM scorer), `.claude/state/design/BRAND-BRIEF.md` +
> `BRAND-RULES.json` (the locked spec), AMD-028 (9.4 self-cap),
> [[feedback_brief_the_brand_before_generating]], [[feedback_design_is_generator_first]],
> [[feedback_rings_frame_not_cover_photo]], [[feedback_gemini_cosmetics_credit_caution]].

## When this skill activates

Invoke the moment you are about to generate, regenerate, source, or wire ANY
visual brand asset — and BEFORE the first generation call. If there is even a 1%
chance the output will be seen as "a PARBAUGHS asset," gate it.

Triggers: any cosmetic SKU art (ring / marker / nameplate / title / card /
banner / Club Crest / Bag Tag), merch product photo, avatar decoration,
caddie or character art, onboarding / scene / placeholder illustration, loading
screen, share-card art, page hero imagery — or any prompt that names Imagen,
Vertex, Gemini, Recraft, Figma Make, OpenRouter Fusion, "generate", "make art".

NOT for: pure UI chrome built from CSS tokens (that's the design-token system,
not generated art). If in doubt, gate it — gating costs seconds; slop reaching
the Founder costs a rejected ship and lost trust.

## The non-negotiable sequence (do these IN ORDER, never skip step 1)

```
1. INJECT  — run the script; it requires size+purpose+usage and injects the spec
2. LANE    — confirm the surface's house lane (tour/H&B vs leisure/rubber-hose)
3. RESEARCH— look at the real reference + the app's own canonical art (image-gen §0)
4. PROMPT  — refine the wrapped prompt into a senior-professional prompt via
             the parbaughs-image-gen skill (named-material + real-optics + one-light)
5. GENERATE— ONE generation, on a keyable bg, blank branded surfaces
6. JUDGE   — run the 5-point QC against the FINISHED PNG (doer != judge)
7. GATE    — RED -> regenerate with the failure in the negative; GREEN -> ship/escalate
```

### Step 1 — INJECT the locked spec + REQUIRED size/purpose/usage (scripted, unskippable)

Do not paraphrase the brand from memory, and do not generate without stating the
size, purpose, and intended use. Run the script and use its output verbatim as
the head of the prompt:

```bash
node scripts/brand-gate.mjs wrap \
  --lane <tour|rubberhose> \
  --size    "<exact dimensions + aspect + transparent? + the WORN render size it scales to>" \
  --purpose "<what this image IS — the SKU / surface it represents>" \
  --usage   "<exactly HOW + WHERE it renders in the app>" \
  --subject "<named-material + form clause for the object>"
```

`wrap` **exits non-zero** if you omit the lane, size, purpose, usage, or subject
— you literally cannot generate without them (Founder 2026-06-15: every image
prompt must carry size + purpose + how-it-will-be-used). The script reads
`BRAND-RULES.json` so palette hexes, the forbidden list, prohibitions, the
global negative, and the semantic anchor are always current and byte-identical
across a set. If the spec file is missing the script hard-fails (exit 2) — that
is correct: **no spec, no generation.**

> **The three required fields, why they matter** (each prevents a real failure):
> - **SIZE/FORMAT** — a ring generated without "hollow center == 92px photo,
>   1024² transparent" comes back as a filled disc that covers the face
>   ([[feedback_rings_frame_not_cover_photo]]). State the gen size AND the worn
>   render size it must scale to.
> - **PURPOSE** — "an apex-tier shop ring SKU" vs "a level-5 unlock deco" pulls a
>   different material tier; naming it keeps the SET cohesive, not a grab-bag.
> - **USAGE** — "raster overlay via playerDecoSrc, shown in shop preview +
>   try-it-on + every avatar surface" dictates transparency, framing, and that it
>   must read at thumbnail size. Skipping it produces a pretty image that doesn't
>   fit the slot.

### Step 2 — LANE (remove the judgment call)

Every asset is exactly ONE lane. Cosmetic ITEMS = **tour/H&B brass** (refined,
collectible — NOT rubber-hose). Caddies, seasonal decorations, onboarding /
character art, leisure merch = **rubber-hose** (the character layer). Resolve a
surface mechanically:

```bash
node scripts/brand-gate.mjs lane <ring|marker|caddie|decoration|crest|...>
```

> Balance rule (Founder 2026-06-15): rubber-hose is the SOUL — do not let
> "items standardize on brass" drain it from the app. The two are LAYERED, not
> competing: rubber-hose = the CHARACTER; brass/H&B-grade craft = the
> PRESENTATION it's wrapped in. Everything gets craft-quality.

### Step 4 — PROMPT through parbaughs-image-gen (senior-professional, generate ONCE)

The wrapped output is the BRIEF, not the final prompt. Route it through the
`parbaughs-image-gen` skill to get the senior-professional generation prompt
(named-material + real-optics + one-described-light formula, negatives written
as positive end-states, blank-then-composite logo rule). This is what stops the
"generic AI" look AND the recreate churn the Founder called out — get the prompt
right before spending a generation. Generate ONE, vet, iterate (credit-caution).

### Step 6 — JUDGE (mechanical, same 5 questions every time)

```bash
node scripts/brand-gate.mjs check
```

The 5-point QC (verbatim from `BRAND-RULES.json.qc_5point`):
1. **Would it read as PARBAUGHS even WITHOUT the logo?** (must be YES)
2. Palette: only approved hexes + antique brass (no yellow-gold / neon / pure-white)?
3. Correct LANE (rubber-hose vs tour/H&B) for the surface?
4. A real PARBAUGHS motif present (rose / crossed hickories / claret pennant — not generic luxury)?
5. Black ink weight + aged-paper ground + restraint (not slop tells)?

Read the finished PNG (V1) and answer each with EVIDENCE, not assertion. Q1 is
the load-bearing question — the "Olympic-medal" crest failed it: it could belong
to any app. Where possible hand this to `parbaughs-visual-judge` (a separate
pass) so the doer is not the judge.

### Step 7 — GATE verdict

| Verdict | Trigger | Action |
|---|---|---|
| **RED** | any palette-forbidden hit, any prohibition hit, or Q1 = NO | Do NOT ship. Regenerate with the specific failure appended to the negative. ≤3 retries before escalating the spec gap. |
| **YELLOW** | passes all 5 but is a HIGH-RISK asset OR a ≥9.5 quality claim | Ship to **staging only**; surface to Founder for taste sign-off (AMD-028). Self-rating capped at 9.4. |
| **GREEN** | passes all 5 + LOW-risk asset type | Finish + wire + V1-verify on real avatars; ship. |

HIGH-RISK (always Founder taste, never agent-claim ≥9.5): caddie portraits,
logo/P+rose treatments, default avatars, merch product art, shop cosmetic art,
onboarding hero. (From `BRAND-RULES.json.high_risk_assets_need_founder_signoff`.)

## DO / DON'T gallery (the example-pairs that make the gate concrete)

| Surface | ❌ DON'T (the slop tell) | ✅ DO (on-brand) |
|---|---|---|
| Avatar ring | gold laurel-wreath medal, green enamel, red gem — generic Olympic luxury, yellow-gold, no golf, no rose | struck **antique-brass** band (#B4893E, restrained) with a **crossed-hickory** / **claret pennant** / **rose** motif, hollow center sized to the photo — reads golf-club + H&B |
| Decoration | shiny 3D Pixar laurel, drop-shadow clipart | flat **rubber-hose** ink-on-aged-cream character — bold black outline, warm limited palette, halftone grain |
| Merch photo | 4 products crammed in one flat-lay; bright studio HDR | ONE product, H&B catalog lighting, blank surface then composited P+rose, warm neutral ground |
| Nameplate/title | one identical flat gold pill repeated 6× | VARIED brass/H&B materials by tier (struck-brass engraved / hard-enamel pin in bezel / foil-stamp) — each unique |
| P+rose mark | a clean corporate serif on white | the mark in our register; rubber-hose restyle is on the table (Founder 2026-06-15) — warm, characterful, on cream |

Rule of thumb: if it would look at home in a generic "trophy/achievement" stock
pack, it is **RED**. If it could only be PARBAUGHS, it is on-brand.

## Brand-translate (vague adjective → measurable directive)

When a brief says "premium" / "luxury" / "clean" / "exciting," translate to the
spec before prompting — never pass the vague word to the model:

| Vague | Measurable directive (from the spec) |
|---|---|
| "premium" | restrained antique brass #B4893E + fine leather grain + hard-enamel; H&B understatement (NOT more ornament) |
| "luxury" | fewer elements, better materials, one focal peak; NOT gold-everything |
| "clean" | confident black ink weight on cream #E7E0CD aged paper; generous negative space |
| "exciting" | one asymmetric focal peak + a motif moment; still restrained (country-club-on-par) |
| "golf-y" | a named PARBAUGHS motif (crossed hickories / claret pennant / the cup), not a generic ball-and-tee |

## Rationalization table — STOP if you catch yourself thinking any of these

| Rationalization | Reality |
|---|---|
| "I know the brand, I'll just prompt it" | The brand cannot live in memory — that produced the Olympic-medal crest. Run step 1. |
| "I don't need to state the size/usage" | The Founder requires it; the script won't run without it. A sizeless ring covers the face. |
| "It looks pretty good to me" | The doer is not the judge. Run the 5-point QC against the PNG. |
| "Close enough, the Founder can tweak it" | Off-brand reaching the Founder = rejected ship + lost trust. RED means regenerate. |
| "Brass is premium, more brass = more premium" | Over-indexing brass drains rubber-hose (Founder 2026-06-15). Check the lane + restraint. |
| "It's just a small decoration, skip the gate" | If it's a visible asset, gate it. Gating costs seconds. |
| "The palette is roughly right" | "Roughly" = a forbidden yellow-gold creeping in. Verify literal hexes. |
| "I'll generate a few and pick the best" | Generate ONE, vet, iterate (credit-caution). A scatter-gen has no anchor + wastes credits. |

## RED→GREEN baseline (skill-eval)

The failing transcript this skill prevents is captured at
`.claude/state/skill-evals/brand-gate-baseline.md` — the 2026-06-15 ring/crest
gen that skipped the brief and shipped an Olympic-medal frame to the Founder
(REJECTED). The GREEN behavior: that same request, run through steps 1–7, never
reaches the Founder off-brand because step 6 RED-blocks the medal at Q1/Q2 and
forces a regenerate with "no Olympic/Roman laurel, antique brass not yellow-gold,
add a crossed-hickory motif" in the negative.

## Cross-references

- `.claude/state/design/BRAND-RULES.json` — the machine-readable spec the script injects.
- `.claude/state/design/BRAND-BRIEF.md` — the prose brief (recipe, lanes, palette, motifs).
- `parbaughs-image-gen` SKILL — the generation HOW (senior prompt formula, finishing pipeline).
- `parbaughs-visual-judge` SKILL — the post-render MLLM scorer (the doer!=judge automation).
- `scripts/brand-gate.mjs` — the low-freedom injection + QC script (wrap/preamble/check/lane).
- AMD-028 — agent self-rating capped at 9.4; ≥9.5 = Founder visual sign-off.
- P7 (≥9.5 competitive bar) · P8 (ship-blocking security analogue this mirrors).

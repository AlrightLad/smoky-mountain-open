---
name: parbaughs-image-gen
description: Expert-level image generation for PARBAUGHS brand assets (merch, shop cosmetics, page art) via Vertex Imagen 4 + a deterministic local finishing pipeline. Use whenever generating or regenerating any product photo, cosmetic decoration, accessory shot, or scene illustration. Encodes the prompt formula, modifier library, per-class consistency anchors, asset recipes, vetting checklist, and the KEY→GRADE→UPSCALE→COMPOSITE→SHADOW post-edit pass that turns a raw generation into a professionally-tailored, brand-consistent asset.
---

# parbaughs-image-gen

> **Why this skill exists.** Founder, 2026-06-14: *"all merch looks generic
> and not professionally tailored or edited which means the design prompts
> are not well crafted enough... add or create a skill to use [image]
> generation at an expert level with extreme research and knowledge on high
> end use of the tool."* The root cause of the "generic AI" look is almost
> never the model — it's (1) vague-adjective prompts, (2) baked-in logos/text
> the diffusion model garbles, and (3) **a missing finishing pass.** Imagen 4
> Fast is a *content generator*, not a finishing tool. This skill fixes all
> three: an expert prompt formula, a blank-then-composite logo rule, and a
> free/local/deterministic post-edit pipeline.
>
> **Source:** 6-agent research workflow (2026-06-14) → Imagen prompt
> engineering, product-photography vocabulary, AI-tell avoidance, materials
> rendering, gemini-vs-imagen, post-edit pipeline. Synthesis lives here.
>
> **Related:** [[reference_online_asset_sourcing]], [[feedback_design_is_generator_first]],
> [[project_merch_lineup]], [[project_brand_rubberhose_x_hb]],
> [[feedback_gemini_cosmetics_credit_caution]], [[feedback_rings_frame_not_cover_photo]].

## The one-paragraph mental model

Generate **once**, on a **keyable background**, with a **blank** branded
surface, using a **named-material + real-optics + one-described-light**
prompt whose only negatives are written as **positive end-states** — then
**finish deterministically offline** (key → decontaminate → grade → upscale
→ composite the real P+rose vector → uniform crop/pad → synthesize a contact
shadow). The studio look comes from the *finishing*, not the raw model
output. Consistency across a set comes from a **byte-identical anchor block
+ a pinned seed**, not from re-typing.

---

## 0. Research the real reference FIRST (Founder 2026-06-14 — mandatory)

> Founder: *"you need to do web research on these items and compare other brands
> and how they list them on their website, and web-search items you are unsure
> how they look, so you can better craft image prompts. These should be done on
> ALL images and designs so you can adequately provide the prompt to yield the
> highest-score, most accurate design."*

**Before writing ANY product prompt, web-research what the real object looks
like** — its true form, size, materials, and how premium brands photograph/list
it. Translate the reference into the named-material + form clause; never guess.
Skipping this produces *plausible-but-wrong* objects (e.g. a golf **yardage book**
is a SLIM pocket-size staple/spiral-bound course-guide booklet ~3.5×5.5" with a
hand-drawn hole-map per page — NOT a fat leather journal with a ribbon; the first
attempt got this wrong because it wasn't researched). WebSearch the item +
"<brand> <item>" for 1-2 real reference points, confirm the form, THEN prompt.

## 0.25 Match the APP'S OWN aesthetic — look before you prompt (Founder 2026-06-14)

> Founder: *"If Gemini needs to see the app or another AI to generate a prompt
> to match the aesthetic of the app for the shop items, that may need to happen,
> because you seem to miss the branding here."*

Before generating any COSMETIC / character / on-brand asset, **Read the app's own
canonical brand art and match THAT specific aesthetic** — do not prompt from a
generic interpretation of a style name. You (or a vision model) must SEE the real
references first. The canonical PARBAUGHS visual language, observed from the
shipped art (`public/img/avatars/caddy-*.jpg`, `default-*.jpg`, `img/logo/`):

- **Clean, bold BLACK-ink line art** — friendly hand-drawn 1930s rubber-hose
  cartoon, RESTRAINED and tidy (not heavy, not ornate).
- **Vintage aged-CREAM / parchment** grounds with a subtle paper texture, framed
  by a **thin single or double-ring border**.
- **Largely ink-on-cream**, with MUTED brand color used sparingly (forest green,
  brass, brown) — never loud, never glossy.
- **Flat illustrated** — NOT 3D, NOT glossy metallic relief, NOT shiny.

**Why this matters (the lesson):** the first apex avatar rings were generated as
shiny ornate 3D brass medallions — Founder: "not on brand, not adequate." They
missed because they ignored the app's flat-ink-on-vintage-parchment language. An
on-brand frame is a hand-INKED ornamental ring on aged cream with a thin double
border and muted accents — the same hand as the caddies — not a metal medal.
Always composite a new cosmetic beside `caddy-caddy.jpg` and confirm it reads as
the SAME hand before shipping.

## 0.3 Restraint over ornament — modern luxury minimalism (Founder 2026-06-14)

> Founder: *"Not everything needs to be brass — that's super old school. Look at
> the high-performing, high-quality brands and you'll notice it's not much brass
> at all. I need to match that level of professionalism to compete in that space."*

The 2026 premium standard (confirmed by research) is **luxury minimalism**:
restrained design, **neutral/tonal palettes** (off-white, stone, ink, navy,
olive, warm earth), **subtle-to-invisible branding**, premium materials and clean
form doing the work — NOT loud ornament or heavy metallics.

Apply to PARBAUGHS:
- **Brass/gold is a RARE, small accent — never a default.** Overusing it reads
  dated/kitschy (the exact "old-school" miss). Most surfaces should be tonal:
  cream / stone / deep-ink / forest-green, with ink or a single quiet accent.
- **Lead with material + form + restraint, not shine.** A flat clean ink mark on
  cream out-classes a glossy gold medallion every time at this tier.
- **Subtle branding.** The P+rose / rubber-hose identity stays, executed quietly
  and cleanly — the identity is the value, not the volume.
- Benchmark professionalism against H&B / Malbon / Linear-Stripe-grade restraint;
  the bar is "could this sit next to a high-performing premium brand."
- The palette-lock below still holds, but **down-weight brass**: treat it as ≤10%
  of any composition, prefer ink/forest/cream for structure and lines.

## 0.4 Avatar decorations must be AWARD-WINNING — study Discord (Founder 2026-06-14)

> Founder: *"These are super bland and not award-winning or worth purchasing.
> Get inspiration from Discord and search other social apps — you're really
> struggling, meaning you're not prompting properly or aligned with me."*

Researched Discord avatar decorations + mobile-game frames. The bar for a
**purchasable** decoration is: **colorful, dimensional, characterful, THEMED**,
and collectible — not a flat monochrome ring and not a shiny generic medallion
(both of which were rejected). Discord ships themed COLLECTIONS (Fantasy swords,
wings, crowns, glowing frames, seasonal pumpkins/foliage, wearable characters,
animated effects) with "razzle-dazzle." Mobile-game frames add 3D depth, crowns,
ribbons, glow.

**PARBAUGHS's unfair advantage = the rubber-hose caddies + golf moments.** The
winning decoration language is the **rubber-hose illustrated cartoon style WITH
rich full color, cel-shading, dimensional depth, a characterful golf element
(fluttering pin-flag, crossed hickories, a peeking caddy, confetti/glow), and a
THEME** — i.e. the same hand as caddy-oldtom.jpg (which is full-color, not flat
ink), elevated to collectible polish. Target concepts: a caddy character peeking
over the avatar (Discord wearable-character pattern), a Hole-in-One gold-confetti
glow frame, a Champion green-jacket/claret-jug frame, seasonal frames (Masters
azalea bloom, Frost-Delay winter), a fluttering-pennant frame. Generate on a
keyable bg that contrasts the frame's colors (use chroma-BLUE #1763FF when the
frame contains greens), carve the hollow center (§6), composite over the photo.
LESSON: flat-ink = bland; shiny-brass-medallion = off-brand; **colorful
characterful rubber-hose + golf theme + depth = the bar.**

## 0.5 Two brand lanes + North Stars — pick the lane BEFORE the recipe

PARBAUGHS apparel/imagery splits into two distinct visual lanes with named
brand North Stars. Decide which lane an asset belongs to first; it sets the
colorway, branding weight, genre, and the reference brand to study.

| Lane | Mark | **North Star** | Genre | Colorway | Branding |
|---|---|---|---|---|---|
| **TOUR / golf** | **P+rose** | **Holderness & Bourne** | Realistic — on-course campaign photography (model in the line on a dramatic links course, Bandon-Dunes feel) + premium ghost-mannequin packshots | **What the pros compete in: tournament white, tour navy, black, heather grey, charcoal.** NOT beige+green. Brand accents (forest green / brass / claret) only as subtle tonal tipping, never the field. | **H&B minimal** — premium fabric does the talking; one small, quiet P+rose crest. No loud graphics. |
| **LEISURE / casual** | **rubber-hose caddies + cartoons** | **Malbon Golf** | Streetwear × golf — bold playful graphic prints, relaxed fits, hoodies/tees/sweater-vests, younger and style-conscious | Bolder, more playful than tour | Graphic-forward — **but where Malbon uses its "Buckets" golf-ball mascot, we use our rubber-hose caddies / cartoons (with alterations)**, never a copy |

Rules: study the North Star brand's site for the lane before prompting. The tour
line is sold like a real golf brand — lead a merch surface with an **on-course
lifestyle hero**, then clean tour-colorway packshots; faces turned away on
lifestyle shots. The leisure line takes Malbon's streetwear-golf energy but
substitutes our rubber-hose caddies for Malbon's mascot. Keep the two lanes
visibly distinct; never mix the cartoon onto a tour packshot or vice-versa.

## 1. The prompt formula — SUBJECT → CONTEXT → STYLE → TECHNICAL

Write **flowing narrative sentences, not comma-soup.** Front-load: Imagen
truncates past ~480 tokens (~60–150 words), so the tail boosters get dropped.

| Slot | What goes in it |
|---|---|
| **1 · SUBJECT** | ONE product, named precisely: object + **specific stock** + **finish/process** + brand color. Replace adjectives with **material nouns** — `fine waffle-textured cotton pique`, not `premium fabric`; `die-struck solid brass with crisp raised relief`, not `gold metal`. |
| **2 · CONTEXT** | Surface + background (**keyable**, see §4) + **LIGHT** (named source + direction + *what the light does to the material*) + arrangement + frame-fill (`~70% of frame height`). |
| **3 · STYLE** | Genre + brand presentation + the **palette-lock** clause (§2). For brand scenes: rubber-hose cartoon layer rendered *inside* a Holderness-&-Bourne editorial presentation. |
| **4 · TECHNICAL** | Optical signature (**lens + aperture**) + **2–3 boosters MAX** + the **declarative exclusion** (positive end-state), placed LAST. |

**Literal template — copy, fill the ALLCAPS slots:**

```
A studio product photograph of a single SUBJECT_MATERIAL_STOCK_FINISH_COLOR,
isolated on a seamless solid BG_COLOR background, LIGHT_SOURCE_DIRECTION raking
across the surface to reveal the MATERIAL_TEXTURE, one soft contact shadow
directly beneath, product centered occupying about 70 percent of frame height
with generous even negative space. Luxury catalog product photography,
PALETTE_LOCK. Shot on a LENS_FOCAL macro lens at APERTURE, photorealistic,
fine surface detail, 4K Studio Photo. The SUBJECT is the only object in frame;
the background is one uniform flat color and the surface is clean and unmarked.
```

Rules baked into the formula:
- (a) lead photo prompts with **"A studio product photograph of…"** / "A photo of…" to bias toward camera realism;
- (b) **ONE subject only**;
- (c) **one fully-described light beats three vague ones**;
- (d) **every exclusion is a positive end-state**, never "no/don't" (§8 rule 2);
- (e) **aspectRatio is a parameter, not prompt text** (§2).

---

## 2. Modifier library (pick per asset — these are the levers)

**LENS / OPTICS — the single biggest realism lever.** No lens → the model picks a generic phone-camera look. Match focal to subject size:
- small metal / cosmetics (medallion, ball-marker, ring, bag-tag): `shot on a 100mm macro lens at f/8 for full sharpness across the relief`
- garments / accessories: `shot on an 85mm lens at f/8`
- group flat-lays: `shot straight down on a 50mm lens at f/9`
- scene fillers (**the only place to open up**): `shot on a 35mm lens at f/2.8, shallow depth of field, soft background bokeh`
- **NEVER f/1.8 on products** — it blurs the hems / stitching / relief that signal quality.

**LIGHTING — commit to ONE described key:**
- general: `a single large softbox at 45 degrees from camera-left, gentle gradient falloff, one soft shadow falling to the lower right`
- anti-plastic fabric/leather: `raking directional light grazing the surface to reveal the [weave/pile/rib/grain]`
- brass / enamel / metal: `a single large softbox producing a broad graduated specular highlight, one subtle warm reflection, deep controlled shadow` (soft+large kills the blown-highlight CGI tell)
- flat-lay only: `soft diffused overhead softbox light with gentle directional shadows for depth`

**MATERIAL — APPAREL** (named stock + weave defeats "generic"):
- pique: `fine waffle-textured cotton pique with a crisp ribbed collar`
- cap: `fine structured cotton-twill with a visible weave`
- quarter-zip: `forest-green brushed knit with soft surface pile and a visible rib at the cuff and hem`
- towel: `plush terry cotton with visible looped pile`
- headcover: `chunky hand-knit wool with visible cable stitches`
- champion blazer: `forest-green worsted-wool felt, soft velvety matte nap, no sheen, fine fiber texture`
- hoodie: `heavyweight brushed-fleece cotton with a soft napped surface, ribbed cuffs and hem`

**MATERIAL — METAL** (name finish + light-behavior; **pair TWO finishes per object** for richness):
- struck brass: `die-struck solid brass with crisp raised relief, polished high points and softly antiqued recessed lows, warm honey-gold`
- brushed brass: `brushed satin brass, fine parallel grain, low directional sheen`
- polished brass: `mirror-polished brass, bright specular highlights, warm gold reflections`
- knurled: `precision-knurled antique-brass detail, fine diamond cross-hatch, crisp machined ridges with brushed-satin valleys`

**MATERIAL — ENAMEL + LEATHER:**
- hard cloisonné: `hard-cloisonne enamel polished perfectly flush and level with the raised brass cloison wires, glassy high-gloss jewel-like surface, crisp metal borders between colors` (say *flush + glossy* or you get cheap recessed soft-enamel)
- leather: `full-grain vegetable-tanned tan saddle leather, visible natural grain and pores, hand-tooled border, burnished darkened edges with beveled edge-paint, tight saddle-stitch in waxed cream linen thread` (**NEVER** "corrected-grain / bonded / PU" — reads plastic)

**QUALITY BOOSTERS — 2–3 MAX** (more muddies output into the generic-AI look):
- photos: pick from `4K`, `HDR`, `Studio Photo`, `photorealistic`, `sharp commercial product photography`, `fine surface detail`
- metal: `high-end jewelry catalog photography`
- illustration: `by a professional`, `detailed`
- **BANNED stack** (an AI tell in itself): `8K, ultra-detailed, hyperrealistic, masterpiece, award-winning, beautiful, premium, high-quality` all at once.

**IMPERFECTION (anti-uncanny-clean):** `a few natural wrinkles at the fold lines`, `subtle creasing where the fabric bends`, `slight organic variation in the nap`. Tie to stress points: `natural wrinkles radiating from the placket`.

**HARDWARE (count + crisp + isolate** — defeats melted/duplicated tells): `a single polished brass grommet in one corner with crisp clean edges`, `a brass zipper pull with sharp individual teeth, fully closed`, `a claret-red knit pom catching one soft highlight`. State the count; describe as a discrete crisp object; keep it OFF busy/folded zones.

**PALETTE-LOCK (append verbatim to every brand asset):**
```
Strict palette of warm cream #F5EFE0, forest felt green #1E4D3B, brass gold
#C9A227, claret red #7B2D3A, and deep ink #1A1A1A — no other colors.
```
Exact hex as the ONLY allowed colors beats "warm tones" and stops per-render drift.

**DECLARATIVE EXCLUSION (the only negative form Imagen honors** — write as positive end-state, place LAST):
```
The product is the only object in frame; the background is one uniform flat
color; edges are clean and crisp; surfaces are free of fingerprints, dust,
and studio reflections.
```
Negative→positive cheat-sheet:
| You want to exclude | Write instead |
|---|---|
| no logo / no text | `a completely blank, unmarked panel` |
| no mannequin | `ghost mannequin, hollow garment` |
| not plastic | `genuine matte/specular material with true grain` |
| not blurry | `sharp focus with shallow background falloff` |
| no busy background | `a single seamless sweep` |
| no extra items | `a single item, alone in frame` |

**ASPECT RATIO (a PARAMETER, never prompt text):** `1:1` single-item packshots + icon tiles; `3:4` portrait for UPRIGHT products (standing headcover, blazer-on-hanger, upright driver); `4:3` flat-lays / editorial groups; `16:9` scene fillers; `9:16` very tall objects. Forcing everything 1:1 crops/distorts tall items and looks amateur.

---

## 3. Consistency protocol — make the catalog look "shot in one session"

A set reads as one art-directed catalog ONLY if the light + background + lens
+ finish clause is **byte-identical** across the set and the **seed is pinned** —
change ONLY the subject noun. Prompt-only consistency caps at ~80%; shared
config + seed closes the gap.

1. **SHARED ANCHOR CONSTANT.** Replace the single `STUDIO` string with **per-class anchor constants** — `APPAREL_STUDIO`, `HARDGOODS_MACRO`, `LEATHER_STUDIO`, `FLATLAY`, `SCENE`, `KEYING_STUDIO` — each a verbatim block reused unchanged for every item in that class. Soft goods (felt/cotton) want soft even diffuse; hard goods (brass/enamel) want a single directional softbox for the graduated specular. **Splitting the one constant into per-material anchors is the core fix for the "generic" look.**
2. **PIN THE SEED.** Add to the predict `parameters`: `{ sampleCount:1, aspectRatio: ar||'1:1', seed: 42, addWatermark: false }`. **`addWatermark:false` is REQUIRED** or Vertex rejects the seed (SynthID + seed are mutually exclusive).
3. **SAVED-RECIPE MAP.** Store per-category `{ anchor, lens, aperture, seed, aspectRatio, fabricFragment, hardwareFragment }` as a const map so the subject clause is the ONLY varying input.
4. **FRAMING LOCK.** Reuse `product centered occupying about 70 percent of frame height with generous even negative space` verbatim everywhere (mismatched scale is a subtle "not shot together" tell).
5. **COLOR LOCK at TWO layers.** Name exact hex in-prompt AND correct to exact hex in the post-edit grade pass — treat Imagen's color as approximate; the pixel-true match happens in finishing.
6. **RATIO-PER-CATEGORY.** One ratio per category so framing reads as one catalog.

---

## 4. Asset recipes (per family — the prompt + the post-pass)

### APPAREL — ghost-mannequin (the pro move; replaces "neatly folded" which hides fit)
Generate on a keyable bg, BLANK chest; composite the real P+rose logo in post — **never let Imagen render the emblem.**
```
A ghost-mannequin (invisible-mannequin) studio product photograph of a
[GARMENT] in [MATERIAL+WEAVE, palette color], shown as a hollow three-
dimensional shape worn by no one, natural shoulder and chest volume, crisp
collar with the inside of the back neckline visible through the hollow opening,
natural fabric drape and soft folds, a few natural wrinkles at the fold lines,
[HARDWARE counted+crisp]. Isolated on a seamless solid pure-white #FFFFFF
background, a single large softbox key at 45 degrees camera-left with a lower-
power fill and a subtle rim light separating the garment from the background,
raking light revealing the [weave/rib], one soft contact shadow beneath, three-
quarter hero angle rotated 30 degrees with a slight downward tilt, garment
occupying about 70 percent of frame height. Sharp commercial e-commerce product
photography, photorealistic, fine [WEAVE] texture. Shot on an 85mm lens at f/8.
[PALETTE-LOCK]. The garment and its soft shadow are the only things in frame;
the chest and front panel are a completely blank, unmarked field ready for
compositing; the background is one uniform flat white surface.
```
Keyable bg: **white `#FFFFFF`** for cream/light garments, **green `#00B140`** for dark items (black hoodie). aspectRatio `3:4` upright (blazer/headcover), `1:1` cap/polo packshots.

### COSMETIC — transparent ring / decoration raster
Imagen **cannot emit true alpha** — generate keyable, matte out in post. Rings **frame** the photo; ornaments on the rim, **never a face-covering disc** ([[feedback_rings_frame_not_cover_photo]]). Render the motif **NEUTRAL GRAY**, then `tint()` to exact brand hex in post so a set shares one palette.
```
A single ornamental avatar ring decoration, a circular frame only with a hollow
open center, [MOTIF: laurel / crossed clubs / brass rope] worked into the rim in
the 1930s rubber-hose cartoon flourish style with bold confident ink outlines,
[hard-cloisonne enamel polished flush and glossy / brushed-satin brass] finish,
rendered in neutral medium gray, perfectly centered, symmetrical, viewed head-on
and flat. Isolated on a seamless solid bright chroma-green #00B140 background,
even flat shadowless studio lighting, no cast shadow touching the frame edge,
crisp clean anti-aliased outer and inner edges, high detail. Shot on a 100mm
macro lens at f/8. The ring is the only object in frame; the center is open and
empty (no face, no photo inside); the background is one uniform flat green field.
```
aspectRatio `1:1`. POST: flood-fill key the green → erode-1 + alpha-feather → `tint` brass `{201,162,39}` / claret `{123,45,58}` / felt `{30,77,59}` → keep the center transparent (it frames the user photo).

### ACCESSORY — product shot (leather bag-tag / hardware)
Two contrasting finishes per object; raking light for grain.
```
A studio macro product photograph of a single premium [ITEM] in [full-grain
vegetable-tanned tan saddle leather, visible natural grain and pores / hammered
sterling silver], [hand-tooled border, burnished darkened edges with beveled
edge-paint, tight saddle-stitch in waxed cream linen thread], [a single polished
antique-brass rivet with crisp edges catching one soft highlight], resting in a
three-quarter hero angle. Isolated on a seamless solid neutral 18% gray
background, a single large softbox raking from the upper-left to reveal the
pebbled grain, one subtle warm reflection, deep controlled shadow, one soft
contact shadow beneath, item centered occupying about 70 percent of frame height.
High-end product catalog photography, photorealistic, fine material texture.
Shot on a 100mm macro lens at f/8 for full sharpness across the grain.
[PALETTE-LOCK]. The [ITEM] is the only object in frame; any name panel is a
blank embossed field ready for compositing; the background is one uniform flat
gray sweep.
```
struck-brass medallion: `die-struck solid brass, crisp raised relief, polished high points with antiqued recesses, warm honey-gold`. cloisonné ball-marker: the flush-glossy-enamel clause.

### SCENE / FILLER illustration (atmospheric page art)
The **one** place to open the aperture; no keying — grade + upscale only.
```
A serene wide cinematic photograph of [SCENE], [TIME-OF-DAY + DIRECTIONAL LIGHT],
soft atmospheric haze, warm muted brand-palette tones, no people present,
editorial [landscape/interior] photography, shallow depth of field with soft
background bokeh, photorealistic, fine detail. Shot on a 35mm lens at f/2.8.
[PALETTE-LOCK].
```
aspectRatio `16:9`. For CARTOON-BRAND scenes append: `1930s rubber-hose cartoon golfer character (bold confident ink outlines, pie-cut eyes, rounded hose limbs, glove hands) rendered INSIDE a premium Holderness-&-Bourne editorial country-club presentation: refined composition, soft natural clubhouse light, tasteful negative space, elevated and understated, a cohesive single illustration.`

---

## 5. Vetting checklist (run on EVERY generated asset — V1, Read the PNG)

1. **TEXT / LOGO:** zero baked-in lettering / wordmark / emblem on any branded surface. Imagen misspells/garbles small marks — branded items MUST be BLANK; if any text/emblem appears, REJECT + regenerate blank. Real mark composited in post only.
2. **MATERIAL READS PHOTOGRAPHED, NOT RENDERED:** weave/grain/relief visible (raking light landed); metal has a *graduated soft* highlight not a blown white smear; enamel glossy-flush not recessed-matte. Flat/plastic → finish + light-behavior clause missing → regenerate.
3. **HARDWARE INTACT:** zippers/buttons/grommets/rivets are the stated count, discrete, crisp — no melted/fused/duplicated. Hands/fingers absent.
4. **OPTICS CORRECT:** whole product sharp (f/8–f/11 held); subject scale matches the set (~70% frame height); aspect ratio fits the product.
5. **PALETTE FIDELITY:** only the five brand colors; no stray lime/olive/orange drift.
6. **KEYABILITY:** product fully inside frame with even margin, nothing touching an edge, background one flat uniform keyable color, only a soft contact shadow — no busy shadows fighting the key.
7. **ANTI-GENERIC AI-TELL SWEEP:** not impossibly pristine/symmetric (a few wrinkles present); ONE coherent light direction; no uncanny edge-to-edge sharpness on a scene; not the over-processed plastic of booster-stacking.
8. **CONSISTENCY:** beside the rest of its set — same light direction, shadow softness, surface, scale. Looks shot elsewhere → anchor drifted or seed unpinned → regenerate with the verbatim anchor + pinned seed.
9. **EDGE HALO (post-key):** composite the cutout over BOTH dark and light bg and inspect the rim — any white/green fringe → edge decontamination (erode-1 + feather). A 1–2px halo is THE amateur-cutout giveaway.
10. **BRAND FUSION (scenes):** the rubber-hose layer reads complementary INSIDE the H&B premium presentation, not loud/clashing.

---

## 6. The post-edit finishing pipeline (the missing pass)

**INSIGHT:** "generic, not professionally edited" is almost always the MISSING
finishing pass, not a prompt problem. Generate ONCE on a keyable bg (~$0.02),
then finish **deterministically + free + offline.** On THIS workstation the
toolchain is **Python + Pillow (PIL 12.2)** — no ImageMagick, no sharp, no
numpy. The pipeline lives in `scripts/_finish-art.py` with IDENTICAL constants
for every asset.

**FIXED ORDER (never reorder):**
`KEY → DECONTAMINATE → GRADE → UPSCALE → COMPOSITE LOGO → CROP/PAD → SHADOW`

Every intermediate is **PNG** (never JPEG — no alpha + block artifacts ruin keying/upscaling).

1. **FLOOD-FILL KEY** — connectivity-aware from the 4 corners (PIL `ImageDraw.floodfill` with a tolerance, or a BFS), **never a global color→transparent** (which punches holes in same-colored interior regions). Tune tolerance: too low = halo, too high = eats edges.
2. **EDGE DECONTAMINATE** — erode the alpha edge in ~1px past the contaminated anti-alias ring, then a TIGHT feather (≤0.6px Gaussian, never a big smear). Kills the white/green halo that screams "AI cutout."
3. **BRAND GRADE** — the #1 "one set" lever: one identically-authored tone map applied to every asset (channel curves toward cream/felt/brass/claret/ink). Grade AFTER keying (so the matte edge isn't graded into a fringe), BEFORE upscale.
4. **UPSCALE** — Imagen tops ~1024px; retina needs 2–4×. PIL Lanczos resize + a light unsharp mask, alpha preserved. (Real-ESRGAN if ever installed — but key FIRST at native res, then upscale the clean RGBA.)
5. **COMPOSITE THE REAL P+ROSE VECTOR** onto the BLANK garment — `public/img/logo/parbaughs-logo.png` (full color) or `parbaughs-knockout.png` (gold), scaled to the embroidery position, blended fabric-aware (Multiply ~85% for embroidery-darkening on light fabric; normal over for dark).
6. **UNIFORM CROP/PAD** — trim to the alpha bbox, add a proportional border (~8%), extent to a fixed centered square/portrait canvas. Kills the "each framed differently" tell — run the SAME command across the whole set.
7. **SYNTHESIZE A CONTACT SHADOW** — clone the alpha, dilate + heavy blur, drop to ~40% black, composite *behind* the product. Imagen's baked shadow gets cut off with the bg, leaving the product floating; a grounded shadow is what separates catalog-grade from cutout.

**Flat cosmetic recolor:** render the ring/badge NEUTRAL GRAY, then PIL `tint` to exact hex (`brass {201,162,39}`, `claret {123,45,58}`, `felt {30,77,59}`) — far more consistent than asking Imagen for "#C9A227 brass" twenty times.

---

## 7. Tool guidance — Vertex Imagen 4 (working) vs Gemini (gated)

**WORKING PATH — Vertex AI Imagen 4 Fast.** Use for ALL core PARBAUGHS work;
it is the RIGHT tool, not a downgrade — Imagen 4 documentably beats Gemini /
Nano-Banana on product color accuracy, material rendering, and geometry
(exactly apparel/cosmetics/accessories).
- Route: `scripts/_gen-vertex-art.mjs` → staging service account (`scripts/.service-account.json`, **gitignored**) → GoogleAuth OAuth (cloud-platform) → `POST {LOC}-aiplatform.googleapis.com/.../imagen-4.0-fast-generate-001:predict`, billed to `parbaughs-staging`, **~$0.02/img**.
- Run: `node scripts/_gen-vertex-art.mjs merch|merch2|shop|fillers` OR `node scripts/_gen-vertex-art.mjs <name> "<prompt>" [aspectRatio]`.
- **CONSTRAINTS:** (1) **NO `negativePrompt` field** — every exclusion MUST be a positive end-state; instructive "no/don't" can paradoxically *summon* the thing. (2) **Cannot emit true alpha** — generate cosmetics on a flat keyable bg + matte in post. (3) **Misspells in-image text** — never bake the wordmark/emblem; composite in post. (4) **Single-subject text-to-image** — no edit/inpaint field; do refinement + fusion in the local pipeline. (5) Max ~480 tokens — front-load. (6) `seed` requires `addWatermark:false`.
- **ITERATE one variable per regen, 3–4 regens per hero asset** (cheap).

**GATED PATH — Gemini native image** (`gemini-2.5-flash-image` / Nano Banana):
the AI-Studio IMAGE key hit **free-tier-0 (billing-gated) — NOT available.**
Its strengths are production-ready **in-image TEXT**, conversational
editing/inpainting, and multi-reference character consistency (e.g. caddie
portraits). **IF billing is ever un-gated,** route ONLY text-bearing assets,
multi-reference character-consistent caddie art, and conversational edits to
it; keep ALL clean product/material shots on Imagen 4. Until then, every
"Gemini strength" is covered by the local pipeline (text/logo via SVG/PNG
composite, edits via PIL).

**Credit discipline** ([[feedback_gemini_cosmetics_credit_caution]]): curated
prompts, ONE image each, vet before regenerating, regenerate only misses.

**Committed-path rule (HARD):** app-referenced generated art goes to a
**committed** path (`public/img/merch/`, `public/img/shop/`, `public/img/cosmetics/`),
**NEVER `public/img/gen/`** (gitignored → deploys to staging-local but NOT to
prod GitHub Pages → the v8.25.171 broken-"?" bug). The gen script writes to
`public/img/gen/` as a *scratch* dir; the finishing pipeline writes the final
asset to its committed home.

---

## 8. Anti-generic rules (the ten commandments)

1. **NAME THE MATERIAL PHYSICS, not adjectives.** The model renders nouns it has real photos of; it hallucinates vague adjectives ("premium", "high-end", "nice", "soft"). Every material = specific stock + finish/process + how light interacts with it.
2. **WRITE EXCLUSIONS AS POSITIVE END-STATES.** Imagen has no negative field; "no logo, no text" can *summon* the very logos you're excluding. Rewrite as "a completely blank, unmarked panel… ready for compositing."
3. **ANCHOR REAL OPTICS.** Add `shot on a [100mm macro / 85mm / 50mm / 35mm] lens at f/[8/9/2.8]` to EVERY prompt — the focal+aperture pair anchors the model to real EXIF statistics. Single biggest realism lever.
4. **ONE FULLY-DESCRIBED LIGHT beats three vague ones.** "soft studio lighting" averages into a flat muddy AI look. Commit to one key with an explicit angle + ONE named shadow, and say what the light DOES to the material.
5. **CAP QUALITY BOOSTERS AT 2–3.** >3 muddies output into over-processed plastic — which IS the generic-AI tell. Spend the word budget on the material clause.
6. **NEVER let Imagen render the brand mark or any text.** Garbled/fused/invented marks are a fundamental diffusion limit. Generate BLANK + composite the real P+rose vector in post. BLANK is the DEFAULT.
7. **GENERATE FOR KEYING, NOT DISPLAY.** Contrasting flat keyable color (green/white/gray per-subject), never cream-on-cream (kills the key). The studio look comes from the post grade + gradient + synthesized shadow.
8. **ADD DELIBERATE MICRO-IMPERFECTION.** AI's default impossibly-pristine garment is uncanny. Name small organic flaws tied to physical stress points.
9. **PAIR TWO FINISHES PER OBJECT** for crafted richness. A single uniform finish reads flat; "polished high points against a brushed-satin field" gives the light something to do.
10. **ENFORCE ONE LOOK MECHANICALLY, not by re-typing.** Byte-identical anchor block + pinned seed + saved-recipe config + verbatim framing clause across the whole set. Prompt-only consistency never exceeds ~80%.

---

## 9. End-to-end checklist (use this every time)

- [ ] Pick the asset family (apparel / cosmetic / accessory / scene) → its recipe (§4).
- [ ] Build the prompt from the formula (§1) + modifiers (§2); BLANK any branded surface; exclusions as positive end-states.
- [ ] Set the right keyable bg + lens + aspectRatio; reuse the per-class anchor verbatim; pin `seed:42, addWatermark:false`.
- [ ] Generate ONE image to the scratch dir (`public/img/gen/`).
- [ ] **V1 vet** against the §5 checklist (Read the PNG, describe, compare). Regenerate misses, one variable at a time.
- [ ] Run the finishing pipeline (§6) → writes the final to a **committed** path.
- [ ] **V1 vet the finished asset** beside its set (consistency + halo + shadow).
- [ ] Wire into the page; version-trio bump; build; verify it renders on the consuming surface; ship per [[project_staging_lifecycle]] + the ship-cycle skill.
- [ ] Founder taste sign-off for any ≥9.5 visual-parity claim (AMD-028).

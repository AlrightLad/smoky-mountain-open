# brand-gate skill-eval — RED→GREEN baseline

> The failing transcript `parbaughs-brand-gate` is built to prevent. Captured so
> the skill has a concrete regression target (RED-GREEN-REFACTOR authoring per
> the harness ADOPT-PLAN). If a future change to the skill or the script would
> let this RED case through again, this eval has regressed.

## RED — the failure (2026-06-15, before the gate existed)

**Task:** "the rings are atrocious… need a serious revamp" → generate a premium
avatar ring + a Club Crest via Vertex Imagen.

**What happened (doing-mode):**
1. Wrote an Imagen prompt describing the OBJECT ("a struck-brass laurel ring,
   green enamel, a red gem") with NO brand brief, NO palette hexes, NO lane, NO
   size/purpose/usage, NO PARBAUGHS motif.
2. Generated. The output was a clean, well-rendered… generic **gold laurel-wreath
   medal** — an "Olympic medal" frame. Also generated a heraldic crest with a
   crown + Roman laurel.
3. Shipped it to the Founder for review.

**Founder verdict (verbatim):**
- *"these are not parbaugh related at all"*
- *"the crest was not the slightest on brand"*
- *"didn't fit the branding/direction… explain the app and our direction BEFORE
  having these made"*

**Root cause (named in research):** generated WITHOUT a locked style, from a
text-only/no brief, with no visual anchor → the model reverted to its generic
prior. The doer also judged its own output ("looks good") instead of testing it
against fixed criteria. = the brand lived in memory; the doer was the judge.

## GREEN — the same task through the gate (steps 1–7)

1. **INJECT** — `node scripts/brand-gate.mjs wrap --lane tour --size "1024²
   transparent PNG, worn at 96px ring, hollow center == 92px photo" --purpose
   "apex shop ring SKU" --usage "raster overlay via playerDecoSrc on every
   avatar surface + shop preview/try-it-on" --subject "struck antique-brass band,
   crossed-hickory motif"`. The command would have **refused** the original
   sizeless/purposeless prompt (exit 1), and injects the palette hexes + the
   forbidden list (which names "Olympic/Roman laurel-gold" + "yellow-gold medal
   gradients") + the prohibition "a generic heraldic crest with a crown + Roman
   laurel".
2. **LANE** — `lane ring` → `tour`. Confirmed.
3. **RESEARCH** — look at real H&B hardware + the app's own caddy art; the
   reference is a restrained brass club badge, not a medal.
4. **PROMPT** — refine via `parbaughs-image-gen` into a senior prompt with the
   crossed-hickory motif, antique brass (#B4893E) not yellow-gold, one light.
5. **GENERATE** — one image.
6. **JUDGE** — `check`: Q1 "reads as PARBAUGHS without the logo?" The medal =
   **NO** → RED. Q2 palette: yellow-gold = forbidden → RED.
7. **GATE** — RED. Regenerate with "no Olympic/Roman laurel, antique brass not
   yellow-gold, add a crossed-hickory motif, our felt/claret palette" in the
   negative. The medal never reaches the Founder.

**The eval passes when:** the gate refuses the sizeless prompt at step 1 AND
flags the medal at step 6 (Q1 NO + Q2 forbidden-palette). Both are mechanical,
not taste — so a fresh agent with no memory of this incident still catches it.

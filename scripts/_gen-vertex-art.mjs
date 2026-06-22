// Professional asset generation via Vertex AI Imagen 4 (Fast), billed to the
// parbaughs-staging project's credits using the LOCAL staging service account
// (scripts/.service-account.json — gitignored). WORKING image-gen path:
//   staging SA → OAuth (cloud-platform) → Vertex predict on parbaughs-staging.
//
//   node scripts/_gen-vertex-art.mjs merch     # ghost-mannequin BLANK apparel (key+composite logo in post)
//   node scripts/_gen-vertex-art.mjs shop       # shop cosmetics as real objects
//   node scripts/_gen-vertex-art.mjs fillers    # atmospheric page art
//   node scripts/_gen-vertex-art.mjs <name> "<prompt>" [aspectRatio]   # one-off
//
// EXPERT DOCTRINE — see .claude/skills/parbaughs-image-gen/SKILL.md. The rules
// this script now enforces (the fix for the Founder's "generic" verdict):
//   • SUBJECT→CONTEXT→STYLE→TECHNICAL narrative prompts, front-loaded <480 tok.
//   • Named material PHYSICS, not adjectives. Real optics (lens+aperture) on
//     EVERY prompt. ONE described light. ≤3 quality boosters.
//   • Exclusions written as POSITIVE end-states ONLY (Imagen has no negative
//     field; "no logo" can summon logos). Generate branded surfaces BLANK;
//     composite the real P+rose vector in the local finishing pass.
//   • Per-CLASS anchor constants (not one STUDIO string) + PINNED SEED +
//     verbatim framing clause = a catalog that looks shot in one session.
//   • Generate FOR KEYING on a per-subject flat keyable bg; the studio look
//     comes from scripts/_finish-art.py, not the raw model output.
//   • imagen-4.0-fast (~$0.02/img). ONE image each; vet; regenerate only misses.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const SA = 'scripts/.service-account.json';
if (!existsSync(SA)) { console.error('NO staging SA at ' + SA); process.exit(3); }
const sa = JSON.parse(readFileSync(SA, 'utf8'));
const { GoogleAuth } = await import('google-auth-library');
const token = (await (await new GoogleAuth({ credentials: sa, scopes: ['https://www.googleapis.com/auth/cloud-platform'] }).getClient()).getAccessToken()).token;
// Founder 2026-06-22: "stop using the lowest version" → default to Imagen 4 ULTRA
// (the highest-quality tier; ~markedly better fabric/lighting/relief than -fast).
// Override per-run with IMG_MODEL (e.g. imagen-4.0-generate-001 for the cheaper
// standard tier on bulk/scene work).
const PROJ = sa.project_id, LOC = 'us-central1', MODEL = process.env.IMG_MODEL || 'imagen-4.0-ultra-generate-001';
const OUT = 'public/img/gen';   // SCRATCH dir (gitignored). Finishing pass writes the committed asset.
mkdirSync(OUT, { recursive: true });

// ── Palette-lock clause (append verbatim to every brand asset) ──────────────
const PALETTE = ' Strict palette of warm cream #F5EFE0, forest felt green #1E4D3B, brass gold #C9A227, claret red #7B2D3A, and deep ink #1A1A1A — no other colors.';
// ── Verbatim framing clause (subject scale lock across the whole set) ───────
const FRAME = ' the garment centered occupying about 70 percent of frame height with generous even negative space';

// ── PER-CLASS ANCHORS (the consistency mechanism — reused byte-identical) ───
// Ghost-mannequin apparel: one described key + rim light + raking detail. The
// BLANK chest is a positive end-state ("a blank field ready for compositing");
// the real logo is composited in post (Imagen garbles small marks).
function apparel(garment, material, weave, hardware, bg) {
  return 'A ghost-mannequin (invisible-mannequin) studio product photograph of a ' + garment + ' in ' + material +
    ', shown as a hollow three-dimensional shape worn by no one, natural shoulder and chest volume, a crisp collar with the inside of the back neckline visible through the hollow opening, natural fabric drape and soft folds, a few natural wrinkles at the fold lines' + (hardware ? ', ' + hardware : '') +
    '. The garment lit by soft directional light from the upper left, the raking light revealing the ' + weave + ', a three-quarter hero angle rotated 30 degrees with a slight downward tilt,' + FRAME +
    '. Isolated on a background that is one perfectly flat, even, fully-saturated, shadowless solid ' + bg + ' color filling the entire frame uniformly from edge to edge. Sharp commercial e-commerce product photography, photorealistic, fine ' + weave + ' texture. Shot on an 85mm lens at f/8.' + PALETTE +
    ' The garment is the only object in frame; the entire chest and front panel are a completely blank, unmarked field of plain fabric ready for compositing; the background stays one uniform flat saturated color with no gradient and no lighting falloff.';
}

// MERCH — ghost-mannequin BLANK apparel. TOUR colorway (Founder 2026-06-14):
// what the pros wear competing — tournament white / tour navy / black / heather
// grey, Holderness-&-Bourne premium fabric with MINIMAL branding (just a small
// composited crest). None of these colours are green-dominant, so ALL sit on one
// chroma-green keyable bg (clean key, no blue-bg blob). The brand accents (forest
// green / brass / claret) appear only as subtle tonal tipping, never the field.
const KEYBG = 'bright chroma-green #00B140';
// Founder 2026-06-22 TOUR lineup: quarter-zip, hoodie (H&B Jackson-Hoodie style),
// polo, hat (Titleist style), vest (H&B Boyd-vest style). NO tee in tour (the tee
// moves to the leisure line). Premium, minimal branding (blank for post-composite).
const MERCH = [
  ['merch-quarterzip', apparel('quarter-zip golf pullover', 'deep tour-navy brushed performance knit', 'brushed knit pile and the rib at the cuff and hem', 'a single brass zip pull with sharp individual teeth, zipped to mid-chest', KEYBG), '3:4'],
  ['merch-hoodie',     apparel('refined premium quarter-zip pullover hoodie in the elevated Holderness-and-Bourne style, clean minimal and tailored not streetwear', 'heavyweight deep-charcoal brushed merino-blend fleece with a soft hand', 'the fine napped fleece and the rib at the cuff and hem', 'a clean two-tone drawcord with flat metal tips and a single brass quarter-zip pull, hood lying naturally', KEYBG), '3:4'],
  ['merch-polo',       apparel('short-sleeve tour golf polo', 'crisp tournament-white performance cotton pique with a clean self-collar and a single subtle forest-green tipped edge', 'pique waffle weave and the ribbed collar', 'a clean three-button placket with subtle tonal stitching, buttons fastened', KEYBG), '3:4'],
  ['merch-vest',       apparel('sleeveless golf vest in the tailored Holderness-and-Bourne Boyd-vest style', 'deep forest-green brushed performance knit with a smooth premium face', 'the brushed knit face and the rib at the armholes and hem', 'a single brass full-zip pull zipped to mid-chest, clean armhole binding, no sleeves', 'bright chroma-blue #1763FF'), '3:4'],
  ['merch-hat',        'A studio product photograph of a single structured tour golf cap in the premium Titleist style, crisp six-panel cotton-twill crown in tournament white with a tour-navy brim and a small blank front panel ready for an embroidered crest, a clean curved brim and a fabric strap closure, three-quarter front hero angle, the cap centered occupying about 65 percent of frame height. Isolated on one perfectly flat fully-saturated shadowless solid bright chroma-green #00B140 background filling the entire frame, soft directional light from upper left revealing the twill weave, sharp commercial e-commerce product photography, photorealistic, fine cotton-twill texture. Shot on an 85mm lens at f/8.' + PALETTE + ' The cap is the only object in frame; the front panel is a completely blank unmarked field ready for compositing; the background stays one uniform flat green color.', '1:1'],
];

// SHOP — premium cosmetics as real objects (macro, two finishes per object).
const HARDGOODS = ' Isolated on a seamless solid neutral 18% gray background, a single large softbox producing a broad graduated specular highlight, one subtle warm reflection, a deep controlled shadow, one soft contact shadow beneath, the object centered occupying about 70 percent of frame height. High-end jewelry catalog photography, photorealistic, fine surface detail. Shot on a 100mm macro lens at f/8 for full sharpness across the relief.' + PALETTE + ' The object is the only thing in frame; the background is one uniform flat gray sweep.';
const SHOP = [
  ['shop-medallion', 'A studio macro product photograph of a single die-struck solid-brass commemorative golf medallion, crisp raised relief of a golf flag and crossed clubs, polished high points against softly antiqued recessed lows, warm honey-gold, a brushed-satin rim.' + HARDGOODS],
  ['shop-ballmarker', 'A studio macro product photograph of a single golf ball marker disc with hard-cloisonne enamel polished perfectly flush and glossy against raised brass cloison wires, a deep forest-green enamel field and an engraved golf flag, jeweler quality.' + HARDGOODS],
  ['shop-bagtag', 'A studio macro product photograph of a single golf bag name tag in full-grain vegetable-tanned tan saddle leather with visible natural grain and pores, a hand-tooled border, burnished darkened edges with beveled edge-paint, a tight saddle-stitch in waxed cream linen thread, and a single polished antique-brass rivet with crisp edges, a blank embossed name panel ready for compositing.' + HARDGOODS],
  ['shop-greenjacket', apparel('tournament champion blazer on a wooden hanger', 'forest-green worsted-wool felt with a soft velvety matte nap and no sheen', 'fine wool nap and the lapel roll', 'three crisp brass buttons catching one soft highlight each', 'bright chroma-blue #1763FF'), '3:4'],
];

// LIFESTYLE — on-course editorial campaign photography (Founder 2026-06-14):
// the P+rose line is the TOUR / golf-aesthetic brand, so it's shown the way real
// golf apparel brands sell it — a realistic model wearing the branded apparel on
// a dramatic links course (Bandon-Dunes feel). Faces turned AWAY (rear / 3-quarter-
// rear / mid-swing) to dodge the AI-face tell; the course + light + lens carry the
// aspirational golf feel. SCENE class: graded + upscaled in post, NOT keyed.
const LIFE = ' Premium aspirational golf-brand campaign photography, warm muted earthy tones in harmony with a cream, forest-green and brass palette, photorealistic, fine fabric and turf detail.';
const LIFESTYLE = [
  ['life-fairway', 'A cinematic editorial golf-lifestyle photograph of a male golfer seen from behind and slightly to the side, walking down a dramatic coastal links fairway at golden hour, wearing a deep tour-navy quarter-zip golf pullover and a structured white cap, a tan leather golf bag on his shoulder, windswept fescue dunes and the ocean beyond in soft focus, long low golden sunlight raking across the turf, his face turned away toward the course.' + LIFE + ' Shot on an 85mm lens at f/2.8, shallow depth of field.', '16:9'],
  ['life-teebox', 'A cinematic editorial golf-lifestyle photograph of a male golfer at the top of his swing follow-through on an elevated coastal tee box, viewed from behind and to the side so the face is turned away, wearing a crisp tournament-white tour golf polo with a clean self-collar and tailored charcoal trousers, the links coastline and ocean stretching out below under a soft overcast sky, crisp morning light, motion poised and balanced.' + LIFE + ' Shot on a 70mm lens at f/3.2, shallow depth of field.', '3:4'],
  ['life-clubhouse', 'A cinematic editorial golf-lifestyle photograph of a male golfer from behind walking out from a stone clubhouse toward the first tee at golden hour, wearing a heavyweight black quarter-zip and tailored grey trousers, carrying a tan leather golf bag, warm low sunlight, manicured fairway and flagstick ahead in soft focus, relaxed confident posture, face away from camera.' + LIFE + ' Shot on a 50mm lens at f/2.8, shallow depth of field.', '3:4'],
];

// COSMETIC — apex avatar-ring DECORATIONS (Founder: "go full Discord extending-
// frame decorations, ALL frames award-winning"). Rendered NEUTRAL GRAY (tinted to
// exact brand hex in post so a set shares one palette), a circular frame ONLY with
// a HOLLOW OPEN CENTER (the ring FRAMES the user photo, never covers the face —
// [[feedback_rings_frame_not_cover_photo]]), on a chroma-green keyable bg. Matte
// out + tint in scripts/_finish-art.py. 1:1.
function ring(motif, finish) {
  return 'A single ornamental avatar ring decoration, a circular frame only with a large hollow open center, ' + motif +
    ' worked into the rim in the 1930s rubber-hose cartoon flourish style with bold confident clean ink outlines, ' + finish +
    ', rendered in flat neutral medium gray, perfectly centered and radially symmetrical, viewed head-on and flat. Isolated on a background that is one perfectly flat, even, fully-saturated, shadowless solid bright chroma-green #00B140 color filling the frame uniformly edge to edge, even flat shadowless studio lighting, crisp clean anti-aliased outer and inner edges, high detail. Shot on a 100mm macro lens at f/8. The ring is the only object in frame; the center is a large open empty circle with nothing inside it (no face, no photo, no disc); the background stays one uniform flat green color.';
}
const COSMETIC = [
  ['ring-laurel', ring('two symmetric laurel branches of small leaves meeting at the top and bottom', 'a die-struck brass relief finish with polished high points and antiqued recesses')],
  ['ring-rope',   ring('a twisted nautical rope braided evenly all the way around', 'a brushed-satin brass finish with a fine directional grain')],
  ['ring-clubs',  ring('two pairs of crossed golf clubs at the four diagonal points joined by a thin beaded band', 'a die-struck brass relief finish with crisp raised edges')],
  ['ring-wreath', ring('a continuous wreath of small rose buds and leaves in the Parbaughs flourish', 'a hard-enamel inlaid finish polished flush and glossy within crisp metal borders')],
];

// DECO — award-winning avatar decorations (Founder-approved concepts 2026-06-14),
// prompts from the decoration-design workflow (5 art-directors + lead critique),
// grounded in the caddie rubber-hose hand + the Discord-decoration bar. Colorful,
// dimensional, characterful, themed, hollow center. Keyed + carved + composited
// in scripts/_finish-art.py (mode: deco). Blue keyable bg unless cool/white theme.
const DECO = [
  ['deco-caddy-companion', 'A premium collectible circular avatar-frame decoration in the bold 1930s rubber-hose cartoon style of a vintage Cuphead-era golf cartoon, a COMPLETE continuous unbroken circular ring frame that fully encircles a large perfectly centered hollow open empty circle, the ring a smooth even forest-green band with small leafy laurel sprigs and one tiny claret-red pennant spaced evenly all the way around it, and a friendly caddy character visible only from the shoulders up peeking and cresting OVER the top outer edge of the ring, a round cheerful face with big pie-cut eyes and a warm grin wearing a forest-green flat newsboy cap, raising exactly ONE single white-gloved rubber-hose hand beside his head in a friendly wave, only one arm and one hand with a normal thumb and four fingers and absolutely no other arms or limbs visible anywhere, his body hidden behind the top of the ring, the caddy sitting on top of the unbroken ring and never blocking or overlapping the centered opening, rendered in rich full color with bold confident black ink outlines, smooth cel-shading and gentle dimensional depth and a soft warm rim glow, warm-cream and deep forest-green and claret-red tones with a tiny brass-gold button accent, lively characterful and fun, correct natural cartoon anatomy. Polished premium collectible game-cosmetic quality, vibrant and dimensional, a flat matte hand-drawn illustration. Isolated on a perfectly flat fully-saturated shadowless bright chroma-blue background filling the entire frame, the center a large perfectly centered open empty circle with nothing inside it, the background one uniform flat blue color. The ring opening is centered and symmetrical, viewed head-on and flat.'],
  ['deco-hole-in-one', 'A premium collectible circular avatar-frame decoration in the bold 1930s rubber-hose cartoon style of a vintage Cuphead-era golf cartoon, an exuberant hole-in-one celebration framing the rim, at the bottom a forest-green grassy cup with a tilted little claret pin-flag and a bouncing cream golf ball mid-drop with three short black motion streaks, a wide spray of cream and claret confetti triangles and curling streamers arcing up both sides of the ring, tiny puffs of celebratory smoke at the rim, a soft glowing warm halo around the whole frame, one small brass-gold star twinkle at the top, rendered in rich full color with bold confident black ink outlines, smooth cel-shading and rounded dimensional depth, warm-cream and deep forest-green and claret-red tones, joyful energetic and playful, a large hollow open empty center with nothing inside it. Polished premium collectible game-cosmetic quality, vibrant and dimensional, flat matte illustration. Isolated on a perfectly flat fully-saturated shadowless solid chroma-blue 1763FF background filling the entire frame, the background stays one uniform flat blue color. Centered, symmetrical, viewed head-on and flat.'],
  ['deco-champion', 'A premium collectible circular avatar-frame decoration in the bold 1930s rubber-hose cartoon style of a vintage Cuphead-era golf cartoon, a prestige champions frame, a small hand-drawn claret jug trophy with a gentle warm brass-gold glint perched at the very top of the rim as the hero focal point, a deep forest-green tournament-jacket lapel and collar motif with crisp cream piping wrapping the lower rim, refined leafy laurel branches in forest-green climbing symmetrically up both sides with tiny claret-red berries, rendered in rich full color with bold confident black ink outlines, smooth cel-shading and gentle dimensional depth and a soft warm rim glow, warm-cream and deep forest-green and claret-red tones with restrained gold only on the trophy, dignified lively and characterful, a large hollow open empty center with nothing inside it. Polished premium collectible game-cosmetic quality, vibrant and dimensional, a flat matte illustration. Isolated on a perfectly flat fully-saturated shadowless bright chroma-blue background filling the entire frame that stays one uniform flat color. Centered, symmetrical, viewed head-on and flat.'],
  ['deco-masters-azalea', 'A premium collectible circular avatar-frame decoration in the bold 1930s rubber-hose cartoon style of a vintage Cuphead-era golf cartoon, a lively hand-drawn spring frame where a lush asymmetric burst of blooming pink azalea blossoms with layered rounded petals piles heavily across the upper-left shoulder of the rim and trails thinner down the right side, fresh forest-green leaves and curling stems weaving through the petals with a couple of pink blossoms drifting loose toward the bottom, a single small claret-red golf tee nestled among the lower flowers as a charming accent, rendered in rich full color with bold confident black ink outlines, smooth cel-shading and layered dimensional depth and a soft warm sunlit bloom glow, warm-cream and deep forest-green and bright azalea-pink and claret-red tones with one tiny brass gold highlight, lively characterful joyful and fresh, a large hollow open empty center showing nothing inside. Polished premium collectible game-cosmetic quality, vibrant and dimensional, a flat matte illustration, never a thin plain line ring. Isolated on a perfectly flat fully-saturated shadowless bright chroma-blue 1763FF background filling the entire frame, the center is a large open empty circle with nothing inside it, the background stays one uniform flat blue color. Centered, symmetrical, viewed head-on and flat.'],
  ['deco-frost-delay', 'A premium collectible circular avatar-frame decoration in the bold 1930s rubber-hose cartoon style of a vintage Cuphead-era golf cartoon, a lively hand-drawn winter rim wrapping the circle built from chunky cartoon snow caps and rounded icicles dripping along the lower edge with sparkling six-point frost crystals dotted around it, a small cream and forest-green winter pennant pin-flag fluttering at the very top and a crossed pair of frosted hickory golf clubs dusted with snow at the bottom, rendered in rich full color with bold confident black ink outlines, smooth cel-shading, plump dimensional depth and a soft icy-blue rim glow, icy white and pale frost-blue and warm cream with a small deep forest-green pine accent, lively characterful and fun, a large hollow open empty center. Polished premium collectible game-cosmetic quality, vibrant and dimensional, a thick rounded snowy ring. Isolated on a perfectly flat fully-saturated shadowless bright chroma-green background filling the entire frame, the center is a large open empty circle with nothing inside it, the background stays one uniform flat green color. Centered, symmetrical, viewed head-on and flat.'],
  // round 2 — object/scene motifs (no human characters, so no anatomy risk), varied unlock methods.
  ['deco-eagle', 'A premium collectible circular avatar-frame decoration in the bold 1930s rubber-hose cartoon style of a vintage Cuphead-era golf cartoon, a prestige eagle frame, a complete continuous circular ring with two large spread cream-and-honey eagle wings sweeping gracefully up both sides from the bottom, a small forest-green laurel cradling a single claret-red star at the very top, rendered in rich full color with bold confident black ink outlines, smooth cel-shading and dimensional feathered depth and a soft warm rim glow, warm-cream and honey and deep forest-green and claret-red tones with one tiny restrained brass-gold glint on the star, dignified and triumphant, a large hollow open empty center. Polished premium collectible game-cosmetic quality, vibrant and dimensional, never a thin plain line ring. Isolated on a perfectly flat fully-saturated shadowless bright chroma-blue background filling the entire frame, the center is a large open empty circle with nothing inside it, the background stays one uniform flat blue color. Centered, symmetrical, viewed head-on and flat.'],
  ['deco-bramble-rose', 'A premium collectible circular avatar-frame decoration in the bold 1930s rubber-hose cartoon style of a vintage Cuphead-era golf cartoon, a lush romantic frame, a complete continuous circular ring densely wreathed all the way around in blooming deep claret-red and soft cream roses with layered petals and thorny forest-green vines and leaves weaving between them, the rose-and-thorn motif of the Parbaughs mark, rendered in rich full color with bold confident black ink outlines, smooth cel-shading and layered dimensional depth and a soft warm glow, deep claret-red and warm-cream and forest-green tones, lush characterful and elegant, a large hollow open empty center. Polished premium collectible game-cosmetic quality, vibrant and dimensional, never a thin plain line ring. Isolated on a perfectly flat fully-saturated shadowless bright chroma-blue background filling the entire frame, the center is a large open empty circle with nothing inside it, the background stays one uniform flat blue color. Centered, symmetrical, viewed head-on and flat.'],
  ['deco-autumn', 'A premium collectible circular avatar-frame decoration in the bold 1930s rubber-hose cartoon style of a vintage Cuphead-era golf cartoon, a cozy autumn frame, a complete continuous circular ring garlanded all the way around with warm fall maple and oak leaves in burnt-orange amber rust-red and golden-brown tones tumbling and overlapping with a couple of leaves drifting loose, a small claret-red acorn accent at the bottom, rendered in rich full color with bold confident black ink outlines, smooth cel-shading and layered dimensional depth and a soft warm autumn glow, burnt-orange and amber and rust-red and warm-cream tones with a small deep forest-green stem accent, lively characterful and warm, a large hollow open empty center. Polished premium collectible game-cosmetic quality, vibrant and dimensional, never a thin plain line ring. Isolated on a perfectly flat fully-saturated shadowless bright chroma-green background filling the entire frame, the center is a large open empty circle with nothing inside it, the background stays one uniform flat green color. Centered, symmetrical, viewed head-on and flat.'],
];

// FILLERS — atmospheric page art (the ONE place to open the aperture).
const SCENE = ' soft atmospheric haze, warm muted brand-palette tones, no people present, editorial photography, shallow depth of field with soft background bokeh, photorealistic, fine detail. Shot on a 35mm lens at f/2.8.' + PALETTE;
const FILLERS = [
  ['filler-dawn-fairway', 'A serene wide cinematic photograph of an empty golf course fairway at dawn, rolling green hills and a distant flag, low golden sunrise light raking across the turf with gentle mist,' + SCENE, '16:9'],
  ['filler-clubhouse', 'A serene wide cinematic photograph of a cozy golf clubhouse interior at golden hour, leather chairs and a wall of brass trophies softly out of focus, warm directional window light,' + SCENE, '16:9'],
];

// LEISURE — the rubber-hose casual line (Malbon-energy, our cartoons NOT a golf-
// ball mascot). A ghost-mannequin tee with a bold hand-inked golf CREST printed
// large (no text, no human character → no anatomy/canon risk). Keyed + finished
// like the tour apparel.
const LEISURE = [
  ['leisure-tee', 'A ghost-mannequin invisible-mannequin studio product photograph of a vintage washed-black heavyweight cotton t-shirt shown as a hollow shape worn by no one with natural shoulder and chest volume and soft folds and a few natural wrinkles at the fold lines, a single bold 1930s rubber-hose cartoon golf CREST printed large and centered on the chest made of two crossed hickory golf clubs over a small claret-red pennant flag framed by a cream laurel wreath with one star at the top, bold confident black ink outlines with warm-cream and forest-green and claret-red flat cel-shaded fills, playful and characterful and fun, absolutely no text and no letters and no words anywhere. The garment lit by soft directional light from the upper left revealing the cotton jersey texture, a three-quarter hero angle rotated 30 degrees with a slight downward tilt, the garment centered occupying about 70 percent of frame height. Sharp commercial e-commerce product photography, photorealistic, fine jersey texture. Shot on an 85mm lens at f/8. Isolated on a background that is one perfectly flat fully-saturated shadowless solid bright chroma-blue color filling the entire frame edge to edge, the background stays one uniform flat blue color with no gradient.', '3:4'],
];

const SETS = { merch: MERCH, shop: SHOP, fillers: FILLERS, lifestyle: LIFESTYLE, cosmetic: COSMETIC, deco: DECO, leisure: LEISURE };
const which = process.argv[2];

async function gen(name, prompt, ar) {
  const url = `https://${LOC}-aiplatform.googleapis.com/v1/projects/${PROJ}/locations/${LOC}/publishers/google/models/${MODEL}:predict`;
  const r = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    // seed pinned for reproducibility; addWatermark MUST be false or Vertex
    // rejects the seed (SynthID + seed are mutually exclusive). See SKILL §3.
    body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio: ar || '1:1', seed: Number(process.env.IMG_SEED || 42), addWatermark: false } }) });
  const txt = await r.text();
  if (!r.ok) { console.log('  [FAIL] ' + name + ' HTTP ' + r.status + ' ' + txt.replace(/\s+/g, ' ').slice(0, 200)); return false; }
  const b64 = ((JSON.parse(txt).predictions || [])[0] || {}).bytesBase64Encoded;
  if (!b64) { console.log('  [FAIL] ' + name + ' no image'); return false; }
  writeFileSync(OUT + '/' + name + '.png', Buffer.from(b64, 'base64'));
  console.log('  [OK]   ' + name + '.png (' + Math.round(b64.length * 0.75 / 1024) + 'kb)');
  return true;
}

let jobs;
if (SETS[which]) jobs = SETS[which];
else if (which && process.argv[3]) jobs = [[which, process.argv[3], process.argv[4]]];
else jobs = [...MERCH, ...SHOP, ...FILLERS];

console.log('VERTEX IMAGEN gen → ' + jobs.length + ' images (model ' + MODEL + ', billed to ' + PROJ + ', scratch → ' + OUT + '):');
let ok = 0;
for (const [name, prompt, ar] of jobs) { try { if (await gen(name, prompt, ar)) ok++; } catch (e) { console.log('  [ERR] ' + name + ' ' + String(e).slice(0, 100)); } }
console.log('\nDONE ' + ok + '/' + jobs.length + ' → ' + OUT + '/  (~$' + (ok * 0.02).toFixed(2) + ' est.)  Next: python scripts/_finish-art.py merch');

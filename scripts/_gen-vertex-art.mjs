// Professional asset generation via Vertex AI Imagen 4 (Fast), billed to the
// parbaughs-staging project's credits using the LOCAL staging service account
// (scripts/.service-account.json — gitignored). This is the WORKING image-gen
// path (the AI-Studio key route hit free-tier-0 on a different project):
//   staging SA → OAuth (cloud-platform) → Vertex predict on parbaughs-staging.
//
//   node scripts/_gen-vertex-art.mjs merch     # only merch line
//   node scripts/_gen-vertex-art.mjs shop      # only shop item art
//   node scripts/_gen-vertex-art.mjs fillers   # page blank-space art
//   node scripts/_gen-vertex-art.mjs <name> "<prompt>"   # one-off
//
// CREDIT DISCIPLINE (Founder 2026-06-14): curated prompts, ONE image each,
// imagen-4.0-fast (~$0.02/img). Vet output, regenerate only misses. Imagen 4 has
// NO negative-prompt field — negatives are written as positive instructions.
// Prompt shape (validated): Subject + Context(surface/light) + Style + Technical.
// Brand palette: warm cream, forest/felt green, brass gold, claret red, deep ink.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const SA = 'scripts/.service-account.json';
if (!existsSync(SA)) { console.error('NO staging SA at ' + SA); process.exit(3); }
const sa = JSON.parse(readFileSync(SA, 'utf8'));
const { GoogleAuth } = await import('google-auth-library');
const token = (await (await new GoogleAuth({ credentials: sa, scopes: ['https://www.googleapis.com/auth/cloud-platform'] }).getClient()).getAccessToken()).token;
const PROJ = sa.project_id, LOC = 'us-central1', MODEL = 'imagen-4.0-fast-generate-001';
const OUT = 'public/img/gen';
mkdirSync(OUT, { recursive: true });

const STUDIO = ' Soft diffused studio light from the upper left, gentle shadow, subtle reflection. Clean warm-cream seamless background. Luxury catalog product photography style, photorealistic, sharp focus, high detail.';

// MERCH — physical products for the merch "pro shop" catalog (1:1 each).
const MERCH = [
  ['merch-cap', 'A minimalist studio product photograph of a single structured premium golf cap, baseball-style, warm cream crown with a forest-green brim and a small embroidered crossed-golf-clubs emblem on the front panel, resting on a smooth warm cream surface, fine fabric texture.' + STUDIO],
  ['merch-polo', 'A minimalist studio product photograph of a single neatly folded premium golf polo shirt, warm cream pique fabric with a forest-green collar trim and a small embroidered crossed-golf-clubs emblem on the chest, folded on a smooth warm cream surface.' + STUDIO],
  ['merch-quarterzip', 'A minimalist studio product photograph of a single neatly folded premium quarter-zip golf pullover, forest-green knit with a cream zip placket and a small brass crossed-golf-clubs emblem at the chest, folded on a smooth warm cream surface.' + STUDIO],
  ['merch-towel', 'A minimalist studio product photograph of a single neatly folded premium golf towel, warm cream cotton with a woven forest-green and claret-red stripe and a small embroidered golf-flag emblem, a brass grommet at one corner, on a smooth warm cream surface.' + STUDIO],
  ['merch-headcover', 'A minimalist studio product photograph of a single premium golf driver headcover, cream and forest-green knit with a claret-red pom on top and a small crossed-golf-clubs emblem, standing upright on a smooth warm cream surface.' + STUDIO],
  ['merch-flatlay', 'A premium top-down flat-lay product photograph of golf merchandise arranged neatly on a warm cream surface: a folded cream golf polo, a structured cream and forest-green cap, a folded forest-green towel, and a knit driver headcover, with three white golf balls. Editorial catalog styling, warm cream, forest green, brass and claret palette. Soft diffused overhead studio light, subtle shadows, photorealistic, high detail.', '4:3'],
];

// SHOP — premium product renders of the earnable/buyable cosmetics as real objects.
const SHOP = [
  ['shop-medallion', 'A minimalist studio macro product photograph of a single struck solid-brass commemorative golf medallion coin, embossed with a golf flag and crossed clubs, gleaming polished gold metal with crisp relief, resting flat on a smooth warm cream surface.' + STUDIO],
  ['shop-ballmarker', 'A minimalist studio macro product photograph of a single premium hammered sterling-silver golf ball marker disc with a small deep-green enamel inset and an engraved golf flag, jeweler quality, resting flat on a smooth warm cream surface.' + STUDIO],
  ['shop-bagtag', 'A minimalist studio macro product photograph of a single premium pebbled tan calfskin leather golf bag name tag with a polished brass rivet, hand-stitched edge and a blank embossed panel, resting flat on a smooth warm cream surface.' + STUDIO],
  ['shop-greenjacket', 'A minimalist studio product photograph of a single emerald forest-green tournament champion blazer on a wooden hanger, gold buttons, crisp lapels, prestige presentation against a clean warm cream background.' + STUDIO],
];

// FILLERS — atmospheric page art for blank space (wider crops).
const FILLERS = [
  ['filler-dawn-fairway', 'A serene wide cinematic photograph of an empty golf course fairway at dawn, rolling green hills, a flag on a distant green, soft golden sunrise light and gentle mist, warm muted tones, no people, editorial landscape photography, photorealistic, high detail.', '16:9'],
  ['filler-clubhouse', 'A warm inviting photograph of a cozy golf clubhouse interior at golden hour, leather chairs, a wall of brass trophies softly out of focus, warm cream and forest-green and brass tones, no people, editorial interior photography, shallow depth of field, photorealistic.', '16:9'],
];

const SETS = { merch: MERCH, shop: SHOP, fillers: FILLERS };
const which = process.argv[2];

async function gen(name, prompt, ar) {
  const url = `https://${LOC}-aiplatform.googleapis.com/v1/projects/${PROJ}/locations/${LOC}/publishers/google/models/${MODEL}:predict`;
  const r = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio: ar || '1:1' } }) });
  const txt = await r.text();
  if (!r.ok) { console.log('  [FAIL] ' + name + ' HTTP ' + r.status + ' ' + txt.replace(/\s+/g, ' ').slice(0, 150)); return false; }
  const b64 = ((JSON.parse(txt).predictions || [])[0] || {}).bytesBase64Encoded;
  if (!b64) { console.log('  [FAIL] ' + name + ' no image'); return false; }
  writeFileSync(OUT + '/' + name + '.png', Buffer.from(b64, 'base64'));
  console.log('  [OK]   ' + name + '.png (' + Math.round(b64.length * 0.75 / 1024) + 'kb)');
  return true;
}

let jobs;
if (which === 'merch' || which === 'shop' || which === 'fillers') jobs = SETS[which];
else if (which && process.argv[3]) jobs = [[which, process.argv[3], process.argv[4]]];
else jobs = [...MERCH, ...SHOP, ...FILLERS];

console.log('VERTEX IMAGEN gen → ' + jobs.length + ' images (model ' + MODEL + ', billed to ' + PROJ + '):');
let ok = 0;
for (const [name, prompt, ar] of jobs) { try { if (await gen(name, prompt, ar)) ok++; } catch (e) { console.log('  [ERR] ' + name + ' ' + String(e).slice(0, 100)); } }
console.log('\nDONE ' + ok + '/' + jobs.length + ' → ' + OUT + '/  (~$' + (ok * 0.02).toFixed(2) + ' est. of the $25)');

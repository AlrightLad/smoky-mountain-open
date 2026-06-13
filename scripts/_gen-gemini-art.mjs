// Professional asset generation via Google Gemini 2.5 Flash Image (the free
// 500/day tier). Founder 2026-06-13: shop items + merch art must be top-tier,
// generated with a real tool — hand-SVG is "comical." This pipeline is
// plug-and-play: drop the free key in scripts/.secrets/gemini-key.txt (or set
// GEMINI_API_KEY) and run `node scripts/_gen-gemini-art.mjs`. It generates each
// asset, saves a PNG to public/img/gen/, and reports. No key needed to READ
// this file — only to RUN it. Get a key: aistudio.google.com -> Get API key.
//
//   node scripts/_gen-gemini-art.mjs            # generate ALL
//   node scripts/_gen-gemini-art.mjs shop       # only shop items
//   node scripts/_gen-gemini-art.mjs merch      # only merch
// API: POST .../models/gemini-2.5-flash-image:generateContent  (x-goog-api-key)
//      body {contents:[{parts:[{text}]}]}; image at
//      candidates[0].content.parts[].inlineData.data (base64).  Ref:
//      https://ai.google.dev/gemini-api/docs  (verified shape 2026-06-13)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const KEY = (process.env.GEMINI_API_KEY ||
  (existsSync('scripts/.secrets/gemini-key.txt') ? readFileSync('scripts/.secrets/gemini-key.txt', 'utf8').trim() : '')).trim();
if (!KEY) {
  console.error('NO KEY. Put the free Gemini key in scripts/.secrets/gemini-key.txt (gitignored)\n' +
    'or set GEMINI_API_KEY. Get one (2 min, no card): https://aistudio.google.com/app/apikey');
  process.exit(3);
}

const OUT = 'public/img/gen';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// Brand: warm Clubhouse — chalk/cream, felt green (#2f4f33), brass (#c9a84c),
// claret (#b5472f), deep ink. Premium, editorial, golf-country-club. Every
// prompt asks for a clean transparent/neutral studio product render so the
// asset drops onto the app's surfaces cleanly.
const STYLE = ' Premium studio product render, soft directional light, subtle ' +
  'reflections, centered, on a clean transparent or pale-cream background, no ' +
  'text, no watermark, high detail, tasteful, luxury golf pro-shop quality. ' +
  'Warm palette: cream, felt green, brass gold, claret red, deep ink.';

const SHOP = [
  ['ring-clubpin', 'A luxury hard-enamel golf club lapel pin, brass bezel, a tiny crossed-clubs crest in felt green and claret enamel.'],
  ['ring-medallion', 'A struck solid-brass commemorative golf medallion coin, embossed golf flag motif, gleaming metal.'],
  ['plate-calfskin', 'A premium pebbled calfskin leather golf bag name tag, brass rivet, hand-stitched edge, embossed.'],
  ['marker-sterling', 'A hammered sterling-silver golf ball marker disc with a small sapphire-blue inset, jeweler quality.'],
  ['card-greenjacket', 'A folded emerald-green tournament champion blazer / green jacket, gold buttons, on a hanger, prestige.'],
  ['marker-holeinone', 'A gold hole-in-one commemorative golf ball marker, engraved "ACE", brilliant gold finish.'],
];
const MERCH = [
  ['merch-hero', 'A flat-lay of premium golf merch: a folded country-club polo, a structured cap, a leather headcover, a towel — arranged on a warm cream surface, editorial catalog photography, brass + felt-green + claret accents.'],
];

async function gen(name, prompt) {
  const body = { contents: [{ parts: [{ text: prompt + STYLE }] }] };
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent', {
    method: 'POST',
    headers: { 'x-goog-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) { console.log('  [FAIL] ' + name + ' HTTP ' + r.status + ' ' + (await r.text()).slice(0, 160)); return false; }
  const j = await r.json();
  const parts = (((j.candidates || [])[0] || {}).content || {}).parts || [];
  const img = parts.find(p => p.inlineData && p.inlineData.data);
  if (!img) { console.log('  [FAIL] ' + name + ' no image in response: ' + JSON.stringify(j).slice(0, 160)); return false; }
  const buf = Buffer.from(img.inlineData.data, 'base64');
  const ext = (img.inlineData.mimeType || 'image/png').split('/')[1] || 'png';
  const path = OUT + '/' + name + '.' + ext;
  writeFileSync(path, buf);
  console.log('  [OK]   ' + name + ' -> ' + path + ' (' + Math.round(buf.length / 1024) + 'kb)');
  return true;
}

const which = process.argv[2];
const jobs = (which === 'shop') ? SHOP : (which === 'merch') ? MERCH : SHOP.concat(MERCH);
console.log('GEMINI ASSET GEN — ' + jobs.length + ' assets (model gemini-2.5-flash-image):');
let ok = 0;
for (const [name, prompt] of jobs) {
  try { if (await gen(name, prompt)) ok++; } catch (e) { console.log('  [ERR]  ' + name + ' ' + String(e).slice(0, 120)); }
}
console.log('\nDONE: ' + ok + '/' + jobs.length + ' generated -> ' + OUT + '/  (review, then wire the winners into shop.js / merch.js)');

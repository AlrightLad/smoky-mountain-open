// External AI design critique of app screens via Gemini 2.5 Flash (multimodal
// INPUT is on the FREE tier — only image GENERATION needs billing). Founder
// 2026-06-13: "use online tools to even grade and rate existing pages and see
// what other tools recommend or would alter." This feeds a page screenshot to
// Gemini and returns an expert score + the highest-impact concrete changes —
// outside expert input to drive the 9.5 convergence pass (NOT my own judgment).
//
//   node scripts/_gemini-critique.mjs <png-path> [<png-path> ...]
//   (capture pages first via scripts/verify-as-member.mjs)
// Key: scripts/.secrets/gemini-key.txt (gitignored) or GEMINI_API_KEY.
import { readFileSync, existsSync } from 'fs';

const KEY = (process.env.GEMINI_API_KEY ||
  (existsSync('scripts/.secrets/gemini-key.txt') ? readFileSync('scripts/.secrets/gemini-key.txt', 'utf8').trim() : '')).trim();
if (!KEY) { console.error('NO KEY (scripts/.secrets/gemini-key.txt). Get one: aistudio.google.com/app/apikey'); process.exit(3); }

const files = process.argv.slice(2);
if (!files.length) { console.error('Usage: node scripts/_gemini-critique.mjs <png> [<png> ...]'); process.exit(2); }

const PROMPT = 'You are a world-class mobile product designer (ex-Linear/Stripe/' +
  'Vercel) reviewing a screen from PARBAUGHS, a premium golf social app with a ' +
  'deliberate editorial brand (Fraunces serif headlines + mono eyebrows + a warm ' +
  'cream/felt-green/brass "country-club" palette — that identity is INTENTIONAL, ' +
  'do not tell me to flatten it to generic Inter). Within THAT brand, judge it ' +
  'against top-tier app polish. Return EXACTLY: (1) Score /10. (2) The THREE ' +
  'highest-impact, concrete, shippable changes to push it toward 9.5 — each one ' +
  'specific enough to implement (name the element, the exact change). Terse, no fluff.';

async function critique(path) {
  if (!existsSync(path)) { console.log('\n### ' + path + '\n  [missing file]'); return; }
  const b64 = readFileSync(path).toString('base64');
  const body = { contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: 'image/png', data: b64 } }] }] };
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
    method: 'POST', headers: { 'x-goog-api-key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) { console.log('\n### ' + path + '\n  [HTTP ' + r.status + '] ' + (await r.text()).slice(0, 140)); return; }
  const j = await r.json();
  const t = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(p => p.text || '').join('');
  console.log('\n### ' + path.split(/[\\/]/).pop() + '\n' + (t || '[no text]'));
}

console.log('GEMINI DESIGN CRITIQUE (free multimodal tier):');
for (const f of files) { try { await critique(f); } catch (e) { console.log('\n### ' + f + '\n  [err] ' + String(e).slice(0, 120)); } }

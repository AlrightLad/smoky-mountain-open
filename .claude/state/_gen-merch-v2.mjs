// Generate the vetted merch lineup (workflow wofmg0j2e) via Vertex Imagen fast,
// billed to parbaughs-staging. 1 variant each first (credit-disciplined — regen
// only misses). Reads .claude/state/merch-prompts.json.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
const SA = 'scripts/.service-account.json';
if (!existsSync(SA)) { console.error('NO staging SA'); process.exit(3); }
const sa = JSON.parse(readFileSync(SA, 'utf8'));
const { GoogleAuth } = await import('google-auth-library');
const token = (await (await new GoogleAuth({ credentials: sa, scopes: ['https://www.googleapis.com/auth/cloud-platform'] }).getClient()).getAccessToken()).token;
const PROJ = sa.project_id, LOC = 'us-central1', MODEL = 'imagen-4.0-fast-generate-001';
const OUT = 'public/img/gen/merch2';
mkdirSync(OUT, { recursive: true });

const prompts = JSON.parse(readFileSync('.claude/state/merch-prompts.json', 'utf8'));
const only = process.argv[2]; // optional: regen a single key
const jobs = only ? prompts.filter(p => p.key === only) : prompts;

async function gen(p) {
  const url = `https://${LOC}-aiplatform.googleapis.com/v1/projects/${PROJ}/locations/${LOC}/publishers/google/models/${MODEL}:predict`;
  const r = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ instances: [{ prompt: p.prompt }], parameters: { sampleCount: 1, aspectRatio: p.aspectRatio || '1:1' } }) });
  const txt = await r.text();
  if (!r.ok) { console.log('  [FAIL] ' + p.key + ' HTTP ' + r.status + ' ' + txt.replace(/\s+/g, ' ').slice(0, 140)); return false; }
  const b64 = ((JSON.parse(txt).predictions || [])[0] || {}).bytesBase64Encoded;
  if (!b64) { console.log('  [FAIL] ' + p.key + ' no image'); return false; }
  writeFileSync(OUT + '/' + p.key + '.png', Buffer.from(b64, 'base64'));
  console.log('  [OK]   ' + p.key + '.png (' + Math.round(b64.length * 0.75 / 1024) + 'kb, ' + p.aspectRatio + ')');
  return true;
}

console.log('VERTEX merch gen → ' + jobs.length + ' images (fast, billed ' + PROJ + '):');
let ok = 0;
for (const p of jobs) { try { if (await gen(p)) ok++; } catch (e) { console.log('  [ERR] ' + p.key + ' ' + String(e).slice(0, 90)); } }
console.log('\nDONE ' + ok + '/' + jobs.length + ' → ' + OUT + '/  (~$' + (ok * 0.02).toFixed(2) + ')');

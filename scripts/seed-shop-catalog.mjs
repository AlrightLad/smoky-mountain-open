// Seed shop_catalog/{itemId} = {name, price, reserved, arriving, earnedBy}
// from the client catalogs in src/pages/shop.js, so the purchaseCosmetic
// Cloud Function can read authoritative prices server-side (parcoin
// hardening, sec #17). Re-run after any catalog change.
//
//   node scripts/seed-shop-catalog.mjs <project>
//
// World-readable, founder/agent-written collection. Auth mirrors the other
// seed scripts (project SA, else firebase-CLI token via scripts/.secrets).
import { readFileSync, existsSync } from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';

const project = process.argv[2];
if (!project) { console.error('Usage: node scripts/seed-shop-catalog.mjs <project>'); process.exit(2); }

// Parse the two catalog arrays out of shop.js without executing it.
const shopSrc = readFileSync('src/pages/shop.js', 'utf8');
function parseItems(src) {
  // Match {id:"...", ... price:NN ... name:"..." ...} object literals.
  const items = [];
  const re = /\{id:\s*"([a-z0-9_]+)"[^}]*?\}/gi;
  let m;
  while ((m = re.exec(src))) {
    const blk = m[0];
    const id = m[1];
    const price = (blk.match(/price:\s*([0-9.]+)/) || [])[1];
    const name = (blk.match(/name:\s*"((?:[^"\\]|\\.)*)"/) || [])[1] || id;
    const reserved = /reserved:\s*true/.test(blk);
    const arriving = /arriving:\s*true/.test(blk);
    const earnedBy = (blk.match(/earnedBy:\s*"((?:[^"\\]|\\.)*)"/) || [])[1] || null;
    items.push({ id, name, price: price != null ? parseFloat(price) : 0, reserved, arriving, earnedBy });
  }
  return items;
}
const items = parseItems(shopSrc);
console.log('parsed ' + items.length + ' catalog items from shop.js');

function httpsReq(opts, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { let j; try { j = JSON.parse(d || '{}'); } catch (e) { j = { raw: d }; } resolve({ status: res.statusCode, body: j }); }); });
    req.on('error', reject); if (data) req.write(data); req.end();
  });
}
async function getAccessToken() {
  const saPath = 'scripts/.service-account.json';
  if (existsSync(saPath)) {
    const sa = JSON.parse(readFileSync(saPath, 'utf8'));
    if (sa.project_id === project) {
      const admin = (await import('firebase-admin')).default;
      return (await admin.credential.cert(sa).getAccessToken()).access_token;
    }
  }
  const cfgPath = path.join(os.homedir(), '.config/configstore/firebase-tools.json');
  const rt = (JSON.parse(readFileSync(cfgPath, 'utf8')).tokens || {}).refresh_token;
  const oauth = JSON.parse(readFileSync(path.join('scripts', '.secrets', 'fb-oauth.json'), 'utf8'));
  const form = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: rt, client_id: oauth.client_id, client_secret: oauth.client_secret }).toString();
  const r = await httpsReq({ hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(form) } }, form);
  return r.body.access_token;
}
const token = await getAccessToken();
const H = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
const base = `/v1/projects/${project}/databases/(default)/documents`;
let ok = 0, fail = 0;
for (const it of items) {
  const body = JSON.stringify({ fields: {
    name: { stringValue: it.name },
    price: { integerValue: String(Math.round(it.price)) },
    reserved: { booleanValue: !!it.reserved },
    arriving: { booleanValue: !!it.arriving },
    earnedBy: it.earnedBy ? { stringValue: it.earnedBy } : { nullValue: null },
  } });
  const mask = ['name','price','reserved','arriving','earnedBy'].map(f => 'updateMask.fieldPaths=' + f).join('&');
  const r = await httpsReq({ hostname: 'firestore.googleapis.com', path: `${base}/shop_catalog/${it.id}?${mask}`, method: 'PATCH', headers: { ...H, 'Content-Length': Buffer.byteLength(body) } }, body);
  r.status === 200 ? ok++ : (fail++, console.error('  ' + it.id + ' FAILED ' + r.status));
}
console.log(`seeded shop_catalog: ${ok} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

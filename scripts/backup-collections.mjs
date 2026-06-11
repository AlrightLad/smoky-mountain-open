// Backup named Firestore collections to local gitignored JSON (backup-first
// rule for prod data operations). REST-based — same auth as the other
// seed-deploy scripts (project SA, else firebase-CLI token via .secrets).
//
//   node scripts/backup-collections.mjs <project> <collection> [collection...]
//
// Writes .claude/state/backups/<project>-<collection>-<ts>.json
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';

const project = process.argv[2];
const collections = process.argv.slice(3);
if (!project || !collections.length) {
  console.error('Usage: node scripts/backup-collections.mjs <project> <collection> [collection...]');
  process.exit(2);
}

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
const outDir = path.join('.claude', 'state', 'backups');
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, '-');

for (const coll of collections) {
  const docs = [];
  let pageToken = null;
  do {
    const q = JSON.stringify({ structuredQuery: { from: [{ collectionId: coll }], limit: 300 } });
    // runQuery has no pagination cursor in this simple form; 300 covers all
    // current collections (27 rounds prod / 55 staging). Assert no overflow.
    const r = await httpsReq({ hostname: 'firestore.googleapis.com', path: `${base}:runQuery`, method: 'POST', headers: { ...H, 'Content-Length': Buffer.byteLength(q) } }, q);
    for (const row of (Array.isArray(r.body) ? r.body : [])) {
      if (row.document) docs.push(row.document);
    }
    pageToken = null;
  } while (pageToken);
  if (docs.length >= 300) {
    console.error(`REFUSING: ${coll} hit the 300-doc single-page cap — add pagination before relying on this backup.`);
    process.exit(3);
  }
  const file = path.join(outDir, `${project}-${coll}-${ts}.json`);
  writeFileSync(file, JSON.stringify(docs, null, 1), 'utf8');
  console.log(`backed up ${coll}: ${docs.length} docs -> ${file}`);
}

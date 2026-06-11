// Member-doc privacy split — APPROVED by Founder 2026-06-11 ("split member
// docs"). Moves email (PII) out of the public members/{uid} doc (readable by
// every league member) into members_private/{uid} (owner+founder only).
//
//   node scripts/migrate-member-privacy.mjs <project> --dry-run   # report
//   node scripts/migrate-member-privacy.mjs <project> --apply     # migrate
//
// --apply, per member with an email on the public doc:
//   1. write members_private/{uid} = { email, migratedAt }  (idempotent merge)
//   2. delete the email field from the public members/{uid} doc
// Idempotent: a member whose public doc already has no email is skipped.
// fcmToken + location stay for now (the push Cloud Function reads fcmToken
// via Admin SDK; both migrate on the coordinated function-deploy ship).
// BACKUP FIRST: node scripts/backup-collections.mjs <project> members
import { readFileSync, existsSync } from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';

const project = process.argv[2];
const mode = process.argv[3];
if (!project || !['--dry-run', '--apply'].includes(mode)) {
  console.error('Usage: node scripts/migrate-member-privacy.mjs <project> --dry-run|--apply');
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

async function runQuery(body) {
  const data = JSON.stringify(body);
  const r = await httpsReq({ hostname: 'firestore.googleapis.com', path: `${base}:runQuery`, method: 'POST', headers: { ...H, 'Content-Length': Buffer.byteLength(data) } }, data);
  return (Array.isArray(r.body) ? r.body : []).filter(x => x.document);
}

const members = await runQuery({ structuredQuery: { from: [{ collectionId: 'members' }], limit: 2000 } });
let withEmail = 0, migrated = 0, failed = 0;
const work = [];
for (const row of members) {
  const f = row.document.fields || {};
  const email = f.email && f.email.stringValue;
  const uid = row.document.name.split('/').pop();
  if (email) { withEmail++; work.push({ uid, email }); }
}
console.log(`${mode} — ${project}: ${members.length} members, ${withEmail} carry an email on the PUBLIC doc`);

if (mode === '--dry-run') { console.log('No writes performed.'); process.exit(0); }

for (const w of work) {
  // 1. write private doc
  const pBody = JSON.stringify({ fields: { email: { stringValue: w.email }, migratedAt: { timestampValue: new Date().toISOString() } } });
  const pr = await httpsReq({ hostname: 'firestore.googleapis.com', path: `${base}/members_private/${w.uid}?updateMask.fieldPaths=email&updateMask.fieldPaths=migratedAt`, method: 'PATCH', headers: { ...H, 'Content-Length': Buffer.byteLength(pBody) } }, pBody);
  if (pr.status !== 200) { console.error(`  ${w.uid}: members_private write FAILED ${pr.status}`); failed++; continue; }
  // 2. delete email field from public doc (PATCH with mask but field absent = delete)
  const dr = await httpsReq({ hostname: 'firestore.googleapis.com', path: `${base}/members/${w.uid}?updateMask.fieldPaths=email`, method: 'PATCH', headers: { ...H, 'Content-Length': 2 } }, '{}');
  if (dr.status !== 200) { console.error(`  ${w.uid}: public email delete FAILED ${dr.status}`); failed++; continue; }
  migrated++;
}
console.log(`migrated: ${migrated}, failed: ${failed}`);
// verify
const recheck = await runQuery({ structuredQuery: { from: [{ collectionId: 'members' }], limit: 2000 } });
const remaining = recheck.filter(r => { const f = r.document.fields || {}; return f.email && f.email.stringValue; }).length;
console.log(`post-migration verification: ${remaining} public members docs still carry an email (expect 0)`);
process.exit(remaining === 0 && failed === 0 ? 0 : 1);

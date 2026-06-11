// Multi-league round attribution migration — APPROVED by Founder 2026-06-11
// (founder-decisions/2026-06-11.ndjson, multi-league-architecture). Promoted
// from migrate-leagueids.draft.mjs; the draft's --apply guard is retired.
//
//   node scripts/migrate-leagueids.mjs <project> --dry-run     # report only
//   node scripts/migrate-leagueids.mjs <project> --apply       # backfill
//   node scripts/migrate-leagueids.mjs <project> --rollback    # remove leagueIds[] + memberJoinedAt
//
// What --apply does (decision doc F-points; migration day = ZERO visible change):
//   1. Every rounds doc with a scalar leagueId gains leagueIds: [leagueId].
//      DUAL-WRITE WINDOW: the scalar is KEPT — readers migrate query-by-query
//      in later app ships; the scalar is removed only in post-cutover cleanup.
//   2. Every league referenced by those rounds gains memberJoinedAt:{uid:date}
//      seeded from each member's earliest round in that league (visibility
//      window basis). Existing memberJoinedAt keys are never overwritten.
//   3. Idempotent: docs already carrying leagueIds are skipped.
//
// BACKUP-FIRST: run scripts/backup-collections.mjs <project> rounds leagues
// before --apply. --rollback strips leagueIds[] + memberJoinedAt entirely
// (the scalar was never touched, so rollback is total).
import { readFileSync, existsSync } from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';

const project = process.argv[2];
const mode = process.argv[3];
if (!project || !['--dry-run', '--apply', '--rollback'].includes(mode)) {
  console.error('Usage: node scripts/migrate-leagueids.mjs <project> --dry-run|--apply|--rollback');
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

async function patchDoc(docPath, fieldsObj, updateMaskPaths) {
  const body = JSON.stringify({ fields: fieldsObj });
  const mask = updateMaskPaths.map(p => 'updateMask.fieldPaths=' + encodeURIComponent(p)).join('&');
  const r = await httpsReq({ hostname: 'firestore.googleapis.com', path: `${base}/${docPath}?${mask}`, method: 'PATCH', headers: { ...H, 'Content-Length': Buffer.byteLength(body) } }, body);
  return r.status === 200;
}

// ── Scan ──
const rounds = await runQuery({ structuredQuery: { from: [{ collectionId: 'rounds' }], limit: 2000 } });
let withScalar = 0, withArray = 0, withNeither = 0;
const toMigrate = [];
const leagueJoins = {}; // leagueId -> { uid -> earliest date }
for (const row of rounds) {
  const f = row.document.fields || {};
  const scalar = f.leagueId && f.leagueId.stringValue;
  if (f.leagueIds) { withArray++; continue; }
  if (!scalar) { withNeither++; continue; }
  withScalar++;
  toMigrate.push({ path: row.document.name.split('/documents/')[1], leagueId: scalar });
  const uid = f.player && f.player.stringValue;
  const date = (f.date && f.date.stringValue) || '';
  if (uid) {
    leagueJoins[scalar] = leagueJoins[scalar] || {};
    if (!leagueJoins[scalar][uid] || date < leagueJoins[scalar][uid]) leagueJoins[scalar][uid] = date;
  }
}

console.log(`${mode} — ${project}`);
console.log(`rounds scanned: ${rounds.length} (backfill: ${withScalar}, already migrated: ${withArray}, solo: ${withNeither})`);
for (const [lid, members] of Object.entries(leagueJoins)) {
  console.log(`league ${lid}: memberJoinedAt for ${Object.keys(members).length} member(s)`);
}

if (mode === '--dry-run') {
  console.log('\nNo writes performed.');
  process.exit(0);
}

if (mode === '--apply') {
  let ok = 0, fail = 0;
  for (const r of toMigrate) {
    const success = await patchDoc(r.path, { leagueIds: { arrayValue: { values: [{ stringValue: r.leagueId }] } } }, ['leagueIds']);
    success ? ok++ : fail++;
  }
  console.log(`rounds backfilled: ${ok} ok, ${fail} failed`);

  // memberJoinedAt — merge per-key (never overwrite an existing key)
  for (const [lid, members] of Object.entries(leagueJoins)) {
    const get = await httpsReq({ hostname: 'firestore.googleapis.com', path: `${base}/leagues/${encodeURIComponent(lid)}`, method: 'GET', headers: H });
    const existing = (get.body.fields && get.body.fields.memberJoinedAt && get.body.fields.memberJoinedAt.mapValue && get.body.fields.memberJoinedAt.mapValue.fields) || {};
    const merged = { ...existing };
    let added = 0;
    for (const [uid, date] of Object.entries(members)) {
      if (!merged[uid]) { merged[uid] = { stringValue: date }; added++; }
    }
    if (added > 0) {
      const success = await patchDoc(`leagues/${encodeURIComponent(lid)}`, { memberJoinedAt: { mapValue: { fields: merged } } }, ['memberJoinedAt']);
      console.log(`league ${lid}: seeded ${added} memberJoinedAt key(s) — ${success ? 'ok' : 'FAILED'}`);
    } else {
      console.log(`league ${lid}: all memberJoinedAt keys already present`);
    }
  }
  // Post-apply verification: re-scan and assert zero remaining scalar-only docs
  const recheck = await runQuery({ structuredQuery: { from: [{ collectionId: 'rounds' }], limit: 2000 } });
  const remaining = recheck.filter(row => {
    const f = row.document.fields || {};
    return f.leagueId && f.leagueId.stringValue && !f.leagueIds;
  }).length;
  console.log(`post-apply verification: ${remaining} scalar-only rounds remain (expect 0)`);
  process.exit(remaining === 0 && fail === 0 ? 0 : 1);
}

if (mode === '--rollback') {
  let ok = 0, fail = 0;
  for (const row of rounds) {
    const f = row.document.fields || {};
    if (!f.leagueIds) continue;
    const docPath = row.document.name.split('/documents/')[1];
    // PATCH with mask but field absent from body = delete that field
    const success = await patchDoc(docPath, {}, ['leagueIds']);
    success ? ok++ : fail++;
  }
  console.log(`rounds leagueIds removed: ${ok} ok, ${fail} failed`);
  const leagues = await runQuery({ structuredQuery: { from: [{ collectionId: 'leagues' }], limit: 100 } });
  for (const row of leagues) {
    if (!(row.document.fields || {}).memberJoinedAt) continue;
    const docPath = row.document.name.split('/documents/')[1];
    const success = await patchDoc(docPath, {}, ['memberJoinedAt']);
    console.log(`league ${docPath}: memberJoinedAt removed — ${success ? 'ok' : 'FAILED'}`);
  }
  process.exit(0);
}

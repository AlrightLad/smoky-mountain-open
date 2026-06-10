// DRAFT — multi-league round attribution migration (DO NOT RUN — gated on the
// Founder's sign-off of multi-league-architecture-decision.md).
//
//   node scripts/migrate-leagueids.draft.mjs <project> --dry-run     # report only
//   node scripts/migrate-leagueids.draft.mjs <project> --apply      # backfill
//   node scripts/migrate-leagueids.draft.mjs <project> --rollback   # remove leagueIds[]
//
// What it does (decision doc F-points; migration day = ZERO visible change):
//   1. Every rounds doc with a leagueId gains leagueIds: [leagueId] (dual-write
//      window: the old scalar field is KEPT — readers migrate query-by-query
//      in app ships; the scalar is removed only in the post-cutover cleanup).
//   2. Every leagues doc gains memberJoinedAt: { uid: <approx> } seeded from
//      the earliest round each member published to that league (or league
//      createdAt as the floor) — the feed visibility window basis.
//   3. --rollback strips leagueIds[] + memberJoinedAt (the scalar leagueId
//      was never touched, so rollback is total).
//
// Auth mirrors scripts/seed-deploy-rules.mjs: project-matching service
// account, else firebase-CLI-login token via gitignored scripts/.secrets/.
// Writes are batched (400/commit) and idempotent (skips docs already carrying
// leagueIds). Run --dry-run first ALWAYS; it prints per-collection counts.
//
// NOT in this script (separate gated ships per the decision doc):
//   - firestore.rules: rounds create/update validation for leagueIds (4-slot
//     unrolled, F9 cap) — rules ship via npm run rules:deploy:* after
//     emulator tests.
//   - functions/index.js: joinLeague memberJoinedAt transaction write +
//     onLeagueDelete cascade-delete REMOVAL (AMD-018 gate 1, F10).
//   - App query migration (feed/standings/chase/legend array-contains) —
//     per-surface ships behind the dual-write window.
import { readFileSync, existsSync } from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';

const project = process.argv[2];
const mode = process.argv[3];
if (!project || !['--dry-run', '--apply', '--rollback'].includes(mode)) {
  console.error('Usage: node scripts/migrate-leagueids.draft.mjs <project> --dry-run|--apply|--rollback');
  console.error('DRAFT: do not run --apply before Founder signs off multi-league-architecture-decision.md');
  process.exit(2);
}
if (mode !== '--dry-run') {
  console.error('SAFETY: this is a DRAFT. --apply/--rollback are disabled until the');
  console.error('Founder approves multi-league-architecture-decision (then remove this guard).');
  process.exit(3);
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

// ── Dry-run report ──
const rounds = await runQuery({ structuredQuery: { from: [{ collectionId: 'rounds' }], limit: 2000 } });
let withScalar = 0, withArray = 0, withNeither = 0;
const leagueRounds = {}; // leagueId -> { uid -> earliest date }
for (const row of rounds) {
  const f = row.document.fields || {};
  const scalar = f.leagueId && f.leagueId.stringValue;
  const arr = f.leagueIds;
  if (arr) withArray++;
  else if (scalar) withScalar++;
  else withNeither++;
  if (scalar) {
    const uid = f.player && f.player.stringValue;
    const date = (f.date && f.date.stringValue) || '';
    if (uid) {
      leagueRounds[scalar] = leagueRounds[scalar] || {};
      if (!leagueRounds[scalar][uid] || date < leagueRounds[scalar][uid]) leagueRounds[scalar][uid] = date;
    }
  }
}
console.log(`DRY RUN — ${project}`);
console.log(`rounds scanned: ${rounds.length}`);
console.log(`  would backfill leagueIds[]: ${withScalar}`);
console.log(`  already migrated:           ${withArray}`);
console.log(`  no league (solo):           ${withNeither}`);
for (const [lid, members] of Object.entries(leagueRounds)) {
  console.log(`league ${lid}: would seed memberJoinedAt for ${Object.keys(members).length} member(s)`);
}
console.log('\nNo writes performed. --apply remains guarded until Founder sign-off.');

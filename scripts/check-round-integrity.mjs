// Data-integrity screen for rounds (harness screening primitive, 2026-06-12).
// Catches the two classes of round bug seen this session:
//   1. SILENT DROP — a liveround marked status="completed" with a roundId and
//      >=9 holes, but no matching rounds/{roundId} doc (syncRound dropped the
//      write). The round vanished from history.
//   2. MALFORMED SHAPE — a rounds doc missing a field every real round carries
//      (addRound/syncRound shape): timestamp, leagueId, leagueIds[], date,
//      player, createdAt, visibility. A missing `timestamp` mis-sorts the round
//      out of pulse/activity surfaces (the FatalBert landing-pulse bug).
//   3. leagueId / leagueIds[] inconsistency (multi-league dual-write invariant).
//
// Usage:  node scripts/check-round-integrity.mjs [project]   (default: parbaughs)
// Exit 1 if any CRITICAL issue, else 0 — so it can gate a ship or run in cron.
// Read-only. Auth: firebase CLI refresh token + scripts/.secrets/fb-oauth.json
// (same pattern as scripts/prod-errors.mjs). No secrets printed.
import { readFileSync, existsSync } from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';

const PROJECT = process.argv[2] || 'parbaughs';
// `id` is REQUIRED: loadRoundsFromFirestore filters `if (d && d.id)` on the
// id FIELD (not the Firestore doc-id), so a round lacking the id field is
// silently skipped on load — invisible to profile/pulse/everything (the
// FatalBert recovery bug, 2026-06-12). Every surface query also needs the rest.
const REQUIRED = ['id', 'player', 'date', 'score', 'leagueId', 'leagueIds', 'timestamp', 'createdAt', 'visibility'];

function httpsReq(opts, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { let j; try { j = JSON.parse(d || '{}'); } catch (e) { j = { raw: d }; } resolve({ status: res.statusCode, body: j }); }); });
    req.on('error', reject); if (data) req.write(data); req.end();
  });
}
async function token() {
  const rt = (JSON.parse(readFileSync(path.join(os.homedir(), '.config/configstore/firebase-tools.json'), 'utf8')).tokens || {}).refresh_token;
  const oauth = JSON.parse(readFileSync(path.join('scripts', '.secrets', 'fb-oauth.json'), 'utf8'));
  const form = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: rt, client_id: oauth.client_id, client_secret: oauth.client_secret }).toString();
  const r = await httpsReq({ hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(form) } }, form);
  return r.body.access_token;
}
const TK = await token();
const BASE = `/v1/projects/${PROJECT}/databases/(default)/documents`;
function v(f) { if (!f) return undefined; if ('stringValue' in f) return f.stringValue; if ('integerValue' in f) return +f.integerValue; if ('doubleValue' in f) return f.doubleValue; if ('booleanValue' in f) return f.booleanValue; if ('timestampValue' in f) return f.timestampValue; if ('nullValue' in f) return null; if ('arrayValue' in f) return (f.arrayValue.values || []).map(v); return '~'; }
async function listAll(coll) {
  const docs = []; let pageToken = '';
  do {
    const r = await httpsReq({ hostname: 'firestore.googleapis.com', path: `${BASE}/${coll}?pageSize=300${pageToken ? '&pageToken=' + pageToken : ''}`, method: 'GET', headers: { Authorization: 'Bearer ' + TK } });
    (r.body.documents || []).forEach(d => docs.push(d));
    pageToken = r.body.nextPageToken || '';
  } while (pageToken);
  return docs;
}

const rounds = await listAll('rounds');
const liverounds = await listAll('liverounds');
const roundById = {};
rounds.forEach(d => { roundById[d.name.split('/').pop()] = d.fields || {}; });

const issues = [];

// 1. Malformed round shape
rounds.forEach(d => {
  const id = d.name.split('/').pop(); const f = d.fields || {};
  const missing = REQUIRED.filter(k => f[k] === undefined || f[k] === null || ('nullValue' in (f[k] || {})));
  if (missing.length) issues.push({ sev: 'CRITICAL', kind: 'malformed-round', id, detail: 'missing ' + missing.join(',') + ' | player=' + v(f.playerName) + ' date=' + v(f.date) });
  // leagueId must be in leagueIds[]
  const lid = v(f.leagueId), lids = v(f.leagueIds);
  if (lid && Array.isArray(lids) && lids.indexOf(lid) === -1) issues.push({ sev: 'HIGH', kind: 'leagueIds-mismatch', id, detail: 'leagueId=' + lid + ' not in leagueIds=' + JSON.stringify(lids) });
});

// 1b. Scramble linkage (Founder 2026-06-22 — scramble rounds were posting as the
// logger, not the team). Every scramble-format round MUST carry the team stamp
// (scrambleTeamId + teamName + teamMembers[]) so it attributes to the team on the
// feed/scorecard/profile. A scramble round missing the link is the exact bug.
rounds.forEach(d => {
  const id = d.name.split('/').pop(); const f = d.fields || {};
  const fmt = v(f.format);
  if (fmt === 'scramble' || fmt === 'scramble4') {
    const missing = ['scrambleTeamId', 'teamName', 'teamMembers'].filter(k => f[k] === undefined || f[k] === null || ('nullValue' in (f[k] || {})));
    if (missing.length) issues.push({ sev: 'HIGH', kind: 'scramble-unlinked', id, detail: 'scramble round missing team link (' + missing.join(',') + ') — will post as the logger not the team. player=' + v(f.playerName) + ' course=' + v(f.course) + ' date=' + v(f.date) });
  }
});

// 2. Silent-drop: completed liveround with roundId + >=9 holes but no rounds doc
liverounds.forEach(d => {
  const uid = d.name.split('/').pop(); const f = d.fields || {};
  const status = v(f.status), roundId = v(f.roundId);
  const scores = (v(f.scores) || []).filter(x => x !== null && x !== '');
  if (status === 'completed' && roundId && scores.length >= 9 && !roundById[roundId]) {
    issues.push({ sev: 'CRITICAL', kind: 'silent-drop', id: uid, detail: 'liveround completed (' + scores.length + ' holes, roundId=' + roundId + ') but rounds/' + roundId + ' MISSING — round was lost. Recover per reference_missing_round_triage.' });
  }
});

// Report
const crit = issues.filter(i => i.sev === 'CRITICAL');
console.log(`[round-integrity] ${PROJECT}: ${rounds.length} rounds, ${liverounds.length} liverounds scanned`);
if (!issues.length) { console.log('  OK — no integrity issues.'); process.exit(0); }
issues.sort((a, b) => (a.sev === 'CRITICAL' ? -1 : 1) - (b.sev === 'CRITICAL' ? -1 : 1));
issues.forEach(i => console.log(`  ${i.sev.padEnd(8)} ${i.kind.padEnd(18)} ${i.id}  ${i.detail}`));
console.log(`\n${crit.length} CRITICAL, ${issues.length - crit.length} other.`);
process.exit(crit.length ? 1 : 0);

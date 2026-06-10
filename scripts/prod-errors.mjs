// Prod error triage — reads the production Firestore `errors` collection via the
// Firestore REST API (no firebase CLI, no Sentry needed). This is the
// Firebase-error half of the maintain-the-ecosystem loop: the app logs runtime
// errors here (window.onerror + unhandledrejection in src/core/firebase.js;
// pbWarn criticals in src/core/utils.js).
//
//   node scripts/prod-errors.mjs              # last 50, grouped by message+version
//   node scripts/prod-errors.mjs 200          # widen the window
//   node scripts/prod-errors.mjs 50 raw       # raw rows (newest first) for deep-dive
//
// Auth: token minted from the local firebase CLI login (project owner) via the
// public OAuth client in gitignored scripts/.secrets/fb-oauth.json — same
// pattern as seed-deploy-rules.mjs. Token used in-memory only.
//
// GOTCHA this tool encodes: docs carry their time in `timestamp` (ISO string),
// NOT `ts`. Firestore orderBy EXCLUDES docs missing the ordered field, so
// ordering by the wrong field silently returns 0 rows and looks like an empty
// collection. (This exact mistake cost a triage cycle on 2026-06-09.)
import { readFileSync, existsSync } from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';

const LIMIT = Math.min(parseInt(process.argv[2] || '50', 10) || 50, 500);
const RAW = process.argv[3] === 'raw';
const PROJECT = process.env.PB_ERRORS_PROJECT || 'parbaughs';

function httpsReq(opts, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { let j; try { j = JSON.parse(d || '{}'); } catch (e) { j = { raw: d }; } resolve({ status: res.statusCode, body: j }); }); });
    req.on('error', reject); if (data) req.write(data); req.end();
  });
}

async function getAccessToken() {
  const cfgPath = path.join(os.homedir(), '.config/configstore/firebase-tools.json');
  if (!existsSync(cfgPath)) throw new Error('No firebase CLI login found — run `firebase login`.');
  const rt = (JSON.parse(readFileSync(cfgPath, 'utf8')).tokens || {}).refresh_token;
  const oauthPath = path.join('scripts', '.secrets', 'fb-oauth.json');
  const oauth = existsSync(oauthPath) ? JSON.parse(readFileSync(oauthPath, 'utf8')) : {};
  const clientId = process.env.FIREBASE_OAUTH_CLIENT_ID || oauth.client_id;
  const clientSecret = process.env.FIREBASE_OAUTH_CLIENT_SECRET || oauth.client_secret;
  if (!rt || !clientId || !clientSecret) throw new Error('Missing firebase login token or scripts/.secrets/fb-oauth.json.');
  const form = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: rt, client_id: clientId, client_secret: clientSecret }).toString();
  const r = await httpsReq({ hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(form) } }, form);
  if (r.status >= 300 || !r.body.access_token) throw new Error('token mint failed: ' + r.status);
  return r.body.access_token;
}

const token = await getAccessToken();
const body = JSON.stringify({ structuredQuery: {
  from: [{ collectionId: 'errors' }],
  orderBy: [{ field: { fieldPath: 'timestamp' }, direction: 'DESCENDING' }],
  limit: LIMIT,
} });
const r = await httpsReq({
  hostname: 'firestore.googleapis.com',
  path: `/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`,
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
}, body);
if (r.status >= 300) { console.error('query FAILED', r.status, JSON.stringify(r.body).slice(0, 300)); process.exit(1); }

const rows = (Array.isArray(r.body) ? r.body : []).filter(x => x.document).map(x => {
  const f = x.document.fields || {};
  const g = (k) => (f[k] && (f[k].stringValue ?? f[k].integerValue ?? f[k].booleanValue)) ?? null;
  return {
    timestamp: g('timestamp'), message: g('message') || '(none)', appVersion: g('appVersion') || '?',
    page: g('page'), type: g('type'), userId: g('userId'), resolved: f.resolved ? f.resolved.booleanValue : null,
    docPath: x.document.name.split('/documents/')[1],
  };
});

console.log(`prod errors (${PROJECT}): ${rows.length} docs | window: ${rows[rows.length - 1]?.timestamp || 'n/a'} -> ${rows[0]?.timestamp || 'n/a'}`);
if (RAW) { rows.forEach(x => console.log(JSON.stringify(x))); process.exit(0); }

// Grouped triage view: message+version, newest-first within the window. The
// signal that matters: a message recurring at the LATEST appVersion is a live
// bug; messages pinned to old versions are usually already fixed.
const groups = new Map();
rows.forEach(x => {
  const key = x.message.slice(0, 100) + '  [v' + x.appVersion + ']';
  if (!groups.has(key)) groups.set(key, { count: 0, newest: x.timestamp, pages: new Set() });
  const e = groups.get(key); e.count++; if (x.page) e.pages.add(x.page);
});
[...groups.entries()].sort((a, b) => b[1].count - a[1].count).forEach(([k, e]) => {
  console.log(`  ${String(e.count).padStart(3)}x  ${k}  (newest ${e.newest || '?'}${e.pages.size ? ' | pages: ' + [...e.pages].join(',') : ''})`);
});

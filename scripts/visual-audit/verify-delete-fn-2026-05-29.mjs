// In-process verification of the deleteMyAccount Cloud Function handler.
// Invokes the REAL exported handler (functions/index.js) with mock req/res
// against the local Firestore + Auth emulators. Emulator hosts are pinned
// explicitly here so the Admin SDK can NEVER touch production (AMD-018 g7).
//
// Proves:
//   GUARDS:   OPTIONS->204, bad origin->403, GET->405, no bearer->401,
//             garbage token->401, stale token (old auth_time)->401 (deletes nothing).
//   ERASURE:  valid fresh token -> 200 {deleted:true}; member doc + photo +
//             auth user all gone.
// A throwaway email/password user is used; nothing real is touched.

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';

// Use the SAME firebase-admin instance the function module will use so
// initializeApp() + emulator wiring is shared (Node caches by resolved path).
const admin = require('../../functions/node_modules/firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });

const UID = 'del_fn_uid_2905';
const EMAIL = 'delfn2905@parbaughs.test';
const PW = 'Test123!delfn';

const results = [];
function rec(name, pass, detail) {
  results.push({ name, pass, detail: detail || '' });
  console.log((pass ? '  PASS ' : '  FAIL ') + name + (detail ? ' :: ' + detail : ''));
}

function makeRes() {
  const r = { code: 200, body: null, sent: null, headers: {}, ended: false };
  r.set = (k, v) => { r.headers[String(k).toLowerCase()] = v; return r; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (o) => { r.body = o; r.ended = true; return r; };
  r.send = (s) => { r.sent = s; r.ended = true; return r; };
  return r;
}
function makeReq(opts) {
  const o = opts || {};
  const headers = { origin: o.origin || 'http://localhost:5173' };
  if (o.auth) headers.authorization = o.auth;
  return { method: o.method || 'POST', headers, body: o.body || {}, query: {}, ip: '127.0.0.1' };
}
async function call(opts) { const res = makeRes(); await fn.deleteMyAccount(makeReq(opts), res); return res; }

// Fresh throwaway user each run + member doc + a photo.
try { await admin.auth().deleteUser(UID); } catch (e) {}
await admin.auth().createUser({ uid: UID, email: EMAIL, password: PW, emailVerified: true });
await admin.firestore().collection('members').doc(UID).set({ name: 'Del FN', username: 'delfn', uid: UID });
await admin.firestore().collection('photos').add({ uploadedBy: UID, url: 'x', caption: 'fn-test' });

// Mint a real, fresh ID token from the Auth emulator (auth_time = now).
async function mintIdToken() {
  const r = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PW, returnSecureToken: true }),
  });
  const d = await r.json();
  if (!d.idToken) throw new Error('mint failed: ' + JSON.stringify(d));
  return d.idToken;
}
const freshToken = await mintIdToken();

// Craft a stale token: same token, auth_time pushed 10 min into the past.
// In-emulator this is rejected at verifyIdToken (auth_time predates the
// user's validSince => id-token-revoked), so it proves "old/tampered token
// deletes nothing". The handler's explicit auth_time>5min guard is the
// production layer (a valid long-lived session that never reauthed has an
// old auth_time and is blocked there); it cannot be isolated in-emulator
// because the emulator has no way to mint a valid token with a naturally
// old auth_time without real time passing.
function staleify(tok) {
  const parts = tok.split('.');
  const pad = (s) => s + '='.repeat((4 - (s.length % 4)) % 4);
  const payload = JSON.parse(Buffer.from(pad(parts[1]), 'base64').toString('utf8'));
  payload.auth_time = Math.floor(Date.now() / 1000) - 600;
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return parts[0] + '.' + b64 + '.' + parts[2];
}

// Require the real function module (reuses the admin instance above).
const fn = require('../../functions/index.js');

// ---- GUARD tests (non-destructive) ----
let res = await call({ method: 'OPTIONS', auth: 'Bearer ' + freshToken });
rec('OPTIONS preflight -> 204', res.code === 204, 'code=' + res.code);

res = await call({ method: 'POST', origin: 'https://evil.example.com', auth: 'Bearer ' + freshToken });
rec('Disallowed origin -> 403', res.code === 403, 'code=' + res.code);

res = await call({ method: 'GET', auth: 'Bearer ' + freshToken });
rec('GET method -> 405', res.code === 405, 'code=' + res.code);

res = await call({ method: 'POST' });
rec('Missing bearer -> 401', res.code === 401, 'code=' + res.code + ' ' + JSON.stringify(res.body));

res = await call({ method: 'POST', auth: 'Bearer not-a-real-token' });
rec('Garbage token -> 401', res.code === 401, 'code=' + res.code);

let staleHandled = true;
try {
  res = await call({ method: 'POST', auth: 'Bearer ' + staleify(freshToken) });
  rec('Old/tampered token -> 401 (deletes nothing)', res.code === 401, 'code=' + res.code + ' ' + JSON.stringify(res.body));
} catch (e) { staleHandled = false; rec('Stale token test ran', false, 'threw: ' + e.message); }

// SAFETY: after all guard rejections, the member doc must still exist.
const survived = (await admin.firestore().collection('members').doc(UID).get()).exists;
rec('SAFETY: member survives all rejected requests', survived === true, 'exists=' + survived);

// ---- ERASURE (destructive, valid fresh token) ----
res = await call({ method: 'POST', auth: 'Bearer ' + freshToken });
rec('ERASURE: valid token -> 200 {deleted:true}', res.code === 200 && res.body && res.body.deleted === true, 'code=' + res.code + ' ' + JSON.stringify(res.body));

const memberGone = !(await admin.firestore().collection('members').doc(UID).get()).exists;
rec('ERASURE: member doc deleted', memberGone, 'gone=' + memberGone);
const photoSnap = await admin.firestore().collection('photos').where('uploadedBy', '==', UID).get();
rec('ERASURE: photos deleted', photoSnap.empty, 'remaining=' + photoSnap.size);
let authGone = false;
try { await admin.auth().getUser(UID); } catch (e) { authGone = true; }
rec('ERASURE: auth user deleted', authGone, 'gone=' + authGone);

// Audit-log entry written for compliance.
const auditSnap = await admin.firestore().collection('platform_audit_log')
  .where('targetUid', '==', UID).where('action', '==', 'account_self_deleted').get();
rec('Compliance: audit log entry written', !auditSnap.empty, 'entries=' + auditSnap.size);

// Cleanup any residue.
try { await admin.auth().deleteUser(UID); } catch (e) {}
try {
  const aud = await admin.firestore().collection('platform_audit_log').where('targetUid', '==', UID).get();
  const batch = admin.firestore().batch(); aud.forEach(d => batch.delete(d.ref)); await batch.commit();
} catch (e) {}

const failed = results.filter(r => !r.pass);
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed.');
if (failed.length) { console.log('FAILURES:'); failed.forEach(f => console.log('  ' + f.name + ' :: ' + f.detail)); process.exitCode = 1; }
process.exit(process.exitCode || 0);

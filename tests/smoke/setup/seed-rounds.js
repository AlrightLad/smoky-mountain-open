// tests/smoke/setup/seed-rounds.js
// Admin-SDK helper for seeding/clearing test rounds during smoke runs.
//
// Mirrors seed-notifications.js shape. Targets ONLY rounds in
// smoke-test-league so cannot accidentally affect real members.
//
// Round owner defaults to a synthetic UID (NOT the smoke account) so engagement
// scenarios test the member-non-author path through the v8.20.0 (Ship 5+5)
// /rounds/{roundId} 4th OR-clause — the actual fix being validated.

const path = require('path');

const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, '..', '..', '..', 'scripts', '.service-account.json');
const SMOKE_LEAGUE_ID = 'smoke-test-league';
const SMOKE_OTHER_UID = 'smoke-test-round-owner';

function getAdmin() {
  var admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)) });
  }
  return admin;
}

// Returns the admin service account's project_id, or null if the SA file is
// absent/unreadable. project_id is public (it appears in src/core/firebase.js
// client config) — this never reads or exposes the private key. Used by the
// rounds-seed guard to confirm the admin project matches the web-app project
// before seeding (see tests/smoke/helpers/project-guard.js).
function getProjectId() {
  try {
    return require(SERVICE_ACCOUNT_PATH).project_id || null;
  } catch (e) {
    return null;
  }
}

// Clear all rounds in smoke-test-league. Idempotent.
async function clearSmokeRounds() {
  var admin = getAdmin();
  var db = admin.firestore();
  var snap = await db.collection('rounds').where('leagueId', '==', SMOKE_LEAGUE_ID).get();
  if (snap.empty) return 0;
  var batch = db.batch();
  var n = 0;
  snap.forEach(function(doc) { batch.delete(doc.ref); n++; });
  await batch.commit();
  return n;
}

// Insert a single test round in smoke-test-league. Returns the new doc ID.
// Defaults produce a minimal valid round visible on /feed and HQ Home League Pulse.
//
// Production-shape parity (Ship 5+7): pre-generates an ID and uses
// .doc(id).set(doc) so the round doc carries an `id` field. The
// rounds snapshot listener (src/core/sync.js:280) filters on `d.id`
// before pushing into PB.setRoundsFromFirestore — pre-Ship-5+7 the
// seed used .add() which never set the field, so seeded rounds never
// landed in PB.getRounds() local cache. Production writes via
// PB.addRound + syncRound always set `id` (see data.js:350), so this
// brings the seed in line with what real members generate.
async function insertSmokeRound(opts) {
  var admin = getAdmin();
  var db = admin.firestore();
  opts = opts || {};
  var id = opts.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
  var doc = {
    id: id,
    player: opts.player || SMOKE_OTHER_UID,
    playerName: opts.playerName || '[TEST] Round Owner',
    leagueId: SMOKE_LEAGUE_ID,
    course: opts.course || 'Smoke Test Course',
    score: opts.score || 78,
    holesPlayed: opts.holesPlayed || 18,
    holesMode: opts.holesMode || '18',
    format: opts.format || 'stroke',
    visibility: 'public',
    holeScores: opts.holeScores || [],
    holePars: opts.holePars || [],
    likes: opts.likes || [],
    comments: opts.comments || [],
    commentLikes: opts.commentLikes || {},
    isTestAccount: true,
    status: 'completed',
    timestamp: opts.timestamp || Date.now(),
    date: opts.date || new Date().toISOString().slice(0, 10),
    createdAt: opts.createdAt || admin.firestore.FieldValue.serverTimestamp()
  };
  await db.collection('rounds').doc(id).set(doc);
  return id;
}

// Read back a round by ID. Useful for asserting engagement persistence.
async function getSmokeRound(roundId) {
  var admin = getAdmin();
  var db = admin.firestore();
  var doc = await db.collection('rounds').doc(roundId).get();
  return doc.exists ? Object.assign({ _id: doc.id }, doc.data()) : null;
}

module.exports = {
  SMOKE_LEAGUE_ID: SMOKE_LEAGUE_ID,
  SMOKE_OTHER_UID: SMOKE_OTHER_UID,
  getProjectId: getProjectId,
  clearSmokeRounds: clearSmokeRounds,
  insertSmokeRound: insertSmokeRound,
  getSmokeRound: getSmokeRound
};

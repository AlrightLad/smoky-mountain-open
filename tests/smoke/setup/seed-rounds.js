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
async function insertSmokeRound(opts) {
  var admin = getAdmin();
  var db = admin.firestore();
  opts = opts || {};
  var doc = {
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
  var ref = await db.collection('rounds').add(doc);
  return ref.id;
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
  clearSmokeRounds: clearSmokeRounds,
  insertSmokeRound: insertSmokeRound,
  getSmokeRound: getSmokeRound
};

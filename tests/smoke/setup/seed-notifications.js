// tests/smoke/setup/seed-notifications.js
// Admin-SDK helper for seeding/clearing test notifications during smoke runs.
//
// IMPORTANT: production schema is a TOP-LEVEL `notifications` collection
// keyed by Firestore auto-id, with `toUserId` field — NOT a member subcollection.
// Confirmed via V1 audit + scripts/create-smoke-account.js semantics.
//
// All operations target ONLY the smoke test account (uid hardcoded below)
// so this helper cannot accidentally affect real members.

const path = require('path');

const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, '..', '..', '..', 'scripts', '.service-account.json');
const SMOKE_UID = 'PZpdVJH9mbcT0ukPxa2ZcbTyBgj2';

function getAdmin() {
  var admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)) });
  }
  return admin;
}

// Clear all notifications for the smoke account. Idempotent.
async function clearForSmoke() {
  var admin = getAdmin();
  var db = admin.firestore();
  var snap = await db.collection('notifications').where('toUserId', '==', SMOKE_UID).get();
  if (snap.empty) return 0;
  var batch = db.batch();
  var n = 0;
  snap.forEach(function(doc) { batch.delete(doc.ref); n++; });
  await batch.commit();
  return n;
}

// Insert notifications. `entries` is an array of { type, title, message, page?, linkPage?, params?, linkParams?, read?, readAt?, createdAt? }.
// toUserId is auto-set to smoke uid. createdAt defaults to server timestamp if not provided.
// Returns array of inserted doc IDs (in same order as entries).
async function insertForSmoke(entries) {
  var admin = getAdmin();
  var db = admin.firestore();
  var ids = [];
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    var doc = {
      toUserId: SMOKE_UID,
      type: e.type,
      title: e.title || '',
      message: e.message || '',
      read: e.read === true,
      createdAt: e.createdAt || admin.firestore.FieldValue.serverTimestamp()
    };
    if (e.page) doc.page = e.page;
    if (e.linkPage) doc.linkPage = e.linkPage;
    if (e.params) doc.params = e.params;
    if (e.linkParams) doc.linkParams = e.linkParams;
    if (e.readAt) doc.readAt = e.readAt;
    if (e.icon) doc.icon = e.icon;
    var ref = await db.collection('notifications').add(doc);
    ids.push(ref.id);
  }
  return ids;
}

// Read back a single notification by ID. Useful for asserting readAt timestamps.
async function getNotification(notifId) {
  var admin = getAdmin();
  var db = admin.firestore();
  var doc = await db.collection('notifications').doc(notifId).get();
  return doc.exists ? Object.assign({ _id: doc.id }, doc.data()) : null;
}

// Convenience: server timestamp helper for explicit createdAt seeding (e.g., aged notifications).
function tsNow() { return getAdmin().firestore.Timestamp.now(); }
function tsAgo(secondsAgo) {
  return getAdmin().firestore.Timestamp.fromMillis(Date.now() - secondsAgo * 1000);
}

module.exports = {
  SMOKE_UID: SMOKE_UID,
  clearForSmoke: clearForSmoke,
  insertForSmoke: insertForSmoke,
  getNotification: getNotification,
  tsNow: tsNow,
  tsAgo: tsAgo
};

// tests/smoke/helpers/seed-browser.js
// Browser-side notification seeding via the live client SDK (window.db) for the
// authenticated smoke account.
//
// WHY THIS EXISTS (vs admin-SDK seeding in tests/smoke/setup/seed-notifications.js):
// the web app's Firestore config is hardcoded to the PRODUCTION project
// (src/core/firebase.js) and the smoke run reads notifications through that
// browser client. Admin-SDK seeding targets whatever project
// scripts/.service-account.json points at — when that is a DIFFERENT project
// than the web app's config, admin-seeded docs never reach the browser listener
// and every notification scenario times out. Writing through the SAME browser
// client the assertions read from removes that cross-project failure mode and
// exercises the real production create/read/delete path the rules enforce
// (notifications: create if amIActive(); read + delete if toUserId == uid()).
//
// All operations target ONLY the signed-in smoke account (currentUser.uid), so
// they cannot touch a real member's data. Firestore Timestamps do not survive
// page.evaluate serialization, so ages are passed as seconds-ago numbers and
// the Timestamps are constructed in-page; readback surfaces readAt as
// readAtMs + readAtIsTimestamp instead of a raw Timestamp.

// Clear every notification owned by the smoke account. Idempotent. Returns the
// number deleted.
async function clearForSmoke(page) {
  return page.evaluate(async function() {
    var snap = await window.db.collection('notifications')
      .where('toUserId', '==', currentUser.uid).get();
    if (snap.empty) return 0;
    var batch = window.db.batch();
    var n = 0;
    snap.forEach(function(doc) { batch.delete(doc.ref); n++; });
    await batch.commit();
    return n;
  });
}

// Insert notifications for the smoke account. `entries` mirrors the admin
// helper's document shape but expresses ages as seconds-ago numbers:
//   { type, title?, message?, page?, linkPage?, params?, linkParams?, read?,
//     icon?, createdAtSecAgo?, readAtSecAgo? }
// createdAt defaults to now; readAt is set only when readAtSecAgo is provided.
// Returns the created doc IDs in input order.
async function insertForSmoke(page, entries) {
  return page.evaluate(async function(entries) {
    var Timestamp = window.firebase.firestore.Timestamp;
    var now = Date.now();
    var batch = window.db.batch();
    var ids = [];
    entries.forEach(function(e) {
      var ref = window.db.collection('notifications').doc();
      var doc = {
        toUserId: currentUser.uid,
        // v8.24.54 — seed the REAL shape: sendNotification now stamps
        // fromUserId, and the hardened rule requires fromUserId == uid() on
        // create (anti-forgery). The smoke user notifies itself for setup.
        fromUserId: currentUser.uid,
        type: e.type,
        title: e.title || '',
        message: e.message || '',
        read: e.read === true,
        createdAt: Timestamp.fromMillis(now - (e.createdAtSecAgo || 0) * 1000)
      };
      if (e.page) doc.page = e.page;
      if (e.linkPage) doc.linkPage = e.linkPage;
      if (e.params) doc.params = e.params;
      if (e.linkParams) doc.linkParams = e.linkParams;
      if (e.readAtSecAgo != null) doc.readAt = Timestamp.fromMillis(now - e.readAtSecAgo * 1000);
      if (e.icon) doc.icon = e.icon;
      batch.set(ref, doc);
      ids.push(ref.id);
    });
    await batch.commit();
    return ids;
  }, entries);
}

// Read back a notification by ID as a SERIALIZABLE snapshot. Returns
// { exists:false } when absent; otherwise { exists, read, readAtIsTimestamp,
// readAtMs } (readAt surfaced as millis since raw Timestamps can't cross
// page.evaluate).
async function getNotification(page, notifId) {
  return page.evaluate(async function(notifId) {
    var snap = await window.db.collection('notifications').doc(notifId).get();
    if (!snap.exists) return { exists: false };
    var d = snap.data() || {};
    return {
      exists: true,
      read: d.read === true,
      readAtIsTimestamp: !!(d.readAt && typeof d.readAt.toMillis === 'function'),
      readAtMs: (d.readAt && typeof d.readAt.toMillis === 'function') ? d.readAt.toMillis() : null
    };
  }, notifId);
}

// Whether a notification with the given ID still exists, determined via a
// LIST query over the smoke account's own notifications (rule-safe). A
// get-by-id is deliberately NOT used here: under the notifications rule
// (read: if resource.data.toUserId == uid()), a get on a DELETED doc returns
// PERMISSION_DENIED — not a clean not-found — because resource.data is null,
// so a get can't tell "deleted" apart from "denied". A list constrained to
// toUserId == uid is always permitted and simply omits the deleted doc.
async function notifExistsForSmoke(page, notifId) {
  return page.evaluate(async function(notifId) {
    var snap = await window.db.collection('notifications')
      .where('toUserId', '==', currentUser.uid).get();
    var found = false;
    snap.forEach(function(doc) { if (doc.id === notifId) found = true; });
    return found;
  }, notifId);
}

module.exports = {
  clearForSmoke: clearForSmoke,
  insertForSmoke: insertForSmoke,
  getNotification: getNotification,
  notifExistsForSmoke: notifExistsForSmoke
};

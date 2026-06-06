// S7 — readAt timestamp persistence.
// Validates: Q4 ruling — handleNotifClick sets read:true AND readAt:fsTimestamp().

const bseed = require('../helpers/seed-browser.js');
const nav = require('../helpers/navigation.js');

module.exports = {
  id: 'S7',
  name: 'readAt timestamp persisted',
  run: async function(ctx) {
    var page = ctx.page;
    // Browser-side seed (window.db) — see helpers/seed-browser.js header.
    await bseed.clearForSmoke(page);
    var ids = await bseed.insertForSmoke(page, [
      {
        type: 'feed_like',
        title: 'S7-readat',
        message: 'click to mark read',
        page: 'chat',
        read: false,
        createdAtSecAgo: 60
      }
    ]);
    var notifId = ids[0];
    if (!notifId) throw new Error('seed did not return an id');

    await nav.resetNotifClientState(page);
    await nav.waitForNotifByTitle(page, 'S7-readat');
    await nav.openPanelAndWaitForRender(page);
    var clicked = await nav.clickNotificationByText(page, 'S7-readat');
    if (!clicked) throw new Error('S7 notification not found');

    // Allow Firestore round-trip
    await page.waitForTimeout(1500);

    var doc = await bseed.getNotification(page, notifId);
    if (!doc.exists) throw new Error('notification doc disappeared after click');
    if (doc.read !== true) throw new Error('expected read=true after click; got ' + JSON.stringify(doc.read));
    if (!doc.readAtIsTimestamp) throw new Error('readAt missing or not a Firestore Timestamp after click');
    var ageMs = Date.now() - doc.readAtMs;
    if (ageMs < 0 || ageMs > 60000) {
      throw new Error('readAt outside expected window: ' + ageMs + 'ms');
    }

    await ctx.capture.screenshot('S7-after-click');
    return { passed: true, details: 'readAt set ' + ageMs + 'ms ago' };
  }
};

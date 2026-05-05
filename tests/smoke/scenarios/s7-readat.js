// S7 — readAt timestamp persistence.
// Validates: Q4 ruling — handleNotifClick sets read:true AND readAt:fsTimestamp().

const seed = require('../setup/seed-notifications.js');
const nav = require('../helpers/navigation.js');

module.exports = {
  id: 'S7',
  name: 'readAt timestamp persisted',
  setup: async function() {
    await seed.clearForSmoke();
    var ids = await seed.insertForSmoke([
      {
        type: 'feed_like',
        title: 'S7-readat',
        message: 'click to mark read',
        page: 'chat',
        read: false,
        createdAt: seed.tsAgo(60)
      }
    ]);
    module.exports.__seededId = ids[0];
  },
  run: async function(ctx) {
    var page = ctx.page;
    var notifId = module.exports.__seededId;
    if (!notifId) throw new Error('seed did not record __seededId');

    await nav.resetNotifClientState(page);
    await nav.waitForNotifByTitle(page, 'S7-readat');
    await nav.openPanelAndWaitForRender(page);
    var clicked = await nav.clickNotificationByText(page, 'S7-readat');
    if (!clicked) throw new Error('S7 notification not found');

    // Allow Firestore round-trip
    await page.waitForTimeout(1500);

    var doc = await seed.getNotification(notifId);
    if (!doc) throw new Error('notification doc disappeared after click');
    if (doc.read !== true) throw new Error('expected read=true after click; got ' + JSON.stringify(doc.read));
    if (!doc.readAt) throw new Error('readAt missing after click');
    if (typeof doc.readAt.toMillis !== 'function') {
      throw new Error('readAt is not a Firestore Timestamp; got ' + typeof doc.readAt);
    }
    var ageMs = Date.now() - doc.readAt.toMillis();
    if (ageMs < 0 || ageMs > 60000) {
      throw new Error('readAt outside expected window: ' + ageMs + 'ms');
    }

    await ctx.capture.screenshot('S7-after-click');
    return { passed: true, details: 'readAt set ' + ageMs + 'ms ago' };
  }
};

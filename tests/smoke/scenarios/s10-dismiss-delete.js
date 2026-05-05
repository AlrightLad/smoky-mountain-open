// S10 — Dismissal delete on read items.
// Validates: dismissNotif fork — read items get deleted from Firestore (not
// just marked read).

const seed = require('../setup/seed-notifications.js');
const nav = require('../helpers/navigation.js');

module.exports = {
  id: 'S10',
  name: 'dismiss deletes read items',
  setup: async function() {
    await seed.clearForSmoke();
    var ids = await seed.insertForSmoke([
      {
        type: 'feed_like',
        title: 'S10-dismiss-target',
        message: 'already read; dismiss should delete',
        page: 'chat',
        read: true,
        readAt: seed.tsAgo(3600),
        createdAt: seed.tsAgo(7200)
      }
    ]);
    module.exports.__targetId = ids[0];
  },
  run: async function(ctx) {
    var page = ctx.page;
    var targetId = module.exports.__targetId;
    if (!targetId) throw new Error('seed did not record __targetId');

    // Reset client state so openNotifPanel triggers a fresh loadMoreReadHistory
    await nav.resetNotifClientState(page);
    // Wait for any stale liveNotifications to drain (S10 has 0 unread, just 1 read)
    await page.waitForFunction(function() {
      return Array.isArray(window.liveNotifications) && window.liveNotifications.length === 0;
    }, null, { timeout: 25000 });
    await nav.openPanelAndWaitForRender(page);

    // Wait for the read history to load (target is a read item)
    await page.waitForFunction(function() {
      return Array.isArray(window.readHistory) && window.readHistory.some(function(n) {
        return n && n.title === 'S10-dismiss-target';
      });
    }, null, { timeout: 25000 });

    var dismissed = await nav.dismissNotificationByText(page, 'S10-dismiss-target');
    if (!dismissed) throw new Error('could not click X on read item');

    // Allow Firestore delete round-trip
    await page.waitForTimeout(1500);

    var doc = await seed.getNotification(targetId);
    if (doc) throw new Error('notification doc still exists after dismiss; expected deletion');

    await ctx.capture.screenshot('S10-after-delete');
    return { passed: true, details: 'doc ' + targetId + ' deleted from Firestore' };
  }
};

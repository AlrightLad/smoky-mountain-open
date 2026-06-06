// S10 — Dismissal delete on read items.
// Validates: dismissNotif fork — read items get deleted from Firestore (not
// just marked read).

const bseed = require('../helpers/seed-browser.js');
const nav = require('../helpers/navigation.js');

module.exports = {
  id: 'S10',
  name: 'dismiss deletes read items',
  run: async function(ctx) {
    var page = ctx.page;
    // Browser-side seed (window.db) — see helpers/seed-browser.js header.
    await bseed.clearForSmoke(page);
    var ids = await bseed.insertForSmoke(page, [
      {
        type: 'feed_like',
        title: 'S10-dismiss-target',
        message: 'already read; dismiss should delete',
        page: 'chat',
        read: true,
        readAtSecAgo: 3600,
        createdAtSecAgo: 7200
      }
    ]);
    var targetId = ids[0];
    if (!targetId) throw new Error('seed did not return an id');

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

    // Confirm deletion by polling a rule-safe LIST query for the target's
    // absence. A get-by-id readback would NOT work here: under the
    // notifications rule (read: if resource.data.toUserId == uid()), a get on
    // the now-deleted doc returns PERMISSION_DENIED rather than not-found,
    // which a prior version of this scenario mis-reported as a failure even
    // though the app deleted the doc correctly.
    var gone = false;
    for (var attempt = 0; attempt < 10 && !gone; attempt++) {
      await page.waitForTimeout(500);
      gone = !(await bseed.notifExistsForSmoke(page, targetId));
    }
    if (!gone) throw new Error('notification doc still exists after dismiss; expected deletion');

    await ctx.capture.screenshot('S10-after-delete');
    return { passed: true, details: 'doc ' + targetId + ' deleted from Firestore' };
  }
};

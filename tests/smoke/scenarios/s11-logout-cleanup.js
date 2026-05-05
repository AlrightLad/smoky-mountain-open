// S11 — V16 logout cleanup completeness.
// Validates: firebase.js exitApp() V16 fold — readHistory + cursor + observer
// + _notifById all cleared on logout, alongside the existing _notifUnsub.
//
// MUST be the LAST scenario in the run order (scenarios after this would fail
// because the smoke account is no longer authenticated).

const auth = require('../helpers/auth.js');

module.exports = {
  id: 'S11',
  name: 'V16 logout cleanup',
  run: async function(ctx) {
    var page = ctx.page;

    // Sanity: verify pre-logout state has notification system active
    var preLogout = await page.evaluate(function() {
      return {
        notifUnsub: typeof window._notifUnsub,
        liveCount: (window.liveNotifications || []).length,
        readCount: (window.readHistory || []).length,
        idMap: window._notifById ? Object.keys(window._notifById).length : -1,
        observer: !!window._readHistoryObserver
      };
    });
    if (preLogout.notifUnsub !== 'function') {
      throw new Error('pre-logout: _notifUnsub not a function: ' + preLogout.notifUnsub);
    }

    // Trigger logout
    await auth.logout(page);

    // Allow exitApp() cleanup to complete
    await page.waitForTimeout(500);

    var postLogout = await page.evaluate(function() {
      return {
        notifUnsub: window._notifUnsub === null || typeof window._notifUnsub === 'undefined' ? 'cleared' : typeof window._notifUnsub,
        liveCount: (typeof window.liveNotifications === 'undefined') ? 'undefined' : window.liveNotifications.length,
        readCount: (typeof window.readHistory === 'undefined') ? 'undefined' : window.readHistory.length,
        cursor: (typeof window.readHistoryCursor === 'undefined') ? 'undefined' : (window.readHistoryCursor === null ? 'null' : 'present'),
        idMapSize: window._notifById ? Object.keys(window._notifById).length : 'undefined',
        observerNull: window._readHistoryObserver === null || typeof window._readHistoryObserver === 'undefined'
      };
    });

    var failures = [];
    if (postLogout.notifUnsub !== 'cleared') failures.push('_notifUnsub not cleared: ' + postLogout.notifUnsub);
    if (postLogout.liveCount !== 0 && postLogout.liveCount !== 'undefined') failures.push('liveNotifications not empty: ' + postLogout.liveCount);
    if (postLogout.readCount !== 0 && postLogout.readCount !== 'undefined') failures.push('readHistory not empty: ' + postLogout.readCount);
    if (postLogout.cursor !== 'null' && postLogout.cursor !== 'undefined') failures.push('readHistoryCursor not null: ' + postLogout.cursor);
    if (postLogout.idMapSize !== 0 && postLogout.idMapSize !== 'undefined') failures.push('_notifById not empty: ' + postLogout.idMapSize);
    if (!postLogout.observerNull) failures.push('_readHistoryObserver not null');

    await ctx.capture.screenshot('S11-post-logout');

    if (failures.length) throw new Error(failures.join(' | '));
    return { passed: true, details: 'all 6 notification globals cleared on logout' };
  }
};

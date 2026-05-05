// S9 — Mark-read promotion (instant UI feedback).
// Validates: R1 promotion logic — clicking an unread notification immediately
// moves it from liveNotifications to readHistory[0] without waiting for the
// listener to re-fire.

const seed = require('../setup/seed-notifications.js');
const nav = require('../helpers/navigation.js');

module.exports = {
  id: 'S9',
  name: 'mark-read instant promotion',
  setup: async function() {
    await seed.clearForSmoke();
    await seed.insertForSmoke([
      {
        type: 'feed_like',
        title: 'S9-promote',
        message: 'mark me read',
        page: 'chat',
        read: false,
        createdAt: seed.tsAgo(60)
      },
      {
        type: 'dm',
        title: 'S9-keep-unread',
        message: 'do not click',
        page: 'dms',
        read: false,
        createdAt: seed.tsAgo(120)
      }
    ]);
  },
  run: async function(ctx) {
    var page = ctx.page;
    await nav.resetNotifClientState(page);
    await nav.waitForAllNotifTitles(page, ['S9-promote', 'S9-keep-unread']);

    // Title-aware assertions: don't count totals (which can include stale items
    // from prior scenarios on slower browsers); just verify the specific
    // notification's state transition before/after the dismiss.
    var beforeClick = await page.evaluate(function() {
      return {
        promoteInUnread: !!(window.liveNotifications || []).find(function(n) { return n.title === 'S9-promote'; }),
        promoteInRead:   !!(window.readHistory || []).find(function(n) { return n.title === 'S9-promote'; })
      };
    });
    if (!beforeClick.promoteInUnread) throw new Error('S9-promote not in liveNotifications before click');
    if (beforeClick.promoteInRead) throw new Error('S9-promote already in readHistory before click');

    await nav.openPanelAndWaitForRender(page);

    var dismissed = await nav.dismissNotificationByText(page, 'S9-promote');
    if (!dismissed) throw new Error('could not click X on S9-promote');

    // Allow promotion microtask to land
    await page.waitForTimeout(500);

    var afterClick = await page.evaluate(function() {
      return {
        promoteInUnread: !!(window.liveNotifications || []).find(function(n) { return n.title === 'S9-promote'; }),
        promoteInRead:   !!(window.readHistory || []).find(function(n) { return n.title === 'S9-promote'; }),
        readHistoryFront: (window.readHistory && window.readHistory[0]) ? window.readHistory[0].title : null
      };
    });

    if (afterClick.promoteInUnread) throw new Error('S9-promote still in liveNotifications after click');
    if (!afterClick.promoteInRead) throw new Error('S9-promote not in readHistory after click');
    if (afterClick.readHistoryFront !== 'S9-promote') {
      throw new Error('readHistory[0] not S9-promote; got ' + JSON.stringify(afterClick.readHistoryFront));
    }

    await ctx.capture.screenshot('S9-after-promotion');
    return { passed: true, details: 'S9-promote unread -> read; readHistory[0]=' + afterClick.readHistoryFront };
  }
};

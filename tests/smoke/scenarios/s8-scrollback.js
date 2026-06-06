// S8 — EARLIER section + scroll-back pagination.
// Validates: R1 readHistory cache + R2 _notifById listener stash + Option A
// IntersectionObserver. Seeds enough READ notifications to require pagination
// (loadMoreReadHistory uses limit(20) per page).

const bseed = require('../helpers/seed-browser.js');
const nav = require('../helpers/navigation.js');

module.exports = {
  id: 'S8',
  name: 'EARLIER section + scroll-back',
  run: async function(ctx) {
    var page = ctx.page;
    // Browser-side seed (window.db) — see helpers/seed-browser.js header.
    // 35 aged READ notifications (forces pagination at limit(20)) + 3 unread.
    var entries = [];
    for (var i = 0; i < 35; i++) {
      entries.push({
        type: 'feed_like',
        title: 'S8-read-' + i,
        message: 'old notification ' + i,
        page: 'chat',
        read: true,
        readAtSecAgo: 86400 + i * 60,
        createdAtSecAgo: 86400 * 2 + i * 60
      });
    }
    for (var j = 0; j < 3; j++) {
      entries.push({
        type: 'feed_comment',
        title: 'S8-unread-' + j,
        message: 'recent ' + j,
        page: 'chat',
        read: false,
        createdAtSecAgo: 60 - j
      });
    }
    await bseed.clearForSmoke(page);
    await bseed.insertForSmoke(page, entries);
    // Reset client state — readHistory persists across panel toggles per R1.
    // Without reset, prior scenarios' readHistory cache prevents
    // openNotifPanel from triggering loadMoreReadHistory (which only fires
    // when readHistory.length === 0).
    await nav.resetNotifClientState(page);
    await nav.waitForAllNotifTitles(page, ['S8-unread-0', 'S8-unread-1', 'S8-unread-2']);

    await nav.openPanelAndWaitForRender(page);

    // Wait for initial read-history fetch to land (cache populated lazily on open).
    // Bumped to 40s for webkit-mobile, where Firestore read query replication is
    // notably slower than chromium/firefox/webkit-desktop.
    await page.waitForFunction(function() {
      return Array.isArray(window.readHistory) && window.readHistory.length >= 20;
    }, null, { timeout: 40000 });

    var beforeScroll = await page.evaluate(function() {
      return {
        readHistory: window.readHistory.length,
        cursor: window.readHistoryCursor === 'end' ? 'end' : (typeof window.readHistoryCursor),
        dividerPresent: !!document.querySelector('.notif-section-divider')
      };
    });
    if (!beforeScroll.dividerPresent) throw new Error('EARLIER section divider not rendered');
    if (beforeScroll.readHistory < 20) throw new Error('initial readHistory < 20: ' + beforeScroll.readHistory);

    await ctx.capture.screenshot('S8-before-scroll');

    // Trigger pagination — sentinel enters viewport → IntersectionObserver
    // fires loadMoreReadHistory.
    await page.evaluate(function() {
      var panel = document.getElementById('notifPanel');
      if (panel) panel.scrollTop = panel.scrollHeight;
    });

    await page.waitForFunction(function() {
      return Array.isArray(window.readHistory) && window.readHistory.length > 20;
    }, null, { timeout: 30000 });

    var afterScroll = await page.evaluate(function() {
      return { readHistory: window.readHistory.length };
    });
    if (afterScroll.readHistory <= beforeScroll.readHistory) {
      throw new Error('readHistory did not grow on scroll: before=' + beforeScroll.readHistory + ' after=' + afterScroll.readHistory);
    }

    await ctx.capture.screenshot('S8-after-scroll');
    return { passed: true, details: beforeScroll.readHistory + ' -> ' + afterScroll.readHistory + ' read notifs' };
  }
};

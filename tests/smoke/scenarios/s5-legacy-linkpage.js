// S5 — Legacy linkPage field fallback.
// Validates: notifications written before v8.17.0 (linkPage instead of page)
// still navigate correctly via the read-side aliasing in handleNotifClick.

const bseed = require('../helpers/seed-browser.js');
const nav = require('../helpers/navigation.js');

module.exports = {
  id: 'S5',
  name: 'legacy linkPage fallback',
  run: async function(ctx) {
    var page = ctx.page;
    // Browser-side seed (window.db) — see helpers/seed-browser.js header.
    await bseed.clearForSmoke(page);
    await bseed.insertForSmoke(page, [
      {
        type: 'dm',
        title: 'S5-legacy-dm',
        message: 'legacy field test',
        linkPage: 'dms',  // legacy field, NOT page
        read: false,
        createdAtSecAgo: 60
      }
    ]);
    await nav.resetNotifClientState(page);
    await nav.waitForNotifByTitle(page, 'S5-legacy-dm');
    await nav.openPanelAndWaitForRender(page);
    var clicked = await nav.clickNotificationByText(page, 'S5-legacy-dm');
    if (!clicked) throw new Error('legacy notification not found in panel');
    await page.waitForFunction(function() { return Router.getPage() === 'dms'; }, null, { timeout: 5000 });
    await ctx.capture.screenshot('S5-on-dms');
    return { passed: true, details: 'legacy linkPage routed to /dms' };
  }
};

// S4 — V6 nav fix verification across 5 representative notification types.
// Validates: page field is canonical; clicking a notification with page="X"
// navigates to X (NOT home, which was the V6 audit bug).

const bseed = require('../helpers/seed-browser.js');
const nav = require('../helpers/navigation.js');

const TYPES = [
  { type: 'wager_challenge', page: 'wagers' },
  { type: 'bounty_claimed',  page: 'bounties' },
  { type: 'league_request',  page: 'leagues' },
  { type: 'round_posted',    page: 'feed' },
  { type: 'tee_posted',      page: 'teetimes' }
];

module.exports = {
  id: 'S4',
  name: 'V6 nav fix (5 types)',
  run: async function(ctx) {
    var page = ctx.page;
    // Browser-side seed (window.db) — see helpers/seed-browser.js header.
    await bseed.clearForSmoke(page);
    await bseed.insertForSmoke(page, TYPES.map(function(t, i) {
      return {
        type: t.type,
        title: 'S4-' + t.type,
        message: 'click test for ' + t.type,
        page: t.page,
        read: false,
        createdAtSecAgo: 600 - i * 60
      };
    }));
    await nav.resetNotifClientState(page);
    await nav.waitForAllNotifTitles(page, TYPES.map(function(t) { return 'S4-' + t.type; }));

    var failures = [];
    for (var i = 0; i < TYPES.length; i++) {
      var t = TYPES[i];
      await nav.resetNotifClientState(page);
      await nav.openPanelAndWaitForRender(page);
      var clicked = await nav.clickNotificationByText(page, 'S4-' + t.type);
      if (!clicked) {
        failures.push(t.type + ' notification not found in panel');
        continue;
      }
      try {
        await page.waitForFunction(function(expected) {
          return Router.getPage() === expected;
        }, t.page, { timeout: 3000 });
      } catch (e) {
        var actual = await page.evaluate(function() { return Router.getPage(); });
        failures.push(t.type + ' → expected ' + t.page + ', got ' + actual);
      }
    }

    await ctx.capture.screenshot('S4-final-state');
    if (failures.length) throw new Error(failures.join(' | '));
    return { passed: true, details: TYPES.length + ' types navigated correctly' };
  }
};

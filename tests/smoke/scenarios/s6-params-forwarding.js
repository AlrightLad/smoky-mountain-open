// S6 — profile_reminder params forwarding.
// Validates: V10 Flag 3 fix — params (or legacy linkParams) get forwarded
// to Router.go via handleNotifClick, end-to-end into Router.getParams().
// Uses linkParams (legacy field name) to also exercise the read-side fallback.

const seed = require('../setup/seed-notifications.js');
const nav = require('../helpers/navigation.js');

module.exports = {
  id: 'S6',
  name: 'params forwarding (linkParams legacy)',
  setup: async function() {
    await seed.clearForSmoke();
    await seed.insertForSmoke([
      {
        type: 'profile_reminder',
        title: 'S6-profile-reminder',
        message: 'edit your bio',
        linkPage: 'members',
        linkParams: { edit: seed.SMOKE_UID },
        read: false,
        createdAt: seed.tsAgo(60)
      }
    ]);
  },
  run: async function(ctx) {
    var page = ctx.page;
    await nav.resetNotifClientState(page);
    await nav.waitForNotifByTitle(page, 'S6-profile-reminder');
    await nav.openPanelAndWaitForRender(page);
    var clicked = await nav.clickNotificationByText(page, 'S6-profile-reminder');
    if (!clicked) throw new Error('profile_reminder notification not found');
    await page.waitForFunction(function() { return Router.getPage() === 'members'; }, null, { timeout: 5000 });
    var params = await page.evaluate(function() { return Router.getParams(); });
    if (!params || !params.edit) {
      throw new Error('Router.getParams() did not include .edit; got ' + JSON.stringify(params));
    }
    await ctx.capture.screenshot('S6-params-forwarded');
    return { passed: true, details: 'params.edit=' + params.edit };
  }
};

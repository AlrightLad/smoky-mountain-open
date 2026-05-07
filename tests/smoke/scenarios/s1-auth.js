// S1 — Auth path + version assertion.
// Validates: smoke credentials work + APP_VERSION reflects working tree.

const auth = require('../helpers/auth.js');
const nav = require('../helpers/navigation.js');

module.exports = {
  id: 'S1',
  name: 'auth path + APP_VERSION',
  run: async function(ctx) {
    await auth.loginReal(ctx.page, ctx.devUrl);
    await nav.waitForAppBoot(ctx.page);
    var version = await nav.readVersion(ctx.page);
    await ctx.capture.screenshot('S1-home-post-login');
    if (version !== '8.22.0') {
      throw new Error('APP_VERSION mismatch — expected 8.20.0, got "' + version + '"');
    }
    return { passed: true, details: 'logged in; APP_VERSION=' + version };
  }
};

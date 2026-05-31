// S1 — Auth path + version assertion.
// Validates: smoke credentials work + APP_VERSION reflects working tree.

const auth = require('../helpers/auth.js');
const nav = require('../helpers/navigation.js');

// Source of truth: package.json version (Hook 5 keeps utils.js APP_VERSION in
// sync with it). Reading it here makes this assertion self-updating and turns
// S1 into a live check that the served bundle's APP_VERSION matches the tree,
// instead of a hardcoded string that goes stale on every version bump.
const EXPECTED_VERSION = require('../../../package.json').version;

module.exports = {
  id: 'S1',
  name: 'auth path + APP_VERSION',
  run: async function(ctx) {
    await auth.loginReal(ctx.page, ctx.devUrl);
    await nav.waitForAppBoot(ctx.page);
    var version = await nav.readVersion(ctx.page);
    await ctx.capture.screenshot('S1-home-post-login');
    if (version !== EXPECTED_VERSION) {
      throw new Error('APP_VERSION mismatch — expected ' + EXPECTED_VERSION + ' (package.json), got "' + version + '"');
    }
    return { passed: true, details: 'logged in; APP_VERSION=' + version };
  }
};

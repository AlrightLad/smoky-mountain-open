// Part 1 demo scenario: navigate + assert APP_VERSION === '8.17.0'.
// Auth-free by design — proves cross-browser orchestration (launcher,
// page, capture, results.json, matrix render) works end-to-end without
// requiring real Firebase credentials. Auth helper (auth.loginReal) is
// shipped alongside and exercised by Part 2 scenarios.

const nav = require('../helpers/navigation.js');

module.exports = {
  id: 'S0',
  name: 'demo: navigate + APP_VERSION assertion',
  run: async function(ctx) {
    var page = ctx.page;
    var capture = ctx.capture;

    await page.goto(ctx.devUrl);
    // APP_VERSION is a global declared in utils.js, set on script load —
    // available before any auth flow.
    await page.waitForFunction(function() {
      return typeof window.APP_VERSION === 'string';
    }, null, { timeout: 15000 });

    var version = await nav.readVersion(page);
    await capture.screenshot('initial-load');

    if (version !== '8.22.0') {
      throw new Error('APP_VERSION mismatch — expected 8.20.0, got "' + version + '"');
    }

    return { passed: true, details: 'APP_VERSION=' + version };
  }
};

// S2 — Notification listener startup.
// Validates: post-login auth state attaches the consolidated listener
// (router.js -25 LOC dead-code removal in v8.17.0; verifies listener still
// attaches via window._notifUnsub being a function).

module.exports = {
  id: 'S2',
  name: 'listener startup',
  run: async function(ctx) {
    var page = ctx.page;
    // S1 already logged in; just wait for listener to attach.
    await page.waitForFunction(function() {
      return typeof window._notifUnsub === 'function';
    }, null, { timeout: 10000 });

    var ok = await page.evaluate(function() {
      return typeof window._notifUnsub === 'function';
    });
    if (!ok) throw new Error('window._notifUnsub not a function after 10s');

    await ctx.capture.screenshot('S2-listener-attached');
    return { passed: true, details: 'window._notifUnsub attached' };
  }
};

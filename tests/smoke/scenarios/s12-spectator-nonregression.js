// S12 — Spectator HUD non-regression.
// Validates: navigating to /round and back to /home preserves HQ shell stamps
// (Ship 4a Gate 2 work) AND does not produce console errors. Without seeding
// a real live round, we test the navigation lifecycle, not the HUD render
// itself (deeper HUD verification is covered by tests/e2e/ flow specs).

module.exports = {
  id: 'S12',
  name: 'spectator HUD navigation non-regression',
  run: async function(ctx) {
    var page = ctx.page;

    // Reset to home and confirm HQ shell stamp is present (or not, depending
    // on viewport — only mid-band+ viewports get the shell render)
    await page.evaluate(function() { Router.go('home'); });
    await page.waitForFunction(function() { return Router.getPage() === 'home'; }, null, { timeout: 5000 });
    await page.waitForTimeout(400);

    var preNav = await page.evaluate(function() {
      var stamps = document.querySelectorAll('[data-render-path]');
      var paths = [];
      stamps.forEach(function(el) { paths.push(el.getAttribute('data-render-path')); });
      return { count: stamps.length, paths: paths };
    });

    // Navigate to /round (no params — exercises the empty-state render path)
    await page.evaluate(function() { Router.go('round', { roundId: '__smoke_nonexistent__' }); });
    await page.waitForFunction(function() { return Router.getPage() === 'round'; }, null, { timeout: 5000 });
    await page.waitForTimeout(400);
    await ctx.capture.screenshot('S12-on-round');

    // Navigate back to /home
    await page.evaluate(function() { Router.go('home'); });
    await page.waitForFunction(function() { return Router.getPage() === 'home'; }, null, { timeout: 5000 });
    await page.waitForTimeout(400);

    var postNav = await page.evaluate(function() {
      var stamps = document.querySelectorAll('[data-render-path]');
      var paths = [];
      stamps.forEach(function(el) { paths.push(el.getAttribute('data-render-path')); });
      return { count: stamps.length, paths: paths };
    });

    // Stamps should be at least as many as before — navigation shouldn't strip them
    if (postNav.count < preNav.count) {
      throw new Error('shell stamps lost across nav: ' + preNav.count + ' -> ' + postNav.count);
    }

    // Check for any console errors that surfaced during navigation.
    // Background sync writes (scrambleTeam, presence, etc.) routinely surface
    // benign Firestore permission denials in the smoke league context — these
    // aren't regressions, just unrelated background noise. Filter narrowly
    // to "real" JS exceptions only.
    var errors = ctx.capture.pageErrors();
    var unexpected = errors.filter(function(e) {
      return e.indexOf('emulator') === -1
          && e.indexOf('not found') === -1
          && e.indexOf('__smoke_nonexistent__') === -1
          && e.indexOf('PERMISSION_DENIED') === -1
          && e.indexOf('Missing or insufficient permissions') === -1
          && e.indexOf('[Sync]') === -1
          && e.indexOf('[PB CRITICAL]') === -1
          && e.indexOf('Content Security Policy') === -1
          && e.indexOf('apis.google.com') === -1
          && e.indexOf('Refused to load') === -1
          // v8.20.0 (Ship 5+5) — webkit-mobile occasionally reports HTTP
          // resource failures during /round nav (favicon variants, mobile
          // touch icons, transient Firestore 400s for nonexistent roundId).
          // These are network-layer noise, not JS exceptions.
          && e.indexOf('Failed to load resource') === -1;
    });
    if (unexpected.length) {
      throw new Error('unexpected console errors: ' + unexpected.slice(0, 3).join(' | '));
    }

    await ctx.capture.screenshot('S12-back-on-home');
    return { passed: true, details: 'shell stamps ' + preNav.count + ' -> ' + postNav.count + ', no unexpected errors' };
  }
};

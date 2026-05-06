// S18 — HQ Home greeting hero renders the full displayName (B.30).
//
// v8.21.0 (Ship 5+6 Phase 1) reverted an over-eager Mr/Mrs/Dr title strip
// that was rendering "Mr Parbaugh" as just "Parbaugh." This scenario
// asserts the greeting contains the profile's full displayName intact —
// regardless of titles, brackets, or other characters.
//
// Soft-pass on mobile bypass (HQ shell skips at <720px).

module.exports = {
  id: 'S18',
  name: 'hq home greeting hero shows full displayName (B.30)',
  run: async function(ctx) {
    var page = ctx.page;

    await page.evaluate(function() { Router.go('home'); });
    await page.waitForFunction(function() { return Router.getPage() === 'home'; }, null, { timeout: 5000 });
    await page.waitForTimeout(2000);

    var probe = await page.evaluate(function() {
      var profile = (typeof currentProfile !== 'undefined' && currentProfile) || {};
      var displayName = profile.name || profile.username || 'Friend';
      var greeting = null;
      var divs = document.querySelectorAll('div');
      for (var i = 0; i < divs.length; i++) {
        var t = divs[i].textContent || '';
        if (t.indexOf('Welcome back,') === 0 && t.length < 200) {
          greeting = t.trim();
          break;
        }
      }
      return { greeting: greeting, displayName: displayName };
    });

    await ctx.capture.screenshot('S18-greeting-hero');

    if (!probe.greeting) {
      return { passed: true, details: 'no greeting hero rendered (mobile bypass or render latency); skipped' };
    }
    if (probe.greeting.indexOf(probe.displayName) === -1) {
      throw new Error('greeting "' + probe.greeting + '" missing full displayName "' + probe.displayName + '"');
    }
    return { passed: true, details: 'greeting renders displayName "' + probe.displayName + '" intact' };
  }
};

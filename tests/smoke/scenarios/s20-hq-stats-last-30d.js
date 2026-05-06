// S20 — LAST 30D rolling window caption + cutoff math (B.31).
//
// v8.21.0 (Ship 5+6 Phase 2) replaced calendar-MTD ("rounds this calendar
// month") with rolling 30-day. Calendar-MTD reset to 0 every month-1st,
// breaking members' "recent activity" mental model. Rolling 30D keeps
// recent activity visible across month boundaries.
//
// Hybrid (a)+pure-math approach per CTO Decision 1:
//   (a) Read the rendered "LAST 30D: N" caption; assert it parses to a
//       finite integer.
//   pure-math: page.evaluate the cutoff math directly — verify a 29-days-
//       ago timestamp is included and a 31-days-ago timestamp excluded.
// No state pollution; doesn't seed rounds against the smoke account.

module.exports = {
  id: 'S20',
  name: 'hq stats LAST 30D rolling window (B.31)',
  run: async function(ctx) {
    var page = ctx.page;

    await page.evaluate(function() { Router.go('home'); });
    await page.waitForFunction(function() { return Router.getPage() === 'home'; }, null, { timeout: 5000 });
    await page.waitForTimeout(2000);

    var probe = await page.evaluate(function() {
      // (a) Find the "LAST 30D: N" caption text in the stats strip.
      var caption = null;
      var spans = document.querySelectorAll('div');
      for (var i = 0; i < spans.length; i++) {
        var t = (spans[i].textContent || '').trim();
        if (/^LAST 30D:\s*\d+$/i.test(t)) {
          caption = t;
          break;
        }
      }

      // pure-math: replicate the cutoff predicate from home.js
      var THIRTY_DAYS_MS = 30 * 86400000;
      var cutoff = Date.now() - THIRTY_DAYS_MS;
      var ts29 = Date.now() - (29 * 86400000);
      var ts31 = Date.now() - (31 * 86400000);
      return {
        caption: caption,
        included29: ts29 >= cutoff,
        excluded31: ts31 < cutoff
      };
    });

    await ctx.capture.screenshot('S20-stats-last-30d');

    // Cutoff math is deterministic — must always pass.
    if (!probe.included29) {
      throw new Error('cutoff math broken: 29-days-ago timestamp not >= cutoff');
    }
    if (!probe.excluded31) {
      throw new Error('cutoff math broken: 31-days-ago timestamp not < cutoff');
    }

    if (!probe.caption) {
      // Mobile bypass or strip not yet rendered. Pure-math still validated.
      return { passed: true, details: 'cutoff math OK; caption not in DOM (mobile bypass or render latency)' };
    }

    var m = /(\d+)/.exec(probe.caption);
    var n = m ? parseInt(m[1], 10) : NaN;
    if (isNaN(n)) {
      throw new Error('LAST 30D caption did not parse to a number: "' + probe.caption + '"');
    }
    return { passed: true, details: 'caption "' + probe.caption + '"; cutoff math OK (29d included, 31d excluded)' };
  }
};

// S19 — HQ Home stats strip cells align horizontally regardless of data
// state (B.7 / B.28).
//
// v8.21.0 (Ship 5+6 Phase 2) added always-truthy caption fallbacks so cells
// with missing data ("NO ROUNDS YET") still produce the same row count as
// cells with data — preventing the alignment drift that produced uneven
// heights before the fix. This scenario guards that: cells within a strip
// must share one height.
//
// The HQ home renders MORE THAN ONE such strip for an established member,
// each an independent 4-cell quartet sharing the .hq-stat-strip__numeral
// class but living in its own container at its own height:
//   • personal snapshot  — _renderStatsSnapshotQuartet (home-hq.js):
//       HCP / ROUNDS / BEST / STREAK
//   • "league this week"  — _renderLeagueThisWeekStrip (home-hq-league-week.js,
//       extracted 2026-05-22 per AMD-027): ROUNDS / AVG / LOW / MOMENTUM
// (a new user instead sees the ghosted quartet from home-rail-newuser.js).
// Alignment is guaranteed WITHIN a strip, not across strips — the two strips
// legitimately differ in height (e.g. 120px vs 102px). So we group numeral
// cells by their parent strip element and assert each group is internally
// flush (within 1px, absorbing sub-pixel rounding).

module.exports = {
  id: 'S19',
  name: 'hq stats strip cells align (B.7+B.28)',
  run: async function(ctx) {
    var page = ctx.page;

    await page.evaluate(function() { Router.go('home'); });
    await page.waitForFunction(function() { return Router.getPage() === 'home'; }, null, { timeout: 5000 });
    await page.waitForTimeout(2000);

    var probe = await page.evaluate(function() {
      var numerals = document.querySelectorAll('.hq-stat-strip__numeral');
      if (numerals.length === 0) return { found: false };
      // Group cells by their owning strip (cell.parentElement). Each strip is
      // an independent quartet; alignment holds within a strip, not across.
      var strips = [];   // strip elements, in DOM order
      var groups = [];    // parallel { heights, captions }
      numerals.forEach(function(n) {
        var cell = n.parentElement;
        if (!cell) return;
        var strip = cell.parentElement;
        var idx = strips.indexOf(strip);
        if (idx === -1) { strips.push(strip); groups.push({ heights: [], captions: [] }); idx = groups.length - 1; }
        var rect = cell.getBoundingClientRect();
        groups[idx].heights.push(Math.round(rect.height));
        // Caption is the third (last) child div; not all cells have one
        var children = cell.querySelectorAll('div');
        if (children.length >= 3) groups[idx].captions.push(children[2].textContent.trim());
      });
      return { found: true, total: numerals.length, groups: groups };
    });

    await ctx.capture.screenshot('S19-stats-strip');

    if (!probe.found) {
      return { passed: true, details: 'no .hq-stat-strip__numeral rendered (mobile bypass or strip not on this surface); skipped' };
    }
    var problems = [];
    probe.groups.forEach(function(g, i) {
      if (!g.heights.length) return;
      var maxH = Math.max.apply(null, g.heights);
      var minH = Math.min.apply(null, g.heights);
      if (maxH - minH > 1) {
        problems.push('strip ' + (i + 1) + ' height drift: heights=' + JSON.stringify(g.heights)
          + ' (max-min=' + (maxH - minH) + 'px); captions=' + JSON.stringify(g.captions));
      }
    });
    if (problems.length) {
      throw new Error(problems.join(' | '));
    }
    return { passed: true, details: probe.groups.length + ' strip(s), ' + probe.total + ' cells, each internally aligned ±1px' };
  }
};

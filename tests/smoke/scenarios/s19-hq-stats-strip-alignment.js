// S19 — HQ Home stats strip cells align horizontally regardless of data
// state (B.7 / B.28).
//
// The stats strip renders 4 cells (HCP / ROUNDS / BEST / STREAK). v8.21.0
// (Ship 5+6 Phase 2) added always-truthy caption fallbacks so cells with
// missing data ("NO ROUNDS YET") still produce the same row count as cells
// with data — preventing the alignment drift that produced uneven heights
// before the fix. This scenario asserts all cells render with equal heights.
//
// Each cell holds .hq-stat-strip__numeral; cells share the strip's parent.
// We read each cell (numeral parent) and assert all heights are identical
// (within 1px to absorb sub-pixel rounding).

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
      var heights = [];
      var widths = [];
      var sampleCaptions = [];
      numerals.forEach(function(n) {
        var cell = n.parentElement;
        if (!cell) return;
        var rect = cell.getBoundingClientRect();
        heights.push(Math.round(rect.height));
        widths.push(Math.round(rect.width));
        // Caption is the third (last) child div; not all cells have one
        var children = cell.querySelectorAll('div');
        if (children.length >= 3) sampleCaptions.push(children[2].textContent.trim());
      });
      return { found: true, count: numerals.length, heights: heights, widths: widths, captions: sampleCaptions };
    });

    await ctx.capture.screenshot('S19-stats-strip');

    if (!probe.found) {
      return { passed: true, details: 'no .hq-stat-strip__numeral rendered (mobile bypass or strip not on this surface); skipped' };
    }
    if (probe.count !== 4) {
      throw new Error('expected 4 stats cells, found ' + probe.count + ' (heights=' + JSON.stringify(probe.heights) + ')');
    }
    var maxH = Math.max.apply(null, probe.heights);
    var minH = Math.min.apply(null, probe.heights);
    if (maxH - minH > 1) {
      throw new Error('stats cells height drift: heights=' + JSON.stringify(probe.heights) + ' (max-min=' + (maxH - minH) + 'px); captions=' + JSON.stringify(probe.captions));
    }
    return { passed: true, details: 'all 4 cells aligned at ' + minH + 'px ±1px' };
  }
};

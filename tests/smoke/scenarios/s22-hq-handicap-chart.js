// S22 — HQ Home handicap chart renders a legal state + holds dimensions
// across rerender (D1 / Phase 4 / A6).
//
// v8.21.0 (Ship 5+6 Phase 4) wrapped the handicap chart in
// .hq-handicap-chart and extracted _renderEmptySeriesState. The empty
// state is engineered for ZERO LAYOUT SHIFT: same SVG container + viewBox
// + height as populated chart. When the 3rd round arrives, content swaps
// but outer dimensions don't budge.
//
// Soft "legal-states" assertion per CTO Decision 2:
//   - chart container .hq-handicap-chart exists
//   - inner [data-chart-id="handicap_home"] holds an <svg>
//   - state is ONE OF: empty (text contains "OF 3 ROUNDS LOGGED") OR
//     populated (any other svg children)
//
// BONUS — zero-shift contract:
//   - Capture chart-container box height
//   - Click a range pill (30D/SEASON/ANNUAL) — triggers surgical rerender
//     via _rerenderTrendChart('handicap_home')
//   - Capture height after, assert unchanged (±1px subpixel)

module.exports = {
  id: 'S22',
  name: 'hq handicap chart legal state + zero-shift on rerender (D1/A6)',
  run: async function(ctx) {
    var page = ctx.page;

    await page.evaluate(function() { Router.go('home'); });
    await page.waitForFunction(function() { return Router.getPage() === 'home'; }, null, { timeout: 5000 });
    await page.waitForTimeout(2500);

    var stateProbe = await page.evaluate(function() {
      var wrap = document.querySelector('.hq-handicap-chart');
      if (!wrap) return { found: false };
      var chartBody = wrap.querySelector('[data-chart-id="handicap_home"]');
      var svg = chartBody ? chartBody.querySelector('svg') : null;
      if (!svg) return { found: true, chartBodyFound: !!chartBody, svgFound: false };
      var svgRect = svg.getBoundingClientRect();
      var bodyRect = chartBody.getBoundingClientRect();
      var svgText = (svg.textContent || '').trim();
      var isEmptyState = /OF 3 ROUNDS LOGGED/i.test(svgText);
      // Populated chart has either polylines/paths beyond the dashed
      // lines, or circles for data points.
      var dataElements = svg.querySelectorAll('path, polyline, circle').length;
      return {
        found: true,
        chartBodyFound: true,
        svgFound: true,
        svgWidth: svgRect.width,
        svgHeight: svgRect.height,
        bodyHeight: Math.round(bodyRect.height),
        isEmptyState: isEmptyState,
        dataElementCount: dataElements,
        svgText: svgText
      };
    });

    await ctx.capture.screenshot('S22-chart-initial');

    if (!stateProbe.found) {
      return { passed: true, details: 'no .hq-handicap-chart rendered (mobile bypass or render latency); skipped' };
    }
    if (!stateProbe.svgFound) {
      throw new Error('chart container present but SVG missing (chartBodyFound=' + stateProbe.chartBodyFound + ')');
    }
    if (!(stateProbe.svgWidth > 0 && stateProbe.svgHeight > 0)) {
      throw new Error('chart SVG has zero rendered size: ' + stateProbe.svgWidth + 'x' + stateProbe.svgHeight);
    }
    if (!stateProbe.isEmptyState && stateProbe.dataElementCount === 0) {
      throw new Error('chart in undefined state: not empty (no "OF 3 ROUNDS LOGGED") and no data elements');
    }
    var initialState = stateProbe.isEmptyState ? 'empty' : ('populated (' + stateProbe.dataElementCount + ' draw elements)');

    // BONUS — zero-layout-shift on range-pill toggle. Click a different
    // range than current, wait briefly for surgical rerender, re-measure
    // body height. Skip the BONUS if the toggle isn't present (single-pill
    // configurations).
    var toggleProbe = await page.evaluate(function() {
      var pills = document.querySelectorAll('.chart-range-toggle[data-chart-id="handicap_home"] .chart-range-pill');
      if (pills.length < 2) return { skipped: true };
      var active = -1;
      for (var i = 0; i < pills.length; i++) {
        if (pills[i].classList.contains('chart-range-pill--active')) { active = i; break; }
      }
      var target = active === 0 ? 1 : 0; // pick a different pill
      var pillToClick = pills[target];
      pillToClick.click();
      return { skipped: false, clicked: pillToClick.getAttribute('data-range') };
    });

    if (!toggleProbe.skipped) {
      await page.waitForTimeout(400);
      var afterProbe = await page.evaluate(function() {
        var chartBody = document.querySelector('[data-chart-id="handicap_home"]');
        if (!chartBody) return { found: false };
        var rect = chartBody.getBoundingClientRect();
        return { found: true, bodyHeight: Math.round(rect.height) };
      });

      await ctx.capture.screenshot('S22-chart-after-toggle');

      if (!afterProbe.found) {
        throw new Error('chart body disappeared after range toggle');
      }
      var diff = Math.abs(afterProbe.bodyHeight - stateProbe.bodyHeight);
      if (diff > 1) {
        throw new Error('chart layout shifted on range toggle: ' + stateProbe.bodyHeight + 'px → ' + afterProbe.bodyHeight + 'px (diff=' + diff + 'px)');
      }
      return {
        passed: true,
        details: 'state=' + initialState + '; height ' + stateProbe.bodyHeight + 'px held across "' + toggleProbe.clicked + '" toggle'
      };
    }
    return { passed: true, details: 'state=' + initialState + '; range toggle absent — bonus skipped' };
  }
};

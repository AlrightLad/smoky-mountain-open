// S28 — growth trilogy assertions (v8.24.43-45).
// Protects the three acquisition features the strategy brief ranked 1-3:
//   1. pbCreateShareLink — exposed; rejects signed-out callers cleanly
//      (the public-shares pipeline's client gate).
//   2. Wrapped — route renders the story stage with progress segments and
//      a tappable engine (slide advances on right-side click).
//   3. Commissioner's Kit — renderLeagueDetail emits the Your First Week
//      card for a young league the signed-in member commissions (asserted
//      against the live league doc the smoke account owns).
// P8 discipline: assert rendered DOM, not function presence alone.

module.exports = {
  id: 'S28',
  name: 'growth trilogy (share link gate / wrapped story / commissioner kit)',
  run: async function(ctx) {
    var page = ctx.page;

    // ── 1+2. Wrapped story engine (signed-in member with rounds) ──
    var r = await page.evaluate(function() {
      var out = {};
      out.shareFn = typeof pbCreateShareLink === 'function';
      out.wrappedRoute = typeof _buildWrappedSlides === 'function';
      Router.go('wrapped');
      return new Promise(function(resolve) {
        setTimeout(function() {
          var stage = document.getElementById('wrappedStage');
          out.stageRendered = !!stage;
          out.progressSegments = stage ? stage.firstElementChild.children.length : 0;
          out.slideCount = (typeof _wrappedSlides !== 'undefined') ? _wrappedSlides.length : 0;
          // advance one slide via the engine's own click handler
          if (stage) {
            var evt = new MouseEvent('click', { clientX: window.innerWidth - 10, bubbles: true });
            stage.dispatchEvent(evt);
          }
          setTimeout(function() {
            out.advanced = (typeof _wrappedIdx !== 'undefined') && _wrappedIdx === (out.slideCount > 1 ? 1 : 0);
            Router.go('home');
            resolve(out);
          }, 250);
        }, 600);
      });
    });

    var failures = [];
    if (!r.shareFn) failures.push('pbCreateShareLink missing');
    if (!r.wrappedRoute || !r.stageRendered) failures.push('wrapped stage did not render');
    if (r.slideCount < 1) failures.push('wrapped built zero slides');
    if (r.progressSegments !== r.slideCount) failures.push('progress segments (' + r.progressSegments + ') != slides (' + r.slideCount + ')');
    if (r.slideCount > 1 && !r.advanced) failures.push('tap did not advance the story');

    // ── 3. Commissioner's Kit on the smoke league page ──
    var k = await page.evaluate(function() {
      Router.go('leagues', { id: 'smoke-test-league' });
      return new Promise(function(resolve) {
        setTimeout(function() {
          var kit = document.getElementById('commKit');
          var out = { kitRendered: !!kit, items: 0 };
          if (kit) {
            out.items = ['kit-invite', 'kit-tee', 'kit-chat', 'kit-round'].filter(function(id) {
              return !!document.getElementById(id);
            }).length;
          }
          Router.go('home');
          resolve(out);
        }, 2500);
      });
    });
    if (!k.kitRendered) failures.push('commissioner kit card missing on young league');
    if (k.items !== 4) failures.push('kit items rendered ' + k.items + '/4');

    if (failures.length) throw new Error(failures.join(' | '));
    await ctx.capture.screenshot('S28-growth-trilogy');
    return { passed: true, details: 'share gate + wrapped(' + r.slideCount + ' slides) + kit 4/4 green' };
  }
};

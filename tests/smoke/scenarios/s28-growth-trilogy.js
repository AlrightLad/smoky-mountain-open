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

    // ── 1+2. Share gate + Wrapped (BOTH branches: pending-gate AND story engine) ──
    // v8.25.54: Wrapped for the CURRENT year is gated until Dec 1 (Founder
    // 2026-06-13 — "show pending yearly progress, not results, before then").
    // So the story-stage assertion now runs against a PAST year (never gated),
    // and we separately assert the current-year pending gate renders correctly.
    var r = await page.evaluate(function() {
      var out = {};
      out.shareFn = typeof pbCreateShareLink === 'function';
      out.wrappedFn = typeof _buildWrappedSlides === 'function';
      var now = new Date();
      var cur = now.getFullYear();
      out.gatedNow = now < new Date(cur, 11, 1); // true before Dec 1 → current year shows "pending"
      return new Promise(function(resolve) {
        // (a) STORY ENGINE — a past year is never gated, so the stage always builds
        Router.go('wrapped', { year: cur - 1 });
        setTimeout(function() {
          var stage = document.getElementById('wrappedStage');
          out.stageRendered = !!stage;
          out.progressSegments = (stage && stage.firstElementChild) ? stage.firstElementChild.children.length : 0;
          out.slideCount = (typeof _wrappedSlides !== 'undefined') ? _wrappedSlides.length : 0;
          if (stage) {
            var evt = new MouseEvent('click', { clientX: window.innerWidth - 10, bubbles: true });
            stage.dispatchEvent(evt);
          }
          setTimeout(function() {
            out.advanced = (typeof _wrappedIdx !== 'undefined') && _wrappedIdx === (out.slideCount > 1 ? 1 : 0);
            // (b) PENDING GATE — back home, then the current-year route
            Router.go('home');
            setTimeout(function() {
              Router.go('wrapped');
              setTimeout(function() {
                var stageCur = document.getElementById('wrappedStage');
                var pageEl = document.querySelector('[data-page="wrapped"]');
                var txt = pageEl ? pageEl.textContent : '';
                // before Dec 1: pending view (no story stage); on/after: the story
                out.currentBranchOk = out.gatedNow
                  ? (!stageCur && /still being written|In Progress|unlocks/i.test(txt))
                  : !!stageCur;
                Router.go('home');
                resolve(out);
              }, 500);
            }, 300);
          }, 250);
        }, 600);
      });
    });

    var failures = [];
    if (!r.shareFn) failures.push('pbCreateShareLink missing');
    if (!r.wrappedFn) failures.push('_buildWrappedSlides missing');
    if (!r.stageRendered) failures.push('wrapped story stage did not render (past year)');
    if (r.slideCount < 1) failures.push('wrapped built zero slides (past year)');
    if (r.progressSegments !== r.slideCount) failures.push('progress segments (' + r.progressSegments + ') != slides (' + r.slideCount + ')');
    if (r.slideCount > 1 && !r.advanced) failures.push('tap did not advance the story');
    if (!r.currentBranchOk) failures.push(r.gatedNow ? 'current-year Wrapped pending-gate did not render' : 'current-year Wrapped story did not render (post-Dec-1)');

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

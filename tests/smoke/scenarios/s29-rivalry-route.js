// S29 — rivalry detail navigation (v8.24.52 fix).
// The bug: showRivalryDetail() wrote into the standings container WITHOUT
// showing it (no Router.go), so every rivalry/nemesis button rendered into a
// hidden div and appeared dead. The fix routes through Router.go('standings',
// {rivalry}). This scenario navigates the real way (the harness in which
// Router.go demonstrably works — see S24-S26) and asserts the detail shows.
module.exports = {
  id: 'S29',
  name: 'rivalry detail routes + renders (dead-button fix)',
  run: async function(ctx) {
    var page = ctx.page;
    var r = await page.evaluate(function() {
      return new Promise(function(resolve) {
        var out = {};
        var ps = (typeof PB !== 'undefined') ? PB.getPlayers() : [];
        out.havePlayers = ps.length >= 2;
        if (!out.havePlayers) { resolve(out); return; }
        var a = ps[0].id, b = ps[1].id;
        out.fnExists = typeof showRivalryDetail === 'function';
        showRivalryDetail(a, b);
        // allow the route + render to settle
        setTimeout(function() {
          out.page = Router.getPage();
          var el = document.querySelector('[data-page="standings"]');
          out.standingsVisible = !!(el && !el.classList.contains('hidden'));
          out.rendersVs = !!(el && el.innerHTML.indexOf(' vs ') !== -1);
          out.hasRecord = !!(el && el.querySelector('.rv-score'));
          // back returns somewhere sane (not stuck)
          resolve(out);
        }, 400);
      });
    });

    var failures = [];
    if (!r.havePlayers) { return { passed: true, details: 'skipped — <2 players seeded' }; }
    if (!r.fnExists) failures.push('showRivalryDetail missing');
    if (r.page !== 'standings') failures.push('did not route to standings (got ' + r.page + ')');
    if (!r.standingsVisible) failures.push('standings container still hidden — the original dead-button bug');
    if (!r.rendersVs) failures.push('rivalry "X vs Y" header did not render');
    if (!r.hasRecord) failures.push('head-to-head score block missing');
    if (failures.length) throw new Error(failures.join(' | '));
    await ctx.capture.screenshot('S29-rivalry-detail');
    return { passed: true, details: 'rivalry routes to standings + renders the tape' };
  }
};

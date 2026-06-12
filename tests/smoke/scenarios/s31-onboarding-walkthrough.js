// S31 — onboarding walkthrough (FTUE) flow guard (v8.25.0).
// The Caddy-guided first-run walkthrough (window.pbWalk): pick caddie → frame →
// calibrate → demonstrate → un-losable demo-hole win → finish. Asserts the engine
// renders (overlay + figure), all 5 beats advance, the demo-hole win fires its
// message + finish button, finish tears down, and skip() also tears down. Forces
// runFtue(0) directly (bypasses route()'s once-per-session/E2E suppress). The
// demo hole NEVER writes /rounds (a couch-bound new user can't log a real round).
module.exports = {
  id: 'S31',
  name: 'onboarding walkthrough — 5-beat FTUE spine + demo-hole win + teardown',
  run: async function (ctx) {
    var page = ctx.page;
    var r = await page.evaluate(function () {
      function q(sel) { var o = document.getElementById('pbWalk'); return o ? o.querySelector(sel) : null; }
      function body() { var b = q('.pbw-body'); return b ? b.textContent : ''; }
      var out = { deps: !!(window.pbWalk && window.pbCaddy && window.pbVoices) };
      if (!out.deps) return out;
      window.pbWalk.runFtue(0);                                        // beat 0
      out.b0overlay = !!document.getElementById('pbWalk');
      out.b0figure = !!q('#pbc-svg');
      out.b0choices = document.querySelectorAll('#pbWalk .pbw-caddie-pick').length;
      var caddy = document.querySelector('#pbWalk .pbw-caddie-pick[data-id="caddy"]'); if (caddy) caddy.click();
      out.b1 = body();                                                 // beat 1 frame
      var p1 = document.getElementById('pbw-primary'); if (p1) p1.click();
      out.b2choices = document.querySelectorAll('#pbWalk .pbw-choice').length; // beat 2 calibrate
      var c = document.querySelector('#pbWalk .pbw-choice'); if (c) c.click();  // -> beat 3
      var p3 = document.getElementById('pbw-primary'); if (p3) p3.click();      // -> beat 4
      out.b4scores = document.querySelectorAll('#pbWalk .pbw-demo-score').length;
      var s = document.querySelector('#pbWalk .pbw-demo-score'); if (s) s.click(); // tap score -> win
      out.winMsg = (document.getElementById('pbw-demo-msg') || {}).textContent || '';
      out.finishBtn = !!document.getElementById('pbw-finish');
      var f = document.getElementById('pbw-finish'); if (f) f.click();  // finish -> teardown
      out.tornDown = !document.getElementById('pbWalk');
      window.pbWalk.runFtue(0); out.reopened = !!document.getElementById('pbWalk'); // skip path
      window.pbWalk.skip();
      out.skipTornDown = !document.getElementById('pbWalk');
      return out;
    });
    var fails = [];
    if (!r.deps) { throw new Error('pbWalk/pbCaddy/pbVoices missing from bundle'); }
    if (!r.b0overlay) fails.push('beat0 overlay did not mount');
    if (!r.b0figure) fails.push('caddy figure not rendered');
    if (r.b0choices < 3) fails.push('beat0 caddie choices < 3 (' + r.b0choices + ')');
    if (!r.b1) fails.push('beat1 frame body empty');
    if (r.b2choices !== 2) fails.push('beat2 calibrate choices != 2 (' + r.b2choices + ')');
    if (r.b4scores < 4) fails.push('beat4 demo-hole scores < 4 (' + r.b4scores + ')');
    if (!r.winMsg) fails.push('demo-hole win message empty');
    if (!r.finishBtn) fails.push('finish button missing after score tap');
    if (!r.tornDown) fails.push('overlay not torn down after finish');
    if (!r.reopened) fails.push('runFtue did not reopen for skip test');
    if (!r.skipTornDown) fails.push('skip() did not tear down overlay');
    if (fails.length) throw new Error(fails.join(' | '));
    return { passed: true, details: 'FTUE: 5 beats + demo-hole win + finish/skip teardown all verified' };
  }
};

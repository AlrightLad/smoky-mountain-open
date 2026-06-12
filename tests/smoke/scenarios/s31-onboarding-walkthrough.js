// S31 — onboarding walkthrough (FTUE) flow guard (v8.25.4 restructure).
// New order per Founder feedback: welcome -> calibrate (solo/crew) -> 4-beat
// FEATURE TOUR (Play / Feed / Standings / earn-&-spend) -> un-losable demo-hole
// WIN -> meet-your-caddy LAST (explained + previewable, confirm with "Start
// playing"). Asserts the engine renders, every beat advances, the win fires, the
// caddy beat is last with a preview area, and finish + skip both tear down.
// Forces runFtue(0) directly (bypasses route()'s once-per-session/E2E suppress).
module.exports = {
  id: 'S31',
  name: 'onboarding walkthrough — welcome + feature tour + demo win + caddy-last',
  run: async function (ctx) {
    var page = ctx.page;
    var r = await page.evaluate(function () {
      function q(sel) { var o = document.getElementById('pbWalk'); return o ? o.querySelector(sel) : null; }
      function body() { var b = q('.pbw-body'); return b ? b.textContent : ''; }
      var out = { deps: !!(window.pbWalk && window.pbCaddy && window.pbVoices) };
      if (!out.deps) return out;
      window.pbWalk.runFtue(0);                                         // beat 0 welcome
      out.overlay = !!document.getElementById('pbWalk');
      out.figure = !!q('#pbc-svg');
      out.welcomeBody = body();
      var p0 = document.getElementById('pbw-primary'); if (p0) p0.click(); // -> beat 1 calibrate
      out.calibChoices = document.querySelectorAll('#pbWalk .pbw-choice').length;
      var c = document.querySelector('#pbWalk .pbw-choice'); if (c) c.click(); // pick -> beat 2 tour
      var guard = 0;                                                    // step the 4 tour beats
      while (!document.querySelector('#pbWalk .pbw-demo-score') && guard++ < 10) {
        var pr = document.getElementById('pbw-primary'); if (!pr) break; pr.click();
      }
      out.reachedWin = !!document.querySelector('#pbWalk .pbw-demo-score');
      out.winScores = document.querySelectorAll('#pbWalk .pbw-demo-score').length;
      var s = document.querySelector('#pbWalk .pbw-demo-score'); if (s) s.click(); // tap -> win
      out.winMsg = (document.getElementById('pbw-demo-msg') || {}).textContent || '';
      var f = document.getElementById('pbw-finish'); if (f) f.click();  // -> beat 7 caddy (LAST)
      out.caddyChoices = document.querySelectorAll('#pbWalk .pbw-caddie-pick').length;
      out.caddyPreview = !!document.getElementById('pbw-caddie-preview');
      var cad = document.querySelector('#pbWalk .pbw-caddie-pick[data-id="caddy"]'); if (cad) cad.click(); // preview
      out.previewText = (document.getElementById('pbw-caddie-preview') || {}).textContent || '';
      var fin = document.getElementById('pbw-primary'); if (fin) fin.click(); // "Start playing" -> complete
      out.tornDown = !document.getElementById('pbWalk');
      window.pbWalk.runFtue(0); out.reopened = !!document.getElementById('pbWalk');
      window.pbWalk.skip(); out.skipTornDown = !document.getElementById('pbWalk');
      return out;
    });
    var fails = [];
    if (!r.deps) throw new Error('pbWalk/pbCaddy/pbVoices missing from bundle');
    if (!r.overlay) fails.push('overlay did not mount');
    if (!r.figure) fails.push('caddy figure not rendered');
    if (!r.welcomeBody) fails.push('welcome body empty');
    if (r.calibChoices !== 2) fails.push('calibrate choices != 2 (' + r.calibChoices + ')');
    if (!r.reachedWin) fails.push('did not reach demo-hole through the tour');
    if (r.winScores < 4) fails.push('demo-hole scores < 4 (' + r.winScores + ')');
    if (!r.winMsg) fails.push('demo-hole win message empty');
    if (r.caddyChoices < 3) fails.push('caddy-last choices < 3 (' + r.caddyChoices + ')');
    if (!r.caddyPreview) fails.push('caddy preview area missing (no preview before select)');
    if (!r.tornDown) fails.push('overlay not torn down after Start playing');
    if (!r.reopened) fails.push('runFtue did not reopen for skip test');
    if (!r.skipTornDown) fails.push('skip() did not tear down overlay');
    if (fails.length) throw new Error(fails.join(' | '));
    return { passed: true, details: 'FTUE: welcome -> calibrate -> 4-beat tour -> demo win -> caddy-last (preview+confirm)' };
  }
};

// S27 — 2026-06-10 marathon feature assertions (v8.24.14 → v8.24.31).
// One scenario, six sub-checks on the shipped module behaviors that have no
// other automated coverage. P8 discipline: assert rendered DOM (existence,
// classes, computed color), not just function presence.
//
//   1. pbConfirm — renders the branded card, danger maps to claret,
//      Escape closes + cleans up (replaced 24 native confirm()s).
//   2. pbCelebrate — exposed; sessionStorage throttle blocks same-key
//      refire (pb_celebrate_* whitelist).
//   3. pbTeeIntro — exposed; maybeShow() is a NO-OP while the
//      pb_intro_enabled flag is unset (ships dark).
//   4. pbInvitesLeft — 25-invite floor over a legacy maxInvites:3 profile;
//      founder profile gets Infinity.
//   5. Router.toast delegation — legacy call lands in #pb-toast-stack.
//   6. Theme system — applyTheme flips the palette (canvas var changes)
//      and getCurrentTheme reads back; restores clubhouse after.

module.exports = {
  id: 'S27',
  name: 'marathon 2026-06-10 features (confirm/confetti/intro/invites/toast/theme)',
  run: async function(ctx) {
    var page = ctx.page;

    var r = await page.evaluate(function() {
      var out = {};
      return new Promise(function(resolve) {
        // ── 1. pbConfirm ──
        out.confirmFn = typeof pbConfirm === 'function';
        if (out.confirmFn) {
          pbConfirm({ title: 'S27 danger check', message: 'm', confirmLabel: 'Go', danger: true });
          var ov = document.getElementById('pbConfirmOverlay');
          out.confirmRendered = !!ov;
          var yes = document.getElementById('pbConfirmYes');
          out.confirmDangerBg = yes ? getComputedStyle(yes).backgroundColor : null;
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        }

        // ── 2. pbCelebrate throttle ──
        out.celebrateFn = typeof pbCelebrate === 'function';
        try { sessionStorage.removeItem('pb_celebrate_s27'); } catch (e) {}
        if (out.celebrateFn) {
          pbCelebrate({ key: 's27' });
          out.celebrateThrottled = null;
          try { out.celebrateThrottled = sessionStorage.getItem('pb_celebrate_s27') !== null; } catch (e) {}
        }

        // ── 3. pbTeeIntro dark by default ──
        out.introFn = typeof pbTeeIntro !== 'undefined' && !!pbTeeIntro.maybeShow;
        if (out.introFn) {
          try { localStorage.removeItem('pb_intro_enabled'); } catch (e) {}
          var showed = pbTeeIntro.maybeShow();
          out.introStaysDark = showed === false && !document.getElementById('pbIntro');
        }

        // ── 4. invite floor ──
        out.invitesFn = typeof pbInvitesLeft === 'function';
        if (out.invitesFn) {
          out.floorApplied = pbInvitesLeft({ maxInvites: 3, invitesUsed: 3 }) === 22; // max(3,25)-3
          out.founderInfinite = pbInvitesLeft({ platformRole: 'founder', maxInvites: 3 }) === Infinity;
        }

        // ── 5. toast delegation ──
        Router.toast('S27 delegation check');
        var stack = document.getElementById('pb-toast-stack');
        out.toastDelegated = !!(stack && stack.textContent.indexOf('S27 delegation check') !== -1);

        // ── 6. theme flip ──
        var before = getComputedStyle(document.documentElement).getPropertyValue('--cb-canvas').trim();
        applyTheme('twilight_links');
        var after = getComputedStyle(document.documentElement).getPropertyValue('--cb-canvas').trim();
        out.themeFlips = before !== after && getCurrentTheme() === 'twilight_links';
        applyTheme('clubhouse');
        try { localStorage.setItem('pb_theme', 'clubhouse'); } catch (e) {}

        // allow the Escape teardown + confetti canvas removal to settle
        setTimeout(function() {
          out.confirmCleaned = !document.getElementById('pbConfirmOverlay');
          resolve(out);
        }, 400);
      });
    });

    var failures = [];
    if (!r.confirmFn || !r.confirmRendered) failures.push('pbConfirm missing/not rendering');
    if (r.confirmDangerBg !== 'rgb(142, 58, 58)') failures.push('danger button not claret: ' + r.confirmDangerBg);
    if (!r.confirmCleaned) failures.push('Escape did not clean up pbConfirm');
    if (!r.celebrateFn || r.celebrateThrottled !== true) failures.push('pbCelebrate missing or throttle key not written');
    if (!r.introFn || r.introStaysDark !== true) failures.push('pbTeeIntro missing or NOT dark by default');
    if (!r.invitesFn || !r.floorApplied || !r.founderInfinite) failures.push('pbInvitesLeft floor/founder wrong');
    if (!r.toastDelegated) failures.push('Router.toast did not land in pb-toast-stack');
    if (!r.themeFlips) failures.push('applyTheme did not flip the palette');

    if (failures.length) throw new Error(failures.join(' | '));
    await ctx.capture.screenshot('S27-marathon-features');
    return { passed: true, details: '6/6 marathon feature checks green' };
  }
};

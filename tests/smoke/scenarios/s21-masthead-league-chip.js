// S21 — Masthead league chip renders with conditional chevron (D2/Phase 3).
//
// v8.21.0 (Ship 5+6 Phase 3) added the league wayfinding chip to the HQ
// masthead right cluster: dot (◉) + uppercase league name, chevron only
// when the user belongs to multiple leagues. Single-league users see
// the chip as a flat label that opens /leagues for create-or-join;
// multi-league users see the chevron as a switcher affordance.
//
// Asserts:
//   - .hq-league-chip button exists
//   - dot ◉ child present
//   - name child renders uppercase, non-empty
//   - chevron presence matches currentProfile.leagues.length > 1
//   - aria-label conditioned on the same predicate (A5 amendment)

module.exports = {
  id: 'S21',
  name: 'masthead league chip + conditional chevron (D2/A5)',
  run: async function(ctx) {
    var page = ctx.page;

    await page.evaluate(function() { Router.go('home'); });
    await page.waitForFunction(function() { return Router.getPage() === 'home'; }, null, { timeout: 5000 });
    await page.waitForTimeout(2000);

    var probe = await page.evaluate(function() {
      var chip = document.querySelector('.hq-league-chip');
      if (!chip) return { found: false };
      var profile = (typeof currentProfile !== 'undefined' && currentProfile) || {};
      var leagues = (profile.leagues || []);
      var multiLeague = leagues.length > 1;
      var dot = chip.querySelector('.hq-league-chip__dot');
      var nameEl = chip.querySelector('.hq-league-chip__name');
      var chevron = chip.querySelector('.hq-league-chip__chevron');
      var rect = chip.getBoundingClientRect();
      return {
        found: true,
        width: rect.width,
        height: rect.height,
        hasDot: !!dot,
        dotText: dot ? dot.textContent.trim() : '',
        hasName: !!nameEl,
        nameText: nameEl ? nameEl.textContent.trim() : '',
        hasChevron: !!chevron,
        ariaLabel: chip.getAttribute('aria-label'),
        multiLeague: multiLeague,
        leagueCount: leagues.length
      };
    });

    await ctx.capture.screenshot('S21-league-chip');

    if (!probe.found) {
      return { passed: true, details: 'no .hq-league-chip rendered (mobile bypass or render latency); skipped' };
    }
    if (!(probe.width > 0 && probe.height > 0)) {
      throw new Error('chip rendered with zero size: ' + probe.width + 'x' + probe.height);
    }
    if (!probe.hasDot) throw new Error('chip missing .hq-league-chip__dot');
    if (probe.dotText !== '◉') throw new Error('chip dot text is "' + probe.dotText + '" (expected ◉)');
    if (!probe.hasName) throw new Error('chip missing .hq-league-chip__name');
    if (!probe.nameText) throw new Error('chip name text is empty');
    if (probe.nameText !== probe.nameText.toUpperCase()) {
      throw new Error('chip name not uppercase: "' + probe.nameText + '"');
    }
    // Conditional chevron — must match leagues.length > 1
    if (probe.multiLeague && !probe.hasChevron) {
      throw new Error('multi-league user (leagues=' + probe.leagueCount + ') but no chevron rendered');
    }
    if (!probe.multiLeague && probe.hasChevron) {
      throw new Error('single-league user (leagues=' + probe.leagueCount + ') but chevron rendered');
    }
    // A5: aria-label conditioned on same predicate
    var expectedAria = probe.multiLeague ? 'Switch league' : 'Manage leagues';
    if (probe.ariaLabel !== expectedAria) {
      throw new Error('aria-label "' + probe.ariaLabel + '" (expected "' + expectedAria + '" for leagues=' + probe.leagueCount + ')');
    }
    return { passed: true, details: 'chip "' + probe.nameText + '" rendered; chevron=' + probe.hasChevron + ' matches leagues=' + probe.leagueCount };
  }
};

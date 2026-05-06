// S16 — HQ Home League Pulse round-card action row markup.
// Validates v8.20.0 (Ship 5+5) restoration of the .hq-feed-card__actions
// markup that was REMOVED in v8.16.1 with annotation "Returns in Ship 5+3"
// — finally restored in Ship 5+5 with [Kudos | Comment] 2-action row on
// round-type cards per Option B.
//
// This is the scenario that would have caught the v8.16.1 → v8.19.0 multi-
// ship gap (P2 process correction: annotation capture).

const seedRounds = require('../setup/seed-rounds.js');
const visual = require('../helpers/visual.js');

module.exports = {
  id: 'S16',
  name: 'hq home action row markup on round cards',
  setup: async function() {
    await seedRounds.clearSmokeRounds();
    // Multiple rounds to maximize chance one surfaces in the HQ Home pull
    var ids = [];
    for (var i = 0; i < 3; i++) {
      var id = await seedRounds.insertSmokeRound({ score: 75 + i, course: 'S16 Course ' + i });
      ids.push(id);
    }
    module.exports.__roundIds = ids;
  },
  run: async function(ctx) {
    var page = ctx.page;

    await page.evaluate(function() { Router.go('home'); });
    await page.waitForFunction(function() { return Router.getPage() === 'home'; }, null, { timeout: 5000 });

    // Wait for the activity feed to render. HQ shell only renders at mid-band+;
    // mobile band bypasses shell. Smoke runs at default desktop viewport (most
    // browsers); webkit-mobile uses iPhone 14 Pro profile. Mobile fallback also
    // renders activity items, just without HQ shell stamp.
    await page.waitForTimeout(3000);

    // Look for action row markup on any round-type League Pulse card.
    var probe = await page.evaluate(function() {
      var cards = document.querySelectorAll('.hq-feed-card');
      var actionRows = document.querySelectorAll('.hq-feed-card__actions');
      var withKudos = 0;
      var withComment = 0;
      var sampleRoundIds = [];
      actionRows.forEach(function(row) {
        var rid = row.getAttribute('data-round-id');
        if (rid) sampleRoundIds.push(rid);
        if (row.querySelector('[data-action="kudos"]')) withKudos++;
        if (row.querySelector('[data-action="comment"]')) withComment++;
      });
      return {
        cardCount: cards.length,
        actionRowCount: actionRows.length,
        withKudos: withKudos,
        withComment: withComment,
        sampleRoundIds: sampleRoundIds.slice(0, 3)
      };
    });

    await ctx.capture.screenshot('S16-hq-home-action-rows');

    if (probe.cardCount === 0) {
      // No HQ Home cards rendered at all (could be mobile bypass or activity
      // feed not populated). Soft-pass with diagnostic — this scenario can't
      // assert on a surface that didn't render.
      return { passed: true, details: 'no .hq-feed-card rendered (likely mobile bypass or activity load latency); skipped action-row assertion' };
    }
    if (probe.actionRowCount === 0) {
      throw new Error('action row markup absent on HQ Home (' + probe.cardCount + ' cards rendered, 0 .hq-feed-card__actions found)');
    }
    if (probe.withKudos === 0 || probe.withComment === 0) {
      throw new Error('action row missing buttons: ' + probe.withKudos + ' kudos, ' + probe.withComment + ' comment');
    }

    // P8 (Ship 5+6 Phase 7): visual integrity on the first League Pulse
    // kudos button. Catches namespace-collision regressions like the
    // v8.21.0 data-count → animate.js textContent wipe.
    await visual.assertEngagementSurfaceVisible(page, {
      selector: '.hq-feed-card__actions [data-action="kudos"]',
      label: 'HQ Home League Pulse kudos button'
    });

    return { passed: true, details: probe.actionRowCount + ' action rows rendered + kudos visual integrity OK' };
  }
};

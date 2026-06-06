// S13 — /feed round card action row integrity (DOM assertion).
// Validates v8.20.0 (Ship 5+5) restoration: the round card action row has
// exactly 4 buttons (Scorecard | Kudos | Comment | Share), each with a
// non-empty onclick handler that is NOT a typeof-guarded no-op.
//
// This is the scenario that would have caught the v8.19.0 scoping miss
// (Comment was a /chat-redirect stub, Share called undefined function,
// Kudos was absent). Pure DOM assertion — no Firestore writes.
//
// P3 surface-coverage scenario per Ship 5+5 process correction.
// P8 retrofit (Ship 5+6 Phase 7): visual-layer assertion on kudos button —
// catches namespace-collision regressions like the data-count / animate.js
// textContent wipe that wiped the heart SVG between Phase 5 and Phase 7.

const seedRounds = require('../setup/seed-rounds.js');
const projectGuard = require('../helpers/project-guard.js');
const visual = require('../helpers/visual.js');

module.exports = {
  id: 'S13',
  name: 'feed action row integrity (4 buttons wired)',
  run: async function(ctx) {
    var page = ctx.page;

    // Admin SDK seeds a round so a /feed card renders. Skip (soft-pass) when the
    // admin SA project doesn't match the web-app project — otherwise no seeded
    // card appears and we'd report a spurious failure.
    var skip = await projectGuard.roundsSeedGuard(page);
    if (skip) return skip;

    await seedRounds.clearSmokeRounds();
    await seedRounds.insertSmokeRound({});
    // Settle so onSnapshot receives the seed (parity with old post-setup() wait).
    await page.waitForTimeout(2000);

    await page.evaluate(function() { Router.go('feed'); });
    await page.waitForFunction(function() { return Router.getPage() === 'feed'; }, null, { timeout: 5000 });

    // Wait for at least one round card action row to render WITHIN the
    // /feed page container. The same `[data-feed-action-row="1"]` selector
    // is used by HQ Home League Pulse cards (S1.2 cross-surface contract);
    // when both DOMs contain matching rows (e.g. after PB.getRounds caches
    // a seed round, home re-renders a 2-button League Pulse row, and its
    // stale DOM persists across the navigation to /feed), an unscoped
    // selector can return the home League Pulse row first and assert on
    // the wrong pattern (2 buttons vs feed's 4). Scope to [data-page="feed"]
    // so this test only sees the live /feed action row.
    await page.waitForFunction(function() {
      return document.querySelector('[data-page="feed"] [data-feed-action-row="1"]') !== null;
    }, null, { timeout: 15000 });

    var actionRow = await page.evaluate(function() {
      var row = document.querySelector('[data-page="feed"] [data-feed-action-row="1"]');
      if (!row) return null;
      var buttons = row.querySelectorAll('[data-action]');
      var out = { count: buttons.length, actions: [], roundId: row.getAttribute('data-round-id') };
      buttons.forEach(function(b) {
        out.actions.push({
          name: b.getAttribute('data-action'),
          onclick: b.getAttribute('onclick') || ''
        });
      });
      return out;
    });

    if (!actionRow) throw new Error('no action row found on /feed');
    if (actionRow.count !== 4) {
      throw new Error('expected 4 action buttons, found ' + actionRow.count + ' (' + actionRow.actions.map(function(a){return a.name;}).join(',') + ')');
    }

    var expected = ['scorecard', 'kudos', 'comment', 'share'];
    for (var i = 0; i < expected.length; i++) {
      var found = actionRow.actions.find(function(a) { return a.name === expected[i]; });
      if (!found) throw new Error('missing action: ' + expected[i]);
      if (!found.onclick) throw new Error(expected[i] + ' has no onclick handler');
      // Reject typeof-guarded no-op pattern (the v8.19.0 Share bug shape).
      if (found.onclick.indexOf("typeof") !== -1 && found.onclick.indexOf("=== 'function'") !== -1) {
        throw new Error(expected[i] + ' onclick is a typeof-guarded no-op: ' + found.onclick);
      }
    }

    // P8 visual-layer assertion — kudos button's heart SVG renders with
    // dimensions, color, intact child nodes, and valid data attributes.
    // Scoped to [data-page="feed"] for the same reason as the row selector
    // above (HQ Home League Pulse stale DOM may match the unscoped form).
    await visual.assertEngagementSurfaceVisible(page, {
      selector: '[data-page="feed"] [data-feed-action-row="1"] [data-action="kudos"]',
      label: '/feed kudos button'
    });

    await ctx.capture.screenshot('S13-feed-action-row');
    return { passed: true, details: '4 buttons wired + kudos visual integrity OK on round ' + actionRow.roundId };
  }
};

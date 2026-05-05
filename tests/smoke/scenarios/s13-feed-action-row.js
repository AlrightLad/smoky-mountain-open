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

const seedRounds = require('../setup/seed-rounds.js');

module.exports = {
  id: 'S13',
  name: 'feed action row integrity (4 buttons wired)',
  setup: async function() {
    await seedRounds.clearSmokeRounds();
    var id = await seedRounds.insertSmokeRound({});
    module.exports.__roundId = id;
  },
  run: async function(ctx) {
    var page = ctx.page;

    await page.evaluate(function() { Router.go('feed'); });
    await page.waitForFunction(function() { return Router.getPage() === 'feed'; }, null, { timeout: 5000 });

    // Wait for at least one round card action row to render
    await page.waitForFunction(function() {
      return document.querySelector('[data-feed-action-row="1"]') !== null;
    }, null, { timeout: 15000 });

    var actionRow = await page.evaluate(function() {
      var row = document.querySelector('[data-feed-action-row="1"]');
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

    await ctx.capture.screenshot('S13-feed-action-row');
    return { passed: true, details: '4 buttons (scorecard/kudos/comment/share) all wired on round ' + actionRow.roundId };
  }
};

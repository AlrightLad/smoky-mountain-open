// S14 — /feed kudos persistence (Firestore round-trip).
// Validates v8.20.0 (Ship 5+5) end-to-end: smoke account (member, NOT round
// author) clicks Kudos on a seeded round → likes array updated in /rounds doc.
// Exercises the new firestore.rules /rounds 4th OR-clause permitting league
// members to write hasOnly(['likes','comments','commentLikes']).

const seedRounds = require('../setup/seed-rounds.js');
const visual = require('../helpers/visual.js');

module.exports = {
  id: 'S14',
  name: 'feed kudos persistence',
  setup: async function() {
    await seedRounds.clearSmokeRounds();
    var id = await seedRounds.insertSmokeRound({});
    module.exports.__roundId = id;
  },
  run: async function(ctx) {
    var page = ctx.page;
    var roundId = module.exports.__roundId;
    if (!roundId) throw new Error('seed did not record __roundId');

    await page.evaluate(function() { Router.go('feed'); });
    await page.waitForFunction(function() { return Router.getPage() === 'feed'; }, null, { timeout: 5000 });

    // Wait for db (Firestore client) + currentUser to be ready. The writer
    // performs its own .get() so doesn't depend on the snapshot listener
    // having populated window._feedItems — this avoids webkit's slower
    // Firestore replication latency.
    await page.waitForFunction(function() {
      return typeof db !== 'undefined' && db && typeof currentUser !== 'undefined' && currentUser;
    }, null, { timeout: 15000 });

    // P8 (Ship 5+6 Phase 7): if the kudos button is in DOM, assert visual
    // integrity before firing the writer. The /feed kudos card depends on
    // a snapshot listener that may not have populated by this point —
    // skip if absent (the data-layer write below still validates the
    // primary contract). When present, assertion catches namespace-
    // collision regressions like the v8.21.0 data-count / animate.js wipe.
    var kudosPresent = await page.evaluate(function(rid) {
      return !!document.querySelector('[data-feed-action-row="1"][data-round-id="' + rid + '"] [data-action="kudos"]');
    }, roundId);
    if (kudosPresent) {
      await visual.assertEngagementSurfaceVisible(page, {
        selector: '[data-feed-action-row="1"][data-round-id="' + roundId + '"] [data-action="kudos"]',
        label: '/feed kudos button (pre-write)'
      });
    }

    // Click Kudos via the public writer (avoids DOM coordinate flakiness +
    // local cache dependency).
    await page.evaluate(function(rid) { feedToggleLike(rid); }, roundId);

    // Allow Firestore round-trip (webkit needs more headroom)
    await page.waitForTimeout(4000);

    var doc = await seedRounds.getSmokeRound(roundId);
    if (!doc) throw new Error('seeded round disappeared');
    var likes = doc.likes || [];
    var smokeUid = require('../setup/seed-notifications.js').SMOKE_UID;
    if (likes.indexOf(smokeUid) === -1) {
      throw new Error('smoke uid missing from likes array after toggle (likes=' + JSON.stringify(likes) + ')');
    }

    await ctx.capture.screenshot('S14-after-kudos');
    return { passed: true, details: 'likes array contains smoke uid; ' + likes.length + ' total' };
  }
};

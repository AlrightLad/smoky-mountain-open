// S14 — /feed kudos persistence (Firestore round-trip).
// Validates v8.20.0 (Ship 5+5) end-to-end: smoke account (member, NOT round
// author) clicks Kudos on a seeded round → likes array updated in /rounds doc.
// Exercises the new firestore.rules /rounds 4th OR-clause permitting league
// members to write hasOnly(['likes','comments','commentLikes']).

const seedRounds = require('../setup/seed-rounds.js');

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

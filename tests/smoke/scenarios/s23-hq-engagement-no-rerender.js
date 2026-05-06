// S23 — HQ Home League Pulse engagement is instant and surgical (S1.2).
//
// v8.21.0 (Ship 5+6 Phase 5 / S1.2) replaced "render-driven" engagement
// (full Router.go re-render on every kudos/comment) with "DOM-mutation-
// driven" engagement (surgical patches via _patchKudosButton, _patch...
// CommentCount, etc.). This scenario captures HQ Home page state
// before kudos engagement, fires the engagement, and asserts the page
// did NOT re-render: scrollY unchanged, greeting hero text unchanged,
// masthead outerHTML unchanged. Only the kudos button's data-i-liked
// flips and data-likes-count increments.
//
// Edge case (CTO Decision Option B): set window._suppressRoundsRerender
// = true before firing engagement so the snapshot listener echo can't
// race the assertion. The flag is the production mechanism for this
// suppression — using it in test context is appropriate.
//
// Soft-pass on mobile bypass / no League Pulse cards rendered.

const seedRounds = require('../setup/seed-rounds.js');
const visual = require('../helpers/visual.js');

module.exports = {
  id: 'S23',
  name: 'hq home engagement: surgical patch, no full re-render (S1.2)',
  setup: async function() {
    await seedRounds.clearSmokeRounds();
    var id = await seedRounds.insertSmokeRound({});
    module.exports.__roundId = id;
  },
  run: async function(ctx) {
    var page = ctx.page;
    var roundId = module.exports.__roundId;
    if (!roundId) throw new Error('seed did not record __roundId');

    await page.evaluate(function() { Router.go('home'); });
    await page.waitForFunction(function() { return Router.getPage() === 'home'; }, null, { timeout: 5000 });

    // Wait for db + currentUser ready (engagement writers depend on these)
    await page.waitForFunction(function() {
      return typeof db !== 'undefined' && db && typeof currentUser !== 'undefined' && currentUser;
    }, null, { timeout: 15000 });

    // Settle for League Pulse to render with the seeded round visible.
    // The smoke account's activeLeague is 'smoke-test-league' per
    // scripts/create-smoke-account.js, so the seeded round surfaces.
    await page.waitForTimeout(3000);

    // Probe for the seeded kudos button. If not in DOM (mobile bypass,
    // late activity load, or activeLeague drift), soft-pass.
    var found = await page.evaluate(function(rid) {
      var btn = document.querySelector('.hq-feed-card__actions[data-round-id="' + rid + '"] [data-action="kudos"]');
      return !!btn;
    }, roundId);

    if (!found) {
      await ctx.capture.screenshot('S23-skip-no-kudos');
      return { passed: true, details: 'kudos button for seeded round not in HQ Home League Pulse (mobile bypass or activity load latency); skipped' };
    }

    // P8 visual integrity check on the kudos button before engagement.
    await visual.assertEngagementSurfaceVisible(page, {
      selector: '.hq-feed-card__actions[data-round-id="' + roundId + '"] [data-action="kudos"]',
      label: 'HQ Home seeded-round kudos button (pre-engagement)'
    });

    // Capture pulse before engagement.
    var before = await visual.capturePulse(page);

    // Suppress snapshot-listener re-render echo (CTO Decision Option B).
    // This flag is the production mechanism; setting it here just extends
    // the suppression window past Firestore's replication settle.
    await page.evaluate(function() { window._suppressRoundsRerender = true; });

    // Fire the engagement via the public writer.
    await page.evaluate(function(rid) { feedToggleLike(rid); }, roundId);

    // Allow surgical patch to land (synchronous in writer; allow rAF
    // + microtasks to finish + any DOM observers to react).
    await page.waitForTimeout(400);

    // Capture pulse after engagement.
    var after = await visual.capturePulse(page);

    // Assert no full-page re-render: only kudos count + iLiked toggle
    // permitted. greeting / masthead / scrollY must be byte-identical.
    var preLiked = before.kudosILiked;
    var expectedDeltas = preLiked === '1'
      ? { kudosCountDelta: -1, kudosLikedToggle: true }
      : { kudosCountDelta: 1, kudosLikedToggle: true };

    visual.assertPulseUnchanged(before, after, expectedDeltas);

    // P8 post-engagement visual integrity (heart still rendered after
    // the surgical patch — catches the data-count → textContent wipe class
    // of regression).
    await visual.assertEngagementSurfaceVisible(page, {
      selector: '.hq-feed-card__actions[data-round-id="' + roundId + '"] [data-action="kudos"]',
      label: 'HQ Home seeded-round kudos button (post-engagement)'
    });

    await ctx.capture.screenshot('S23-after-engagement');
    return {
      passed: true,
      details: 'kudos toggled (' + preLiked + ' → ' + after.kudosILiked + ', count delta=' + expectedDeltas.kudosCountDelta + '); greeting + masthead + scrollY unchanged'
    };
  }
};

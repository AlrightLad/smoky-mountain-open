// S15 — /feed comment persistence (Firestore round-trip).
// Validates v8.20.0 (Ship 5+5) comment writer end-to-end. Smoke account
// (member, NOT round author) posts a comment via feedSubmitComment →
// /rounds doc comments[] array updated.

const seedRounds = require('../setup/seed-rounds.js');
const visual = require('../helpers/visual.js');

module.exports = {
  id: 'S15',
  name: 'feed comment persistence',
  setup: async function() {
    await seedRounds.clearSmokeRounds();
    var id = await seedRounds.insertSmokeRound({});
    module.exports.__roundId = id;
  },
  run: async function(ctx) {
    var page = ctx.page;
    var roundId = module.exports.__roundId;
    if (!roundId) throw new Error('seed did not record __roundId');
    var testText = 'S15-test-comment-' + Date.now();

    await page.evaluate(function() { Router.go('feed'); });
    await page.waitForFunction(function() { return Router.getPage() === 'feed'; }, null, { timeout: 5000 });

    // Wait for db + currentUser only — avoid the snapshot-listener dependency
    // (webkit Firestore replication is too slow for _feedItems waits).
    await page.waitForFunction(function() {
      return typeof db !== 'undefined' && db && typeof currentUser !== 'undefined' && currentUser;
    }, null, { timeout: 15000 });

    // feedSubmitComment reads input.value from DOM. If the round card hasn't
    // rendered yet (snapshot listener slow on webkit), the input element
    // doesn't exist and the writer returns early. Inject a synthetic input
    // with the expected ID so the writer can read it. The writer's own
    // .get() will fetch the round from Firestore directly.
    await page.evaluate(function(args) {
      var input = document.getElementById('feedCommentText-' + args.rid);
      if (!input) {
        input = document.createElement('input');
        input.type = 'text';
        input.id = 'feedCommentText-' + args.rid;
        input.style.display = 'none';
        document.body.appendChild(input);
      }
      input.value = args.text;
      feedSubmitComment(args.rid);
    }, { rid: roundId, text: testText });

    await page.waitForTimeout(4000);

    var doc = await seedRounds.getSmokeRound(roundId);
    if (!doc) throw new Error('seeded round disappeared');
    var comments = doc.comments || [];
    var smokeUid = require('../setup/seed-notifications.js').SMOKE_UID;
    var match = comments.find(function(c) { return c.uid === smokeUid && c.text === testText; });
    if (!match) {
      throw new Error('comment with smoke uid + test text not found (comments=' + JSON.stringify(comments).slice(0, 200) + ')');
    }

    // P8 (Ship 5+6 Phase 7): if comment-like hearts surfaced after the
    // surgical patch, assert visual integrity. data-likes-count attribute
    // also lives on per-comment hearts and is at the same risk of being
    // wiped by an animate.js textContent overwrite.
    var heartPresent = await page.evaluate(function(rid) {
      return !!document.querySelector('[data-comment-row="1"][data-round-id="' + rid + '"] [data-action="comment-like"]');
    }, roundId);
    if (heartPresent) {
      await visual.assertEngagementSurfaceVisible(page, {
        selector: '[data-comment-row="1"][data-round-id="' + roundId + '"] [data-action="comment-like"]',
        label: '/feed comment-like heart',
        // Comment hearts are a span with a ♥ glyph — no SVG, no inner
        // span. The glyph IS the asset at risk if textContent gets
        // overwritten, so assert it via requireTextMatch.
        minSize: 8,
        requireSvg: false,
        requireSpan: false,
        requireTextMatch: /♥/
      });
    }

    await ctx.capture.screenshot('S15-after-comment');
    return { passed: true, details: 'comment persisted; ' + comments.length + ' total; heart visible=' + heartPresent };
  }
};

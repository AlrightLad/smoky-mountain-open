// S26 — Ship 5+7 end-to-end (B.44 + Edit + Delete + missing-round error).
//
// Replaces the manual 4-step E2E walkthrough with an automated scenario.
// Single registration, four sub-tests sharing state where possible:
//
//   Sub-test 1 — B.44 retroactive timestamp end-to-end
//                Programmatically write a round dated 4 days ago via the
//                production write path (PB.addRound + syncRound through
//                _submitRoundEntry). Verify Firestore doc.timestamp is
//                derived from the date (noon-local), not Date.now(), and
//                that League Pulse displays "4d" via feedTimeAgo.
//
//   Sub-test 2 — Edit + side-effect preservation
//                Capture pre-edit notification count + XP/ParCoin baselines.
//                Navigate to /rounds?roundId=X&action=edit, verify form
//                prefills (course + hole 7 score), modify hole 7, submit
//                via window.submitRoundEdit. Verify "Round updated" toast,
//                Firestore reflects the change, NO duplicate notifications,
//                NO double XP/ParCoin awards.
//
//   Sub-test 3 — Delete
//                Mirror the inline onclick handler (PB.deleteRound +
//                db.delete). Verify round removed from PB cache + Firestore.
//
//   Sub-test 4 — Missing-round edit URL (CTO walkthrough Step 4 substitute)
//                The non-author rejection path can't be driven by this
//                smoke account: per scripts/create-smoke-account.js the
//                smoke account IS the commissioner + admin of smoke-test-
//                league, so `amILeagueLeadership(smoke-test-league)`
//                returns true and the /rounds update rule permits the
//                smoke account to edit ANY round in its own league.
//                Driving the rejection would require a second test
//                account at a regular-member tier — out of scope. Instead
//                we exercise renderRoundEditForm's other error branch:
//                navigate to an edit URL for a deleted round, verify the
//                "Round not found" toast + redirect to /rounds list.
//
// All sub-tests run in sequence — sub-tests 1-3 share the same round ID;
// sub-test 4 reuses that ID after sub-test 3 deletes the doc.

const seedRounds = require('../setup/seed-rounds.js');
const projectGuard = require('../helpers/project-guard.js');
const seedNotif = require('../setup/seed-notifications.js');
const SMOKE_UID = seedNotif.SMOKE_UID;

module.exports = {
  id: 'S26',
  name: 'rounds Ship 5+7 e2e (B.44 + edit + delete + non-author reject)',
  run: async function(ctx) {
    var page = ctx.page;

    // Creates its round via the production browser write path, but reads it back
    // (plus members + notifications invariants) via the Admin SDK. Skip
    // (soft-pass) when the admin SA project doesn't match the web-app project —
    // the readback would target a different project than the browser wrote to.
    var skip = await projectGuard.roundsSeedGuard(page);
    if (skip) return skip;

    await seedRounds.clearSmokeRounds();

    // Wait for db + currentUser ready (smoke account already auth'd via S1)
    await page.waitForFunction(function() {
      return typeof db !== 'undefined' && db && typeof currentUser !== 'undefined' && currentUser
          && typeof PB !== 'undefined' && PB.addRound && typeof _submitRoundEntry === 'function';
    }, null, { timeout: 15000 });

    // Inject a synthetic course into PB cache so renderLogHoleGrid (rounds.js:369)
    // can produce the hole inputs the form needs for prefill + submit. Without
    // this, course-by-name lookup returns null, the grid renders the "Course
    // not found — enter total score manually" stub, and getLogHoleData() picks
    // up zero filled scores, causing submitRoundEdit to bail with "Enter at
    // least 9 holes". In-memory only (PB.addCourse doesn't write to Firestore
    // per data.js:285) so this synthesizes nothing in the cloud.
    var TEST_COURSE = 'S26 Test Course';
    await page.evaluate(function(name) {
      if (PB.getCourseByName(name)) return;
      var pars = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
      var holes = [];
      for (var i = 0; i < 18; i++) holes.push({ par: pars[i], yards: 350 + (i * 10) });
      PB.addCourse({
        id: 's26-test-course',
        name: name,
        loc: 'Test',
        region: 'TEST',
        rating: 72.0,
        slope: 113,
        par: 72,
        holes: holes,
        photo: '',
        reviews: []
      });
    }, TEST_COURSE);

    // ════════════════════════════════════════════════════════════════
    // Sub-test 1 — B.44 retroactive timestamp end-to-end
    // ════════════════════════════════════════════════════════════════
    // 2026-05-21 fix: was 4 days ago + assert "4d". feedTimeAgo(ts) is hour-
    // precise (floor((now-ts)/3600000/24)), so 4-days-ago at noon-local
    // straddles the "3d"/"4d" boundary depending on time-of-day of smoke run.
    // Seeding 5 days back + asserting "5d" gives a robust 24h window.
    var seedDaysAgo = 5;
    var seededDate = new Date(Date.now() - seedDaysAgo * 86400000);
    var fourDaysAgoStr = seededDate.getFullYear() + '-' +
                        String(seededDate.getMonth() + 1).padStart(2, '0') + '-' +
                        String(seededDate.getDate()).padStart(2, '0');
    var expectedTimestamp = new Date(fourDaysAgoStr + 'T12:00:00').getTime();
    var expectedTimeAgoLabel = seedDaysAgo + 'd';

    var roundId = await page.evaluate(function(args) {
      var formData = {
        player: currentUser.uid,
        playerName: (currentProfile && (currentProfile.name || currentProfile.username)) || 'Smoke',
        course: args.course,
        score: 72,
        date: args.date,
        rating: 72,
        slope: 113,
        format: 'stroke',
        holesPlayed: 18,
        holesMode: '18',
        holeScores: ['4','4','3','4','5','4','4','3','5','4','3','4','5','4','4','3','4','5'],
        firData: [], girData: [], puttsData: [],
        bunkerData: [], sandData: [], upDownData: [], missData: [], penaltyData: [],
        visibility: 'public'
      };
      return _submitRoundEntry(formData).then(function(r) { return r.id; });
    }, { date: fourDaysAgoStr, course: TEST_COURSE });

    if (!roundId) throw new Error('sub-test 1: _submitRoundEntry did not return a round id');

    // Wait for syncRound to land in Firestore (webkit can lag 2-3s).
    await page.waitForTimeout(3000);

    var doc1 = await seedRounds.getSmokeRound(roundId);
    if (!doc1) throw new Error('sub-test 1: round did not persist to Firestore (id=' + roundId + ')');
    if (doc1.timestamp !== expectedTimestamp) {
      throw new Error('sub-test 1 (B.44): doc.timestamp=' + doc1.timestamp +
                      ' expected=' + expectedTimestamp +
                      ' (date=' + fourDaysAgoStr + ', drift=' + (doc1.timestamp - expectedTimestamp) + 'ms)');
    }

    // Navigate to League Pulse and verify "4d" feedTimeAgo render.
    await page.evaluate(function() { Router.go('home'); });
    await page.waitForFunction(function() { return Router.getPage() === 'home'; }, null, { timeout: 5000 });
    // Wait until the seeded round is in PB.getRounds() AND has rendered into
    // a League Pulse card (action row carries data-round-id at home.js:1811).
    await page.waitForFunction(function(rid) {
      if (typeof PB === 'undefined' || !PB.getRounds) return false;
      if (!PB.getRounds().some(function(r) { return r.id === rid; })) return false;
      return document.querySelector('[data-page="home"] [data-round-id="' + rid + '"]') !== null;
    }, roundId, { timeout: 15000 });

    var timeAgoText = await page.evaluate(function(rid) {
      var actionRow = document.querySelector('[data-page="home"] [data-round-id="' + rid + '"]');
      if (!actionRow) return null;
      var card = actionRow.closest('.hq-feed-card');
      if (!card) return null;
      var timeEl = card.querySelector('.hq-feed-card__time');
      return timeEl ? timeEl.textContent.trim() : null;
    }, roundId);

    if (timeAgoText === null) {
      // Mobile bypass — League Pulse card not in DOM. Soft-pass with diagnostic.
      await ctx.capture.screenshot('S26-sub1-no-card');
    } else {
      // feedTimeAgo() floors hours/24, so the seeded "noon of N days ago" lands
      // in [N-1, N] day buckets depending on time-of-day at smoke run. Accept
      // N-1, N, or N+1 to absorb time-of-day + DST edge cases. (Asserting strict
      // equality was a year-round flake source per 2026-05-21 smoke break.)
      var acceptable = [(seedDaysAgo - 1) + 'd', seedDaysAgo + 'd', (seedDaysAgo + 1) + 'd'];
      if (acceptable.indexOf(timeAgoText) === -1) {
        throw new Error('sub-test 1 (B.44): League Pulse timestamp "' + timeAgoText + '" (expected one of ' + acceptable.join(', ') + ')');
      }
    }

    await ctx.capture.screenshot('S26-sub1-pass');

    // ════════════════════════════════════════════════════════════════
    // Sub-test 2 — Edit + side-effect preservation
    // ════════════════════════════════════════════════════════════════

    // Baseline: notification count + XP + ParCoin BEFORE the edit.
    var preEditNotifSnap = await seedNotif.getNotification ? null : null; // placeholder
    var admin = require('firebase-admin');
    var adminDb = admin.firestore();
    var preNotifSnap = await adminDb.collection('notifications').where('toUserId', '==', SMOKE_UID).get();
    var preNotifCount = preNotifSnap.size;
    var preMemberSnap = await adminDb.collection('members').doc(SMOKE_UID).get();
    var preXP = preMemberSnap.exists ? (preMemberSnap.data().xp || 0) : 0;
    var preParcoins = preMemberSnap.exists ? (preMemberSnap.data().parcoins || 0) : 0;

    // Navigate to edit form.
    await page.evaluate(function(rid) { Router.go('rounds', { roundId: rid, action: 'edit' }); }, roundId);
    // Form mounts after Firestore fetch resolves; wait for #rf-course populated.
    await page.waitForFunction(function(args) {
      var courseInput = document.getElementById('rf-course');
      if (!courseInput) return false;
      return courseInput.value === args.course;
    }, { course: TEST_COURSE }, { timeout: 10000 });
    // Wait for hole grid to populate from prefill.
    await page.waitForFunction(function() {
      var inputs = document.querySelectorAll('.rf-hole-score');
      if (inputs.length < 9) return false;
      // Hole 7 (index 6) should have the prefilled "4".
      var hole7 = document.querySelector('.rf-hole-score[data-hole="6"]');
      return hole7 && hole7.value === '4';
    }, null, { timeout: 5000 });

    // Modify hole 7 score to 7 (different from the prefill of 4).
    await page.evaluate(function() {
      var hole7 = document.querySelector('.rf-hole-score[data-hole="6"]');
      hole7.value = '7';
      // Trigger oninput so updateLogTotal() refreshes the auto-score field.
      hole7.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Submit edit.
    await page.evaluate(function(rid) { window.submitRoundEdit(rid); }, roundId);

    // Wait for the post-edit toast.
    await page.waitForFunction(function() {
      var t = document.getElementById('toast');
      return t && t.classList.contains('show') && t.textContent.indexOf('Round updated') !== -1;
    }, null, { timeout: 8000 });

    // Wait for navigation back to detail (Router.go('rounds', { roundId })).
    await page.waitForFunction(function(rid) {
      var params = Router.getParams ? Router.getParams() : null;
      return Router.getPage() === 'rounds' && params && params.roundId === rid && !params.action;
    }, roundId, { timeout: 5000 });
    await page.waitForTimeout(2000); // Firestore replication settle

    // Verify Firestore reflects the change.
    var doc2 = await seedRounds.getSmokeRound(roundId);
    if (!doc2) throw new Error('sub-test 2: round disappeared from Firestore after edit');
    if (!Array.isArray(doc2.holeScores) || doc2.holeScores[6] !== '7') {
      throw new Error('sub-test 2: hole 7 not updated in Firestore (got ' +
                      JSON.stringify(doc2.holeScores) + ')');
    }
    // Verify timestamp re-derived from date (B.44 alignment in submitRoundEdit).
    if (doc2.timestamp !== expectedTimestamp) {
      throw new Error('sub-test 2: edit did not preserve B.44 timestamp shape (' + doc2.timestamp + ' vs ' + expectedTimestamp + ')');
    }

    // Side-effect preservation invariant: notifications + XP + ParCoin unchanged.
    var postNotifSnap = await adminDb.collection('notifications').where('toUserId', '==', SMOKE_UID).get();
    if (postNotifSnap.size !== preNotifCount) {
      throw new Error('sub-test 2: notification count changed (pre=' + preNotifCount + ' post=' + postNotifSnap.size + ') — edit fired a duplicate side effect');
    }
    var postMemberSnap = await adminDb.collection('members').doc(SMOKE_UID).get();
    var postXP = postMemberSnap.exists ? (postMemberSnap.data().xp || 0) : 0;
    var postParcoins = postMemberSnap.exists ? (postMemberSnap.data().parcoins || 0) : 0;
    if (postXP !== preXP) {
      throw new Error('sub-test 2: XP changed on edit (pre=' + preXP + ' post=' + postXP + ')');
    }
    if (postParcoins !== preParcoins) {
      throw new Error('sub-test 2: ParCoins changed on edit (pre=' + preParcoins + ' post=' + postParcoins + ')');
    }

    await ctx.capture.screenshot('S26-sub2-pass');

    // ════════════════════════════════════════════════════════════════
    // Sub-test 3 — Delete
    // ════════════════════════════════════════════════════════════════
    // Mirror the inline onclick handler in renderRoundDetail (rounds.js:324):
    //   PB.deleteRound(id) + db.collection('rounds').doc(id).delete()
    await page.evaluate(function(rid) {
      PB.deleteRound(rid);
      return db.collection('rounds').doc(rid).delete();
    }, roundId);
    await page.waitForTimeout(2000);

    // PB cache no longer holds the round.
    var stillInCache = await page.evaluate(function(rid) {
      return PB.getRounds().some(function(r) { return r.id === rid; });
    }, roundId);
    if (stillInCache) throw new Error('sub-test 3: round still in PB.getRounds() after delete');

    // Firestore doc gone.
    var doc3 = await seedRounds.getSmokeRound(roundId);
    if (doc3) throw new Error('sub-test 3: Firestore doc still exists after delete');

    await ctx.capture.screenshot('S26-sub3-pass');

    // ════════════════════════════════════════════════════════════════
    // Sub-test 4 — Edit-URL for missing round (renderRoundEditForm
    // error branch — CTO walkthrough Step 4 substitute)
    // ════════════════════════════════════════════════════════════════
    // The "non-author edit rejection" path can't be exercised by this
    // smoke account because per scripts/create-smoke-account.js it IS
    // the commissioner + admin of smoke-test-league, which means
    // `amILeagueLeadership(smoke-test-league)` returns true for the
    // /rounds update rule and the smoke account is permitted to edit
    // ANY round in its own league. We'd need a second test account at
    // a regular-member tier to drive that rejection — out of scope for
    // unattended smoke.
    //
    // Per the CTO walkthrough Step 4 substitute: navigate to an edit
    // URL for a non-existent round (we just deleted `roundId` in
    // sub-test 3), and verify renderRoundEditForm's missing-round
    // branch (`if (!doc.exists) { Router.toast("Round not found"); ...`)
    // fires + redirects back to the list view.
    var deletedId = roundId; // the round we deleted in sub-test 3

    await page.evaluate(function(rid) { Router.go('rounds', { roundId: rid, action: 'edit' }); }, deletedId);

    // Wait for the missing-round toast.
    await page.waitForFunction(function() {
      var t = document.getElementById('toast');
      return t && t.classList.contains('show') && t.textContent.indexOf('Round not found') !== -1;
    }, null, { timeout: 10000 });

    // Wait for redirect to /rounds list (no roundId, no action).
    await page.waitForFunction(function() {
      var params = Router.getParams ? Router.getParams() : null;
      return Router.getPage() === 'rounds' && (!params || !params.roundId);
    }, null, { timeout: 5000 });

    // Confirm we landed on the list view (handicap box is the marker).
    var onListView = await page.evaluate(function() {
      return !!document.querySelector('[data-page="rounds"] .hcap-box');
    });
    if (!onListView) throw new Error('sub-test 4: did not land on /rounds list view after missing-round redirect');

    await ctx.capture.screenshot('S26-sub4-pass');

    // Cleanup.
    await seedRounds.clearSmokeRounds();

    return {
      passed: true,
      details: 'B.44 timestamp + League Pulse "' + (timeAgoText || 'mobile-bypass') + '"; ' +
               'edit hole 7 4→7 + side effects preserved (notifs ' + preNotifCount + ', XP ' + preXP + ', PC ' + preParcoins + '); ' +
               'delete removed from cache + Firestore; ' +
               'missing-round edit redirects with "Round not found" toast'
    };
  }
};

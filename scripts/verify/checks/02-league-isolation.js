// Check 02: League Isolation
// Stale league cleanup + temp league isolation test

module.exports = { name: "League Isolation", run: run };

async function run(ctx) {
  var db = ctx.db, log = ctx.logger, config = ctx.config, flags = ctx.flags;
  var passed = 0, failed = 0, warnings = 0;
  var CHECK = "league-isolation";
  var admin = require("firebase-admin");

  // ── PRE-RUN: Stale league scan ──
  log.info(CHECK, "Scanning for stale test leagues...");
  var leagueSnap = await db.collection("leagues").get();
  var staleLeagues = [];
  leagueSnap.forEach(function(doc) {
    var d = doc.data();
    var id = doc.id;
    var isStale = false;
    if (/^verify-test-/.test(id) || /^isolation-test/.test(id) || /^test-/.test(id)) isStale = true;
    if (!isStale && d.name && /test/i.test(d.name) && d.memberUids && d.memberUids.length <= 1) isStale = true;
    if (isStale) staleLeagues.push({ id: id, data: d, ref: doc.ref });
  });

  if (staleLeagues.length === 0) {
    log.pass(CHECK, "No stale test leagues found");
    passed++;
  } else {
    for (var s = 0; s < staleLeagues.length; s++) {
      var stale = staleLeagues[s];
      var sd = stale.data;
      var created = sd.createdAt ? (sd.createdAt.toDate ? sd.createdAt.toDate().toISOString() : sd.createdAt) : "unknown";
      var memberCount = sd.memberUids ? sd.memberUids.length : 0;
      log.info(CHECK, "Stale test league: " + stale.id + ", created " + created + ", members " + memberCount);

      // Safety guards
      if (config.PROTECTED_LEAGUES.indexOf(stale.id) !== -1) {
        log.critical(CHECK, "PROTECTED league " + stale.id + " matched stale pattern — skipping");
        failed++;
        continue;
      }
      if (memberCount > 1) {
        log.warn(CHECK, "Stale league " + stale.id + " has " + memberCount + " members — skipping auto-delete");
        warnings++;
        continue;
      }

      // Build cleanup plan
      var cleanupPlan = {};
      for (var ci = 0; ci < config.LEAGUE_SCOPED.length; ci++) {
        var col = config.LEAGUE_SCOPED[ci];
        try {
          var colSnap = await db.collection(col).where("leagueId", "==", stale.id).get();
          if (colSnap.size > 0) cleanupPlan[col] = colSnap.size;
        } catch (e) { /* collection may not exist */ }
      }

      var planStr = Object.keys(cleanupPlan).map(function(k) { return cleanupPlan[k] + " " + k; }).join(", ") || "0 docs";
      log.info(CHECK, "Cleanup plan for " + stale.id + ": " + planStr + " + 1 league doc");

      if (flags.confirmCleanup) {
        log.info(CHECK, "Executing cleanup for " + stale.id + "...");
        // Delete scoped docs
        for (var dk = 0; dk < config.LEAGUE_SCOPED.length; dk++) {
          var dCol = config.LEAGUE_SCOPED[dk];
          try {
            var dSnap = await db.collection(dCol).where("leagueId", "==", stale.id).get();
            var batch = db.batch();
            dSnap.forEach(function(doc) { batch.delete(doc.ref); });
            if (dSnap.size > 0) await batch.commit();
          } catch (e) { /* ok */ }
        }
        // Clean member references
        var memSnap = await db.collection("members").get();
        memSnap.forEach(function(doc) {
          var d = doc.data();
          if (d.leagues && d.leagues.indexOf(stale.id) !== -1) {
            var newLeagues = d.leagues.filter(function(l) { return l !== stale.id; });
            var updates = { leagues: newLeagues };
            if (d.activeLeague === stale.id) updates.activeLeague = config.FOUNDING_LEAGUE_ID;
            doc.ref.update(updates);
          }
        });
        // Delete league doc
        await stale.ref.delete();
        log.info(CHECK, "Deleted stale league: " + stale.id);

        // Verify deletion
        var verify = await db.collection("leagues").doc(stale.id).get();
        if (verify.exists) {
          log.critical(CHECK, "Failed to delete stale league " + stale.id);
          failed++;
        } else {
          log.pass(CHECK, "Stale league " + stale.id + " deleted and verified");
          passed++;
        }
      } else {
        log.info(CHECK, "Dry run — pass --confirm-cleanup to execute deletion of " + stale.id);
      }
    }
  }

  // ── TEMP LEAGUE ISOLATION TEST ──
  var tempId = "verify-test-" + Date.now();
  log.info(CHECK, "Creating temp league: " + tempId);
  await db.collection("leagues").doc(tempId).set({
    name: "Verify Test " + tempId,
    slug: tempId,
    commissioner: "verify-script",
    admins: ["verify-script"],
    memberCount: 0,
    memberUids: [],
    badge: "",
    tier: "test",
    visibility: "private",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    settings: {}
  });

  // Verify zero docs in all league-scoped collections for temp league
  var contaminated = false;
  for (var ti = 0; ti < config.LEAGUE_SCOPED.length; ti++) {
    var tCol = config.LEAGUE_SCOPED[ti];
    try {
      var tSnap = await db.collection(tCol).where("leagueId", "==", tempId).get();
      if (tSnap.size > 0) {
        log.critical(CHECK, "Cross-contamination: " + tCol + " has " + tSnap.size + " docs with leagueId=" + tempId);
        failed++;
        contaminated = true;
      }
    } catch (e) { /* ok */ }
  }
  if (!contaminated) {
    log.pass(CHECK, "Temp league " + tempId + ": zero cross-contamination across all collections");
    passed++;
  }

  // Write isolation test: add a test round, verify it doesn't appear in founding league query
  var testRoundId = "verify-round-" + Date.now();
  await db.collection("rounds").doc(testRoundId).set({
    id: testRoundId,
    player: "verify-script",
    playerName: "Verify Bot",
    course: "Test Course",
    date: "2099-01-01",
    score: 72,
    holesPlayed: 18,
    leagueId: tempId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Query founding league rounds — test round must NOT appear
  var foundingSnap = await db.collection("rounds").where("leagueId", "==", config.FOUNDING_LEAGUE_ID).get();
  var leaked = false;
  foundingSnap.forEach(function(doc) {
    if (doc.id === testRoundId) leaked = true;
  });
  if (leaked) {
    log.critical(CHECK, "ISOLATION FAILURE: test round leaked into founding league query");
    failed++;
  } else {
    log.pass(CHECK, "Write isolation: test round correctly excluded from founding league query");
    passed++;
  }

  // Delete test round
  await db.collection("rounds").doc(testRoundId).delete();

  // ── POST-RUN: Cleanup temp league ──
  await db.collection("leagues").doc(tempId).delete();
  var verifyDel = await db.collection("leagues").doc(tempId).get();
  if (verifyDel.exists) {
    log.critical(CHECK, "Failed to clean up temp league " + tempId);
    failed++;
  } else {
    log.pass(CHECK, "Temp league " + tempId + " cleaned up");
    passed++;
  }

  return { name: "League Isolation", passed: passed, failed: failed, warnings: warnings, details: [] };
}

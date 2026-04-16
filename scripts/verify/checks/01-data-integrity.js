// Check 01: Data Integrity
// Verifies document counts, leagueId presence, member fields, founding league doc

module.exports = { name: "Data Integrity", run: run };

async function run(ctx) {
  var db = ctx.db, log = ctx.logger, config = ctx.config;
  var passed = 0, failed = 0, warnings = 0, details = [];
  var CHECK = "data-integrity";

  // 1. Document counts
  var collections = Object.keys(config.EXPECTED);
  for (var i = 0; i < collections.length; i++) {
    var col = collections[i];
    var snap = await db.collection(col).get();
    var actual = snap.size;
    var expected = config.EXPECTED[col];
    var delta = Math.abs(actual - expected);
    var pct = expected > 0 ? (delta / expected) : 0;
    if (actual === expected) {
      log.pass(CHECK, col + ": " + actual + " docs (expected " + expected + ")", { collection: col, expected: expected, actual: actual });
      passed++;
    } else if (pct > 0.2) {
      log.critical(CHECK, col + ": " + actual + " docs (expected " + expected + ", delta " + Math.round(pct * 100) + "%)", { collection: col, expected: expected, actual: actual });
      failed++;
    } else {
      log.warn(CHECK, col + ": " + actual + " docs (expected " + expected + ")", { collection: col, expected: expected, actual: actual });
      warnings++;
    }
  }

  // 2. LeagueId presence on league-scoped docs
  var leagueDocs = await db.collection("leagues").get();
  var validLeagueIds = [];
  leagueDocs.forEach(function(doc) { validLeagueIds.push(doc.id); });

  for (var j = 0; j < config.LEAGUE_SCOPED.length; j++) {
    var lCol = config.LEAGUE_SCOPED[j];
    var lSnap;
    try { lSnap = await db.collection(lCol).get(); } catch (e) { continue; }
    var missing = 0, invalid = 0, ok = 0;
    lSnap.forEach(function(doc) {
      var d = doc.data();
      if (!d.leagueId) { missing++; }
      else if (validLeagueIds.indexOf(d.leagueId) === -1) { invalid++; }
      else { ok++; }
    });
    if (missing > 0) {
      log.error(CHECK, lCol + ": " + missing + " docs missing leagueId", { collection: lCol, missing: missing });
      failed++;
    } else if (invalid > 0) {
      log.warn(CHECK, lCol + ": " + invalid + " docs with leagueId not matching any league", { collection: lCol, invalid: invalid });
      warnings++;
    } else if (lSnap.size > 0) {
      log.pass(CHECK, lCol + ": all " + ok + " docs have valid leagueId");
      passed++;
    }
  }

  // 3. Member doc validation
  var memberSnap = await db.collection("members").get();
  memberSnap.forEach(function(doc) {
    var d = doc.data();
    var uid = doc.id;
    var name = d.name || d.username || uid;
    // leagues[] check
    if (!d.leagues || !d.leagues.length) {
      log.error(CHECK, "Member " + name + " (" + uid + "): missing leagues[]", { docId: uid, collection: "members" });
      failed++;
    } else {
      // activeLeague in leagues[]
      if (d.activeLeague && d.leagues.indexOf(d.activeLeague) === -1) {
        log.error(CHECK, "Member " + name + ": activeLeague '" + d.activeLeague + "' not in leagues[] " + JSON.stringify(d.leagues), { docId: uid });
        failed++;
      } else {
        passed++;
      }
    }
    // uid match
    if (d.id && d.id !== uid && !d.claimedFrom) {
      log.warn(CHECK, "Member " + name + ": doc id '" + uid + "' != field id '" + d.id + "' (not a claimed profile)", { docId: uid });
      warnings++;
    }
  });

  // 4. Founding league doc
  var foundingDoc = await db.collection("leagues").doc(config.FOUNDING_LEAGUE_ID).get();
  if (!foundingDoc.exists) {
    log.critical(CHECK, "Founding league doc missing: leagues/" + config.FOUNDING_LEAGUE_ID);
    failed++;
  } else {
    var fd = foundingDoc.data();
    if (fd.badge !== "founding") {
      log.error(CHECK, "Founding league badge is '" + fd.badge + "', expected 'founding'", { expected: "founding", actual: fd.badge });
      failed++;
    } else {
      log.pass(CHECK, "Founding league badge: founding");
      passed++;
    }
    var uidCount = fd.memberUids ? fd.memberUids.length : 0;
    if (uidCount !== config.EXPECTED.members) {
      log.warn(CHECK, "Founding league memberUids: " + uidCount + " (expected " + config.EXPECTED.members + ")", { expected: config.EXPECTED.members, actual: uidCount });
      warnings++;
    } else {
      log.pass(CHECK, "Founding league memberUids: " + uidCount);
      passed++;
    }
  }

  return { name: "Data Integrity", passed: passed, failed: failed, warnings: warnings, details: details };
}

// Check 03: Global vs Scoped
// Detects drift between stored member values and values calculated from all rounds globally

module.exports = { name: "Global vs Scoped", run: run };

async function run(ctx) {
  var db = ctx.db, log = ctx.logger, config = ctx.config;
  var passed = 0, failed = 0, warnings = 0;
  var CHECK = "global-vs-scoped";

  var memberSnap = await db.collection("members").get();
  var members = [];
  memberSnap.forEach(function(doc) { members.push({ uid: doc.id, data: doc.data() }); });

  // Fetch ALL rounds (no leagueId filter)
  var allRoundsSnap = await db.collection("rounds").get();
  var allRounds = [];
  allRoundsSnap.forEach(function(doc) { allRounds.push(doc.data()); });

  for (var i = 0; i < members.length; i++) {
    var m = members[i];
    var d = m.data;
    var uid = m.uid;
    var name = d.name || d.username || uid;

    // Get ALL rounds for this player across all leagues
    var claimedFrom = d.claimedFrom || null;
    var playerRounds = allRounds.filter(function(r) {
      return r.player === uid || (claimedFrom && r.player === claimedFrom);
    });
    var individualRounds = playerRounds.filter(function(r) {
      return r.format !== "scramble" && r.format !== "scramble4";
    });
    var full18 = individualRounds.filter(function(r) {
      return !r.holesPlayed || r.holesPlayed >= 18;
    });

    // Expected values
    var expectedTotalRounds = playerRounds.length;
    var expectedBest = full18.length ? Math.min.apply(null, full18.map(function(r) { return r.score || 999; })) : null;
    var expectedAvg = full18.length ? Math.round(full18.reduce(function(a, r) { return a + (r.score || 0); }, 0) / full18.length) : null;
    var expectedHandicap = calcSimpleHandicap(individualRounds);

    // Skip members with no rounds — most fields will be null/undefined
    if (playerRounds.length === 0) {
      passed++;
      continue;
    }

    // Compare totalRounds
    var storedTotal = d.totalRounds || d.roundCount || 0;
    if (Math.abs(storedTotal - expectedTotalRounds) > 0) {
      log.error(CHECK, name + ": totalRounds stored=" + storedTotal + ", calculated=" + expectedTotalRounds,
        { docId: uid, collection: "members", field: "totalRounds", expected: expectedTotalRounds, actual: storedTotal, remediation: "Run persistPlayerStats for " + uid });
      failed++;
    } else { passed++; }

    // Compare bestRound
    if (expectedBest !== null) {
      var storedBest = d.bestRound || d.computedBest || null;
      if (storedBest !== null && storedBest !== expectedBest) {
        log.error(CHECK, name + ": bestRound stored=" + storedBest + ", calculated=" + expectedBest,
          { docId: uid, field: "bestRound", expected: expectedBest, actual: storedBest, remediation: "Run persistPlayerStats for " + uid });
        failed++;
      } else { passed++; }
    }

    // Compare avgScore
    if (expectedAvg !== null) {
      var storedAvg = d.avgScore || d.computedAvg || null;
      if (storedAvg !== null && Math.abs(storedAvg - expectedAvg) > 1) {
        log.error(CHECK, name + ": avgScore stored=" + storedAvg + ", calculated=" + expectedAvg,
          { docId: uid, field: "avgScore", expected: expectedAvg, actual: storedAvg, remediation: "Run persistPlayerStats for " + uid });
        failed++;
      } else { passed++; }
    }

    // Compare handicap
    if (expectedHandicap !== null) {
      var storedHcap = d.computedHandicap || d.handicap || null;
      if (storedHcap !== null && Math.abs(storedHcap - expectedHandicap) > config.TOLERANCE.handicap) {
        log.error(CHECK, name + ": handicap stored=" + storedHcap + ", calculated=" + expectedHandicap + " (delta " + Math.abs(storedHcap - expectedHandicap).toFixed(1) + ")",
          { docId: uid, field: "handicap", expected: expectedHandicap, actual: storedHcap, remediation: "Run persistPlayerStats for " + uid });
        failed++;
      } else { passed++; }
    }

    // Compare level (stored vs derived from XP)
    if (d.xp !== undefined && d.level !== undefined) {
      var derivedLevel = calcLevel(d.xp);
      if (d.level !== derivedLevel) {
        log.error(CHECK, name + ": level stored=" + d.level + ", derived from xp(" + d.xp + ")=" + derivedLevel,
          { docId: uid, field: "level", expected: derivedLevel, actual: d.level, remediation: "Run persistPlayerStats for " + uid });
        failed++;
      } else { passed++; }
    }
  }

  return { name: "Global vs Scoped", passed: passed, failed: failed, warnings: warnings, details: [] };
}

// Use the same canonical WHS implementation as the app
var whsPath = require("path").resolve(__dirname, "../../../src/core/handicap.js");
var whsModule = {};
try {
  // handicap.js uses global function declarations, so we eval it to get the functions
  var whsCode = require("fs").readFileSync(whsPath, "utf8");
  // Wrap in a function to capture the declarations
  var wrappedCode = "(function() { " + whsCode + "; return { calculateHandicapIndex: calculateHandicapIndex, WHS_SCALE: WHS_SCALE }; })()";
  whsModule = eval(wrappedCode);
} catch (e) {
  console.error("WARNING: Could not load handicap.js:", e.message);
}

function calcSimpleHandicap(rounds) {
  if (whsModule.calculateHandicapIndex) return whsModule.calculateHandicapIndex(rounds);
  // Fallback if handicap.js fails to load
  var eligible = rounds.filter(function(r) {
    return r.score && r.rating && r.slope && r.format !== "scramble" && r.format !== "scramble4";
  });
  if (eligible.length < 3) return null;
  var diffs = eligible.map(function(r) {
    return (113 / (r.slope || 113)) * ((r.score || 0) - (r.rating || 72));
  }).sort(function(a, b) { return a - b; });
  var n = Math.min(diffs.length, 20);
  var scale = {3:{c:1,a:-2},4:{c:1,a:-1},5:{c:1,a:0},6:{c:2,a:-1},7:{c:2,a:0},8:{c:2,a:0},9:{c:3,a:0},10:{c:3,a:0},11:{c:3,a:0},12:{c:4,a:0},13:{c:4,a:0},14:{c:4,a:0},15:{c:5,a:0},16:{c:5,a:0},17:{c:6,a:0},18:{c:6,a:0},19:{c:7,a:0},20:{c:8,a:0}};
  var rule = scale[n]; if (!rule) return null;
  var best = diffs.slice(0, rule.c);
  var avg = best.reduce(function(a,v){return a+v},0)/best.length;
  return Math.round(Math.min(54.0, avg + rule.a) * 10) / 10;
}

// Level from XP
function calcLevel(xp) {
  if (!xp || xp <= 0) return 1;
  var level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

function xpForLevel(level) {
  if (level <= 1) return 0;
  return Math.floor(200 * Math.pow(level - 1, 1.65));
}

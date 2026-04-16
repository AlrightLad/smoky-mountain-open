#!/usr/bin/env node
// ========== HANDICAP BACKFILL ==========
// Recalculates WHS handicaps for all members from their full round history.
// Default: dry run (print diff). Pass --execute to write changes.

var admin = require("firebase-admin");
var fs = require("fs");
var path = require("path");

// Load handicap.js by eval (it uses global function declarations)
var handicapCode = fs.readFileSync(path.resolve(__dirname, "../src/core/handicap.js"), "utf8");
var wrappedCode = "(function() { " + handicapCode + "; return { calculateHandicapIndex: calculateHandicapIndex }; })()";
var whs = eval(wrappedCode);

// Init Firebase Admin
var keyPaths = [
  path.resolve(__dirname, ".service-account.json"),
  path.resolve(__dirname, "../serviceAccountKey.json")
];
var keyPath = keyPaths.find(function(p) { return fs.existsSync(p); });
if (!keyPath) { console.error("No service account key found"); process.exit(1); }
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
}
var db = admin.firestore();

var EXECUTE = process.argv.indexOf("--execute") !== -1;

async function run() {
  console.log("=".repeat(60));
  console.log("HANDICAP BACKFILL — " + new Date().toISOString());
  console.log(EXECUTE ? "MODE: EXECUTE (will write changes)" : "MODE: DRY RUN (print only)");
  console.log("=".repeat(60));
  console.log("");

  // Load all members
  var memberSnap = await db.collection("members").get();
  var members = [];
  memberSnap.forEach(function(doc) { members.push({ uid: doc.id, data: doc.data() }); });

  // Load ALL rounds (no league filter — handicap is global)
  var roundSnap = await db.collection("rounds").get();
  var allRounds = [];
  roundSnap.forEach(function(doc) { allRounds.push(doc.data()); });

  console.log("Members: " + members.length);
  console.log("Rounds: " + allRounds.length);
  console.log("");

  var changes = [];
  var unchanged = 0;

  for (var i = 0; i < members.length; i++) {
    var m = members[i];
    var uid = m.uid;
    var d = m.data;
    var name = d.name || d.username || uid;
    var claimedFrom = d.claimedFrom || null;

    // Get all rounds for this player
    var playerRounds = allRounds.filter(function(r) {
      return r.player === uid || (claimedFrom && r.player === claimedFrom);
    });

    // Calculate WHS handicap
    var newHandicap = whs.calculateHandicapIndex(playerRounds);
    var oldHandicap = d.computedHandicap !== undefined ? d.computedHandicap : (d.handicap || null);

    // Also check bestRound, avgScore, totalRounds
    var indiv = playerRounds.filter(function(r) { return r.format !== "scramble" && r.format !== "scramble4"; });
    var full18 = indiv.filter(function(r) { return !r.holesPlayed || r.holesPlayed >= 18; });
    var newBest = full18.length ? Math.min.apply(null, full18.map(function(r) { return r.score || 999; })) : null;
    var newAvg = full18.length ? Math.round(full18.reduce(function(a, r) { return a + (r.score || 0); }, 0) / full18.length) : null;
    var newTotal = playerRounds.length;

    var oldBest = d.bestRound || d.computedBest || null;
    var oldAvg = d.avgScore || d.computedAvg || null;
    var oldTotal = d.totalRounds || d.roundCount || 0;

    var diffs = [];
    if (oldHandicap !== newHandicap) {
      diffs.push("handicap: " + oldHandicap + " → " + newHandicap);
    }
    if (oldBest !== newBest && newBest !== null) {
      diffs.push("bestRound: " + oldBest + " → " + newBest);
    }
    if (oldAvg !== newAvg && newAvg !== null) {
      diffs.push("avgScore: " + oldAvg + " → " + newAvg);
    }
    if (Math.abs(oldTotal - newTotal) > 0) {
      diffs.push("totalRounds: " + oldTotal + " → " + newTotal);
    }

    if (diffs.length > 0) {
      changes.push({
        uid: uid,
        name: name,
        roundCount: playerRounds.length,
        diffs: diffs,
        updates: {
          computedHandicap: newHandicap,
          bestRound: newBest,
          computedBest: newBest,
          avgScore: newAvg,
          computedAvg: newAvg,
          totalRounds: newTotal,
          roundCount: playerRounds.length
        },
        oldHandicap: oldHandicap,
        newHandicap: newHandicap
      });
      console.log("  CHANGE: " + name + " (" + playerRounds.length + " rounds)");
      diffs.forEach(function(diff) { console.log("    " + diff); });
    } else {
      unchanged++;
    }
  }

  console.log("");
  console.log("Summary: " + changes.length + " members need updates, " + unchanged + " unchanged");
  console.log("");

  if (!EXECUTE) {
    console.log("DRY RUN — no changes written. Pass --execute to apply.");
    process.exit(0);
    return;
  }

  // Execute updates
  console.log("Executing updates...");
  for (var j = 0; j < changes.length; j++) {
    var c = changes[j];
    var updates = Object.assign({}, c.updates, { updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    // Write to member doc
    await db.collection("members").doc(c.uid).update(updates);

    // Log to handicap_history
    await db.collection("handicap_history").add({
      uid: c.uid,
      displayName: c.name,
      oldHandicap: c.oldHandicap,
      newHandicap: c.newHandicap,
      roundCount: c.roundCount,
      diffs: c.diffs,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: "backfill-handicaps.js"
    });

    console.log("  Updated: " + c.name);
  }

  console.log("");
  console.log("Done. " + changes.length + " members updated. History logged to handicap_history collection.");
  process.exit(0);
}

run().catch(function(e) {
  console.error("FATAL:", e);
  process.exit(1);
});

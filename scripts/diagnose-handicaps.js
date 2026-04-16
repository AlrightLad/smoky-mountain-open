#!/usr/bin/env node
// ========== HANDICAP DIAGNOSTIC ==========
// For each member with a handicap change, prints full round-by-round breakdown.
// Diagnostic only — writes NOTHING to Firestore.

var admin = require("firebase-admin");
var fs = require("fs");
var path = require("path");

// Load WHS functions from handicap.js
var handicapCode = fs.readFileSync(path.resolve(__dirname, "../src/core/handicap.js"), "utf8");
var whs = eval("(function() { " + handicapCode + "; return { calculateHandicapIndex:calculateHandicapIndex, calculateScoreDifferential:calculateScoreDifferential, WHS_SCALE:WHS_SCALE }; })()");

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

// Members to diagnose
var TARGET_UIDS = [
  "1GE683EauXO8TVhcStKfWiCCcRl2", // Mr Parbaugh
  "8WJ2jTnTuxggUPA4ymAuUO3Nq093", // Nick
  "GKIpnlixcfcvDYf2ugWSC5J5DkG2", // Kayvan
  "V8b60CIf04VGjEoclxfSEMLh4lp2"  // Kiyan
];

async function run() {
  var out = [];
  function w(s) { out.push(s || ""); console.log(s || ""); }

  w("# Handicap Diagnostic — " + new Date().toISOString());
  w("");
  w("Diagnostic only. No data modified.");
  w("");

  // Load all rounds
  var roundSnap = await db.collection("rounds").get();
  var allRounds = [];
  roundSnap.forEach(function(doc) { allRounds.push(doc.data()); });

  for (var t = 0; t < TARGET_UIDS.length; t++) {
    var uid = TARGET_UIDS[t];
    var memberDoc = await db.collection("members").doc(uid).get();
    if (!memberDoc.exists) { w("## MEMBER NOT FOUND: " + uid); w(""); continue; }
    var m = memberDoc.data();
    var name = m.name || m.username || uid;
    var claimedFrom = m.claimedFrom || null;

    w("---");
    w("## " + name + " (" + uid + ")");
    w("");
    w("- **Stored handicap:** " + (m.computedHandicap !== undefined ? m.computedHandicap : (m.handicap || "null")));
    w("- **claimedFrom:** " + (claimedFrom || "none"));

    // Get all rounds for this player
    var playerRounds = allRounds.filter(function(r) {
      return r.player === uid || (claimedFrom && r.player === claimedFrom);
    });

    // Sort newest first
    playerRounds.sort(function(a, b) { return (b.date || "").localeCompare(a.date || ""); });

    w("- **Total rounds:** " + playerRounds.length);
    w("");

    // Round table
    w("| # | Round ID | Date | Course | Score | Rating | Slope | Holes | Format | Differential | Status |");
    w("|---|----------|------|--------|-------|--------|-------|-------|--------|--------------|--------|");

    var eligible = [];
    for (var i = 0; i < playerRounds.length; i++) {
      var r = playerRounds[i];
      var rid = (r.id || "?").substring(0, 16);
      var date = r.date || "?";
      var course = (r.course || "?").substring(0, 25);
      var score = r.score || "?";
      var rating = r.rating;
      var slope = r.slope;
      var holes = r.holesPlayed || "?";
      var format = r.format || "?";

      // Flag missing data
      var ratingStr = rating !== undefined && rating !== null ? String(rating) : "**MISSING**";
      var slopeStr = slope !== undefined && slope !== null ? String(slope) : "**MISSING**";

      // Calculate differential
      var diff = whs.calculateScoreDifferential(r);
      var diffStr = diff !== null ? (Math.round(diff * 10) / 10).toFixed(1) : "—";

      // Determine inclusion/exclusion
      var status = "";
      var excluded = false;
      if (format === "scramble" || format === "scramble4") {
        status = "EXCLUDED (scramble)";
        excluded = true;
      } else if (r.holesPlayed && r.holesPlayed < 18) {
        status = "EXCLUDED (9-hole)";
        excluded = true;
      } else if (!r.score) {
        status = "EXCLUDED (no score)";
        excluded = true;
      } else if (!r.rating || !r.slope) {
        status = "EXCLUDED (missing rating/slope)";
        excluded = true;
      } else {
        status = "INCLUDED";
        eligible.push({ diff: diff, date: r.date, course: r.course, score: r.score, rating: r.rating, slope: r.slope });
      }

      w("| " + (i + 1) + " | " + rid + " | " + date + " | " + course + " | " + score + " | " + ratingStr + " | " + slopeStr + " | " + holes + " | " + format + " | " + diffStr + " | " + status + " |");
    }
    w("");

    // WHS calculation breakdown
    // Take most recent 20 eligible
    var recent20 = eligible.slice(0, 20);
    var n = recent20.length;

    w("### WHS Calculation");
    w("");
    w("- **Eligible rounds:** " + eligible.length + " (after excluding scramble and rounds missing rating/slope)");
    w("- **Recent 20 used:** " + n);
    w("");

    if (n < 3) {
      w("- **Result:** Insufficient data (need at least 3 eligible rounds)");
      w("- **Calculated handicap:** null");
      w("");
      continue;
    }

    // Sort differentials ascending
    var diffs = recent20.map(function(e) { return e.diff; }).sort(function(a, b) { return a - b; });

    var scaleKey = Math.min(n, 20);
    var rule = whs.WHS_SCALE[scaleKey];

    w("- **WHS sliding scale:** " + n + " rounds → use lowest **" + rule.count + "** differential" + (rule.count > 1 ? "s" : "") + " with adjustment **" + (rule.adjustment >= 0 ? "+" : "") + rule.adjustment + "**");
    w("");

    var lowest = diffs.slice(0, rule.count);
    var avg = lowest.reduce(function(a, b) { return a + b; }, 0) / lowest.length;
    var index = Math.min(54.0, avg + rule.adjustment);
    var finalIndex = Math.round(index * 10) / 10;

    w("- **All differentials (sorted ascending):**");
    for (var d = 0; d < diffs.length; d++) {
      var mark = d < rule.count ? " ← USED" : "";
      var roundInfo = recent20.sort(function(a, b) { return a.diff - b.diff; })[d];
      w("  " + (d + 1) + ". **" + (Math.round(diffs[d] * 10) / 10).toFixed(1) + "** (" + (roundInfo ? roundInfo.course + " " + roundInfo.date + " — " + roundInfo.score : "?") + ")" + mark);
    }
    w("");

    w("- **Lowest " + rule.count + " average:** " + (Math.round(avg * 10) / 10).toFixed(1));
    w("- **Adjustment:** " + (rule.adjustment >= 0 ? "+" : "") + rule.adjustment);
    w("- **Final index:** " + (Math.round(avg * 10) / 10).toFixed(1) + " + (" + rule.adjustment + ") = **" + finalIndex + "**");
    w("");
    w("- **Stored handicap:** " + (m.computedHandicap !== undefined ? m.computedHandicap : (m.handicap || "null")));
    w("- **Calculated handicap:** " + finalIndex);
    w("- **Delta:** " + Math.abs((m.computedHandicap || m.handicap || 0) - finalIndex).toFixed(1));
    w("");
  }

  // Write to log file
  var logDir = path.resolve(__dirname, "../logs");
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  var logFile = path.join(logDir, "handicap-diagnostic-" + new Date().toISOString().replace(/[:.]/g, "-") + ".md");
  fs.writeFileSync(logFile, out.join("\n"));
  console.log("\nLog written to: " + logFile);

  process.exit(0);
}

run().catch(function(e) { console.error("FATAL:", e); process.exit(1); });

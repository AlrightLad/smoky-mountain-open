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

// Server-side XP calculation — mirrors getPlayerXP from data.js
// Covers: rounds, courses, PB bonus, H2H wins, milestones, score achievements,
// explore, Play Now, B2B days, invites, founding/beta/commissioner, profile
function calcServerXP(rounds, member, uid, allRounds, allMembers) {
  var xp = 0;
  // Rounds XP
  rounds.forEach(function(r) { xp += r.holeScores ? 150 : 100; if (r.scorecardPhoto) xp += 25; });
  // New course bonus
  var seenCourses = {};
  rounds.forEach(function(r) { if (!seenCourses[r.course]) { xp += 75; seenCourses[r.course] = 1; } });
  // PB bonus (individual non-scramble, chronological)
  var indiv = rounds.filter(function(r){return r.format!=="scramble"&&r.format!=="scramble4";});
  indiv.sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  if (indiv.length >= 2) {
    var best = indiv[0].score;
    for (var i=1;i<indiv.length;i++) { if (indiv[i].score < best) { xp += 200; best = indiv[i].score; } }
  }
  // H2H wins
  var myIndiv = rounds.filter(function(r){return r.format!=="scramble"&&r.format!=="scramble4";});
  myIndiv.forEach(function(r) {
    allMembers.forEach(function(opp) {
      if (opp.uid === uid) return;
      var oppClaimed = opp.data.claimedFrom;
      var oppRound = allRounds.find(function(o) {
        return (o.player === opp.uid || (oppClaimed && o.player === oppClaimed)) && o.course === r.course && o.date === r.date && o.format !== "scramble" && o.format !== "scramble4";
      });
      if (oppRound) {
        if (r.score < oppRound.score) xp += 50;
      }
    });
  });
  // Round milestones
  if (rounds.length >= 1) xp += 100;
  if (rounds.length >= 5) xp += 50;
  if (rounds.length >= 10) xp += 100;
  if (rounds.length >= 25) xp += 250;
  if (rounds.length >= 50) xp += 500;
  // Score achievements (18h non-scramble)
  var full18 = rounds.filter(function(r){return (!r.holesPlayed||r.holesPlayed>=18)&&r.format!=="scramble"&&r.format!=="scramble4";});
  if (full18.some(function(r){return r.score<=120})) xp += 50;
  if (full18.some(function(r){return r.score<100})) xp += 100;
  if (full18.some(function(r){return r.score<90})) xp += 200;
  if (full18.some(function(r){return r.score<85})) xp += 300;
  if (full18.some(function(r){return r.score<80})) xp += 500;
  // Explore
  var cc = Object.keys(seenCourses).length;
  if (cc >= 3) xp += 50; if (cc >= 5) xp += 100; if (cc >= 10) xp += 200;
  // Play Now
  if (rounds.some(function(r){return r.holeScores})) xp += 50;
  // B2B days
  if (rounds.length >= 2) {
    var dates = rounds.map(function(r){return r.date}).filter(Boolean).sort();
    for (var di=1;di<dates.length;di++) {
      var d1=new Date(dates[di-1]+"T12:00:00"), d2=new Date(dates[di]+"T12:00:00");
      if ((d2-d1)<=86400000) { xp += 75; break; }
    }
  }
  // Invites
  var inv = member.invitesUsed || 0;
  if (inv >= 1) xp += 100; if (inv >= 3) xp += 250;
  // Special
  if (member.founding || member.isFoundingFour) xp += 500;
  xp += 250; // Beta
  if (member.role === "commissioner") xp += 500;
  // Profile
  var pf = 0;
  if (member.bio && member.bio.trim()) pf++;
  if (member.range && member.range.trim()) pf++;
  if (member.homeCourse && member.homeCourse.trim()) pf++;
  if (member.favoriteCourse && member.favoriteCourse.trim()) pf++;
  var clubs = 0; if (member.clubs) Object.keys(member.clubs).forEach(function(k){if(member.clubs[k])clubs++});
  if (clubs >= 1) pf++;
  if (pf >= 1) xp += 25;
  if (pf >= 4) xp += 100;
  return xp;
}

function calcLevel(xp) {
  if (!xp) return 1;
  var level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

function xpForLevel(lvl) {
  if (lvl <= 1) return 0;
  return Math.floor(200 * Math.pow(lvl - 1, 1.65));
}

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

    // XP calculation (server-side, covers round-based + profile + special XP)
    var newXP = calcServerXP(playerRounds, d, uid, allRounds, members);
    var newLevel = calcLevel(newXP);

    var oldBest = d.bestRound || d.computedBest || null;
    var oldAvg = d.avgScore || d.computedAvg || null;
    var oldTotal = d.totalRounds || d.roundCount || 0;
    var oldXP = d.xp || 0;
    var oldLevel = d.level || 1;

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
    if (oldXP !== newXP) {
      diffs.push("xp: " + oldXP + " → " + newXP);
    }
    if (oldLevel !== newLevel) {
      diffs.push("level: " + oldLevel + " → " + newLevel);
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
          roundCount: playerRounds.length,
          xp: newXP,
          level: newLevel
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

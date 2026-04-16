// ========== FULL FIRESTORE DIAGNOSTIC (READ-ONLY) ==========
// Reads every collection, prints exact counts, field presence,
// leagueId status. Compares live data to backup. CHANGES NOTHING.

var admin = require("firebase-admin");
var fs = require("fs");

var serviceAccount = require("../serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
var db = admin.firestore();

// Load backup for comparison
var backup = {};
try {
  backup = JSON.parse(fs.readFileSync("backups/pre-multi-league.json", "utf8"));
} catch (e) {
  console.log("WARNING: Could not load backup file:", e.message);
}

async function run() {
  console.log("=".repeat(70));
  console.log("FULL FIRESTORE DIAGNOSTIC — " + new Date().toISOString());
  console.log("READ-ONLY. CHANGES NOTHING.");
  console.log("=".repeat(70));
  console.log("");

  // ── MEMBERS ──
  console.log("=== MEMBERS ===");
  var memberSnap = await db.collection("members").get();
  console.log("Total member docs: " + memberSnap.size);
  console.log("Backup had: " + (backup.members ? backup.members.length : "N/A"));
  console.log("");

  var EXPECTED = ["id","name","username","email","role","level","xp","parcoins","parcoinsLifetime",
    "computedHandicap","computedAvg","computedBest","roundCount","totalRounds","avgScore","bestRound",
    "earnedAchievements","equippedTitle","equippedCosmetics","displayBadges","badges","bio","homeCourse",
    "theme","clubs","bag","funnyFacts","founding","isFoundingFour","invitesUsed","maxInvites","createdAt",
    "leagues","activeLeague"];

  memberSnap.forEach(function(doc) {
    var d = doc.data();
    var ea = d.earnedAchievements || [];
    console.log("  UID: " + doc.id);
    console.log("    name: " + (d.name || "MISSING") + " | username: " + (d.username || "MISSING"));
    console.log("    role: " + (d.role || "MISSING") + " | founding: " + (d.founding || false));
    console.log("    level: " + (d.level !== undefined ? d.level : "MISSING") + " | xp: " + (d.xp !== undefined ? d.xp : "MISSING"));
    console.log("    handicap: " + (d.computedHandicap || d.handicap || "null"));
    console.log("    avgScore: " + (d.avgScore !== undefined ? d.avgScore : "MISSING") + " | bestRound: " + (d.bestRound !== undefined ? d.bestRound : "MISSING"));
    console.log("    computedAvg: " + (d.computedAvg !== undefined ? d.computedAvg : "MISSING") + " | computedBest: " + (d.computedBest !== undefined ? d.computedBest : "MISSING"));
    console.log("    roundCount: " + (d.roundCount !== undefined ? d.roundCount : "MISSING") + " | totalRounds: " + (d.totalRounds !== undefined ? d.totalRounds : "MISSING"));
    console.log("    parcoins: " + (d.parcoins !== undefined ? d.parcoins : "MISSING") + " | lifetime: " + (d.parcoinsLifetime !== undefined ? d.parcoinsLifetime : "MISSING"));
    console.log("    bio: " + (d.bio ? '"' + d.bio.substring(0, 50) + '"' : "(empty)"));
    console.log("    homeCourse: " + (d.homeCourse || "null") + " | theme: " + (d.theme || "null"));
    console.log("    photo: " + (d.photo ? "YES" : "null"));
    console.log("    equippedCosmetics: " + JSON.stringify(d.equippedCosmetics || "MISSING"));
    console.log("    equippedTitle: " + (d.equippedTitle || "null"));
    console.log("    earnedAchievements: " + ea.length + (ea.length > 0 ? " [" + ea.join(", ") + "]" : ""));
    console.log("    displayBadges: " + JSON.stringify(d.displayBadges || []));
    console.log("    badges: " + JSON.stringify(d.badges || "MISSING"));
    console.log("    leagues[]: " + JSON.stringify(d.leagues || "MISSING"));
    console.log("    activeLeague: " + (d.activeLeague || "MISSING"));
    console.log("    invitesUsed: " + (d.invitesUsed !== undefined ? d.invitesUsed : "MISSING") + " | maxInvites: " + (d.maxInvites !== undefined ? d.maxInvites : "MISSING"));

    var missing = EXPECTED.filter(function(f) { return d[f] === undefined; });
    if (missing.length > 0) console.log("    !! MISSING EXPECTED FIELDS: " + missing.join(", "));

    // Compare to backup
    if (backup.members) {
      var bm = backup.members.find(function(m) { return (m._id || m.id) === doc.id; });
      if (bm) {
        var backupKeys = Object.keys(bm).filter(function(k) { return k !== "_id"; });
        var lostFields = backupKeys.filter(function(k) {
          return bm[k] !== undefined && bm[k] !== null && bm[k] !== "" && d[k] === undefined;
        });
        if (lostFields.length > 0) {
          console.log("    !! FIELDS IN BACKUP BUT NOT IN LIVE: " + lostFields.join(", "));
          lostFields.forEach(function(f) {
            var val = bm[f];
            var display = typeof val === "object" ? JSON.stringify(val).substring(0, 80) : String(val).substring(0, 80);
            console.log("       " + f + " was: " + display);
          });
        }
      } else {
        console.log("    !! NOT IN BACKUP (new member since backup)");
      }
    }

    console.log("    ALL KEYS: " + Object.keys(d).sort().join(", "));
    console.log("");
  });

  // ── ROUNDS ──
  console.log("=== ROUNDS ===");
  var roundSnap = await db.collection("rounds").get();
  var rounds = [];
  roundSnap.forEach(function(doc) { rounds.push({id: doc.id, data: doc.data()}); });
  console.log("Total round docs: " + rounds.length);
  console.log("Backup had: " + (backup.rounds ? backup.rounds.length : "N/A"));

  var parbaughsRounds = rounds.filter(function(r) { return r.data.leagueId === "the-parbaughs"; });
  var noLeagueRounds = rounds.filter(function(r) { return !r.data.leagueId; });
  var otherLeagueRounds = rounds.filter(function(r) { return r.data.leagueId && r.data.leagueId !== "the-parbaughs"; });
  console.log("  leagueId='the-parbaughs': " + parbaughsRounds.length);
  console.log("  NO leagueId: " + noLeagueRounds.length);
  console.log("  Other leagueId: " + otherLeagueRounds.length);
  if (otherLeagueRounds.length > 0) {
    var otherIds = {};
    otherLeagueRounds.forEach(function(r) { otherIds[r.data.leagueId] = (otherIds[r.data.leagueId] || 0) + 1; });
    console.log("  Other league breakdown: " + JSON.stringify(otherIds));
  }
  console.log("");

  // Print first 5 rounds in detail
  rounds.slice(0, 5).forEach(function(r, i) {
    var d = r.data;
    console.log("  Round " + (i + 1) + " (doc: " + r.id + "):");
    console.log("    id: " + (d.id || "MISSING") + " | player: " + d.player + " | playerName: " + d.playerName);
    console.log("    course: " + d.course + " | date: " + d.date + " | score: " + d.score);
    console.log("    holesPlayed: " + d.holesPlayed + " | holesMode: " + (d.holesMode || "null") + " | format: " + d.format);
    console.log("    holeScores: " + (d.holeScores ? "[" + d.holeScores.length + "]" : "MISSING"));
    console.log("    holePars: " + (d.holePars ? "[" + d.holePars.length + "]" : "MISSING"));
    console.log("    leagueId: " + (d.leagueId || "MISSING"));
    console.log("    ALL KEYS: " + Object.keys(d).sort().join(", "));
    console.log("");
  });

  // Check backup rounds vs live
  if (backup.rounds) {
    var liveRoundIds = rounds.map(function(r) { return r.data.id || r.id; });
    var backupRoundIds = backup.rounds.map(function(r) { return r.id || r._id; });
    var missingFromLive = backupRoundIds.filter(function(id) { return liveRoundIds.indexOf(id) === -1; });
    var newInLive = liveRoundIds.filter(function(id) { return backupRoundIds.indexOf(id) === -1; });
    if (missingFromLive.length > 0) console.log("  !! ROUNDS IN BACKUP BUT NOT IN LIVE: " + JSON.stringify(missingFromLive));
    if (newInLive.length > 0) console.log("  New rounds since backup: " + newInLive.length);
  }
  console.log("");

  // ── LEAGUE-SCOPED COLLECTIONS ──
  console.log("=== LEAGUE-SCOPED COLLECTIONS ===");
  var leagueColls = ["chat","trips","teetimes","wagers","bounties","challenges","scrambleTeams",
    "calendar_events","scheduling_chat","social_actions","invites","syncrounds","liverounds",
    "league_battles","tripscores","rangeSessions"];

  for (var i = 0; i < leagueColls.length; i++) {
    var col = leagueColls[i];
    try {
      var snap = await db.collection(col).get();
      var total = snap.size;
      var withParbaughs = 0, noLid = 0, otherLid = 0;
      snap.forEach(function(doc) {
        var d = doc.data();
        if (!d.leagueId) noLid++;
        else if (d.leagueId === "the-parbaughs") withParbaughs++;
        else otherLid++;
      });
      var backupCount = backup[col] ? backup[col].length : "N/A";
      console.log("  " + col + ": " + total + " docs (backup: " + backupCount + ") | parbaughs: " + withParbaughs + " | none: " + noLid + " | other: " + otherLid);
    } catch (e) {
      console.log("  " + col + ": ERROR — " + e.message);
    }
  }
  console.log("");

  // ── GLOBAL COLLECTIONS ──
  console.log("=== GLOBAL COLLECTIONS ===");
  var globalColls = ["courses","course_reviews","photos","parcoin_transactions","notifications","presence","errors","feature_requests","dms","pending_celebrations","pendingPush"];
  for (var j = 0; j < globalColls.length; j++) {
    var gcol = globalColls[j];
    try {
      var gsnap = await db.collection(gcol).get();
      var backupGCount = backup[gcol] ? backup[gcol].length : "N/A";
      console.log("  " + gcol + ": " + gsnap.size + " docs (backup: " + backupGCount + ")");
    } catch (e) {
      console.log("  " + gcol + ": ERROR — " + e.message);
    }
  }
  console.log("");

  // ── LEAGUES COLLECTION ──
  console.log("=== LEAGUES COLLECTION ===");
  var leagueSnap = await db.collection("leagues").get();
  console.log("Total league docs: " + leagueSnap.size);
  leagueSnap.forEach(function(doc) {
    var d = doc.data();
    console.log("  doc id: " + doc.id);
    console.log("    name: " + d.name + " | slug: " + d.slug);
    console.log("    badge: " + (d.badge || "none") + " | commissioner: " + d.commissioner);
    console.log("    memberUids: " + (d.memberUids ? d.memberUids.length + " UIDs [" + d.memberUids.join(", ") + "]" : "MISSING"));
    console.log("    memberCount: " + d.memberCount);
    console.log("    visibility: " + d.visibility + " | tier: " + d.tier);
    console.log("    ALL KEYS: " + Object.keys(d).sort().join(", "));
    console.log("");
  });

  // ── CONFIG ──
  console.log("=== CONFIG ===");
  var configSnap = await db.collection("config").get();
  configSnap.forEach(function(doc) {
    console.log("  " + doc.id + ": " + Object.keys(doc.data()).join(", "));
  });
  console.log("");

  // ── SUMMARY ──
  console.log("=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));
  console.log("Members: " + memberSnap.size + " (backup: " + (backup.members ? backup.members.length : "?") + ")");
  console.log("Rounds: " + rounds.length + " (backup: " + (backup.rounds ? backup.rounds.length : "?") + ") — " + parbaughsRounds.length + " tagged, " + noLeagueRounds.length + " untagged, " + otherLeagueRounds.length + " other");
  console.log("");

  process.exit(0);
}

run().catch(function(e) {
  console.error("FATAL:", e);
  process.exit(1);
});

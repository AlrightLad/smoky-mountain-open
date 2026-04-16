// Restore Nick's missing achievements by merging backup + live (union, no duplicates)
var admin = require("firebase-admin");

if (!admin.apps.length) {
  var serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
var db = admin.firestore();

var NICK_UID = "8WJ2jTnTuxggUPA4ymAuUO3Nq093";

// Union of backup (27) + live-only (1) = 28 total
var merged = [
  "first_blood","getting_started","sampler","explorer","sandbagger",
  "og","beta","profile_started","live_scorer","lvl5","blow120","blow130",
  "roller_coaster","event_smo2026","event_goer","snowman","sequoyah",
  "grip_rip","b2b","first_swing","focused_practice","trophy_shelf",
  "two_a_day","triple_crown","all_in","overcorrection","founding_season",
  "double_duty"
];

async function run() {
  // Read current state first
  var doc = await db.collection("members").doc(NICK_UID).get();
  if (!doc.exists) { console.log("ERROR: Nick's doc not found"); process.exit(1); }
  var current = doc.data().earnedAchievements || [];
  console.log("Current achievements (" + current.length + "):", JSON.stringify(current));
  console.log("Will set to merged (" + merged.length + "):", JSON.stringify(merged));

  await db.collection("members").doc(NICK_UID).update({
    earnedAchievements: merged
  });

  // Verify
  var after = await db.collection("members").doc(NICK_UID).get();
  var afterAch = after.data().earnedAchievements || [];
  console.log("After restore (" + afterAch.length + "):", JSON.stringify(afterAch));
  console.log("SUCCESS: Nick's achievements restored from 10 to " + afterAch.length);
  process.exit(0);
}

run().catch(function(e) { console.error("FATAL:", e); process.exit(1); });

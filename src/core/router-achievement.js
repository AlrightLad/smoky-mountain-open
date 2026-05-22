// Achievement detection + XP award system. Extracted per W1.A5.

// ========== ACHIEVEMENT DETECTION + XP AWARD SYSTEM ==========
function checkAndAwardNewAchievements() {
  if (!currentUser || !db) return;
  var uid = currentUser.uid;
  var currentAchs = PB.getAchievements(uid);
  var currentIds = currentAchs.map(function(a) { return a.id; });

  db.collection("members").doc(uid).get().then(function(doc) {
    if (!doc.exists) return;
    var stored = doc.data().earnedAchievements || [];
    var newlyEarned = currentIds.filter(function(id) { return stored.indexOf(id) === -1; });

    if (newlyEarned.length > 0) {
      newlyEarned.forEach(function(id, i) {
        var ach = currentAchs.find(function(a) { return a.id === id; });
        if (!ach) return;
        setTimeout(function() {
          showAchievementCelebration(ach);
          // Also push a notification to the bell
          if (db && currentUser) {
            // v8.17.0 / Q7: migrated from direct .add() to sendNotification helper.
            // Achievement notifications now route through pendingPush → FCM phone push.
            // body → message rename so FCM payload picks up the description (helper reads notif.message).
            // icon field dropped — cluster icon (round) takes over via NOTIFICATION_META.
            sendNotification(currentUser.uid, {
              type: "achievement",
              title: "Achievement unlocked: " + ach.name,
              message: ach.desc + " (+" + ach.xp + " XP)"
            });
          }
          // ── ParCoin: award coins for achievement unlock ──
          if (currentUser) {
            var achCoins = calcAchievementCoins(ach.xp || 50);
            awardCoins(currentUser.uid, achCoins, "achievement", "Unlocked: " + ach.name, "ach_" + id);
          }
        }, i * 4500);
      });
      db.collection("members").doc(uid).update({ earnedAchievements: currentIds }).catch(function(){});
    } else if (stored.length === 0 && currentIds.length > 0) {
      // First run — store silently, no celebrations for retroactive achievements
      db.collection("members").doc(uid).update({ earnedAchievements: currentIds }).catch(function(){});
    }
  }).catch(function() {});
}

function startPresenceSystem() {
  if (!db || !currentUser) return;
  
  // Update immediately, then every 5 min (saves 60% writes vs 2 min)
  updatePresence._force = true;
  updatePresence();
  setInterval(function() { updatePresence._force = true; updatePresence(); }, 300000);
  
  // Set offline on page unload
  window.addEventListener("beforeunload", function() {
    if (db && currentUser) {
      db.collection("presence").doc(currentUser.uid).update({ online: false }).catch(function(){});
    }
    // v8.13.7 Gate 6 — Best-effort spectator listener cleanup on tab close /
    // page reload. Explicit > Firebase SDK auto-cleanup; audit-friendly.
    if (typeof PB !== "undefined" && PB.spectator && typeof PB.spectator.detachListener === "function") {
      PB.spectator.detachListener();
    }
  });
  
  // Listen to presence — 10 min window (matches 5 min heartbeat with buffer)
  if (window._presenceUnsub) window._presenceUnsub();
  window._presenceUnsub = db.collection("presence").onSnapshot(function(snap) {
    onlineMembers = {};
    var now = new Date();
    snap.forEach(function(doc) {
      var data = doc.data();
      if (data.lastSeen && data.lastSeen.toDate) {
        var diff = now - data.lastSeen.toDate();
        if (diff < 600000) { onlineMembers[doc.id] = data; }
      }
    });
    renderOnlineSection();
  }, function(err) { pbWarn("[Presence] error:", err.message); });
}

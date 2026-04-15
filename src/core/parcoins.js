/* ═══════════════════════════════════════════════════════════════════════════
   PARCOINS — In-game currency system (earn only, no spending yet)
   Coins are cosmetic-only with zero real-world cash value.
   Balance stored on members/{uid}.parcoins via FieldValue.increment.
   Transaction log in parcoin_transactions collection.
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Earn rates (match PARBAUGHS_ROADMAP.md) ──
var PARCOIN_RATES = {
  round_complete_base:     10,   // minimum for any completed round
  round_complete_max:      50,   // max for a great round vs handicap
  range_session_base:      5,    // minimum for a range session
  range_session_max:       15,   // max for a long focused session
  attest_round:            5,    // attesting someone else's scores
  tee_time_filled:         10,   // posting a tee time that fills all spots
  daily_login_base:        1,    // day 1 of a streak
  daily_login_max:         10,   // day 7+ of a streak
  achievement_unlock_min:  25,   // small achievements
  achievement_unlock_max:  100,  // major achievements
  event_win:               500,  // winning a trip/event
  personal_best:           100,  // new personal best 18-hole score
  invite_joined:           200   // invitee completes registration
};

// ── Dedup cache (prevents double-awarding in same session) ──
var _parcoinAwarded = {};

/**
 * Award ParCoins to a user.
 * @param {string} uid - Firestore user ID
 * @param {number} amount - coins to award (positive integer)
 * @param {string} reason - machine-readable reason key (e.g. "round_complete")
 * @param {string} label - human-readable description for transaction log
 * @param {string} [dedupKey] - optional dedup key to prevent double-award
 */
function awardCoins(uid, amount, reason, label, dedupKey) {
  if (!uid || !amount || amount <= 0 || !db) return;
  amount = Math.round(amount);

  // Dedup: if this exact award was already given this session, skip
  if (dedupKey) {
    var dk = uid + ":" + dedupKey;
    if (_parcoinAwarded[dk]) { pbLog("[ParCoin] Dedup skip:", dk); return; }
    _parcoinAwarded[dk] = true;
  }

  // Increment balance atomically (prevents minting — only increment, never set)
  db.collection("members").doc(uid).update({
    parcoins: firebase.firestore.FieldValue.increment(amount),
    parcoinsLifetime: firebase.firestore.FieldValue.increment(amount)
  }).catch(function(err) { pbWarn("[ParCoin] Balance update failed:", err.message); });

  // Write transaction log
  db.collection("parcoin_transactions").add({
    uid: uid,
    amount: amount,
    reason: reason,
    label: label,
    createdAt: fsTimestamp()
  }).catch(function(err) { pbWarn("[ParCoin] Transaction log failed:", err.message); });

  // Update local profile cache
  if (currentProfile && (uid === (currentUser ? currentUser.uid : null))) {
    currentProfile.parcoins = (currentProfile.parcoins || 0) + amount;
    currentProfile.parcoinsLifetime = (currentProfile.parcoinsLifetime || 0) + amount;
  }

  pbLog("[ParCoin] Awarded", amount, "to", uid, "for", reason);
}

/**
 * Calculate coins earned for completing a round.
 * 10 base + up to 40 bonus based on score vs handicap.
 * Playing to your handicap = 30 coins. Beating it = up to 50. Worse = 10-25.
 */
function calcRoundCoins(score, rating, slope, handicap) {
  var base = PARCOIN_RATES.round_complete_base;
  if (!score || !rating) return base;

  // Course handicap from index
  var courseHcap = handicap !== null && handicap !== undefined ? Math.round(handicap * (slope || 113) / 113) : null;
  if (courseHcap === null) return base + 15; // no handicap yet, give middle value

  var expected = rating + courseHcap;
  var diff = score - expected; // negative = better than expected

  if (diff <= -5) return PARCOIN_RATES.round_complete_max;       // crushed it
  if (diff <= -2) return 40;                                      // great round
  if (diff <= 0)  return 30;                                      // played to handicap
  if (diff <= 3)  return 20;                                      // close to expected
  if (diff <= 6)  return 15;                                      // off day
  return base;                                                    // rough day
}

/**
 * Calculate coins earned for a range session.
 * 5 base + bonus for duration (up to 5) + bonus for drills (up to 5).
 */
function calcRangeCoins(durationMinutes, drillCount) {
  var base = PARCOIN_RATES.range_session_base;
  var durationBonus = Math.min(5, Math.floor((durationMinutes || 0) / 15)); // 1 per 15 min, max 5
  var drillBonus = Math.min(5, (drillCount || 0) * 2); // 2 per drill, max 5
  return Math.min(PARCOIN_RATES.range_session_max, base + durationBonus + drillBonus);
}

/**
 * Calculate daily login streak coins.
 * 1 coin on day 1, scaling up to 10 on day 7+.
 */
function calcStreakCoins(streakDays) {
  if (!streakDays || streakDays < 1) return PARCOIN_RATES.daily_login_base;
  if (streakDays >= 7) return PARCOIN_RATES.daily_login_max;
  // Linear scale: 1 + floor((streak-1) * 9/6) ≈ 1,2,4,5,7,8,10
  return Math.min(PARCOIN_RATES.daily_login_max, PARCOIN_RATES.daily_login_base + Math.floor((streakDays - 1) * 1.5));
}

/**
 * Calculate achievement unlock coins based on XP value.
 * Achievements worth 25-50 XP → 25 coins. 100+ XP → 50-100 coins.
 */
function calcAchievementCoins(achievementXP) {
  if (!achievementXP || achievementXP <= 50) return PARCOIN_RATES.achievement_unlock_min;
  if (achievementXP >= 200) return PARCOIN_RATES.achievement_unlock_max;
  return Math.round(25 + (achievementXP - 50) * 0.5);
}

/**
 * Get a user's ParCoin balance (from local cache or Firestore).
 */
function getParCoinBalance(uid) {
  if (!uid) return 0;
  // Check local cache first
  if (currentUser && uid === currentUser.uid && currentProfile) {
    return currentProfile.parcoins || 0;
  }
  if (typeof fbMemberCache !== "undefined" && fbMemberCache[uid]) {
    return fbMemberCache[uid].parcoins || 0;
  }
  return 0;
}

/**
 * Get lifetime coins earned.
 */
function getParCoinLifetime(uid) {
  if (!uid) return 0;
  if (currentUser && uid === currentUser.uid && currentProfile) {
    return currentProfile.parcoinsLifetime || 0;
  }
  if (typeof fbMemberCache !== "undefined" && fbMemberCache[uid]) {
    return fbMemberCache[uid].parcoinsLifetime || 0;
  }
  return 0;
}

/**
 * Award daily login coins. Called from enterApp. Uses Firestore to track last login date.
 */
function awardDailyLogin() {
  if (!db || !currentUser) return;
  var today = localDateStr();
  var uid = currentUser.uid;

  db.collection("members").doc(uid).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var lastLogin = data.lastLoginDate || "";
    if (lastLogin === today) return; // already awarded today

    // Calculate streak
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var yesterdayStr = localDateStr(yesterday);
    var streak = (lastLogin === yesterdayStr) ? ((data.loginStreak || 0) + 1) : 1;
    var coins = calcStreakCoins(streak);

    // Update login tracking
    db.collection("members").doc(uid).update({
      lastLoginDate: today,
      loginStreak: streak
    }).catch(function(){});

    // Award coins
    awardCoins(uid, coins, "daily_login", "Daily login (day " + streak + ")", "login_" + today);
  }).catch(function(){});
}

/**
 * Load recent transaction history for a user.
 * Returns a Promise resolving to an array of transaction objects.
 */
function loadTransactionHistory(uid, limit) {
  if (!db || !uid) return Promise.resolve([]);
  return db.collection("parcoin_transactions")
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit || 20)
    .get()
    .then(function(snap) {
      var txns = [];
      snap.forEach(function(doc) { txns.push(Object.assign({_id: doc.id}, doc.data())); });
      return txns;
    })
    .catch(function(err) {
      pbWarn("[ParCoin] Failed to load history:", err.message);
      return [];
    });
}
